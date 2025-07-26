package com.example.allinone

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.allinone.backup.BackupActivity
import com.example.allinone.firebase.FirebaseManager
import com.example.allinone.firebase.FirebaseRepository
import com.example.allinone.ui.navigation.NavItem

import com.example.allinone.ui.navigation.drawerActionItems
import com.example.allinone.ui.navigation.drawerNavItems
import com.example.allinone.ui.NotesScreen
import com.example.allinone.ui.EditNoteScreen
import com.example.allinone.ui.TasksScreen
import com.example.allinone.ui.CalendarScreen
import com.example.allinone.ui.WorkoutScreen
import com.example.allinone.ui.workout.WorkoutSessionScreen
import com.example.allinone.ui.InstagramScreen
import com.example.allinone.ui.HistoryScreen
import com.example.allinone.ui.DatabaseManagementScreen
import com.example.allinone.ui.ErrorLogsScreen
// EditNoteActivity removed - migrated to Compose
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.ui.transactions.TransactionsDashboardScreen
import com.example.allinone.ui.futures.FuturesScreen
import com.example.allinone.ui.compose.wt.WTRegistryScreen
import com.example.allinone.utils.BackupHelper
import com.example.allinone.utils.OfflineStatusHelper
import com.example.allinone.viewmodels.CalendarViewModel
import com.example.allinone.viewmodels.WTLessonsViewModel
import com.example.allinone.workers.BackupWorker
import com.example.allinone.workers.ExpirationNotificationWorker
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject lateinit var firebaseManager: FirebaseManager
    @Inject lateinit var firebaseRepository: FirebaseRepository
    private val offlineStatusHelper by lazy { OfflineStatusHelper(this, firebaseRepository, this) }
    private val backupHelper by lazy { BackupHelper(this, firebaseRepository) }

    // ViewModels
    private lateinit var calendarViewModel: CalendarViewModel
    private lateinit var wtLessonsViewModel: WTLessonsViewModel
    
    // Permission request launchers
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            scheduleExpirationNotifications()
        }
    }

    private val requestMultiplePermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissions.entries.forEach {
            Log.d("MainActivity", "Permission: ${it.key}, granted: ${it.value}")
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (permissions[Manifest.permission.POST_NOTIFICATIONS] == true) {
                scheduleExpirationNotifications()
            }
        }
    }

    companion object {
        private const val PREFS_NAME = "app_preferences"
        private const val KEY_DARK_MODE = "dark_mode_enabled"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        val splashScreen = installSplashScreen()
        var keepSplashScreen = true
        splashScreen.setKeepOnScreenCondition { keepSplashScreen }

        super.onCreate(savedInstanceState)

        // Initialize ViewModels
        calendarViewModel = ViewModelProvider(this)[CalendarViewModel::class.java]
        wtLessonsViewModel = ViewModelProvider(this)[WTLessonsViewModel::class.java]
        
        // Initialize app
        initializeApp()

        setContent {
            val context = LocalContext.current
            val prefs = remember { context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE) }
            var isDarkMode by remember { 
                mutableStateOf(prefs.getBoolean(KEY_DARK_MODE, false)) 
            }
            
            AllInOneTheme(darkTheme = isDarkMode) {
                MainScreen(
                    onThemeToggle = { darkMode ->
                        isDarkMode = darkMode
                        prefs.edit().putBoolean(KEY_DARK_MODE, darkMode).apply()
                    },
                    isDarkMode = isDarkMode
                )
            }
        }
        
        // Allow splash screen to dismiss
        keepSplashScreen = false
    }

    private fun initializeApp() {
        // Request permissions
        lifecycleScope.launch { 
            requestAppPermissions()
        }

        // Observe repository error messages
        firebaseRepository.errorMessage.observe(this) { message ->
            if (!message.isNullOrEmpty()) {
                showErrorMessage(message)
                firebaseRepository.clearErrorMessage()
            }
        }

        // Initialize offline status helper
        runOnUiThread {
            try {
                offlineStatusHelper.initialize()
            } catch (e: Exception) {
                Log.e("MainActivity", "Error initializing OfflineStatusHelper: ${e.message}", e)
            }
        }

        // Background operations
        lifecycleScope.launch(Dispatchers.Default) {
            withContext(Dispatchers.IO) {
                delay(800)
                
                val supervisorJob = SupervisorJob()
                val backgroundScope = CoroutineScope(Dispatchers.IO + supervisorJob)
                
                backgroundScope.launch { 
                    try { scheduleBackup() } catch (e: Exception) {
                        Log.e("MainActivity", "Error scheduling backup: ${e.message}", e)
                    }
                }
                
                backgroundScope.launch { 
                    try { scheduleExpirationNotifications() } catch (e: Exception) {
                        Log.e("MainActivity", "Error scheduling notifications: ${e.message}", e)
                    }
                }
            }
        }
    }
    
    private fun requestAppPermissions() {
        val permissions = mutableListOf<String>()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        
        permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        
        if (permissions.isNotEmpty()) {
            requestMultiplePermissionsLauncher.launch(permissions.toTypedArray())
        }
    }
    
    private fun scheduleBackup() {
        val workRequest = PeriodicWorkRequestBuilder<BackupWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(1, TimeUnit.HOURS)
            .build()
        
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "backup_work",
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }
    
    private fun scheduleExpirationNotifications() {
        val workRequest = PeriodicWorkRequestBuilder<ExpirationNotificationWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(1, TimeUnit.HOURS)
            .build()
        
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "expiration_notification_work",
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }

    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun clearAppData() {
        // Implementation for clearing app data
        Log.d("MainActivity", "Clearing app data")
    }

    private fun clearFirestoreDatabase() {
        // Implementation for clearing Firestore database
        Log.d("MainActivity", "Clearing Firestore database")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onThemeToggle: (Boolean) -> Unit,
    isDarkMode: Boolean
) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    
    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            NavigationDrawerContent(
                navController = navController,
                drawerState = drawerState,
                onThemeToggle = onThemeToggle,
                isDarkMode = isDarkMode
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text("All In One")
                    },
                    navigationIcon = {
                        IconButton(
                            onClick = {
                                scope.launch {
                                    drawerState.open()
                                }
                            }
                        ) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    }
                )
            }
        ) { paddingValues ->
            NavigationHost(
                navController = navController,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@Composable
fun NavigationDrawerContent(
    navController: NavHostController,
    drawerState: DrawerState,
    onThemeToggle: (Boolean) -> Unit,
    isDarkMode: Boolean
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    
    ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .verticalScroll(scrollState)
                .padding(16.dp)
        ) {
            // Header
            Text(
                text = "All In One",
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            HorizontalDivider(modifier = Modifier.padding(bottom = 16.dp))
            
            // Theme toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Dark Mode")
                Switch(
                    checked = isDarkMode,
                    onCheckedChange = onThemeToggle
                )
            }
            
            HorizontalDivider(modifier = Modifier.padding(bottom = 16.dp))
            
            // Navigation items
            drawerNavItems.forEach { item ->
                NavigationDrawerItem(
                    icon = { Icon(item.icon, contentDescription = item.title) },
                    label = { Text(item.title) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            navController.navigate(item.route)
                        }
                    },
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
            
            // Action items
            drawerActionItems.forEach { item ->
                NavigationDrawerItem(
                    icon = { Icon(item.icon, contentDescription = item.title) },
                    label = { Text(item.title) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            when (item.route) {
                                "backup" -> {
                                    val intent = Intent(context, BackupActivity::class.java)
                                    context.startActivity(intent)
                                }
                                "clear_data" -> {
                                    // Handle clear data
                                    Log.d("Navigation", "Clear data clicked")
                                }
                                "clear_database" -> {
                                    // Handle clear database
                                    Log.d("Navigation", "Clear database clicked")
                                }
                            }
                        }
                    },
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
        }
    }
}



@Composable
fun NavigationHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = NavItem.TransactionsDashboard.route,
        modifier = modifier
    ) {
        composable(NavItem.TransactionsDashboard.route) {
            TransactionsDashboardScreen()
        }
        
        composable(NavItem.Futures.route) {
            FuturesScreen()
        }
        
        composable(NavItem.WTRegistry.route) {
            WTRegistryScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(NavItem.Calendar.route) {
            CalendarScreen()
        }
        
        composable(NavItem.Notes.route) {
            NotesScreen(
                onNavigateToEditNote = { noteId ->
                    if (noteId != null) {
                        navController.navigate("${NavItem.EditNote.route}/$noteId")
                    } else {
                        navController.navigate(NavItem.CreateNote.route)
                    }
                }
            )
        }
        
        composable(NavItem.CreateNote.route) {
            EditNoteScreen(
                noteId = null,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("${NavItem.EditNote.route}/{noteId}") { backStackEntry ->
            val noteId = backStackEntry.arguments?.getString("noteId")?.toLongOrNull()
            EditNoteScreen(
                noteId = noteId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(NavItem.Tasks.route) {
            TasksScreen()
        }
        
        composable(NavItem.Instagram.route) {
            InstagramScreen()
        }
        
        composable(NavItem.Workout.route) {
            WorkoutScreen(
                onNavigateToSession = {
                    navController.navigate(NavItem.WorkoutSession.route)
                }
            )
        }
        
        composable(NavItem.WorkoutSession.route) {
            val workoutSessionViewModel: com.example.allinone.viewmodels.WorkoutSessionViewModel = hiltViewModel()
            val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
            val workoutViewModel: com.example.allinone.ui.workout.WorkoutViewModel = remember {
                ViewModelProvider(viewModelStoreOwner)[com.example.allinone.ui.workout.WorkoutViewModel::class.java]
            }
            WorkoutSessionScreen(
                viewModel = workoutSessionViewModel,
                workoutViewModel = workoutViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(NavItem.WorkoutSessionWithProgram.route) { backStackEntry ->
            val programId = backStackEntry.arguments?.getString("programId")?.toLongOrNull()
            val workoutSessionViewModel: com.example.allinone.viewmodels.WorkoutSessionViewModel = hiltViewModel()
            
            // Start session with program if programId is provided
            LaunchedEffect(programId) {
                if (programId != null) {
                    // Get program and start session
                    // This will be handled by the ViewModel
                }
            }
            
            WorkoutSessionScreen(
                viewModel = workoutSessionViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(NavItem.History.route) {
            HistoryScreen()
        }
        
        composable(NavItem.Database.route) {
            DatabaseManagementScreen()
        }

        composable(NavItem.ErrorLogs.route) {
            ErrorLogsScreen()
        }
    }
}


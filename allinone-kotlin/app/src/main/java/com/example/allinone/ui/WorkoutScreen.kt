@file:OptIn(ExperimentalMaterial3Api::class)
package com.example.allinone.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.allinone.data.Program
import com.example.allinone.data.Workout
import com.example.allinone.ui.navigation.WorkoutDashboard
import com.example.allinone.ui.navigation.WorkoutPrograms
import com.example.allinone.ui.navigation.WorkoutSessions
import com.example.allinone.ui.navigation.workoutBottomNavItems
import com.example.allinone.ui.workout.WorkoutViewModel
import com.example.allinone.ui.workout.components.ProgramDetailsModal
import com.example.allinone.ui.workout.components.ProgramSelectionDialog
import com.example.allinone.ui.workout.components.WorkoutDetailsModal
import java.text.SimpleDateFormat
import java.util.*
import com.example.allinone.firebase.FirestoreSessionManager
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import android.util.Log
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

@Composable
fun WorkoutScreen(
    onNavigateToSession: () -> Unit = {}
) {
    val navController = rememberNavController()
    
    Scaffold(
        bottomBar = {
            WorkoutBottomNavigation(navController = navController)
        }
    ) { paddingValues ->
        WorkoutNavigationHost(
            navController = navController,
            onNavigateToSession = onNavigateToSession,
            modifier = Modifier.padding(paddingValues)
        )
    }
}

@Composable
fun WorkoutBottomNavigation(navController: NavHostController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    NavigationBar {
        workoutBottomNavItems.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.title) },
                label = { Text(item.title) },
                selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
fun WorkoutNavigationHost(
    navController: NavHostController,
    onNavigateToSession: () -> Unit,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = WorkoutDashboard.route,
        modifier = modifier
    ) {
        composable(WorkoutDashboard.route) {
            // Use the same ViewModel instance as MainActivity
            val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
            val viewModel: WorkoutViewModel = remember {
                ViewModelProvider(viewModelStoreOwner)[WorkoutViewModel::class.java]
            }
            
            val allPrograms by viewModel.allPrograms.observeAsState(emptyList())
            
            WorkoutDashboard(
                workouts = emptyList(), // Removed unused param
                programs = allPrograms,
                viewModel = viewModel,
                onNavigateToSession = onNavigateToSession
            )
        }
        
        composable(WorkoutPrograms.route) {
            // Use the same ViewModel instance as MainActivity
            val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
            val viewModel: WorkoutViewModel = remember {
                ViewModelProvider(viewModelStoreOwner)[WorkoutViewModel::class.java]
            }
            
            val allPrograms by viewModel.allPrograms.observeAsState(emptyList())
            
            WorkoutPrograms(
                programs = allPrograms,
                viewModel = viewModel,
                onNavigateToSession = onNavigateToSession
            )
        }
        
        composable(WorkoutSessions.route) {
            // val viewModelStoreOwner = LocalViewModelStoreOwner.current!! // removed unused variable
            // val viewModel: WorkoutViewModel = remember {
            //     ViewModelProvider(viewModelStoreOwner)[WorkoutViewModel::class.java]
            // } // removed unused variable
            // val allWorkouts by viewModel.allWorkouts.observeAsState(emptyList()) // removed unused variable
            WorkoutSessions(
                // workouts = allWorkouts, // removed unused param
                // viewModel = viewModel // removed unused param
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutDashboard(
    workouts: List<Workout>,
    programs: List<Program>,
    viewModel: WorkoutViewModel,
    onNavigateToSession: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault()) }
    val pullToRefreshState = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }
    var showProgramSelectionDialog by remember { mutableStateOf(false) }
    var showWorkoutDetails by remember { mutableStateOf(false) }
    var selectedWorkout by remember { mutableStateOf<Workout?>(null) }

    // Handle pull-to-refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            isRefreshing = true
            viewModel.loadPrograms()
            viewModel.loadWorkouts()
            kotlinx.coroutines.delay(500)
            isRefreshing = false
        }
    }
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                StatsCard(
                    title = "This Week",
                    stats = listOf(
                        "Workouts" to "${workouts.size}",
                        "Duration" to formatDuration(workouts.sumOf { it.duration })
                    )
                )
            }
            item {
                RecentWorkoutCard(
                    workout = workouts.maxByOrNull { it.startTime },
                    dateFormatter = dateFormatter
                )
            }
            item {
                StatsCard(
                    title = "All Time",
                    stats = listOf(
                        "Total Workouts" to "${workouts.size}",
                        "Total Duration" to formatDuration(workouts.sumOf { it.duration }),
                        "Programs" to "${programs.size}"
                    )
                )
            }
            item {
                QuickActionsCard(
                    onStartWorkout = { showProgramSelectionDialog = true },
                    onCreateProgram = { /* TODO: Navigate to program creation */ }
                )
            }
            if (workouts.isNotEmpty()) {
                item {
                    Text(
                        text = "Recent Workouts",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
                items(workouts.take(5).sortedByDescending { it.startTime }) { workout ->
                    WorkoutCard(
                        workout = workout,
                        dateFormatter = dateFormatter,
                        onClick = {
                            selectedWorkout = workout
                            showWorkoutDetails = true
                        }
                    )
                }
            }
        }
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
        if (showProgramSelectionDialog) {
            ProgramSelectionDialog(
                programs = programs,
                onProgramSelected = { program ->
                    android.util.Log.d("WorkoutDashboard", "Program selected: ${program.name}")
                    showProgramSelectionDialog = false
                    viewModel.setSelectedProgramForSession(program)
                    android.util.Log.d("WorkoutDashboard", "Navigating to session")
                    onNavigateToSession()
                },
                onStartCustomWorkout = {},
                onDismiss = { showProgramSelectionDialog = false }
            )
        }
        if (showWorkoutDetails && selectedWorkout != null) {
            WorkoutDetailsModal(
                workout = selectedWorkout!!,
                onDismiss = {
                    showWorkoutDetails = false
                    selectedWorkout = null
                }
            )
        }
    }
}

@Composable
fun StatsCard(
    title: String,
    stats: List<Pair<String, String>>,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            stats.forEach { (label, value) ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = value,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                if (stats.last() != (label to value)) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun RecentWorkoutCard(
    workout: Workout?,
    dateFormatter: SimpleDateFormat,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Most Recent Workout",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            if (workout != null) {
                Text(
                    text = workout.programName ?: "Custom Workout",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = dateFormatter.format(workout.startTime),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${workout.exercises.size} exercises",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDuration(workout.duration),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Text(
                    text = "No recent workouts",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun QuickActionsCard(
    onStartWorkout: () -> Unit,
    onCreateProgram: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onStartWorkout,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Start Workout")
                }
                
                OutlinedButton(
                    onClick = onCreateProgram,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("New Program")
                }
            }
        }
    }
}

fun formatDuration(durationMs: Long): String {
    val seconds = durationMs / 1000
    val minutes = seconds / 60
    val hours = minutes / 60

    return when {
        hours > 0 -> "$hours hr ${minutes % 60} min"
        else -> "$minutes min"
    }
}

@Composable
fun WorkoutCard(
    workout: Workout,
    dateFormatter: SimpleDateFormat,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Workout icon
            Icon(
                Icons.Default.FitnessCenter,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(16.dp))

            // Workout details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = workout.programName ?: "Custom Workout",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = dateFormatter.format(workout.startTime),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row {
                    Text(
                        text = "${workout.exercises.size} exercises",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDuration(workout.duration),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Icon(
                Icons.Default.ChevronRight,
                contentDescription = "View details",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutPrograms(
    programs: List<Program>,
    viewModel: WorkoutViewModel,
    onNavigateToSession: () -> Unit,
    modifier: Modifier = Modifier
) {
    val pullToRefreshState = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }
    var showProgramDetails by remember { mutableStateOf(false) }
    var selectedProgram by remember { mutableStateOf<Program?>(null) }
    var showProgramSelectionDialog by remember { mutableStateOf(false) }

    // Handle pull-to-refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            isRefreshing = true
            viewModel.loadPrograms()
            kotlinx.coroutines.delay(500)
            isRefreshing = false
        }
    }
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (programs.isEmpty()) {
                item {
                    EmptyStateCard(
                        title = "No Programs Yet",
                        description = "Create your first workout program to get started",
                        icon = Icons.Default.FitnessCenter,
                        actionText = "Create Program",
                        onAction = { /* TODO: Navigate to program creation */ }
                    )
                }
            } else {
                items(programs) { program ->
                    ProgramCard(
                        program = program,
                        onClick = {
                            selectedProgram = program
                            showProgramDetails = true
                        }
                    )
                }
            }
        }
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
        if (showProgramDetails && selectedProgram != null) {
            ProgramDetailsModal(
                program = selectedProgram!!,
                onDismiss = {
                    showProgramDetails = false
                    selectedProgram = null
                },
                onSave = { updatedProgram ->
                    viewModel.saveProgram(updatedProgram)
                    showProgramDetails = false
                    selectedProgram = null
                },
                onStartWorkout = {
                    showProgramDetails = false
                    showProgramSelectionDialog = true
                }
            )
        }
        if (showProgramSelectionDialog) {
            ProgramSelectionDialog(
                programs = programs,
                onProgramSelected = { program ->
                    showProgramSelectionDialog = false
                    selectedProgram = null
                    viewModel.setSelectedProgramForSession(program)
                    onNavigateToSession()
                },
                onStartCustomWorkout = {},
                onDismiss = {
                    showProgramSelectionDialog = false
                    selectedProgram = null
                }
            )
        }
    }
}

@Composable
fun ProgramCard(
    program: Program,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = program.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            program.description?.let { description ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${program.exercises.size} exercises",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
                Text(
                    text = "Created ${dateFormatter.format(program.createdDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun WorkoutExercises(
    modifier: Modifier = Modifier
) {
    // Placeholder for exercises tab
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        EmptyStateCard(
            title = "Exercise Library",
            description = "Exercise management coming soon",
            icon = Icons.Default.FitnessCenter,
            actionText = "Add Exercise",
            onAction = { /* TODO: Navigate to exercise creation */ }
        )
    }
}

@Composable
fun WorkoutSessions(
    modifier: Modifier = Modifier
) {
    var sessions by remember { mutableStateOf<List<com.example.allinone.data.WorkoutSession>>(emptyList()) }
    val pullToRefreshState = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }
    var showSessionDetails by remember { mutableStateOf(false) }
    var selectedSession by remember { mutableStateOf<com.example.allinone.data.WorkoutSession?>(null) }
    val coroutineScope = rememberCoroutineScope()

    // Listen for live updates from Firestore
    LaunchedEffect(Unit) {
        FirestoreSessionManager.listenToSessions(
            onUpdate = { sessions = it },
            onError = { /* handle error if needed */ }
        )
    }

    // Handle pull-to-refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            isRefreshing = true
            sessions = FirestoreSessionManager.getAllSessions()
            kotlinx.coroutines.delay(500)
            isRefreshing = false
        }
    }
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Text(
                text = "Workout Sessions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(16.dp)
            )
            // Session list
            if (sessions.isEmpty()) {
                EmptyStateCard(
                    title = "No Workout Sessions",
                    description = "Complete some workouts to see your session history here",
                    icon = Icons.Default.History,
                    actionText = "Start Workout",
                    onAction = { /* TODO: Navigate to workout session */ }
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(sessions.sortedByDescending { it.startTime }) { session ->
                        SessionCard(
                            session = session,
                            onClick = {
                                selectedSession = session
                                showSessionDetails = true
                            },
                            onDelete = { 
                                coroutineScope.launch {
                                    try {
                                        FirestoreSessionManager.deleteSession(session.id)
                                        // Refresh sessions list after deletion
                                        sessions = FirestoreSessionManager.getAllSessions()
                                    } catch (e: Exception) {
                                        Log.e("WorkoutSessions", "Failed to delete session", e)
                                        // Could show a snackbar or error message here
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
        // Pull-to-refresh indicator
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
        if (showSessionDetails && selectedSession != null) {
            SessionDetailsModal(
                session = selectedSession!!,
                onDismiss = {
                    showSessionDetails = false
                    selectedSession = null
                }
            )
        }
    }
}

@Composable
private fun SessionCard(
    session: com.example.allinone.data.WorkoutSession,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = session.programName ?: "Custom Workout",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()).format(session.startTime),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Exercises: ${session.exercises.size}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(
                onClick = { showDeleteDialog = true },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete session",
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Session") },
            text = { 
                Text("Are you sure you want to delete this workout session? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun SessionDetailsModal(
    session: com.example.allinone.data.WorkoutSession,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false
        )
    ) {
        ElevatedCard(
            modifier = modifier
                .fillMaxWidth()
                .padding(16.dp)
                .heightIn(max = 600.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Session Details",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Close",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                // Program name and date
                Text(
                    text = session.programName ?: "Custom Workout",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
                Text(
                    text = dateFormatter.format(session.startTime),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
                // Exercises
                Text(
                    text = "Exercises",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                if (session.exercises.isEmpty()) {
                    Text(
                        text = "No exercises recorded.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        session.exercises.forEach { exercise ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (exercise.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = if (exercise.isCompleted) "Completed" else "Not completed",
                                    tint = if (exercise.isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = exercise.exerciseName,
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.weight(1f))
                                Text(
                                    text = "${exercise.completedSets.size}/${exercise.targetSets.size} sets",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkoutStats(
    workouts: List<Workout>,
    viewModel: WorkoutViewModel,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (workouts.isEmpty()) {
            item {
                EmptyStateCard(
                    title = "No Workout History",
                    description = "Complete some workouts to see your statistics and progress",
                    icon = Icons.Default.Analytics,
                    actionText = "Start Workout",
                    onAction = { /* TODO: Navigate to workout session */ }
                )
            }
        } else {
            // Quick stats overview
            item {
                QuickStatsCard(workouts = workouts)
            }
            
            // Recent workouts header
            item {
                Text(
                    text = "Recent Workouts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            // Recent workouts list
            items(workouts.take(10).sortedByDescending { it.startTime }) { workout ->
                WorkoutHistoryCard(
                    workout = workout,
                    onClick = { /* TODO: Navigate to workout details */ },
                    onDelete = { viewModel.deleteWorkout(workout.id) }
                )
            }
            
            // Show all workouts button
            if (workouts.size > 10) {
                item {
                    OutlinedButton(
                        onClick = { /* TODO: Navigate to full history */ },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("View All ${workouts.size} Workouts")
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickStatsCard(
    workouts: List<Workout>,
    modifier: Modifier = Modifier
) {
    val totalDuration = workouts.sumOf { it.duration }
    val averageDuration = if (workouts.isNotEmpty()) totalDuration / workouts.size else 0L
    val completedWorkouts = workouts.count { it.isCompleted() }
    val totalVolume = workouts.sumOf { it.totalVolume }
    
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Workout Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Stats grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "Total",
                    value = "${workouts.size}",
                    subtitle = "workouts"
                )
                
                StatItem(
                    label = "Completed",
                    value = "$completedWorkouts",
                    subtitle = "finished"
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "Total Time",
                    value = formatDuration(totalDuration),
                    subtitle = "exercising"
                )
                
                StatItem(
                    label = "Avg Time",
                    value = formatDuration(averageDuration),
                    subtitle = "per workout"
                )
            }
            
            if (totalVolume > 0) {
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    StatItem(
                        label = "Total Volume",
                        value = "${totalVolume.toInt()}kg",
                        subtitle = "lifted"
                    )
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun WorkoutSessionCard(
    workout: Workout,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
    val timeFormatter = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header row with program name and delete button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = workout.programName ?: "Custom Workout",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = dateFormatter.format(workout.startTime),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = " • ",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = timeFormatter.format(workout.startTime),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Delete button
                IconButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete workout session",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Session details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Duration
                Column {
                    Text(
                        text = "Duration",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatDuration(workout.duration),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                // Exercises
                Column {
                    Text(
                        text = "Exercises",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${workout.exercises.size}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                // Completion
                Column {
                    Text(
                        text = "Completion",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${workout.completionPercentage.toInt()}%",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (workout.completionPercentage >= 100f) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )
                }
            }
            
            // Exercise completion details
            if (workout.exercises.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                
                Text(
                    text = "Exercise Status",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Show first few exercises with completion status
                workout.exercises.take(3).forEach { exercise ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = exercise.exerciseName,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (exercise.isCompleted()) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                contentDescription = if (exercise.isCompleted()) "Completed" else "Not completed",
                                tint = if (exercise.isCompleted()) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${exercise.sets.count { it.completed }}/${exercise.sets.size}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                // Show "and X more" if there are more exercises
                if (workout.exercises.size > 3) {
                    Text(
                        text = "and ${workout.exercises.size - 3} more exercises",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Workout") },
            text = { 
                Text("Are you sure you want to delete this workout session? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun WorkoutHistoryCard(
    workout: Workout,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
    val timeFormatter = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Completion indicator
            Surface(
                modifier = Modifier.size(12.dp),
                shape = CircleShape,
                color = if (workout.isCompleted()) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                }
            ) {}
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Workout details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = workout.programName ?: "Custom Workout",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row {
                    Text(
                        text = dateFormatter.format(workout.startTime),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = timeFormatter.format(workout.startTime),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row {
                    Text(
                        text = "${workout.exercises.size} exercises",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = " • ",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = workout.getFormattedDuration(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Completion percentage and delete button
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "${workout.completionPercentage.toInt()}%",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = workout.getCompletionStatus(),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Delete button
                IconButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete workout",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Workout") },
            text = { 
                Text("Are you sure you want to delete this workout session? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun EmptyStateCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    actionText: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onAction
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(actionText)
            }
        }
    }
}

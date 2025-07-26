package com.example.allinone.ui.compose.wt

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.allinone.data.WTStudent
import com.example.allinone.data.WTRegistration
import com.example.allinone.data.WTLesson
import com.example.allinone.data.WTSeminar
import com.example.allinone.viewmodels.WTRegisterViewModel
import com.example.allinone.viewmodels.WTLessonsViewModel
import com.example.allinone.viewmodels.WTSeminarsViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WTRegistryScreen(
    modifier: Modifier = Modifier,
    onNavigateBack: () -> Unit = {}
) {
    var selectedTabIndex by remember { mutableStateOf(0) }
    val snackbarHostState = remember { SnackbarHostState() }
    
    // ViewModels
    val registerViewModel: WTRegisterViewModel = hiltViewModel()
    val lessonsViewModel: WTLessonsViewModel = hiltViewModel()
    val seminarsViewModel: WTSeminarsViewModel = hiltViewModel()
    
    // Tab titles and icons to match the XML bottom nav menu
    val tabItems = listOf(
        BottomNavItem("Students", Icons.Default.People),
        BottomNavItem("Register", Icons.Default.Edit),
        BottomNavItem("Lessons", Icons.Default.Schedule),
        BottomNavItem("Seminars", Icons.Default.Event)
    )
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Wing Tzun Registry") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            // Bottom Navigation - moved from top to bottom
            NavigationBar {
                tabItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = null) },
                        label = { Text(item.title) },
                        selected = selectedTabIndex == index,
                        onClick = { selectedTabIndex = index }
                    )
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tab Content
            when (selectedTabIndex) {
                0 -> StudentsTab(
                    viewModel = registerViewModel,
                    snackbarHostState = snackbarHostState,
                    modifier = Modifier.fillMaxSize()
                )
                1 -> RegisterTab(
                    viewModel = registerViewModel,
                    snackbarHostState = snackbarHostState,
                    modifier = Modifier.fillMaxSize()
                )
                2 -> LessonsTab(
                    viewModel = lessonsViewModel,
                    snackbarHostState = snackbarHostState,
                    modifier = Modifier.fillMaxSize()
                )
                3 -> SeminarsTab(
                    viewModel = seminarsViewModel,
                    snackbarHostState = snackbarHostState,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}

// Data class for bottom navigation items
data class BottomNavItem(
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

@Composable
fun StudentsTab(
    viewModel: WTRegisterViewModel,
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    val students by viewModel.students.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val error by viewModel.error.observeAsState()
    
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedStudent by remember { mutableStateOf<WTStudent?>(null) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    // Student filtering options: All, Active, Inactive
    var studentFilter by remember { mutableStateOf(StudentFilter.ACTIVE) }
    
    val scope = rememberCoroutineScope()
    
    // Handle error messages
    LaunchedEffect(error) {
        error?.let { message ->
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = message,
                    duration = SnackbarDuration.Short
                )
            }
        }
    }
    
    // Filter students based on selected filter
    val filteredStudents = when (studentFilter) {
        StudentFilter.ALL -> students
        StudentFilter.ACTIVE -> students.filter { it.isActive }
        StudentFilter.INACTIVE -> students.filter { !it.isActive }
    }.sortedBy { it.name }
    
    Column(modifier = modifier.padding(16.dp)) {
        // Filter controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Filter chips
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StudentFilter.values().forEach { filter ->
            FilterChip(
                        selected = studentFilter == filter,
                        onClick = { studentFilter = filter },
                        label = { Text(filter.displayName) }
            )
                }
            }
            
            // Compact Add Student button with text
            Button(
                onClick = { showAddDialog = true },
                modifier = Modifier
                    .height(40.dp)
                    .width(100.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Add student",
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Loading indicator
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            // Students list
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredStudents) { student ->
                    StudentCard(
                        student = student,
                        isRegistered = viewModel.isStudentCurrentlyRegistered(student.id),
                        onEdit = { 
                            selectedStudent = student
                            showEditDialog = true
                        },
                        onDelete = {
                            selectedStudent = student
                            showDeleteDialog = true
                        }
                    )
                }
            }
        }
    }
    
    // Add Student Dialog
    if (showAddDialog) {
        AddStudentDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, phone, email, instagram, notes ->
                viewModel.addStudent(
                    name = name,
                    phoneNumber = phone,
                    email = email,
                    instagram = instagram,
                    isActive = true, // Default to active for new students
                    notes = notes
                )
                showAddDialog = false
            }
        )
    }
    
    // Edit Student Dialog
    if (showEditDialog && selectedStudent != null) {
        EditStudentDialog(
            student = selectedStudent!!,
            onDismiss = { 
                showEditDialog = false
                selectedStudent = null
            },
            onConfirm = { updatedStudent ->
                viewModel.updateStudent(updatedStudent)
                showEditDialog = false
                selectedStudent = null
            }
        )
    }
    
    // Delete Confirmation Dialog
    if (showDeleteDialog && selectedStudent != null) {
        AlertDialog(
            onDismissRequest = { 
                showDeleteDialog = false
                selectedStudent = null
            },
            title = { Text("Delete Student") },
            text = { Text("Are you sure you want to delete ${selectedStudent!!.name}? This will also delete all their registrations.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteStudent(selectedStudent!!.id)
                        showDeleteDialog = false
                        selectedStudent = null
                    }
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showDeleteDialog = false
                        selectedStudent = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

// Enum for student filtering
enum class StudentFilter(val displayName: String) {
    ALL("All"),
    ACTIVE("Active"),
    INACTIVE("Inactive")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterTab(
    viewModel: WTRegisterViewModel,
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    val students by viewModel.students.observeAsState(emptyList())
    val registrations by viewModel.registrations.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val error by viewModel.error.observeAsState()
    
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedRegistration by remember { mutableStateOf<WTRegistration?>(null) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showContextMenu by remember { mutableStateOf(false) }
    
    // Month filter state - similar to WTRegisterContentFragment
    var selectedMonth by remember { mutableStateOf<Int?>(null) }
    val monthNames = arrayOf(
        "All Months", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )
    
    val scope = rememberCoroutineScope()
    
    // Force refresh when the RegisterTab becomes visible to ensure sync with history deletions
    LaunchedEffect(Unit) {
        viewModel.refreshData()
    }
    
    // Handle error messages
    LaunchedEffect(error) {
        error?.let { message ->
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = message,
                    duration = SnackbarDuration.Short
                )
            }
        }
    }
    
    // Filter registrations by month
    val filteredRegistrations = if (selectedMonth == null) {
        registrations
    } else {
        registrations.filter { registration ->
            registration.startDate?.let { startDate ->
                val calendar = Calendar.getInstance()
                calendar.time = startDate
                // Calendar.MONTH is 0-based (0 = January), selectedMonth is 1-based (1 = January)
                calendar.get(Calendar.MONTH) + 1 == selectedMonth
            } ?: false
        }
    }.sortedByDescending { it.startDate }
    
    // Calculate total amount for filtered registrations
    val totalAmount = filteredRegistrations.sumOf { it.amount }
    
    Column(modifier = modifier.padding(16.dp)) {
        // Filter section
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Filters",
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Month filter dropdown
                var expanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = monthNames[selectedMonth ?: 0],
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Select Month") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        monthNames.forEachIndexed { index, month ->
                            DropdownMenuItem(
                                text = { Text(month) },
                                onClick = {
                                    selectedMonth = if (index == 0) null else index
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Total amount display
                Text(
                    text = "Total Amount: ₺${String.format("%.2f", totalAmount)}",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Add registration button
        OutlinedButton(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Registration")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Loading indicator
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            // Registrations list
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredRegistrations) { registration ->
                    RegistrationCard(
                        registration = registration,
                        studentName = students.find { it.id == registration.studentId }?.name ?: "Unknown",
                        onEdit = { 
                            selectedRegistration = registration
                            showEditDialog = true
                        },
                        onLongPress = {
                            selectedRegistration = registration
                            showContextMenu = true
                        }
                    )
                }
            }
        }
    }
    
    // Add Registration Dialog
    if (showAddDialog) {
        AddRegistrationDialog(
            students = students.filter { it.isActive },
            onDismiss = { showAddDialog = false },
            onConfirm = { studentId, amount, startDate, endDate, notes, isPaid, attachmentUri ->
                viewModel.addRegistration(
                    studentId = studentId,
                    amount = amount,
                    startDate = startDate,
                    endDate = endDate,
                    attachmentUri = attachmentUri,
                    notes = notes,
                    isPaid = isPaid
                )
                showAddDialog = false
            }
        )
    }
    
    // Edit Registration Dialog
    if (showEditDialog && selectedRegistration != null) {
        EditRegistrationDialog(
            registration = selectedRegistration!!,
            students = students,
            onDismiss = { 
                showEditDialog = false
                selectedRegistration = null
            },
            onConfirm = { updatedRegistration ->
                viewModel.updateRegistration(updatedRegistration)
                showEditDialog = false
                selectedRegistration = null
            }
        )
    }
    
    // Context Menu Dialog
    if (showContextMenu && selectedRegistration != null) {
        AlertDialog(
            onDismissRequest = { 
                showContextMenu = false
                selectedRegistration = null
            },
            title = { Text("Registration Options") },
            text = { Text("What would you like to do with this registration?") },
            confirmButton = {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = {
                            showContextMenu = false
                            showEditDialog = true
                        }
                    ) {
                        Text("Edit")
                    }
                    TextButton(
                        onClick = {
                            showContextMenu = false
                            showDeleteDialog = true
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Delete")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showContextMenu = false
                        selectedRegistration = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
    
    // Delete Confirmation Dialog
    if (showDeleteDialog && selectedRegistration != null) {
        AlertDialog(
            onDismissRequest = { 
                showDeleteDialog = false
                selectedRegistration = null
            },
            title = { Text("Delete Registration") },
            text = { Text("Are you sure you want to delete this registration? This will also remove it from history and deduct the amount from transactions.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        // Delete the registration - this will handle everything (registry, history, transactions)
                        viewModel.deleteRegistration(selectedRegistration!!)
                        showDeleteDialog = false
                        selectedRegistration = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showDeleteDialog = false
                        selectedRegistration = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun LessonsTab(
    viewModel: WTLessonsViewModel,
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    val lessons by viewModel.lessons.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val errorMessage by viewModel.errorMessage.observeAsState()
    
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedLesson by remember { mutableStateOf<WTLesson?>(null) }
    var showEditDialog by remember { mutableStateOf(false) }
    
    val scope = rememberCoroutineScope()
    
    // Handle error messages
    LaunchedEffect(errorMessage) {
        errorMessage?.let { message ->
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = message,
                    duration = SnackbarDuration.Short
                )
            }
        }
    }
    
    Column(modifier = modifier.padding(16.dp)) {
        // Add lesson button
        OutlinedButton(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Lesson")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Loading indicator
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            // Lessons list
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(lessons.sortedWith(compareBy<WTLesson> { it.dayOfWeek }.thenBy { it.startHour })) { lesson ->
                    LessonCard(
                        lesson = lesson,
                        onEdit = { 
                            selectedLesson = lesson
                            showEditDialog = true
                        },
                        onDelete = {
                            viewModel.deleteLesson(lesson)
                        }
                    )
                }
            }
        }
    }
    
    // Add Lesson Dialog
    if (showAddDialog) {
        AddLessonDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { dayOfWeek, startHour, startMinute, endHour, endMinute ->
                viewModel.addLesson(dayOfWeek, startHour, startMinute, endHour, endMinute)
                showAddDialog = false
            }
        )
    }
    
    // Edit Lesson Dialog
    if (showEditDialog && selectedLesson != null) {
        EditLessonDialog(
            lesson = selectedLesson!!,
            onDismiss = { 
                showEditDialog = false
                selectedLesson = null
            },
            onConfirm = { dayOfWeek, startHour, startMinute, endHour, endMinute ->
                viewModel.updateCurrentLesson(dayOfWeek, startHour, startMinute, endHour, endMinute)
                showEditDialog = false
                selectedLesson = null
            }
        )
    }
}

@Composable
fun SeminarsTab(
    viewModel: WTSeminarsViewModel,
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    val seminars by viewModel.seminars.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedSeminar by remember { mutableStateOf<WTSeminar?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showSuccessMessage by remember { mutableStateOf<String?>(null) }
    
    val scope = rememberCoroutineScope()
    
    // Handle success messages
    LaunchedEffect(showSuccessMessage) {
        showSuccessMessage?.let { message ->
            scope.launch {
                snackbarHostState.showSnackbar(
                    message = message,
                    duration = SnackbarDuration.Short
                )
                showSuccessMessage = null
            }
        }
    }
    
    Column(modifier = modifier.padding(16.dp)) {
        // Add seminar button
        OutlinedButton(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Seminar")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Loading indicator
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            // Seminars list
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(seminars.sortedBy { it.date }) { seminar ->
                    SeminarCard(
                        seminar = seminar,
                        onDelete = {
                            selectedSeminar = seminar
                            showDeleteDialog = true
                        }
                    )
                }
            }
        }
    }
    
    // Add Seminar Dialog
    if (showAddDialog) {
        AddSeminarDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, date, startHour, startMinute, endHour, endMinute, description ->
                val seminar = WTSeminar(
                    name = name,
                    date = date,
                    startHour = startHour,
                    startMinute = startMinute,
                    endHour = endHour,
                    endMinute = endMinute,
                    description = description
                )
                viewModel.addSeminar(seminar)
                showAddDialog = false
                showSuccessMessage = "Seminar added successfully"
            }
        )
    }
    
    // Delete Seminar Dialog
    if (showDeleteDialog && selectedSeminar != null) {
        AlertDialog(
            onDismissRequest = { 
                showDeleteDialog = false
                selectedSeminar = null
            },
            title = { Text("Delete Seminar") },
            text = { Text("Are you sure you want to delete ${selectedSeminar?.name}?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        selectedSeminar?.let { seminar ->
                            viewModel.deleteSeminar(seminar)
                        }
                        showDeleteDialog = false
                        selectedSeminar = null
                        showSuccessMessage = "Seminar deleted successfully"
                    }
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showDeleteDialog = false
                        selectedSeminar = null
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
} 
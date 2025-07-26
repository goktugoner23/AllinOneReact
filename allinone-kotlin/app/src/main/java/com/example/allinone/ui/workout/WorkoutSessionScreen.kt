package com.example.allinone.ui.workout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.allinone.data.WorkoutSession
import com.example.allinone.data.common.UiState
import com.example.allinone.viewmodels.WorkoutSessionViewModel
import com.example.allinone.ui.workout.components.StopwatchComponent
import com.example.allinone.ui.workout.components.WorkoutInfoCard
import com.example.allinone.ui.workout.components.ProgressOverviewCard
import com.example.allinone.ui.workout.components.ExerciseCard

/**
 * Main workout session screen
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutSessionScreen(
    viewModel: WorkoutSessionViewModel,
    workoutViewModel: WorkoutViewModel? = null,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val sessionUiState by viewModel.sessionUiState.collectAsStateWithLifecycle()
    val elapsedTime by viewModel.elapsedTime.collectAsStateWithLifecycle()
    val isStopwatchRunning by viewModel.isStopwatchRunning.collectAsStateWithLifecycle()
    val isStopwatchPaused by viewModel.isStopwatchPaused.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    
    var showFinishDialog by remember { mutableStateOf(false) }
    
    // Handle error messages
    LaunchedEffect(errorMessage) {
        if (!errorMessage.isNullOrEmpty()) {
            // Error will be shown in the UI
        }
    }
    
    // Observe workout session state from WorkoutViewModel
    val shouldStartNewSession by (workoutViewModel?.shouldStartNewSession?.observeAsState(false) ?: remember { mutableStateOf(false) })
    val selectedProgramForSession by (workoutViewModel?.selectedProgramForSession?.observeAsState(null) ?: remember { mutableStateOf(null) })
    
    // Start new session if needed (check this first)
    LaunchedEffect(shouldStartNewSession, selectedProgramForSession) {
        val program = selectedProgramForSession
        android.util.Log.d("WorkoutSessionScreen", "LaunchedEffect triggered - shouldStartNewSession: $shouldStartNewSession, selectedProgram: ${program?.name}")
        if (workoutViewModel != null && shouldStartNewSession && program != null) {
            android.util.Log.d("WorkoutSessionScreen", "Starting workout session with program: ${program.name}")
            // Start session with selected program immediately
            viewModel.startWorkoutSession(program)
            // Clear the selected program after starting session
            workoutViewModel.clearSelectedProgramForSession()
        } else if (!shouldStartNewSession) {
            // Only restore session state if not starting a new session
            viewModel.restoreSessionState()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Workout Session") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Removed stop button from here
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val currentState = sessionUiState) {
                is UiState.Loading -> {
                    LoadingContent()
                }
                is UiState.Success -> {
                    WorkoutSessionContent(
                        session = currentState.data,
                        elapsedTime = elapsedTime,
                        isStopwatchRunning = isStopwatchRunning,
                        isStopwatchPaused = isStopwatchPaused,
                        onPauseResume = {
                            android.util.Log.d("WorkoutSessionScreen", "Pause/Resume clicked - isPaused: $isStopwatchPaused, isRunning: $isStopwatchRunning")
                            if (isStopwatchPaused) {
                                viewModel.resumeWorkout()
                            } else {
                                viewModel.pauseWorkout()
                            }
                        },
                        onStop = { showFinishDialog = true },
                        onCompleteSet = { exerciseId, setNumber, reps, weight ->
                            viewModel.completeExerciseSet(exerciseId, setNumber, reps, weight)
                        },
                        onUncompleteSet = { exerciseId, setNumber ->
                            viewModel.uncompleteExerciseSet(exerciseId, setNumber)
                        }
                    )
                }
                is UiState.Error -> {
                    ErrorContent(
                        message = currentState.message,
                        onRetry = { viewModel.restoreSessionState() }
                    )
                }
                is UiState.Empty -> {
                    EmptyContent(onNavigateBack = onNavigateBack)
                }
            }
            
            // Show error message if present
            errorMessage?.let { currentErrorMessage ->
                Card(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                        .fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Error,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = currentErrorMessage,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = { viewModel.clearErrorMessage() }
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }
            
            // Loading overlay
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    }
    
    // Finish workout dialog
    if (showFinishDialog) {
        FinishWorkoutDialog(
            onConfirm = { notes ->
                viewModel.finishWorkout(notes)
                showFinishDialog = false
                onNavigateBack()
            },
            onDismiss = { showFinishDialog = false }
        )
    }
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Loading workout session...")
        }
    }
}

@Composable
private fun WorkoutSessionContent(
    session: WorkoutSession,
    elapsedTime: Long,
    isStopwatchRunning: Boolean,
    isStopwatchPaused: Boolean,
    onPauseResume: () -> Unit,
    onStop: () -> Unit,
    onCompleteSet: (Long, Int, Int, Double) -> Unit,
    onUncompleteSet: (Long, Int) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Stopwatch component
        item {
            StopwatchComponent(
                elapsedTime = elapsedTime,
                isRunning = isStopwatchRunning,
                isPaused = isStopwatchPaused,
                onPauseResume = onPauseResume,
                onStop = onStop
            )
        }
        
        // Workout info
        item {
            WorkoutInfoCard(session = session)
        }
        
        // Progress overview
        item {
            ProgressOverviewCard(session = session)
        }
        
        // Exercise list
        if (session.exercises.isNotEmpty()) {
            items(session.exercises) { exercise ->
                ExerciseCard(
                    exercise = exercise,
                    onCompleteSet = onCompleteSet,
                    onUncompleteSet = onUncompleteSet
                )
            }
        } else {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No exercises in this workout",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "This is a custom workout with no predefined exercises",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        // Add some bottom padding
        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                Icons.Default.Error,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Error",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = onRetry) {
                Text("Retry")
            }
        }
    }
}

@Composable
private fun EmptyContent(
    onNavigateBack: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                Icons.Default.FitnessCenter,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "No Active Workout",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Start a workout from the main screen to begin tracking your session.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = onNavigateBack) {
                Text("Go Back")
            }
        }
    }
}

@Composable
private fun FinishWorkoutDialog(
    onConfirm: (String?) -> Unit,
    onDismiss: () -> Unit
) {
    var notes by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Finish Workout") },
        text = {
            Column {
                Text("Are you sure you want to finish this workout?")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(notes.takeIf { it.isNotBlank() }) }
            ) {
                Text("Finish")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
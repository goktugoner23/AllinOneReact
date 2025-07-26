package com.example.allinone.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.allinone.data.*
import com.example.allinone.data.common.UiState
import com.example.allinone.data.repository.WorkoutSessionRepository
import com.example.allinone.firebase.FirebaseIdManager
import com.example.allinone.utils.StopwatchManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.util.*
import javax.inject.Inject
import com.example.allinone.firebase.FirestoreSessionManager

/**
 * ViewModel for managing workout session state and operations
 */
@HiltViewModel
class WorkoutSessionViewModel @Inject constructor(
    application: Application,
    private val repository: WorkoutSessionRepository,
    private val stopwatchManager: StopwatchManager,
    private val idManager: FirebaseIdManager
) : AndroidViewModel(application) {
    
    companion object {
        private const val TAG = "WorkoutSessionViewModel"
    }
    
    // Current workout session state
    private val _currentSession = MutableStateFlow<WorkoutSession?>(null)
    val currentSession: StateFlow<WorkoutSession?> = _currentSession.asStateFlow()
    
    // UI state for the session
    private val _sessionUiState = MutableStateFlow<UiState<WorkoutSession>>(UiState.Empty)
    val sessionUiState: StateFlow<UiState<WorkoutSession>> = _sessionUiState.asStateFlow()
    
    // Stopwatch states
    val elapsedTime: StateFlow<Long> = stopwatchManager.elapsedTime
    val isStopwatchRunning: StateFlow<Boolean> = stopwatchManager.isRunning
    val isStopwatchPaused: StateFlow<Boolean> = stopwatchManager.isPaused
    val totalPausedTime: StateFlow<Long> = stopwatchManager.totalPausedTime
    
    // Error state
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        // Try to restore any existing session on initialization
        restoreSessionState()
    }
    
    /**
     * Start a new workout session
     */
    fun startWorkoutSession(program: Program? = null) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Starting workout session with program: ${program?.name ?: "Custom"}")
                Log.d(TAG, "Program details: id=${program?.id}, name=${program?.name}, exercises=${program?.exercises?.size ?: 0}")
                _isLoading.value = true
                _sessionUiState.value = UiState.Loading
                
                // Check if there's already an active session
                if (_currentSession.value?.isActive == true) {
                    _errorMessage.value = "A workout session is already active"
                    _sessionUiState.value = UiState.Error("A workout session is already active")
                    return@launch
                }
                
                // Create new session
                val sessionId = idManager.getNextId("workout_sessions")
                Log.d(TAG, "Generated session ID: $sessionId")
                
                val exercises = program?.exercises?.map { programExercise ->
                    Log.d(TAG, "Creating exercise: ${programExercise.exerciseName} with ${programExercise.sets} sets, ${programExercise.reps} reps, ${programExercise.weight}kg")
                    val targetSets = (1..programExercise.sets).map { setNumber ->
                        TargetSet(
                            setNumber = setNumber,
                            targetReps = programExercise.reps,
                            targetWeight = programExercise.weight
                        )
                    }
                    SessionExercise(
                        exerciseId = programExercise.exerciseId,
                        exerciseName = programExercise.exerciseName,
                        muscleGroup = programExercise.muscleGroup,
                        targetSets = targetSets,
                        completedSets = emptyList(),
                        isCompleted = false,
                        notes = programExercise.notes
                    )
                } ?: run {
                    Log.d(TAG, "No program provided, creating empty exercise list for custom workout")
                    emptyList()
                }
                
                Log.d(TAG, "Created ${exercises.size} exercises for session")
                
                val newSession = WorkoutSession(
                    id = sessionId,
                    programId = program?.id,
                    programName = program?.name,
                    startTime = Date(),
                    pausedDuration = 0L,
                    exercises = exercises,
                    isActive = true,
                    notes = null
                )
                
                Log.d(TAG, "Created session: id=${newSession.id}, programId=${newSession.programId}, programName=${newSession.programName}, exercises=${newSession.exercises.size}")
                
                // Log exercise details
                newSession.exercises.forEachIndexed { index, exercise ->
                    Log.d(TAG, "  Exercise $index: ${exercise.exerciseName}, sets: ${exercise.targetSets.size}")
                }
                
                // Save session to repository
                val saveResult = repository.saveActiveSession(newSession)
                if (saveResult.isFailure) {
                    val error = saveResult.exceptionOrNull()
                    Log.e(TAG, "Failed to save workout session", error)
                    _errorMessage.value = "Failed to start workout session"
                    _sessionUiState.value = UiState.Error("Failed to start workout session")
                    return@launch
                }
                
                // Also save to Firestore immediately for session tracking
                try {
                    FirestoreSessionManager.saveSession(newSession)
                    Log.d(TAG, "Session saved to Firestore on start")
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to save session to Firestore on start", e)
                    // Don't fail the whole operation if Firestore save fails
                }
                
                // Update state
                _currentSession.value = newSession
                _sessionUiState.value = UiState.Success(newSession)
                
                // Start stopwatch immediately
                stopwatchManager.reset()
                stopwatchManager.start()
                
                Log.d(TAG, "Stopwatch started - isRunning: ${stopwatchManager.isRunning.value}, isPaused: ${stopwatchManager.isPaused.value}")
                
                Log.d(TAG, "Workout session started successfully: $sessionId")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error starting workout session", e)
                _errorMessage.value = "Failed to start workout session: ${e.message}"
                _sessionUiState.value = UiState.Error("Failed to start workout session: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Pause the current workout
     */
    fun pauseWorkout() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Pausing workout - current session active: ${_currentSession.value?.isActive}")
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session to pause"
                    Log.w(TAG, "Cannot pause - no active session")
                    return@launch
                }
                try {
                    stopwatchManager.pause()
                } catch (e: Exception) {
                    Log.e(TAG, "Error pausing stopwatch: ", e)
                }
                saveSessionState()
                Log.d(TAG, "Workout paused successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error pausing workout", e)
                _errorMessage.value = "Failed to pause workout: ${e.message}"
            }
        }
    }
    
    /**
     * Resume the current workout
     */
    fun resumeWorkout() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Resuming workout - current session active: ${_currentSession.value?.isActive}")
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session to resume"
                    Log.w(TAG, "Cannot resume - no active session")
                    return@launch
                }
                try {
                    stopwatchManager.resume()
                } catch (e: Exception) {
                    Log.e(TAG, "Error resuming stopwatch: ", e)
                }
                saveSessionState()
                Log.d(TAG, "Workout resumed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error resuming workout", e)
                _errorMessage.value = "Failed to resume workout: ${e.message}"
            }
        }
    }
    
    /**
     * Stop the current workout (just stops the timer, doesn't finish the workout)
     */
    fun stopWorkout() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Stopping workout stopwatch")
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session to stop"
                    Log.w(TAG, "Cannot stop - no active session")
                    return@launch
                }
                try {
                    stopwatchManager.stop()
                } catch (e: Exception) {
                    Log.e(TAG, "Error stopping stopwatch: ", e)
                }
                saveSessionState()
                Log.d(TAG, "Workout stopwatch stopped successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping workout", e)
                _errorMessage.value = "Failed to stop workout: ${e.message}"
            }
        }
    }
    
    /**
     * Complete an exercise set
     */
    fun completeExerciseSet(exerciseId: Long, setNumber: Int, actualReps: Int, actualWeight: Double) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Completing exercise set: exerciseId=$exerciseId, setNumber=$setNumber")
                
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session"
                    return@launch
                }
                
                // Find the exercise
                val exerciseIndex = session.exercises.indexOfFirst { it.exerciseId == exerciseId }
                if (exerciseIndex == -1) {
                    _errorMessage.value = "Exercise not found in current workout"
                    return@launch
                }
                
                val exercise = session.exercises[exerciseIndex]
                
                // Check if set number is valid
                if (setNumber <= 0 || setNumber > exercise.targetSets.size) {
                    _errorMessage.value = "Invalid set number"
                    return@launch
                }
                
                // Check if set is already completed
                if (exercise.isSetCompleted(setNumber)) {
                    Log.w(TAG, "Set $setNumber is already completed for exercise $exerciseId")
                    return@launch
                }
                
                // Create completed set
                val completedSet = CompletedSet(
                    setNumber = setNumber,
                    actualReps = actualReps,
                    actualWeight = actualWeight,
                    completedAt = Date()
                )
                
                // Update exercise with completed set
                val updatedCompletedSets = exercise.completedSets + completedSet
                val updatedExercise = exercise.copy(
                    completedSets = updatedCompletedSets,
                    isCompleted = updatedCompletedSets.size >= exercise.targetSets.size
                )
                
                // Update session
                val updatedExercises = session.exercises.toMutableList()
                updatedExercises[exerciseIndex] = updatedExercise
                
                val updatedSession = session.copy(exercises = updatedExercises)
                
                // Save updated session
                val saveResult = repository.saveActiveSession(updatedSession)
                if (saveResult.isFailure) {
                    Log.e(TAG, "Failed to save updated session", saveResult.exceptionOrNull())
                    _errorMessage.value = "Failed to save progress"
                    return@launch
                }
                
                // Update state
                _currentSession.value = updatedSession
                _sessionUiState.value = UiState.Success(updatedSession)
                
                Log.d(TAG, "Exercise set completed successfully")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error completing exercise set", e)
                _errorMessage.value = "Failed to complete set: ${e.message}"
            }
        }
    }
    
    /**
     * Uncomplete an exercise set
     */
    fun uncompleteExerciseSet(exerciseId: Long, setNumber: Int) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Uncompleting exercise set: exerciseId=$exerciseId, setNumber=$setNumber")
                
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session"
                    return@launch
                }
                
                // Find the exercise
                val exerciseIndex = session.exercises.indexOfFirst { it.exerciseId == exerciseId }
                if (exerciseIndex == -1) {
                    _errorMessage.value = "Exercise not found in current workout"
                    return@launch
                }
                
                val exercise = session.exercises[exerciseIndex]
                
                // Remove the completed set
                val updatedCompletedSets = exercise.completedSets.filter { it.setNumber != setNumber }
                val updatedExercise = exercise.copy(
                    completedSets = updatedCompletedSets,
                    isCompleted = false
                )
                
                // Update session
                val updatedExercises = session.exercises.toMutableList()
                updatedExercises[exerciseIndex] = updatedExercise
                
                val updatedSession = session.copy(exercises = updatedExercises)
                
                // Save updated session
                val saveResult = repository.saveActiveSession(updatedSession)
                if (saveResult.isFailure) {
                    Log.e(TAG, "Failed to save updated session", saveResult.exceptionOrNull())
                    _errorMessage.value = "Failed to save progress"
                    return@launch
                }
                
                // Update state
                _currentSession.value = updatedSession
                _sessionUiState.value = UiState.Success(updatedSession)
                
                Log.d(TAG, "Exercise set uncompleted successfully")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error uncompleting exercise set", e)
                _errorMessage.value = "Failed to uncomplete set: ${e.message}"
            }
        }
    }
    
    /**
     * Finish the current workout
     */
    fun finishWorkout(notes: String? = null) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Finishing workout")
                _isLoading.value = true
                val session = _currentSession.value
                if (session == null || !session.isActive) {
                    _errorMessage.value = "No active workout session to finish"
                    return@launch
                }
                // Stop stopwatch
                try {
                    stopwatchManager.stop()
                } catch (e: Exception) {
                    Log.e(TAG, "Error stopping stopwatch: ", e)
                }
                val endTime = Date()
                val totalDuration = elapsedTime.value
                val activeDuration = totalDuration - totalPausedTime.value
                // Defensive: always use the latest session state and include all exercises/sets
                val completedWorkout = convertSessionToWorkout(
                    session = session.copy(notes = notes, isActive = false),
                    endTime = endTime,
                    totalDuration = totalDuration,
                    activeDuration = activeDuration
                )
                Log.d(TAG, "Saving completed workout: ${completedWorkout.id}, exercises: ${completedWorkout.exercises.size}")
                completedWorkout.exercises.forEachIndexed { idx, ex ->
                    Log.d(TAG, "  Exercise $idx: ${ex.exerciseName}, sets: ${ex.sets.size}")
                }
                val saveResult = repository.saveCompletedWorkout(completedWorkout)
                if (saveResult.isFailure) {
                    Log.e(TAG, "Failed to save completed workout", saveResult.exceptionOrNull())
                    _errorMessage.value = "Failed to save workout"
                    return@launch
                }
                // Save session to Firestore with all data - ONLY when workout finishes
                val finalSession = session.copy(
                    notes = notes,
                    isActive = false,
                    pausedDuration = totalPausedTime.value
                )
                Log.d(TAG, "Saving completed session to Firestore: programId=${finalSession.programId}, programName=${finalSession.programName}, exercises=${finalSession.exercises.size}")
                try {
                    FirestoreSessionManager.saveSession(finalSession)
                    Log.d(TAG, "Completed session saved to Firestore successfully with ${finalSession.exercises.size} exercises")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to save completed session to Firestore", e)
                    _errorMessage.value = "Workout saved locally, but failed to sync to cloud: ${e.message}"
                }
                repository.clearActiveSession()
                _currentSession.value = null
                _sessionUiState.value = UiState.Empty
                try {
                    stopwatchManager.reset()
                } catch (e: Exception) {
                    Log.e(TAG, "Error resetting stopwatch: ", e)
                }
                Log.d(TAG, "Workout finished and saved successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error finishing workout", e)
                _errorMessage.value = "Failed to finish workout: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Save current session state
     */
    fun saveSessionState() {
        viewModelScope.launch {
            try {
                val session = _currentSession.value
                if (session != null && session.isActive) {
                    val updatedSession = session.copy(
                        pausedDuration = totalPausedTime.value
                    )
                    repository.saveActiveSession(updatedSession)
                    stopwatchManager.saveState()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error saving session state", e)
            }
        }
    }
    
    /**
     * Restore session state
     */
    fun restoreSessionState() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Restoring session state")
                _isLoading.value = true
                _sessionUiState.value = UiState.Loading
                
                val sessionResult = repository.getActiveSession()
                if (sessionResult.isSuccess) {
                    val session = sessionResult.getOrNull()
                    if (session != null && session.isActive) {
                        Log.d(TAG, "Restored active session: ${session.id} with ${session.exercises.size} exercises")
                        _currentSession.value = session
                        _sessionUiState.value = UiState.Success(session)
                        
                        // Restore stopwatch state
                        stopwatchManager.restoreState()
                        
                        // If stopwatch isn't running, start it
                        if (!stopwatchManager.isRunning.value) {
                            Log.d(TAG, "Starting stopwatch for restored session")
                            stopwatchManager.start()
                        }
                    } else {
                        Log.d(TAG, "No active session to restore")
                        _sessionUiState.value = UiState.Empty
                    }
                } else {
                    Log.e(TAG, "Failed to restore session", sessionResult.exceptionOrNull())
                    _sessionUiState.value = UiState.Empty
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error restoring session state", e)
                _sessionUiState.value = UiState.Empty
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Clear error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
    
    /**
     * Get formatted elapsed time
     */
    fun getFormattedElapsedTime(): String {
        return stopwatchManager.getFormattedTime()
    }
    
    /**
     * Check if there's an active session
     */
    fun hasActiveSession(): Boolean {
        return _currentSession.value?.isActive == true
    }
    
    /**
     * Convert WorkoutSession to Workout for persistence
     */
    private fun convertSessionToWorkout(session: WorkoutSession, endTime: Date, totalDuration: Long, activeDuration: Long): Workout {
        val workoutExercises = session.exercises.map { sessionExercise ->
            val workoutSets = sessionExercise.completedSets.map { completedSet ->
                WorkoutSet(
                    setNumber = completedSet.setNumber,
                    reps = completedSet.actualReps,
                    weight = completedSet.actualWeight,
                    completed = true
                )
            }
            
            WorkoutExercise(
                exerciseId = sessionExercise.exerciseId,
                exerciseName = sessionExercise.exerciseName,
                muscleGroup = sessionExercise.muscleGroup,
                sets = workoutSets
            )
        }
        
        val totalVolume = session.exercises.sumOf { exercise ->
            exercise.completedSets.sumOf { set ->
                set.actualWeight * set.actualReps
            }
        }
        
        return Workout(
            id = session.id,
            programId = session.programId,
            programName = session.programName,
            startTime = session.startTime,
            endTime = endTime,
            duration = totalDuration,
            activeDuration = activeDuration,
            exercises = workoutExercises,
            notes = session.notes,
            completionPercentage = session.getCompletionPercentage(),
            totalSetsCompleted = session.getTotalCompletedSets(),
            totalSetsPlanned = session.getTotalPlannedSets(),
            totalVolume = totalVolume
        )
    }
    
    /**
     * Initialize session - restore existing or start new one
     */
    fun initializeSession() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Initializing workout session")
                _isLoading.value = true
                
                // First try to restore any existing session
                val sessionResult = repository.getActiveSession()
                if (sessionResult.isSuccess) {
                    val existingSession = sessionResult.getOrNull()
                    if (existingSession != null && existingSession.isActive) {
                        Log.d(TAG, "Found existing active session, restoring")
                        _currentSession.value = existingSession
                        _sessionUiState.value = UiState.Success(existingSession)
                        
                        // Restore stopwatch state
                        stopwatchManager.restoreState()
                    } else {
                        Log.d(TAG, "No existing session found, starting new one")
                        // Start a new session without program (custom workout)
                        startNewSession()
                    }
                } else {
                    Log.d(TAG, "Error getting existing session, starting new one")
                    // Start a new session without program (custom workout)
                    startNewSession()
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing session", e)
                _errorMessage.value = "Failed to initialize workout session: ${e.message}"
                _sessionUiState.value = UiState.Error("Failed to initialize workout session")
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Start a new session (internal method that doesn't check for existing sessions)
     */
    private suspend fun startNewSession(program: Program? = null) {
        try {
            Log.d(TAG, "Starting new workout session with program: ${program?.name ?: "Custom"}")
            
            // Create new session
            val sessionId = idManager.getNextId("workout_sessions")
            val exercises = program?.exercises?.map { programExercise ->
                val targetSets = (1..programExercise.sets).map { setNumber ->
                    TargetSet(
                        setNumber = setNumber,
                        targetReps = programExercise.reps,
                        targetWeight = programExercise.weight
                    )
                }
                
                SessionExercise(
                    exerciseId = programExercise.exerciseId,
                    exerciseName = programExercise.exerciseName,
                    muscleGroup = programExercise.muscleGroup,
                    targetSets = targetSets,
                    notes = programExercise.notes
                )
            } ?: emptyList()
            
            val newSession = WorkoutSession(
                id = sessionId,
                programId = program?.id,
                programName = program?.name,
                startTime = Date(),
                exercises = exercises,
                isActive = true
            )
            
            // Save session
            val saveResult = repository.saveActiveSession(newSession)
            if (saveResult.isFailure) {
                val error = saveResult.exceptionOrNull()
                Log.e(TAG, "Failed to save workout session", error)
                _errorMessage.value = "Failed to start workout session"
                _sessionUiState.value = UiState.Error("Failed to start workout session")
                return
            }
            
            // Update state
            _currentSession.value = newSession
            _sessionUiState.value = UiState.Success(newSession)
            
            // Start stopwatch
            stopwatchManager.start()
            
            Log.d(TAG, "New workout session started successfully: $sessionId")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting new workout session", e)
            _errorMessage.value = "Failed to start workout session: ${e.message}"
            _sessionUiState.value = UiState.Error("Failed to start workout session")
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // Save state when ViewModel is cleared
        saveSessionState()
    }
}
package com.example.allinone.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.allinone.data.*
import com.example.allinone.data.common.UiState
import com.example.allinone.data.repository.WorkoutSessionRepository
import com.example.allinone.utils.WorkoutStatsCalculator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for managing workout statistics and history
 */
@HiltViewModel
class WorkoutStatsViewModel @Inject constructor(
    application: Application,
    private val repository: WorkoutSessionRepository
) : AndroidViewModel(application) {
    
    companion object {
        private const val TAG = "WorkoutStatsViewModel"
    }
    
    // Workout history state
    private val _workoutHistory = MutableStateFlow<List<Workout>>(emptyList())
    val workoutHistory: StateFlow<List<Workout>> = _workoutHistory.asStateFlow()
    
    // Workout statistics state
    private val _workoutStats = MutableStateFlow<WorkoutStats?>(null)
    val workoutStats: StateFlow<WorkoutStats?> = _workoutStats.asStateFlow()
    
    // Workout summaries state
    private val _workoutSummaries = MutableStateFlow<List<WorkoutSessionSummary>>(emptyList())
    val workoutSummaries: StateFlow<List<WorkoutSessionSummary>> = _workoutSummaries.asStateFlow()
    
    // UI state for history
    private val _historyUiState = MutableStateFlow<UiState<List<Workout>>>(UiState.Loading)
    val historyUiState: StateFlow<UiState<List<Workout>>> = _historyUiState.asStateFlow()
    
    // UI state for stats
    private val _statsUiState = MutableStateFlow<UiState<WorkoutStats>>(UiState.Loading)
    val statsUiState: StateFlow<UiState<WorkoutStats>> = _statsUiState.asStateFlow()
    
    // Selected workout for details
    private val _selectedWorkout = MutableStateFlow<Workout?>(null)
    val selectedWorkout: StateFlow<Workout?> = _selectedWorkout.asStateFlow()
    
    // Error state
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    init {
        loadWorkoutHistory()
    }
    
    /**
     * Load workout history from repository
     */
    fun loadWorkoutHistory() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Loading workout history")
                _isLoading.value = true
                _historyUiState.value = UiState.Loading
                _statsUiState.value = UiState.Loading
                
                val result = repository.getCompletedWorkouts()
                
                if (result.isSuccess) {
                    val workouts = result.getOrNull() ?: emptyList()
                    Log.d(TAG, "Loaded ${workouts.size} workouts from history")
                    
                    _workoutHistory.value = workouts
                    _historyUiState.value = if (workouts.isEmpty()) {
                        UiState.Empty
                    } else {
                        UiState.Success(workouts)
                    }
                    
                    // Calculate statistics
                    calculateStatistics(workouts)
                    
                    // Generate summaries
                    generateSummaries(workouts)
                    
                } else {
                    val error = result.exceptionOrNull()
                    Log.e(TAG, "Failed to load workout history", error)
                    val errorMessage = error?.message ?: "Failed to load workout history"
                    _errorMessage.value = errorMessage
                    _historyUiState.value = UiState.Error(errorMessage)
                    _statsUiState.value = UiState.Error(errorMessage)
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error loading workout history", e)
                val errorMessage = "Failed to load workout history: ${e.message}"
                _errorMessage.value = errorMessage
                _historyUiState.value = UiState.Error(errorMessage)
                _statsUiState.value = UiState.Error(errorMessage)
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Calculate workout statistics
     */
    private fun calculateStatistics(workouts: List<Workout>) {
        try {
            Log.d(TAG, "Calculating workout statistics for ${workouts.size} workouts")
            
            val stats = WorkoutStatsCalculator.calculateWorkoutStats(workouts)
            _workoutStats.value = stats
            _statsUiState.value = UiState.Success(stats)
            
            Log.d(TAG, "Statistics calculated: ${stats.totalWorkouts} total workouts, ${stats.getFormattedTotalDuration()} total duration")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating statistics", e)
            _errorMessage.value = "Failed to calculate statistics: ${e.message}"
        }
    }
    
    /**
     * Generate workout summaries
     */
    private fun generateSummaries(workouts: List<Workout>) {
        try {
            Log.d(TAG, "Generating workout summaries")
            
            val summaries = WorkoutStatsCalculator.generateWorkoutSummaries(workouts)
            _workoutSummaries.value = summaries
            
            Log.d(TAG, "Generated ${summaries.size} workout summaries")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error generating summaries", e)
            _errorMessage.value = "Failed to generate summaries: ${e.message}"
        }
    }
    
    /**
     * Get workout details by ID
     */
    fun getWorkoutDetails(workoutId: Long) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Getting workout details for ID: $workoutId")
                
                val result = repository.getCompletedWorkout(workoutId)
                
                if (result.isSuccess) {
                    val workout = result.getOrNull()
                    _selectedWorkout.value = workout
                    
                    if (workout != null) {
                        Log.d(TAG, "Retrieved workout details: ${workout.programName ?: "Custom"}")
                    } else {
                        Log.w(TAG, "Workout not found: $workoutId")
                        _errorMessage.value = "Workout not found"
                    }
                } else {
                    val error = result.exceptionOrNull()
                    Log.e(TAG, "Failed to get workout details", error)
                    _errorMessage.value = "Failed to load workout details"
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error getting workout details", e)
                _errorMessage.value = "Failed to load workout details: ${e.message}"
            }
        }
    }
    
    /**
     * Delete a workout from history
     */
    fun deleteWorkout(workoutId: Long) {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Deleting workout: $workoutId")
                
                val result = repository.deleteCompletedWorkout(workoutId)
                
                if (result.isSuccess) {
                    Log.d(TAG, "Workout deleted successfully: $workoutId")
                    
                    // Refresh the history
                    loadWorkoutHistory()
                } else {
                    val error = result.exceptionOrNull()
                    Log.e(TAG, "Failed to delete workout", error)
                    _errorMessage.value = "Failed to delete workout"
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting workout", e)
                _errorMessage.value = "Failed to delete workout: ${e.message}"
            }
        }
    }
    
    /**
     * Refresh workout data
     */
    fun refreshData() {
        Log.d(TAG, "Refreshing workout data")
        loadWorkoutHistory()
    }
    
    /**
     * Clear selected workout
     */
    fun clearSelectedWorkout() {
        _selectedWorkout.value = null
    }
    
    /**
     * Clear error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }
    
    /**
     * Get workouts for a specific time period
     */
    fun getWorkoutsForPeriod(period: TimePeriod): List<Workout> {
        val workouts = _workoutHistory.value
        val calendar = java.util.Calendar.getInstance()
        
        return when (period) {
            TimePeriod.THIS_WEEK -> {
                calendar.set(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.SUNDAY)
                calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
                calendar.set(java.util.Calendar.MINUTE, 0)
                calendar.set(java.util.Calendar.SECOND, 0)
                calendar.set(java.util.Calendar.MILLISECOND, 0)
                val weekStart = calendar.time
                
                calendar.add(java.util.Calendar.DAY_OF_WEEK, 7)
                val weekEnd = calendar.time
                
                workouts.filter { it.startTime.after(weekStart) && it.startTime.before(weekEnd) }
            }
            TimePeriod.THIS_MONTH -> {
                calendar.set(java.util.Calendar.DAY_OF_MONTH, 1)
                calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
                calendar.set(java.util.Calendar.MINUTE, 0)
                calendar.set(java.util.Calendar.SECOND, 0)
                calendar.set(java.util.Calendar.MILLISECOND, 0)
                val monthStart = calendar.time
                
                calendar.add(java.util.Calendar.MONTH, 1)
                val monthEnd = calendar.time
                
                workouts.filter { it.startTime.after(monthStart) && it.startTime.before(monthEnd) }
            }
            TimePeriod.LAST_30_DAYS -> {
                calendar.add(java.util.Calendar.DAY_OF_YEAR, -30)
                val thirtyDaysAgo = calendar.time
                
                workouts.filter { it.startTime.after(thirtyDaysAgo) }
            }
            TimePeriod.ALL_TIME -> workouts
        }
    }
}

/**
 * Enum for time periods
 */
enum class TimePeriod {
    THIS_WEEK,
    THIS_MONTH,
    LAST_30_DAYS,
    ALL_TIME
}
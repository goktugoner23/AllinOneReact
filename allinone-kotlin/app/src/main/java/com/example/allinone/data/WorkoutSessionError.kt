package com.example.allinone.data

/**
 * Sealed class representing different types of workout session errors
 */
sealed class WorkoutSessionError : Exception() {
    
    /**
     * Error when trying to access a session that doesn't exist
     */
    object SessionNotFound : WorkoutSessionError() {
        override val message: String = "Workout session not found"
    }
    
    /**
     * Error when trying to start a session while another is already active
     */
    object SessionAlreadyActive : WorkoutSessionError() {
        override val message: String = "A workout session is already active"
    }
    
    /**
     * Error when trying to access an invalid exercise ID
     */
    data class InvalidExerciseId(val exerciseId: Long) : WorkoutSessionError() {
        override val message: String = "Invalid exercise ID: $exerciseId"
    }
    
    /**
     * Error when trying to access an invalid set number
     */
    data class InvalidSetNumber(val setNumber: Int, val exerciseId: Long) : WorkoutSessionError() {
        override val message: String = "Invalid set number $setNumber for exercise $exerciseId"
    }
    
    /**
     * Error when data persistence operations fail
     */
    data class PersistenceError(override val message: String, override val cause: Throwable? = null) : WorkoutSessionError()
    
    /**
     * Error when network operations fail
     */
    data class NetworkError(override val message: String, override val cause: Throwable? = null) : WorkoutSessionError()
    
    /**
     * Error when session validation fails
     */
    data class ValidationError(override val message: String) : WorkoutSessionError()
    
    /**
     * Error when stopwatch operations fail
     */
    data class StopwatchError(override val message: String) : WorkoutSessionError()
    
    /**
     * Error when session state is corrupted
     */
    object CorruptedSessionState : WorkoutSessionError() {
        override val message: String = "Workout session state is corrupted"
    }
    
    /**
     * Error when trying to perform operations on an inactive session
     */
    object SessionNotActive : WorkoutSessionError() {
        override val message: String = "Workout session is not active"
    }
}

/**
 * Extension function to get user-friendly error messages
 */
fun WorkoutSessionError.getUserFriendlyMessage(): String {
    return when (this) {
        is WorkoutSessionError.SessionNotFound -> "No active workout session found. Please start a new workout."
        is WorkoutSessionError.SessionAlreadyActive -> "You already have an active workout. Please finish it first."
        is WorkoutSessionError.InvalidExerciseId -> "Exercise not found in current workout."
        is WorkoutSessionError.InvalidSetNumber -> "Invalid set number. Please check your workout plan."
        is WorkoutSessionError.PersistenceError -> "Failed to save workout data. Please try again."
        is WorkoutSessionError.NetworkError -> "Network error. Your workout will be saved locally and synced later."
        is WorkoutSessionError.ValidationError -> this.message
        is WorkoutSessionError.StopwatchError -> "Timer error. Please restart your workout if needed."
        is WorkoutSessionError.CorruptedSessionState -> "Workout data is corrupted. Please start a new workout."
        is WorkoutSessionError.SessionNotActive -> "No active workout session. Please start a workout first."
    }
}
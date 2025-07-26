package com.example.allinone.data.repository

import com.example.allinone.data.Workout
import com.example.allinone.data.WorkoutSession
import com.example.allinone.data.WorkoutSessionError

/**
 * Repository interface for managing workout session data
 */
interface WorkoutSessionRepository {
    
    /**
     * Save the current active workout session
     */
    suspend fun saveActiveSession(session: WorkoutSession): Result<Unit>
    
    /**
     * Get the current active workout session
     */
    suspend fun getActiveSession(): Result<WorkoutSession?>
    
    /**
     * Clear the active workout session
     */
    suspend fun clearActiveSession(): Result<Unit>
    
    /**
     * Save a completed workout to history
     */
    suspend fun saveCompletedWorkout(workout: Workout): Result<Unit>
    
    /**
     * Get all completed workouts
     */
    suspend fun getCompletedWorkouts(): Result<List<Workout>>
    
    /**
     * Get a specific completed workout by ID
     */
    suspend fun getCompletedWorkout(workoutId: Long): Result<Workout?>
    
    /**
     * Delete a completed workout
     */
    suspend fun deleteCompletedWorkout(workoutId: Long): Result<Unit>
    
    /**
     * Check if there's an active session
     */
    suspend fun hasActiveSession(): Boolean
}
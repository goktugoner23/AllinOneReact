package com.example.allinone.data.repository

import android.util.Log
import com.example.allinone.cache.WorkoutSessionCache
import com.example.allinone.data.*
import com.example.allinone.firebase.FirebaseManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementation of WorkoutSessionRepository
 */
@Singleton
class WorkoutSessionRepositoryImpl @Inject constructor(
    private val firebaseManager: FirebaseManager,
    private val cache: WorkoutSessionCache
) : WorkoutSessionRepository {
    
    companion object {
        private const val TAG = "WorkoutSessionRepository"
    }
    
    override suspend fun saveActiveSession(session: WorkoutSession): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Saving active workout session: ${session.id}")
            
            // Save to local cache first for immediate access
            val cacheResult = cache.saveSession(session)
            if (cacheResult.isFailure) {
                Log.w(TAG, "Failed to save session to cache", cacheResult.exceptionOrNull())
                // Continue with Firebase save even if cache fails
            }
            
            Log.d(TAG, "Active workout session saved successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save active workout session", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to save active session", e))
        }
    }
    
    override suspend fun getActiveSession(): Result<WorkoutSession?> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting active workout session")
            
            // Try to get from cache first
            val cacheResult = cache.getSession()
            if (cacheResult.isSuccess) {
                val session = cacheResult.getOrNull()
                if (session != null) {
                    Log.d(TAG, "Active workout session retrieved from cache: ${session.id}")
                    return@withContext Result.success(session)
                }
            } else {
                Log.w(TAG, "Failed to get session from cache", cacheResult.exceptionOrNull())
            }
            
            Log.d(TAG, "No active workout session found")
            Result.success(null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get active workout session", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to get active session", e))
        }
    }
    
    override suspend fun clearActiveSession(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Clearing active workout session")
            
            // Clear from cache
            val cacheResult = cache.clearSession()
            if (cacheResult.isFailure) {
                Log.w(TAG, "Failed to clear session from cache", cacheResult.exceptionOrNull())
            }
            
            Log.d(TAG, "Active workout session cleared successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear active workout session", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to clear active session", e))
        }
    }
    
    override suspend fun saveCompletedWorkout(workout: Workout): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Saving completed workout: ${workout.id}")
            
            // Save to Firebase using the existing saveWorkout method that returns Long
            val workoutId = firebaseManager.saveWorkout(workout)
            
            if (workoutId > 0) {
                Log.d(TAG, "Completed workout saved successfully with ID: $workoutId")
                Result.success(Unit)
            } else {
                Log.e(TAG, "Failed to save workout to Firebase - invalid ID returned")
                Result.failure(WorkoutSessionError.PersistenceError("Failed to save completed workout"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save completed workout", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to save completed workout", e))
        }
    }
    
    override suspend fun getCompletedWorkouts(): Result<List<Workout>> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting completed workouts")
            
            val workouts = firebaseManager.getWorkouts()
            Log.d(TAG, "Retrieved ${workouts.size} completed workouts")
            
            Result.success(workouts)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get completed workouts", e)
            Result.failure(WorkoutSessionError.NetworkError("Failed to get completed workouts", e))
        }
    }
    
    override suspend fun getCompletedWorkout(workoutId: Long): Result<Workout?> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting completed workout: $workoutId")
            
            val workouts = firebaseManager.getWorkouts()
            val workout = workouts.find { it.id == workoutId }
            
            if (workout != null) {
                Log.d(TAG, "Found completed workout: $workoutId")
            } else {
                Log.d(TAG, "Completed workout not found: $workoutId")
            }
            
            Result.success(workout)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get completed workout: $workoutId", e)
            Result.failure(WorkoutSessionError.NetworkError("Failed to get completed workout", e))
        }
    }
    
    override suspend fun deleteCompletedWorkout(workoutId: Long): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Deleting completed workout: $workoutId")
            
            firebaseManager.deleteWorkout(workoutId)
            
            Log.d(TAG, "Completed workout deleted successfully: $workoutId")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete completed workout: $workoutId", e)
            Result.failure(WorkoutSessionError.NetworkError("Failed to delete completed workout", e))
        }
    }
    
    override suspend fun hasActiveSession(): Boolean = withContext(Dispatchers.IO) {
        try {
            val hasSession = cache.hasSession()
            Log.d(TAG, "Checking if active session exists: $hasSession")
            hasSession
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check if active session exists", e)
            false
        }
    }
    
    /**
     * Convert WorkoutSession to Workout for persistence
     */
    fun convertSessionToWorkout(session: WorkoutSession, endTime: java.util.Date, totalDuration: Long, activeDuration: Long): Workout {
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
}
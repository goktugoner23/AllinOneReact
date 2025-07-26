package com.example.allinone.data

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

/**
 * Data class representing a completed workout session
 */
@Parcelize
data class Workout(
    val id: Long = 0,
    val programId: Long? = null,
    val programName: String? = null,
    val startTime: Date = Date(),
    val endTime: Date? = null,
    val duration: Long = 0, // Total duration including pauses in milliseconds
    val activeDuration: Long = 0, // Active workout time excluding pauses in milliseconds
    val exercises: List<WorkoutExercise> = emptyList(),
    val notes: String? = null,
    val completionPercentage: Float = 0f, // Percentage of exercises completed
    val totalSetsCompleted: Int = 0,
    val totalSetsPlanned: Int = 0,
    val totalVolume: Double = 0.0 // Total weight lifted during workout
) : Parcelable {
    
    /**
     * Get formatted duration string
     */
    fun getFormattedDuration(): String {
        val seconds = duration / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        val remainingSeconds = seconds % 60
        
        return when {
            hours > 0 -> String.format("%d:%02d:%02d", hours, remainingMinutes, remainingSeconds)
            else -> String.format("%d:%02d", remainingMinutes, remainingSeconds)
        }
    }
    
    /**
     * Get formatted active duration string
     */
    fun getFormattedActiveDuration(): String {
        val seconds = activeDuration / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        val remainingSeconds = seconds % 60
        
        return when {
            hours > 0 -> String.format("%d:%02d:%02d", hours, remainingMinutes, remainingSeconds)
            else -> String.format("%d:%02d", remainingMinutes, remainingSeconds)
        }
    }
    
    /**
     * Check if workout was completed (100% completion)
     */
    fun isCompleted(): Boolean {
        return completionPercentage >= 100f
    }
    
    /**
     * Get completion status as string
     */
    fun getCompletionStatus(): String {
        return when {
            completionPercentage >= 100f -> "Completed"
            completionPercentage >= 50f -> "Partially Completed"
            else -> "Incomplete"
        }
    }
}

/**
 * Data class representing an exercise performed during a workout
 */
@Parcelize
data class WorkoutExercise(
    val exerciseId: Long,
    val exerciseName: String,
    val muscleGroup: String? = null,
    val sets: List<WorkoutSet> = emptyList()
) : Parcelable {
    
    /**
     * Check if all sets in this exercise are completed
     */
    fun isCompleted(): Boolean {
        return sets.isNotEmpty() && sets.all { it.completed }
    }
}

/**
 * Data class representing a set performed during a workout
 */
@Parcelize
data class WorkoutSet(
    val setNumber: Int,
    val reps: Int,
    val weight: Double,
    val completed: Boolean = false
) : Parcelable

package com.example.allinone.data

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

/**
 * Data class representing an active workout session
 */
@Parcelize
data class WorkoutSession(
    val id: Long = 0,
    val programId: Long? = null,
    val programName: String? = null,
    val startTime: Date = Date(),
    val pausedDuration: Long = 0, // Total paused time in milliseconds
    val exercises: List<SessionExercise> = emptyList(),
    val isActive: Boolean = true,
    val notes: String? = null
) : Parcelable {
    
    /**
     * Calculate the total active duration (excluding paused time)
     */
    fun getActiveDuration(): Long {
        return if (isActive) {
            System.currentTimeMillis() - startTime.time - pausedDuration
        } else {
            0L
        }
    }
    
    /**
     * Calculate completion percentage based on completed sets
     */
    fun getCompletionPercentage(): Float {
        val totalSets = exercises.sumOf { it.targetSets.size }
        val completedSets = exercises.sumOf { it.completedSets.size }
        
        return if (totalSets > 0) {
            (completedSets.toFloat() / totalSets.toFloat()) * 100f
        } else {
            0f
        }
    }
    
    /**
     * Get total number of completed sets
     */
    fun getTotalCompletedSets(): Int {
        return exercises.sumOf { it.completedSets.size }
    }
    
    /**
     * Get total number of planned sets
     */
    fun getTotalPlannedSets(): Int {
        return exercises.sumOf { it.targetSets.size }
    }
    
    /**
     * Check if the workout session is completed (all exercises done)
     */
    fun isCompleted(): Boolean {
        return exercises.isNotEmpty() && exercises.all { it.isCompleted }
    }
}

/**
 * Data class representing an exercise within a workout session
 */
@Parcelize
data class SessionExercise(
    val exerciseId: Long,
    val exerciseName: String,
    val muscleGroup: String? = null,
    val targetSets: List<TargetSet> = emptyList(),
    val completedSets: List<CompletedSet> = emptyList(),
    val isCompleted: Boolean = false,
    val notes: String? = null
) : Parcelable {
    
    /**
     * Get completion percentage for this exercise
     */
    fun getCompletionPercentage(): Float {
        return if (targetSets.isNotEmpty()) {
            (completedSets.size.toFloat() / targetSets.size.toFloat()) * 100f
        } else {
            0f
        }
    }
    
    /**
     * Check if a specific set is completed
     */
    fun isSetCompleted(setNumber: Int): Boolean {
        return completedSets.any { it.setNumber == setNumber }
    }
    
    /**
     * Get the completed set for a specific set number
     */
    fun getCompletedSet(setNumber: Int): CompletedSet? {
        return completedSets.find { it.setNumber == setNumber }
    }
}

/**
 * Data class representing a target set within an exercise
 */
@Parcelize
data class TargetSet(
    val setNumber: Int,
    val targetReps: Int,
    val targetWeight: Double,
    val restTime: Int = 0 // Rest time in seconds
) : Parcelable

/**
 * Data class representing a completed set within an exercise
 */
@Parcelize
data class CompletedSet(
    val setNumber: Int,
    val actualReps: Int,
    val actualWeight: Double,
    val completedAt: Date = Date(),
    val restTime: Int = 0 // Actual rest time taken in seconds
) : Parcelable {
    
    /**
     * Check if this set matches or exceeds the target
     */
    fun meetsTarget(targetSet: TargetSet): Boolean {
        return actualReps >= targetSet.targetReps && actualWeight >= targetSet.targetWeight
    }
}
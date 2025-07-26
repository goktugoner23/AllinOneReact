package com.example.allinone.data

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

/**
 * Data class representing comprehensive workout statistics
 */
@Parcelize
data class WorkoutStats(
    val totalWorkouts: Int = 0,
    val totalDuration: Long = 0, // Total workout time in milliseconds
    val averageDuration: Long = 0, // Average workout duration in milliseconds
    val weeklyWorkouts: Int = 0,
    val monthlyWorkouts: Int = 0,
    val currentStreak: Int = 0, // Current consecutive workout days
    val longestStreak: Int = 0, // Longest consecutive workout days
    val mostFrequentExercises: List<ExerciseFrequency> = emptyList(),
    val workoutTrends: WorkoutTrends? = null,
    val lastWorkoutDate: Date? = null
) : Parcelable {
    
    /**
     * Get average workouts per week
     */
    fun getAverageWorkoutsPerWeek(): Float {
        return if (totalWorkouts > 0) {
            weeklyWorkouts.toFloat()
        } else {
            0f
        }
    }
    
    /**
     * Get formatted average duration string
     */
    fun getFormattedAverageDuration(): String {
        val minutes = averageDuration / (1000 * 60)
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        
        return if (hours > 0) {
            "${hours}h ${remainingMinutes}m"
        } else {
            "${remainingMinutes}m"
        }
    }
    
    /**
     * Get formatted total duration string
     */
    fun getFormattedTotalDuration(): String {
        val minutes = totalDuration / (1000 * 60)
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        
        return if (hours > 0) {
            "${hours}h ${remainingMinutes}m"
        } else {
            "${remainingMinutes}m"
        }
    }
}

/**
 * Data class representing exercise frequency statistics
 */
@Parcelize
data class ExerciseFrequency(
    val exerciseName: String,
    val frequency: Int, // Number of times performed
    val lastPerformed: Date,
    val averageWeight: Double = 0.0,
    val averageReps: Int = 0,
    val personalBest: PersonalBest? = null
) : Parcelable

/**
 * Data class representing personal best for an exercise
 */
@Parcelize
data class PersonalBest(
    val maxWeight: Double,
    val maxReps: Int,
    val achievedDate: Date
) : Parcelable

/**
 * Data class representing workout trends over time
 */
@Parcelize
data class WorkoutTrends(
    val durationTrend: List<TrendPoint> = emptyList(),
    val frequencyTrend: List<TrendPoint> = emptyList(),
    val volumeTrend: List<TrendPoint> = emptyList(), // Total weight lifted over time
    val strengthTrend: List<TrendPoint> = emptyList() // Average weight per exercise over time
) : Parcelable

/**
 * Data class representing a single point in a trend
 */
@Parcelize
data class TrendPoint(
    val date: Date,
    val value: Float,
    val label: String? = null
) : Parcelable

/**
 * Data class for workout session summary
 */
@Parcelize
data class WorkoutSessionSummary(
    val sessionId: Long,
    val programName: String?,
    val date: Date,
    val duration: Long,
    val exercisesCompleted: Int,
    val totalExercises: Int,
    val completionPercentage: Float,
    val totalSetsCompleted: Int,
    val totalVolume: Double // Total weight lifted
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
     * Check if workout was completed
     */
    fun isCompleted(): Boolean {
        return completionPercentage >= 100f
    }
}
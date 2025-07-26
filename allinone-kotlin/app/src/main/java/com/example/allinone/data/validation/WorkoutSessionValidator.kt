package com.example.allinone.data.validation

import com.example.allinone.data.*
import java.util.Date

/**
 * Validator for workout session data
 */
object WorkoutSessionValidator {
    
    /**
     * Validates a workout session
     */
    fun validateWorkoutSession(session: WorkoutSession): ValidationResult {
        val errors = mutableListOf<String>()
        
        // Validate basic session data
        if (session.id < 0) {
            errors.add("Session ID cannot be negative")
        }
        
        if (session.startTime.after(Date())) {
            errors.add("Start time cannot be in the future")
        }
        
        if (session.pausedDuration < 0) {
            errors.add("Paused duration cannot be negative")
        }
        
        // Validate exercises
        session.exercises.forEachIndexed { index, exercise ->
            val exerciseErrors = validateSessionExercise(exercise)
            if (!exerciseErrors.isValid) {
                when (exerciseErrors) {
                    is ValidationResult.Invalid -> {
                        errors.addAll(exerciseErrors.errors.map { "Exercise ${index + 1}: $it" })
                    }
                    else -> {}
                }
            }
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
    
    /**
     * Validates a session exercise
     */
    fun validateSessionExercise(exercise: SessionExercise): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (exercise.exerciseId < 0) {
            errors.add("Exercise ID cannot be negative")
        }
        
        if (exercise.exerciseName.isBlank()) {
            errors.add("Exercise name cannot be blank")
        }
        
        // Validate target sets
        exercise.targetSets.forEachIndexed { index, targetSet ->
            val targetSetErrors = validateTargetSet(targetSet)
            if (!targetSetErrors.isValid) {
                when (targetSetErrors) {
                    is ValidationResult.Invalid -> {
                        errors.addAll(targetSetErrors.errors.map { "Target set ${index + 1}: $it" })
                    }
                    else -> {}
                }
            }
        }
        
        // Validate completed sets
        exercise.completedSets.forEachIndexed { index, completedSet ->
            val completedSetErrors = validateCompletedSet(completedSet)
            if (!completedSetErrors.isValid) {
                when (completedSetErrors) {
                    is ValidationResult.Invalid -> {
                        errors.addAll(completedSetErrors.errors.map { "Completed set ${index + 1}: $it" })
                    }
                    else -> {}
                }
            }
        }
        
        // Validate set number consistency
        val targetSetNumbers = exercise.targetSets.map { it.setNumber }.toSet()
        val completedSetNumbers = exercise.completedSets.map { it.setNumber }.toSet()
        
        completedSetNumbers.forEach { setNumber ->
            if (setNumber !in targetSetNumbers) {
                errors.add("Completed set $setNumber has no corresponding target set")
            }
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
    
    /**
     * Validates a target set
     */
    fun validateTargetSet(targetSet: TargetSet): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (targetSet.setNumber <= 0) {
            errors.add("Set number must be positive")
        }
        
        if (targetSet.targetReps <= 0) {
            errors.add("Target reps must be positive")
        }
        
        if (targetSet.targetWeight < 0) {
            errors.add("Target weight cannot be negative")
        }
        
        if (targetSet.restTime < 0) {
            errors.add("Rest time cannot be negative")
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
    
    /**
     * Validates a completed set
     */
    fun validateCompletedSet(completedSet: CompletedSet): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (completedSet.setNumber <= 0) {
            errors.add("Set number must be positive")
        }
        
        if (completedSet.actualReps <= 0) {
            errors.add("Actual reps must be positive")
        }
        
        if (completedSet.actualWeight < 0) {
            errors.add("Actual weight cannot be negative")
        }
        
        if (completedSet.completedAt.after(Date())) {
            errors.add("Completion time cannot be in the future")
        }
        
        if (completedSet.restTime < 0) {
            errors.add("Rest time cannot be negative")
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
    
    /**
     * Validates workout statistics
     */
    fun validateWorkoutStats(stats: WorkoutStats): ValidationResult {
        val errors = mutableListOf<String>()
        
        if (stats.totalWorkouts < 0) {
            errors.add("Total workouts cannot be negative")
        }
        
        if (stats.totalDuration < 0) {
            errors.add("Total duration cannot be negative")
        }
        
        if (stats.averageDuration < 0) {
            errors.add("Average duration cannot be negative")
        }
        
        if (stats.weeklyWorkouts < 0) {
            errors.add("Weekly workouts cannot be negative")
        }
        
        if (stats.monthlyWorkouts < 0) {
            errors.add("Monthly workouts cannot be negative")
        }
        
        if (stats.currentStreak < 0) {
            errors.add("Current streak cannot be negative")
        }
        
        if (stats.longestStreak < 0) {
            errors.add("Longest streak cannot be negative")
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
}

/**
 * Sealed class representing validation results
 */
sealed class ValidationResult {
    object Valid : ValidationResult()
    data class Invalid(val errors: List<String>) : ValidationResult()
    
    val isValid: Boolean
        get() = this is Valid
}
package com.example.allinone.utils

import com.example.allinone.data.*
import java.util.*
import kotlin.math.roundToInt

/**
 * Utility class for calculating workout statistics and trends
 */
object WorkoutStatsCalculator {
    
    /**
     * Calculate comprehensive workout statistics from a list of workouts
     */
    fun calculateWorkoutStats(workouts: List<Workout>): WorkoutStats {
        if (workouts.isEmpty()) {
            return WorkoutStats()
        }
        
        val sortedWorkouts = workouts.sortedBy { it.startTime }
        val totalDuration = workouts.sumOf { it.duration }
        val averageDuration = totalDuration / workouts.size
        
        // Calculate weekly and monthly workouts
        val weeklyWorkouts = getWorkoutsInPeriod(workouts, Calendar.WEEK_OF_YEAR)
        val monthlyWorkouts = getWorkoutsInPeriod(workouts, Calendar.MONTH)
        
        // Calculate streaks
        val currentStreak = calculateCurrentStreak(sortedWorkouts)
        val longestStreak = calculateLongestStreak(sortedWorkouts)
        
        // Calculate exercise frequencies
        val exerciseFrequencies = calculateExerciseFrequencies(workouts)
        
        // Calculate trends
        val workoutTrends = calculateWorkoutTrends(sortedWorkouts)
        
        return WorkoutStats(
            totalWorkouts = workouts.size,
            totalDuration = totalDuration,
            averageDuration = averageDuration,
            weeklyWorkouts = weeklyWorkouts,
            monthlyWorkouts = monthlyWorkouts,
            currentStreak = currentStreak,
            longestStreak = longestStreak,
            mostFrequentExercises = exerciseFrequencies,
            workoutTrends = workoutTrends,
            lastWorkoutDate = sortedWorkouts.lastOrNull()?.startTime
        )
    }
    
    /**
     * Get workouts within a specific time period
     */
    private fun getWorkoutsInPeriod(workouts: List<Workout>, period: Int): Int {
        val calendar = Calendar.getInstance()
        val currentPeriod = calendar.get(period)
        val currentYear = calendar.get(Calendar.YEAR)
        
        return workouts.count { workout ->
            calendar.time = workout.startTime
            calendar.get(period) == currentPeriod && calendar.get(Calendar.YEAR) == currentYear
        }
    }
    
    /**
     * Calculate current workout streak (consecutive days with workouts)
     */
    private fun calculateCurrentStreak(sortedWorkouts: List<Workout>): Int {
        if (sortedWorkouts.isEmpty()) return 0
        
        val calendar = Calendar.getInstance()
        val today = calendar.get(Calendar.DAY_OF_YEAR)
        val currentYear = calendar.get(Calendar.YEAR)
        
        // Group workouts by day
        val workoutDays = sortedWorkouts
            .map { workout ->
                calendar.time = workout.startTime
                Pair(calendar.get(Calendar.DAY_OF_YEAR), calendar.get(Calendar.YEAR))
            }
            .distinct()
            .sortedByDescending { (day, year) -> year * 1000 + day }
        
        if (workoutDays.isEmpty()) return 0
        
        val (lastWorkoutDay, lastWorkoutYear) = workoutDays.first()
        
        // Check if the last workout was today or yesterday
        val daysDifference = if (currentYear == lastWorkoutYear) {
            today - lastWorkoutDay
        } else {
            // Handle year boundary
            val daysInLastYear = if (isLeapYear(lastWorkoutYear)) 366 else 365
            (today + daysInLastYear) - lastWorkoutDay
        }
        
        if (daysDifference > 1) return 0 // Streak is broken
        
        // Count consecutive days
        var streak = 0
        var expectedDay = lastWorkoutDay
        var expectedYear = lastWorkoutYear
        
        for ((day, year) in workoutDays) {
            if (day == expectedDay && year == expectedYear) {
                streak++
                // Move to previous day
                expectedDay--
                if (expectedDay < 1) {
                    expectedYear--
                    expectedDay = if (isLeapYear(expectedYear)) 366 else 365
                }
            } else {
                break
            }
        }
        
        return streak
    }
    
    /**
     * Calculate the longest workout streak
     */
    private fun calculateLongestStreak(sortedWorkouts: List<Workout>): Int {
        if (sortedWorkouts.isEmpty()) return 0
        
        val calendar = Calendar.getInstance()
        
        // Group workouts by day
        val workoutDays = sortedWorkouts
            .map { workout ->
                calendar.time = workout.startTime
                Pair(calendar.get(Calendar.DAY_OF_YEAR), calendar.get(Calendar.YEAR))
            }
            .distinct()
            .sortedWith(compareBy({ it.second }, { it.first }))
        
        if (workoutDays.isEmpty()) return 0
        
        var longestStreak = 1
        var currentStreak = 1
        
        for (i in 1 until workoutDays.size) {
            val (prevDay, prevYear) = workoutDays[i - 1]
            val (currDay, currYear) = workoutDays[i]
            
            val isConsecutive = if (prevYear == currYear) {
                currDay - prevDay == 1
            } else {
                // Handle year boundary
                val daysInPrevYear = if (isLeapYear(prevYear)) 366 else 365
                prevDay == daysInPrevYear && currDay == 1
            }
            
            if (isConsecutive) {
                currentStreak++
                longestStreak = maxOf(longestStreak, currentStreak)
            } else {
                currentStreak = 1
            }
        }
        
        return longestStreak
    }
    
    /**
     * Calculate exercise frequencies and statistics
     */
    private fun calculateExerciseFrequencies(workouts: List<Workout>): List<ExerciseFrequency> {
        val exerciseStats = mutableMapOf<String, MutableList<ExercisePerformance>>()
        
        // Collect all exercise performances
        workouts.forEach { workout ->
            workout.exercises.forEach { exercise ->
                val performances = exerciseStats.getOrPut(exercise.exerciseName) { mutableListOf() }
                
                exercise.sets.forEach { set ->
                    if (set.completed) {
                        performances.add(
                            ExercisePerformance(
                                date = workout.startTime,
                                reps = set.reps,
                                weight = set.weight
                            )
                        )
                    }
                }
            }
        }
        
        // Calculate statistics for each exercise
        return exerciseStats.map { (exerciseName, performances) ->
            val averageWeight = performances.map { it.weight }.average()
            val averageReps = performances.map { it.reps }.average().roundToInt()
            val lastPerformed = performances.maxByOrNull { it.date }?.date ?: Date()
            
            val personalBest = performances.maxByOrNull { it.weight }?.let { best ->
                PersonalBest(
                    maxWeight = best.weight,
                    maxReps = best.reps,
                    achievedDate = best.date
                )
            }
            
            ExerciseFrequency(
                exerciseName = exerciseName,
                frequency = performances.size,
                lastPerformed = lastPerformed,
                averageWeight = averageWeight,
                averageReps = averageReps,
                personalBest = personalBest
            )
        }.sortedByDescending { it.frequency }
    }
    
    /**
     * Calculate workout trends over time
     */
    private fun calculateWorkoutTrends(sortedWorkouts: List<Workout>): WorkoutTrends {
        if (sortedWorkouts.size < 2) {
            return WorkoutTrends()
        }
        
        // Duration trend (weekly averages)
        val durationTrend = calculateWeeklyAverages(sortedWorkouts) { it.duration.toFloat() }
        
        // Frequency trend (workouts per week)
        val frequencyTrend = calculateWeeklyFrequency(sortedWorkouts)
        
        // Volume trend (total weight lifted per week)
        val volumeTrend = calculateWeeklyAverages(sortedWorkouts) { it.totalVolume.toFloat() }
        
        // Strength trend (average weight per exercise per week)
        val strengthTrend = calculateWeeklyStrengthTrend(sortedWorkouts)
        
        return WorkoutTrends(
            durationTrend = durationTrend,
            frequencyTrend = frequencyTrend,
            volumeTrend = volumeTrend,
            strengthTrend = strengthTrend
        )
    }
    
    /**
     * Calculate weekly averages for a given metric
     */
    private fun calculateWeeklyAverages(
        workouts: List<Workout>,
        valueExtractor: (Workout) -> Float
    ): List<TrendPoint> {
        val calendar = Calendar.getInstance()
        val weeklyData = mutableMapOf<Pair<Int, Int>, MutableList<Float>>()
        
        // Group workouts by week
        workouts.forEach { workout ->
            calendar.time = workout.startTime
            val week = calendar.get(Calendar.WEEK_OF_YEAR)
            val year = calendar.get(Calendar.YEAR)
            val key = Pair(week, year)
            
            weeklyData.getOrPut(key) { mutableListOf() }.add(valueExtractor(workout))
        }
        
        // Calculate averages and create trend points
        return weeklyData.map { (weekYear, values) ->
            val (week, year) = weekYear
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.WEEK_OF_YEAR, week)
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            
            TrendPoint(
                date = calendar.time,
                value = values.average().toFloat(),
                label = "Week $week"
            )
        }.sortedBy { it.date }
    }
    
    /**
     * Calculate weekly workout frequency
     */
    private fun calculateWeeklyFrequency(workouts: List<Workout>): List<TrendPoint> {
        val calendar = Calendar.getInstance()
        val weeklyCount = mutableMapOf<Pair<Int, Int>, Int>()
        
        // Count workouts per week
        workouts.forEach { workout ->
            calendar.time = workout.startTime
            val week = calendar.get(Calendar.WEEK_OF_YEAR)
            val year = calendar.get(Calendar.YEAR)
            val key = Pair(week, year)
            
            weeklyCount[key] = weeklyCount.getOrDefault(key, 0) + 1
        }
        
        // Create trend points
        return weeklyCount.map { (weekYear, count) ->
            val (week, year) = weekYear
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.WEEK_OF_YEAR, week)
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            
            TrendPoint(
                date = calendar.time,
                value = count.toFloat(),
                label = "Week $week"
            )
        }.sortedBy { it.date }
    }
    
    /**
     * Calculate weekly strength trend (average weight per exercise)
     */
    private fun calculateWeeklyStrengthTrend(workouts: List<Workout>): List<TrendPoint> {
        val calendar = Calendar.getInstance()
        val weeklyWeights = mutableMapOf<Pair<Int, Int>, MutableList<Double>>()
        
        // Collect all weights per week
        workouts.forEach { workout ->
            calendar.time = workout.startTime
            val week = calendar.get(Calendar.WEEK_OF_YEAR)
            val year = calendar.get(Calendar.YEAR)
            val key = Pair(week, year)
            
            val weights = weeklyWeights.getOrPut(key) { mutableListOf() }
            
            workout.exercises.forEach { exercise ->
                exercise.sets.forEach { set ->
                    if (set.completed && set.weight > 0) {
                        weights.add(set.weight)
                    }
                }
            }
        }
        
        // Calculate average weights and create trend points
        return weeklyWeights.map { (weekYear, weights) ->
            val (week, year) = weekYear
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.WEEK_OF_YEAR, week)
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            
            TrendPoint(
                date = calendar.time,
                value = weights.average().toFloat(),
                label = "Week $week"
            )
        }.sortedBy { it.date }
    }
    
    /**
     * Generate workout session summaries
     */
    fun generateWorkoutSummaries(workouts: List<Workout>): List<WorkoutSessionSummary> {
        return workouts.map { workout ->
            val exercisesCompleted = workout.exercises.count { exercise ->
                exercise.sets.any { it.completed }
            }
            
            WorkoutSessionSummary(
                sessionId = workout.id,
                programName = workout.programName,
                date = workout.startTime,
                duration = workout.duration,
                exercisesCompleted = exercisesCompleted,
                totalExercises = workout.exercises.size,
                completionPercentage = workout.completionPercentage,
                totalSetsCompleted = workout.totalSetsCompleted,
                totalVolume = workout.totalVolume
            )
        }.sortedByDescending { it.date }
    }
    
    /**
     * Check if a year is a leap year
     */
    private fun isLeapYear(year: Int): Boolean {
        return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
    }
    
    /**
     * Data class for tracking exercise performance
     */
    private data class ExercisePerformance(
        val date: Date,
        val reps: Int,
        val weight: Double
    )
}
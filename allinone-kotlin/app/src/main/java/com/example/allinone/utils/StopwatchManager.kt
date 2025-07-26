package com.example.allinone.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Interface for managing stopwatch functionality
 */
interface StopwatchManager {
    val elapsedTime: StateFlow<Long>
    val isRunning: StateFlow<Boolean>
    val isPaused: StateFlow<Boolean>
    val totalPausedTime: StateFlow<Long>
    
    fun start()
    fun pause()
    fun resume()
    fun stop()
    fun reset()
    fun getFormattedTime(): String
    fun saveState()
    fun restoreState()
}

/**
 * Implementation of StopwatchManager using coroutines and StateFlow
 */
@Singleton
class StopwatchManagerImpl @Inject constructor(
    private val context: Context
) : StopwatchManager {
    
    companion object {
        private const val TAG = "StopwatchManager"
        private const val PREFS_NAME = "stopwatch_prefs"
        private const val KEY_START_TIME = "start_time"
        private const val KEY_PAUSED_TIME = "paused_time"
        private const val KEY_IS_RUNNING = "is_running"
        private const val KEY_IS_PAUSED = "is_paused"
        private const val KEY_PAUSE_START_TIME = "pause_start_time"
        private const val UPDATE_INTERVAL = 100L // Update every 100ms for smooth UI
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    private val _elapsedTime = MutableStateFlow(0L)
    override val elapsedTime: StateFlow<Long> = _elapsedTime.asStateFlow()
    
    private val _isRunning = MutableStateFlow(false)
    override val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()
    
    private val _isPaused = MutableStateFlow(false)
    override val isPaused: StateFlow<Boolean> = _isPaused.asStateFlow()
    
    private val _totalPausedTime = MutableStateFlow(0L)
    override val totalPausedTime: StateFlow<Long> = _totalPausedTime.asStateFlow()
    
    private var startTime: Long = 0L
    private var pauseStartTime: Long = 0L
    private var accumulatedPausedTime: Long = 0L
    
    private var timerJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    
    init {
        restoreState()
    }
    
    override fun start() {
        Log.d(TAG, "Starting stopwatch")
        
        if (_isRunning.value) {
            Log.w(TAG, "Stopwatch is already running")
            return
        }
        
        startTime = System.currentTimeMillis()
        accumulatedPausedTime = 0L
        _totalPausedTime.value = 0L
        _isRunning.value = true
        _isPaused.value = false
        
        startTimer()
        saveState()
    }
    
    override fun pause() {
        Log.d(TAG, "Pausing stopwatch")
        
        if (!_isRunning.value) {
            Log.w(TAG, "Cannot pause: stopwatch is not running")
            return
        }
        
        if (_isPaused.value) {
            Log.w(TAG, "Stopwatch is already paused")
            return
        }
        
        pauseStartTime = System.currentTimeMillis()
        _isPaused.value = true
        
        stopTimer()
        saveState()
    }
    
    override fun resume() {
        Log.d(TAG, "Resuming stopwatch")
        
        if (!_isRunning.value) {
            Log.w(TAG, "Cannot resume: stopwatch is not running")
            return
        }
        
        if (!_isPaused.value) {
            Log.w(TAG, "Stopwatch is not paused")
            return
        }
        
        // Add the time spent paused to accumulated paused time
        val pauseDuration = System.currentTimeMillis() - pauseStartTime
        accumulatedPausedTime += pauseDuration
        _totalPausedTime.value = accumulatedPausedTime
        
        _isPaused.value = false
        
        startTimer()
        saveState()
    }
    
    override fun stop() {
        Log.d(TAG, "Stopping stopwatch")
        
        _isRunning.value = false
        _isPaused.value = false
        
        stopTimer()
        clearState()
        Log.d(TAG, "Stopwatch stopped successfully")
    }
    
    override fun reset() {
        Log.d(TAG, "Resetting stopwatch")
        
        stop()
        
        startTime = 0L
        pauseStartTime = 0L
        accumulatedPausedTime = 0L
        _elapsedTime.value = 0L
        _totalPausedTime.value = 0L
        
        clearState()
    }
    
    override fun getFormattedTime(): String {
        val totalSeconds = _elapsedTime.value / 1000
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        
        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, remainingMinutes, seconds)
        } else {
            String.format("%d:%02d", remainingMinutes, seconds)
        }
    }
    
    override fun saveState() {
        try {
            prefs.edit().apply {
                putLong(KEY_START_TIME, startTime)
                putLong(KEY_PAUSED_TIME, accumulatedPausedTime)
                putBoolean(KEY_IS_RUNNING, _isRunning.value)
                putBoolean(KEY_IS_PAUSED, _isPaused.value)
                putLong(KEY_PAUSE_START_TIME, pauseStartTime)
                apply()
            }
            Log.d(TAG, "Stopwatch state saved")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save stopwatch state", e)
        }
    }
    
    override fun restoreState() {
        try {
            val wasRunning = prefs.getBoolean(KEY_IS_RUNNING, false)
            val wasPaused = prefs.getBoolean(KEY_IS_PAUSED, false)
            
            if (wasRunning) {
                startTime = prefs.getLong(KEY_START_TIME, 0L)
                accumulatedPausedTime = prefs.getLong(KEY_PAUSED_TIME, 0L)
                pauseStartTime = prefs.getLong(KEY_PAUSE_START_TIME, 0L)
                
                _isRunning.value = true
                _isPaused.value = wasPaused
                _totalPausedTime.value = accumulatedPausedTime
                
                if (wasPaused) {
                    // If we were paused, add the time since app was backgrounded to paused time
                    val additionalPausedTime = System.currentTimeMillis() - pauseStartTime
                    accumulatedPausedTime += additionalPausedTime
                    _totalPausedTime.value = accumulatedPausedTime
                    pauseStartTime = System.currentTimeMillis()
                } else {
                    // If we were running, continue the timer
                    startTimer()
                }
                
                Log.d(TAG, "Stopwatch state restored - Running: $wasRunning, Paused: $wasPaused")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restore stopwatch state", e)
            reset()
        }
    }
    
    private fun startTimer() {
        stopTimer() // Stop any existing timer
        
        timerJob = scope.launch {
            while (_isRunning.value && !_isPaused.value) {
                val currentTime = System.currentTimeMillis()
                val elapsed = currentTime - startTime - accumulatedPausedTime
                _elapsedTime.value = maxOf(0L, elapsed)
                
                delay(UPDATE_INTERVAL)
            }
        }
    }
    
    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }
    
    private fun clearState() {
        try {
            prefs.edit().clear().apply()
            Log.d(TAG, "Stopwatch state cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear stopwatch state", e)
        }
    }
    
    /**
     * Clean up resources when the manager is no longer needed
     */
    fun cleanup() {
        scope.cancel()
        stopTimer()
    }
}
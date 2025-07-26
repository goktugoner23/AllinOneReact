package com.example.allinone.cache

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.allinone.data.WorkoutSession
import com.example.allinone.data.WorkoutSessionError
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Interface for caching workout session data locally
 */
interface WorkoutSessionCache {
    
    /**
     * Save workout session to local cache
     */
    suspend fun saveSession(session: WorkoutSession): Result<Unit>
    
    /**
     * Get workout session from local cache
     */
    suspend fun getSession(): Result<WorkoutSession?>
    
    /**
     * Clear workout session from local cache
     */
    suspend fun clearSession(): Result<Unit>
    
    /**
     * Check if there's a cached session
     */
    suspend fun hasSession(): Boolean
}

/**
 * Implementation of WorkoutSessionCache using SharedPreferences
 */
@Singleton
class WorkoutSessionCacheImpl @Inject constructor(
    private val context: Context
) : WorkoutSessionCache {
    
    companion object {
        private const val TAG = "WorkoutSessionCache"
        private const val PREFS_NAME = "workout_session_cache"
        private const val KEY_ACTIVE_SESSION = "active_session"
        private const val KEY_SESSION_EXISTS = "session_exists"
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson: Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()
    
    override suspend fun saveSession(session: WorkoutSession): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Saving workout session to cache: ${session.id}")
            
            val sessionJson = gson.toJson(session)
            
            prefs.edit().apply {
                putString(KEY_ACTIVE_SESSION, sessionJson)
                putBoolean(KEY_SESSION_EXISTS, true)
                apply()
            }
            
            Log.d(TAG, "Workout session saved to cache successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save workout session to cache", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to save session to cache", e))
        }
    }
    
    override suspend fun getSession(): Result<WorkoutSession?> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting workout session from cache")
            
            if (!hasSession()) {
                Log.d(TAG, "No cached session found")
                return@withContext Result.success(null)
            }
            
            val sessionJson = prefs.getString(KEY_ACTIVE_SESSION, null)
            
            if (sessionJson.isNullOrEmpty()) {
                Log.d(TAG, "Session JSON is null or empty")
                return@withContext Result.success(null)
            }
            
            val session = gson.fromJson(sessionJson, WorkoutSession::class.java)
            Log.d(TAG, "Workout session retrieved from cache: ${session.id}")
            
            Result.success(session)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get workout session from cache", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to get session from cache", e))
        }
    }
    
    override suspend fun clearSession(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Clearing workout session from cache")
            
            prefs.edit().apply {
                remove(KEY_ACTIVE_SESSION)
                putBoolean(KEY_SESSION_EXISTS, false)
                apply()
            }
            
            Log.d(TAG, "Workout session cleared from cache successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear workout session from cache", e)
            Result.failure(WorkoutSessionError.PersistenceError("Failed to clear session from cache", e))
        }
    }
    
    override suspend fun hasSession(): Boolean = withContext(Dispatchers.IO) {
        try {
            val hasSession = prefs.getBoolean(KEY_SESSION_EXISTS, false)
            Log.d(TAG, "Checking if session exists in cache: $hasSession")
            hasSession
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check if session exists in cache", e)
            false
        }
    }
}
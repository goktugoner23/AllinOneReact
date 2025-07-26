package com.example.allinone.ui.components

import android.Manifest
import android.content.Context
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlin.math.sin

data class VoiceRecorderState(
    val isRecording: Boolean = false,
    val isPlaying: Boolean = false,
    val isPaused: Boolean = false,
    val recordingDuration: Long = 0L,
    val playbackPosition: Long = 0L,
    val totalDuration: Long = 0L,
    val audioFile: File? = null,
    val hasPermission: Boolean = false,
    val error: String? = null
)

@Composable
fun VoiceRecorder(
    state: VoiceRecorderState,
    onStateChange: (VoiceRecorderState) -> Unit,
    onRecordingComplete: (File) -> Unit,
    modifier: Modifier = Modifier
) {

    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        onStateChange(state.copy(hasPermission = isGranted))
    }
    
    // Request permission on first launch
    LaunchedEffect(Unit) {
        if (!state.hasPermission) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when {
                !state.hasPermission -> {
                    PermissionRequiredView(
                        onRequestPermission = {
                            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    )
                }
                
                state.isRecording -> {
                    RecordingView(
                        duration = state.recordingDuration,
                        onStopRecording = {
                            // Handle stop recording
                            onStateChange(state.copy(isRecording = false))
                        }
                    )
                }
                
                state.audioFile != null -> {
                    PlaybackView(
                        isPlaying = state.isPlaying,
                        isPaused = state.isPaused,
                        currentPosition = state.playbackPosition,
                        totalDuration = state.totalDuration,
                        onPlay = {
                            onStateChange(state.copy(isPlaying = true, isPaused = false))
                        },
                        onPause = {
                            onStateChange(state.copy(isPlaying = false, isPaused = true))
                        },
                        onStop = {
                            onStateChange(state.copy(isPlaying = false, isPaused = false, playbackPosition = 0L))
                        },
                        onSeek = { position ->
                            onStateChange(state.copy(playbackPosition = position))
                        },
                        onNewRecording = {
                            onStateChange(state.copy(audioFile = null, totalDuration = 0L, playbackPosition = 0L))
                        },
                        onSave = {
                            onRecordingComplete(state.audioFile)
                        }
                    )
                }
                
                else -> {
                    StartRecordingView(
                        onStartRecording = {
                            if (state.hasPermission) {
                                onStateChange(state.copy(isRecording = true, recordingDuration = 0L))
                            }
                        }
                    )
                }
            }
            
            state.error?.let { error ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun PermissionRequiredView(
    onRequestPermission: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Mic,
            contentDescription = "Microphone",
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Text(
            text = "Microphone permission required",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        
        Button(
            onClick = onRequestPermission,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text("Grant Permission")
        }
    }
}

@Composable
private fun StartRecordingView(
    onStartRecording: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Button(
            onClick = onStartRecording,
            modifier = Modifier.size(72.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Icon(
                imageVector = Icons.Default.Mic,
                contentDescription = "Start Recording",
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
        
        Text(
            text = "Tap to record",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun RecordingView(
    duration: Long,
    onStopRecording: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "recording")
    val animatedScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "scale"
    )
    
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Animated recording indicator
        Box(
            modifier = Modifier.size(80.dp),
            contentAlignment = Alignment.Center
        ) {
            // Pulsing circle
            Box(
                modifier = Modifier
                    .size(80.dp * animatedScale)
                    .background(
                        color = MaterialTheme.colorScheme.error.copy(alpha = 0.3f),
                        shape = CircleShape
                    )
            )
            
            // Recording button
            Button(
                onClick = onStopRecording,
                modifier = Modifier.size(56.dp),
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Stop,
                    contentDescription = "Stop Recording",
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.onError
                )
            }
        }
        
        // Recording duration
        Text(
            text = formatDuration(duration),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        
        Text(
            text = "Recording...",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        // Audio waveform visualization
        AudioWaveform(
            isRecording = true,
            modifier = Modifier
                .fillMaxWidth()
                .height(32.dp)
        )
    }
}

@Composable
private fun PlaybackView(
    isPlaying: Boolean,
    @Suppress("UNUSED_PARAMETER") isPaused: Boolean,
    currentPosition: Long,
    totalDuration: Long,
    onPlay: () -> Unit,
    onPause: () -> Unit,
    onStop: () -> Unit,
    @Suppress("UNUSED_PARAMETER") onSeek: (Long) -> Unit,
    onNewRecording: () -> Unit,
    onSave: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Playback controls
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onStop,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Stop,
                    contentDescription = "Stop",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            IconButton(
                onClick = if (isPlaying) onPause else onPlay,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(
                    imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (isPlaying) "Pause" else "Play",
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            
            IconButton(
                onClick = onNewRecording,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "New Recording",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // Progress indicator
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = formatDuration(currentPosition),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = formatDuration(totalDuration),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            val progress = if (totalDuration > 0) {
                currentPosition.toFloat() / totalDuration.toFloat()
            } else 0f
            
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
            )
        }
        
        // Audio waveform
        AudioWaveform(
            isRecording = false,
            modifier = Modifier
                .fillMaxWidth()
                .height(32.dp)
        )
        
        // Action buttons
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onNewRecording,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Re-record")
            }
            
            Button(
                onClick = onSave,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = Icons.Default.Save,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Save")
            }
        }
    }
}

@Composable
private fun AudioWaveform(
    isRecording: Boolean,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveform")
    val animatedPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ), label = "phase"
    )
    
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val centerY = height / 2
        
        val waveColor = if (isRecording) {
            Color.Red
        } else {
            Color.Blue
        }
        
        // Draw waveform
        val waveCount = 20
        val waveSpacing = width / waveCount
        
        for (i in 0 until waveCount) {
            val x = i * waveSpacing
            val amplitude = if (isRecording) {
                // Animated amplitude for recording
                (sin((animatedPhase + i * 18) * Math.PI / 180) * height * 0.3).toFloat()
            } else {
                // Static waveform for playback
                (sin(i * 0.5) * height * 0.2).toFloat()
            }
            
            drawLine(
                color = waveColor,
                start = androidx.compose.ui.geometry.Offset(x, centerY - amplitude),
                end = androidx.compose.ui.geometry.Offset(x, centerY + amplitude),
                strokeWidth = 3.dp.toPx()
            )
        }
    }
}

private fun formatDuration(milliseconds: Long): String {
    val totalSeconds = milliseconds / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    
    return String.format("%d:%02d", minutes, seconds)
}

@Composable
fun rememberVoiceRecorderState(): MutableState<VoiceRecorderState> {
    return remember { mutableStateOf(VoiceRecorderState()) }
}

// Voice recorder manager class to handle MediaRecorder and MediaPlayer
class VoiceRecorderManager(private val context: Context) {
    private var mediaRecorder: MediaRecorder? = null
    private var mediaPlayer: MediaPlayer? = null
    private var recordingFile: File? = null
    
    fun startRecording(onError: (String) -> Unit): File? {
        try {
            val outputDir = File(context.cacheDir, "voice_notes")
            if (!outputDir.exists()) {
                outputDir.mkdirs()
            }
            
            recordingFile = File(outputDir, "voice_${UUID.randomUUID()}.mp4")
            
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setOutputFile(recordingFile!!.absolutePath)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                
                prepare()
                start()
            }
            
            return recordingFile
        } catch (e: Exception) {
            onError("Failed to start recording: ${e.message}")
            return null
        }
    }
    
    fun stopRecording(): File? {
        return try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            recordingFile
        } catch (e: Exception) {
            Log.e("VoiceRecorder", "Error stopping recording", e)
            null
        }
    }
    
    fun startPlayback(file: File, onError: (String) -> Unit) {
        try {
            mediaPlayer = MediaPlayer().apply {
                setDataSource(file.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            onError("Failed to play recording: ${e.message}")
        }
    }
    
    fun pausePlayback() {
        mediaPlayer?.pause()
    }
    
    fun resumePlayback() {
        mediaPlayer?.start()
    }
    
    fun stopPlayback() {
        mediaPlayer?.apply {
            if (isPlaying) {
                stop()
            }
            release()
        }
        mediaPlayer = null
    }
    
    fun getCurrentPosition(): Long {
        return mediaPlayer?.currentPosition?.toLong() ?: 0L
    }
    
    fun getDuration(): Long {
        return mediaPlayer?.duration?.toLong() ?: 0L
    }
    
    fun seekTo(position: Long) {
        mediaPlayer?.seekTo(position.toInt())
    }
    
    fun release() {
        stopRecording()
        stopPlayback()
    }
} 
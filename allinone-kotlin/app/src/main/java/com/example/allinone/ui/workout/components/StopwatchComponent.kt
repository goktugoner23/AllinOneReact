package com.example.allinone.ui.workout.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * Stopwatch component showing elapsed time and pause/resume controls
 */
@Composable
fun StopwatchComponent(
    elapsedTime: Long,
    isRunning: Boolean,
    isPaused: Boolean,
    onPauseResume: () -> Unit,
    onStop: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp), // reduced padding for compactness
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Status indicator
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                StatusIndicator(
                    isRunning = isRunning,
                    isPaused = isPaused
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = when {
                        isPaused -> "Paused"
                        isRunning -> "Active"
                        else -> "Stopped"
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = when {
                        isPaused -> MaterialTheme.colorScheme.tertiary
                        isRunning -> MaterialTheme.colorScheme.primary
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp)) // less space for compactness

            // Time display
            Text(
                text = formatElapsedTime(elapsedTime),
                style = MaterialTheme.typography.displayLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Control buttons - always show when there's an active session
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                FloatingActionButton(
                    onClick = onPauseResume,
                    containerColor = if (isPaused) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.tertiary
                    },
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = if (isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                        contentDescription = if (isPaused) "Resume" else "Pause"
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                FloatingActionButton(
                    onClick = onStop,
                    containerColor = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = "Finish Workout"
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusIndicator(
    isRunning: Boolean,
    isPaused: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.size(12.dp),
        shape = CircleShape,
        color = when {
            isPaused -> MaterialTheme.colorScheme.tertiary
            isRunning -> MaterialTheme.colorScheme.primary
            else -> MaterialTheme.colorScheme.onSurfaceVariant
        }
    ) {}
}

private fun formatElapsedTime(elapsedTimeMs: Long): String {
    val totalSeconds = elapsedTimeMs / 1000
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
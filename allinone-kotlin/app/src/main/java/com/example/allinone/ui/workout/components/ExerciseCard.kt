package com.example.allinone.ui.workout.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.allinone.data.SessionExercise

/**
 * Card displaying an exercise with its sets during a workout session
 */
@Composable
fun ExerciseCard(
    exercise: SessionExercise,
    onCompleteSet: (Long, Int, Int, Double) -> Unit,
    onUncompleteSet: (Long, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var showSetDialog by remember { mutableStateOf(false) }
    var selectedSetNumber by remember { mutableStateOf(0) }
    
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Exercise header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = exercise.exerciseName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    exercise.muscleGroup?.let { muscleGroup ->
                        Text(
                            text = muscleGroup,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Completion indicator
                Icon(
                    imageVector = if (exercise.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = if (exercise.isCompleted) "Completed" else "Not completed",
                    tint = if (exercise.isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Sets
            Text(
                text = "Sets (${exercise.completedSets.size}/${exercise.targetSets.size})",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(exercise.targetSets) { targetSet ->
                    val isCompleted = exercise.isSetCompleted(targetSet.setNumber)
                    val completedSet = exercise.getCompletedSet(targetSet.setNumber)
                    
                    SetChip(
                        setNumber = targetSet.setNumber,
                        targetReps = targetSet.targetReps,
                        targetWeight = targetSet.targetWeight,
                        isCompleted = isCompleted,
                        actualReps = completedSet?.actualReps,
                        actualWeight = completedSet?.actualWeight,
                        onClick = {
                            if (isCompleted) {
                                onUncompleteSet(exercise.exerciseId, targetSet.setNumber)
                            } else {
                                selectedSetNumber = targetSet.setNumber
                                showSetDialog = true
                            }
                        }
                    )
                }
            }
            
            // Notes
            exercise.notes?.let { notes ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = notes,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
    
    // Set completion dialog
    if (showSetDialog) {
        val targetSet = exercise.targetSets.find { it.setNumber == selectedSetNumber }
        if (targetSet != null) {
            SetCompletionDialog(
                setNumber = selectedSetNumber,
                targetReps = targetSet.targetReps,
                targetWeight = targetSet.targetWeight,
                onConfirm = { reps, weight ->
                    onCompleteSet(exercise.exerciseId, selectedSetNumber, reps, weight)
                    showSetDialog = false
                },
                onDismiss = { showSetDialog = false }
            )
        }
    }
}

@Composable
private fun SetChip(
    setNumber: Int,
    targetReps: Int,
    targetWeight: Double,
    isCompleted: Boolean,
    actualReps: Int?,
    actualWeight: Double?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FilterChip(
        onClick = onClick,
        label = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Set $setNumber",
                    style = MaterialTheme.typography.labelSmall
                )
                if (isCompleted && actualReps != null && actualWeight != null) {
                    Text(
                        text = "${actualReps}×${actualWeight}kg",
                        style = MaterialTheme.typography.bodySmall
                    )
                } else {
                    Text(
                        text = "${targetReps}×${targetWeight}kg",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        selected = isCompleted,
        leadingIcon = if (isCompleted) {
            { Icon(Icons.Default.Check, contentDescription = "Completed") }
        } else null,
        modifier = modifier
    )
}

@Composable
private fun SetCompletionDialog(
    setNumber: Int,
    targetReps: Int,
    targetWeight: Double,
    onConfirm: (Int, Double) -> Unit,
    onDismiss: () -> Unit
) {
    var reps by remember { mutableStateOf(targetReps.toString()) }
    var weight by remember { mutableStateOf(targetWeight.toString()) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Complete Set $setNumber") },
        text = {
            Column {
                Text("Target: $targetReps reps × ${targetWeight}kg")
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = reps,
                    onValueChange = { reps = it },
                    label = { Text("Actual Reps") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = weight,
                    onValueChange = { weight = it },
                    label = { Text("Actual Weight (kg)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val actualReps = reps.toIntOrNull() ?: targetReps
                    val actualWeight = weight.toDoubleOrNull() ?: targetWeight
                    onConfirm(actualReps, actualWeight)
                }
            ) {
                Text("Complete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
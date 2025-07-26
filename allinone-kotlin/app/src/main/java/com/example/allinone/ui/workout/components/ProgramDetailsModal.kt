package com.example.allinone.ui.workout.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.allinone.data.Program
import com.example.allinone.data.ProgramExercise

/**
 * Modal dialog showing program details with editable exercises
 */
@Composable
fun ProgramDetailsModal(
    program: Program,
    onDismiss: () -> Unit,
    onSave: (Program) -> Unit,
    onStartWorkout: () -> Unit,
    modifier: Modifier = Modifier
) {
    var editedProgram by remember { mutableStateOf(program) }
    var isEditing by remember { mutableStateOf(false) }
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isEditing) "Edit Program" else program.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    
                    Row {
                        if (isEditing) {
                            TextButton(
                                onClick = {
                                    editedProgram = program
                                    isEditing = false
                                }
                            ) {
                                Text("Cancel")
                            }
                            
                            Spacer(modifier = Modifier.width(8.dp))
                            
                            Button(
                                onClick = {
                                    onSave(editedProgram)
                                    isEditing = false
                                }
                            ) {
                                Text("Save")
                            }
                        } else {
                            IconButton(onClick = { isEditing = true }) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit")
                            }
                        }
                        
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }
                }
                
                Divider()
                
                // Content
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Program info
                    item {
                        ProgramInfoSection(
                            program = editedProgram,
                            isEditing = isEditing,
                            onProgramChange = { editedProgram = it }
                        )
                    }
                    
                    // Exercises header
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Exercises (${editedProgram.exercises.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            
                            if (isEditing) {
                                IconButton(
                                    onClick = {
                                        val newExercise = ProgramExercise(
                                            exerciseId = System.currentTimeMillis(),
                                            exerciseName = "New Exercise",
                                            sets = 3,
                                            reps = 10,
                                            weight = 0.0
                                        )
                                        editedProgram = editedProgram.copy(
                                            exercises = editedProgram.exercises + newExercise
                                        )
                                    }
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Add Exercise")
                                }
                            }
                        }
                    }
                    
                    // Exercises list
                    if (editedProgram.exercises.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        Icons.Default.FitnessCenter,
                                        contentDescription = null,
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No exercises yet",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (isEditing) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "Tap the + button to add exercises",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        itemsIndexed(editedProgram.exercises) { index, exercise ->
                            ProgramExerciseCard(
                                exercise = exercise,
                                index = index,
                                isEditing = isEditing,
                                onExerciseChange = { updatedExercise ->
                                    val updatedExercises = editedProgram.exercises.toMutableList()
                                    updatedExercises[index] = updatedExercise
                                    editedProgram = editedProgram.copy(exercises = updatedExercises)
                                },
                                onDeleteExercise = {
                                    val updatedExercises = editedProgram.exercises.toMutableList()
                                    updatedExercises.removeAt(index)
                                    editedProgram = editedProgram.copy(exercises = updatedExercises)
                                }
                            )
                        }
                    }
                }
                
                // Bottom actions
                if (!isEditing) {
                    Divider()
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Close")
                        }
                        
                        Button(
                            onClick = onStartWorkout,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Start Workout")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProgramInfoSection(
    program: Program,
    isEditing: Boolean,
    onProgramChange: (Program) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        if (isEditing) {
            OutlinedTextField(
                value = program.name,
                onValueChange = { onProgramChange(program.copy(name = it)) },
                label = { Text("Program Name") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = program.description ?: "",
                onValueChange = { onProgramChange(program.copy(description = it.takeIf { it.isNotBlank() })) },
                label = { Text("Description (optional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3
            )
        } else {
            program.description?.let { description ->
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${program.exercises.size} exercises",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "Created ${java.text.SimpleDateFormat("MMM dd, yyyy", java.util.Locale.getDefault()).format(program.createdDate)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ProgramExerciseCard(
    exercise: ProgramExercise,
    index: Int,
    isEditing: Boolean,
    onExerciseChange: (ProgramExercise) -> Unit,
    onDeleteExercise: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${index + 1}.",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                if (isEditing) {
                    IconButton(onClick = onDeleteExercise) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete Exercise",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
            
            if (isEditing) {
                OutlinedTextField(
                    value = exercise.exerciseName,
                    onValueChange = { onExerciseChange(exercise.copy(exerciseName = it)) },
                    label = { Text("Exercise Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = exercise.sets.toString(),
                        onValueChange = { 
                            it.toIntOrNull()?.let { sets ->
                                onExerciseChange(exercise.copy(sets = sets))
                            }
                        },
                        label = { Text("Sets") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    OutlinedTextField(
                        value = exercise.reps.toString(),
                        onValueChange = { 
                            it.toIntOrNull()?.let { reps ->
                                onExerciseChange(exercise.copy(reps = reps))
                            }
                        },
                        label = { Text("Reps") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    OutlinedTextField(
                        value = if (exercise.weight == 0.0) "" else exercise.weight.toString(),
                        onValueChange = { 
                            val weight = it.toDoubleOrNull() ?: 0.0
                            onExerciseChange(exercise.copy(weight = weight))
                        },
                        label = { Text("Weight (kg)") },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                exercise.muscleGroup?.let { muscleGroup ->
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = muscleGroup,
                        onValueChange = { onExerciseChange(exercise.copy(muscleGroup = it.takeIf { it.isNotBlank() })) },
                        label = { Text("Muscle Group") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                
                exercise.notes?.let { notes ->
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { onExerciseChange(exercise.copy(notes = it.takeIf { it.isNotBlank() })) },
                        label = { Text("Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 2
                    )
                }
            } else {
                Text(
                    text = exercise.exerciseName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "${exercise.sets} sets",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${exercise.reps} reps",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (exercise.weight > 0) {
                        Text(
                            text = "${exercise.weight}kg",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                exercise.muscleGroup?.let { muscleGroup ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = muscleGroup,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                exercise.notes?.let { notes ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
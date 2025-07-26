package com.example.allinone.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.allinone.data.Task
import com.example.allinone.data.TaskGroup
import java.text.SimpleDateFormat
import java.util.*
import android.app.DatePickerDialog
import android.app.TimePickerDialog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskDialog(
    taskGroups: List<TaskGroup>,
    onDismiss: () -> Unit,
    onConfirm: (name: String, description: String?, dueDate: Date?, groupId: Long?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var dueDate by remember { mutableStateOf<Date?>(null) }
    var selectedGroupId by remember { mutableStateOf<Long?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
    val context = LocalContext.current
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Task") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Task name
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Task Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Task description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                // Due date
                OutlinedTextField(
                    value = dueDate?.let { dateFormatter.format(it) } ?: "",
                    onValueChange = { },
                    label = { Text("Due Date (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = {
                        Row {
                            if (dueDate != null) {
                                IconButton(onClick = { dueDate = null }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear date")
                                }
                            }
                            IconButton(onClick = { showDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Pick date")
                            }
                        }
                    }
                )
                
                // Group selection
                if (taskGroups.isNotEmpty()) {
                    Text(
                        text = "Group (Optional)",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            GroupChip(
                                title = "No Group",
                                color = MaterialTheme.colorScheme.outline,
                                isSelected = selectedGroupId == null,
                                onClick = { selectedGroupId = null }
                            )
                        }
                        
                        items(taskGroups) { group ->
                            val groupColor = try {
                                Color(android.graphics.Color.parseColor(group.color))
                            } catch (e: Exception) {
                                MaterialTheme.colorScheme.primary
                            }
                            
                            GroupChip(
                                title = group.title,
                                color = groupColor,
                                isSelected = selectedGroupId == group.id,
                                onClick = { selectedGroupId = group.id }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (name.isNotBlank()) {
                        onConfirm(
                            name.trim(),
                            description.trim().takeIf { it.isNotBlank() },
                            dueDate,
                            selectedGroupId
                        )
                    }
                },
                enabled = name.isNotBlank()
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
    
    // Date picker
    if (showDatePicker) {
        val calendar = Calendar.getInstance()
        dueDate?.let { calendar.time = it }
        
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCalendar = Calendar.getInstance().apply {
                    set(year, month, dayOfMonth)
                    dueDate?.let { existingDate ->
                        val existingCalendar = Calendar.getInstance().apply { time = existingDate }
                        set(Calendar.HOUR_OF_DAY, existingCalendar.get(Calendar.HOUR_OF_DAY))
                        set(Calendar.MINUTE, existingCalendar.get(Calendar.MINUTE))
                    }
                }
                dueDate = newCalendar.time
                showTimePicker = true
                showDatePicker = false
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }
    
    // Time picker
    if (showTimePicker) {
        val calendar = Calendar.getInstance()
        dueDate?.let { calendar.time = it }
        
        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                val newCalendar = Calendar.getInstance().apply {
                    dueDate?.let { time = it }
                    set(Calendar.HOUR_OF_DAY, hourOfDay)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                }
                dueDate = newCalendar.time
                showTimePicker = false
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true
        ).show()
    }
}

@Composable
fun GroupChip(
    title: String,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FilterChip(
        onClick = onClick,
        label = { Text(title) },
        selected = isSelected,
        modifier = modifier,
        leadingIcon = {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(color)
            )
        },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = color.copy(alpha = 0.2f),
            selectedLabelColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
fun AddTaskGroupDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, description: String?, color: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedColor by remember { mutableStateOf("#2196F3") }
    
    val availableColors = listOf(
        "#2196F3" to "Blue",
        "#4CAF50" to "Green", 
        "#F44336" to "Red",
        "#FF9800" to "Orange",
        "#9C27B0" to "Purple",
        "#607D8B" to "Blue Grey",
        "#795548" to "Brown",
        "#009688" to "Teal"
    )
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Task Group") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Group title
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Group Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Group description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                
                // Color selection
                Text(
                    text = "Color",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableColors) { (colorHex, _) ->
                        val color = Color(android.graphics.Color.parseColor(colorHex))
                        
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(color)
                                .clickable { selectedColor = colorHex }
                                .then(
                                    if (selectedColor == colorHex) {
                                        Modifier.padding(4.dp)
                                    } else Modifier
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (selectedColor == colorHex) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = "Selected",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank()) {
                        onConfirm(
                            title.trim(),
                            description.trim().takeIf { it.isNotBlank() },
                            selectedColor
                        )
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditTaskDialog(
    task: Task,
    taskGroups: List<TaskGroup>,
    onDismiss: () -> Unit,
    onConfirm: (name: String, description: String?, dueDate: Date?, groupId: Long?) -> Unit,
    onDelete: () -> Unit
) {
    var name by remember { mutableStateOf(task.name) }
    var description by remember { mutableStateOf(task.description ?: "") }
    var dueDate by remember { mutableStateOf(task.dueDate) }
    var selectedGroupId by remember { mutableStateOf(task.groupId) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Task") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Task name
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Task Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Task description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                // Due date
                OutlinedTextField(
                    value = dueDate?.let { dateFormatter.format(it) } ?: "",
                    onValueChange = { },
                    label = { Text("Due Date (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = {
                        Row {
                            if (dueDate != null) {
                                IconButton(onClick = { dueDate = null }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear date")
                                }
                            }
                            IconButton(onClick = { showDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Pick date")
                            }
                        }
                    }
                )

                // Group selection
                if (taskGroups.isNotEmpty()) {
                    Text(
                        text = "Group (Optional)",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            GroupChip(
                                title = "No Group",
                                color = MaterialTheme.colorScheme.outline,
                                isSelected = selectedGroupId == null,
                                onClick = { selectedGroupId = null }
                            )
                        }

                        items(taskGroups) { group ->
                            val groupColor = try {
                                Color(android.graphics.Color.parseColor(group.color))
                            } catch (e: Exception) {
                                MaterialTheme.colorScheme.primary
                            }

                            GroupChip(
                                title = group.title,
                                color = groupColor,
                                isSelected = selectedGroupId == group.id,
                                onClick = { selectedGroupId = group.id }
                            )
                        }
                    }
                }

                // Delete button
                OutlinedButton(
                    onClick = onDelete,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Delete Task")
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (name.isNotBlank()) {
                        onConfirm(
                            name.trim(),
                            description.trim().takeIf { it.isNotBlank() },
                            dueDate,
                            selectedGroupId
                        )
                    }
                },
                enabled = name.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )

    // Date picker
    if (showDatePicker) {
        val calendar = Calendar.getInstance()
        dueDate?.let { calendar.time = it }

        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCalendar = Calendar.getInstance().apply {
                    set(year, month, dayOfMonth)
                    dueDate?.let { existingDate ->
                        val existingCalendar = Calendar.getInstance().apply { time = existingDate }
                        set(Calendar.HOUR_OF_DAY, existingCalendar.get(Calendar.HOUR_OF_DAY))
                        set(Calendar.MINUTE, existingCalendar.get(Calendar.MINUTE))
                    }
                }
                dueDate = newCalendar.time
                showTimePicker = true
                showDatePicker = false
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    // Time picker
    if (showTimePicker) {
        val calendar = Calendar.getInstance()
        dueDate?.let { calendar.time = it }

        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                val newCalendar = Calendar.getInstance().apply {
                    dueDate?.let { time = it }
                    set(Calendar.HOUR_OF_DAY, hourOfDay)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                }
                dueDate = newCalendar.time
                showTimePicker = false
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true
        ).show()
    }
}

@Composable
fun EditTaskGroupDialog(
    taskGroup: TaskGroup,
    onDismiss: () -> Unit,
    onConfirm: (title: String, description: String?, color: String) -> Unit,
    onDelete: () -> Unit
) {
    var title by remember { mutableStateOf(taskGroup.title) }
    var description by remember { mutableStateOf(taskGroup.description ?: "") }
    var selectedColor by remember { mutableStateOf(taskGroup.color) }

    val availableColors = listOf(
        "#2196F3" to "Blue",
        "#4CAF50" to "Green",
        "#F44336" to "Red",
        "#FF9800" to "Orange",
        "#9C27B0" to "Purple",
        "#607D8B" to "Blue Grey",
        "#795548" to "Brown",
        "#009688" to "Teal"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Task Group") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Group title
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Group Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Group description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )

                // Color selection
                Text(
                    text = "Color",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableColors) { (colorHex, _) ->
                        val color = Color(android.graphics.Color.parseColor(colorHex))

                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(color)
                                .clickable { selectedColor = colorHex }
                                .then(
                                    if (selectedColor == colorHex) {
                                        Modifier.padding(4.dp)
                                    } else Modifier
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (selectedColor == colorHex) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = "Selected",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }

                // Delete button
                OutlinedButton(
                    onClick = onDelete,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Delete Group")
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank()) {
                        onConfirm(
                            title.trim(),
                            description.trim().takeIf { it.isNotBlank() },
                            selectedColor
                        )
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DeleteTaskDialog(
    task: Task,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete Task") },
        text = {
            Text("Are you sure you want to delete \"${task.name}\"? This action cannot be undone.")
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DeleteTaskGroupDialog(
    taskGroup: TaskGroup,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete Task Group") },
        text = {
            Text("Are you sure you want to delete \"${taskGroup.title}\"? All tasks in this group will be moved to ungrouped. This action cannot be undone.")
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

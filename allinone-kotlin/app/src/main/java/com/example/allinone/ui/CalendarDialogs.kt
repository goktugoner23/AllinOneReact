package com.example.allinone.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.allinone.data.Event
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEventDialog(
    selectedDate: Date,
    onDismiss: () -> Unit,
    onConfirm: (title: String, description: String?, date: Date, endDate: Date?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var eventDate by remember { mutableStateOf(selectedDate) }
    var endDate by remember { mutableStateOf<Date?>(null) }
    var eventType by remember { mutableStateOf("Event") }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }
    var showEndTimePicker by remember { mutableStateOf(false) }
    
    val fullDateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
    val context = LocalContext.current
    
    val eventTypes = listOf("Event", "Lesson", "Registration Start", "Registration End", "Meeting", "Appointment")
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Event") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Event title
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Event Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Event description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                // Event type selection
                Text(
                    text = "Event Type",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(eventTypes) { type ->
                        FilterChip(
                            onClick = { eventType = type },
                            label = { Text(type) },
                            selected = eventType == type
                        )
                    }
                }
                
                // Start date and time
                OutlinedTextField(
                    value = fullDateFormatter.format(eventDate),
                    onValueChange = { },
                    label = { Text("Start Date & Time") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = {
                        Row {
                            IconButton(onClick = { showTimePicker = true }) {
                                Icon(Icons.Default.Schedule, contentDescription = "Pick time")
                            }
                            IconButton(onClick = { showDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Pick date")
                            }
                        }
                    }
                )
                
                // End date and time (optional)
                OutlinedTextField(
                    value = endDate?.let { fullDateFormatter.format(it) } ?: "",
                    onValueChange = { },
                    label = { Text("End Date & Time (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                    trailingIcon = {
                        Row {
                            if (endDate != null) {
                                IconButton(onClick = { endDate = null }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear end date")
                                }
                            }
                            IconButton(onClick = { showEndTimePicker = true }) {
                                Icon(Icons.Default.Schedule, contentDescription = "Pick end time")
                            }
                            IconButton(onClick = { showEndDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Pick end date")
                            }
                        }
                    }
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (title.isNotBlank()) {
                        onConfirm(
                            title.trim(),
                            description.trim().takeIf { it.isNotBlank() },
                            eventDate,
                            endDate
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
    
    // Date picker for start date
    if (showDatePicker) {
        val calendar = Calendar.getInstance().apply { time = eventDate }
        
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCalendar = Calendar.getInstance().apply {
                    time = eventDate
                    set(year, month, dayOfMonth)
                }
                eventDate = newCalendar.time
                showDatePicker = false
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }
    
    // Time picker for start time
    if (showTimePicker) {
        val calendar = Calendar.getInstance().apply { time = eventDate }
        
        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                val newCalendar = Calendar.getInstance().apply {
                    time = eventDate
                    set(Calendar.HOUR_OF_DAY, hourOfDay)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                }
                eventDate = newCalendar.time
                showTimePicker = false
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true
        ).show()
    }
    
    // Date picker for end date
    if (showEndDatePicker) {
        val calendar = Calendar.getInstance().apply { 
            time = endDate ?: eventDate
        }
        
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCalendar = Calendar.getInstance().apply {
                    time = endDate ?: eventDate
                    set(year, month, dayOfMonth)
                }
                endDate = newCalendar.time
                showEndDatePicker = false
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }
    
    // Time picker for end time
    if (showEndTimePicker) {
        val calendar = Calendar.getInstance().apply { 
            time = endDate ?: eventDate
        }
        
        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                val newCalendar = Calendar.getInstance().apply {
                    time = endDate ?: eventDate
                    set(Calendar.HOUR_OF_DAY, hourOfDay)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                }
                endDate = newCalendar.time
                showEndTimePicker = false
            },
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            true
        ).show()
    }
}

@Composable
fun EventDetailsDialog(
    event: Event,
    onDismiss: () -> Unit,
    onDelete: () -> Unit
) {
    val fullDateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(event.title) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Event type
                Text(
                    text = "Type: ${event.type}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                
                // Event description
                event.description?.let { description ->
                    Text(
                        text = "Description:",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                // Start date
                Text(
                    text = "Start: ${fullDateFormatter.format(event.date)}",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                // End date
                event.endDate?.let { endDate ->
                    Text(
                        text = "End: ${fullDateFormatter.format(endDate)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
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
                    Text("Delete Event")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

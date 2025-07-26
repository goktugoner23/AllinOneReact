package com.example.allinone.ui.compose.wt

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.DatePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.example.allinone.data.WTStudent
import com.example.allinone.data.WTRegistration
import com.example.allinone.data.WTLesson
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddRegistrationDialog(
    students: List<WTStudent>,
    onDismiss: () -> Unit,
    onConfirm: (Long, Double, Date, Date, String?, Boolean, String?) -> Unit
) {
    var selectedStudent by remember { mutableStateOf<WTStudent?>(null) }
    var amount by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf<Date?>(null) }
    var endDate by remember { mutableStateOf<Date?>(null) }
    var notes by remember { mutableStateOf("") }
    var isPaid by remember { mutableStateOf(false) }
    var expandedStudents by remember { mutableStateOf(false) }
    var attachmentUri by remember { mutableStateOf<Uri?>(null) }
    var showStartDatePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }
    val startDatePickerState = rememberDatePickerState(initialSelectedDateMillis = startDate?.time)
    val endDatePickerState = rememberDatePickerState(initialSelectedDateMillis = endDate?.time)
    
    val context = LocalContext.current
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    val calendar = Calendar.getInstance()
    
    // File picker launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        attachmentUri = uri
    }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Add Registration",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Student Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedStudents,
                    onExpandedChange = { expandedStudents = !expandedStudents }
                ) {
                    OutlinedTextField(
                        value = selectedStudent?.name ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Select Student *") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedStudents) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expandedStudents,
                        onDismissRequest = { expandedStudents = false },
                        modifier = Modifier.heightIn(max = 200.dp)
                    ) {
                        students.forEach { student ->
                            DropdownMenuItem(
                                text = { Text(student.name) },
                                onClick = {
                                    selectedStudent = student
                                    expandedStudents = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Amount
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Start Date
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = startDate?.let { dateFormat.format(it) } ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Start Date *") },
                        trailingIcon = {
                            IconButton(onClick = { showStartDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Select date")
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = true
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { showStartDatePicker = true }
                    )
                }
                if (showStartDatePicker) {
                    Dialog(onDismissRequest = { showStartDatePicker = false }) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DatePicker(state = startDatePickerState)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { showStartDatePicker = false }) { Text("Cancel") }
                                    Button(onClick = {
                                        startDatePickerState.selectedDateMillis?.let {
                                            val picked = Date(it)
                                            startDate = picked
                                        }
                                        showStartDatePicker = false
                                    }) { Text("OK") }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // End Date
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = endDate?.let { dateFormat.format(it) } ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("End Date *") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = true,
                        trailingIcon = {
                            IconButton(onClick = { showEndDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Select date")
                            }
                        }
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { showEndDatePicker = true }
                    )
                }
                if (showEndDatePicker) {
                    Dialog(onDismissRequest = { showEndDatePicker = false }) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DatePicker(state = endDatePickerState)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { showEndDatePicker = false }) { Text("Cancel") }
                                    Button(onClick = {
                                        endDatePickerState.selectedDateMillis?.let {
                                            endDate = Date(it)
                                        }
                                        showEndDatePicker = false
                                    }) { Text("OK") }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Notes
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Payment Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Switch(
                        checked = isPaid,
                        onCheckedChange = { isPaid = it }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Paid")
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Receipt/Attachment section (only show if paid)
                if (isPaid) {
                    Text(
                        text = "Receipt/Attachment",
                        fontWeight = FontWeight.Medium
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = { filePickerLauncher.launch("*/*") },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.AttachFile, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add Receipt")
                        }
                        
                        if (attachmentUri != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(
                                onClick = { attachmentUri = null }
                            ) {
                                Icon(Icons.Default.Clear, contentDescription = "Remove")
                            }
                        }
                    }
                    
                    // Show selected file name
                    attachmentUri?.let { uri ->
                        Text(
                            text = "File selected: ${uri.lastPathSegment ?: "Unknown"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            if (selectedStudent != null && amount.isNotBlank() && startDate != null && endDate != null) {
                                onConfirm(
                                    selectedStudent!!.id,
                                    amount.toDoubleOrNull() ?: 0.0,
                                    startDate!!,
                                    endDate!!,
                                    notes.takeIf { it.isNotBlank() },
                                    isPaid,
                                    attachmentUri?.toString()
                                )
                            }
                        },
                        enabled = selectedStudent != null && amount.isNotBlank() && startDate != null && endDate != null
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditRegistrationDialog(
    registration: WTRegistration,
    students: List<WTStudent>,
    onDismiss: () -> Unit,
    onConfirm: (WTRegistration) -> Unit
) {
    var amount by remember { mutableStateOf(registration.amount.toString()) }
    var startDate by remember { mutableStateOf(registration.startDate) }
    var endDate by remember { mutableStateOf(registration.endDate) }
    var notes by remember { mutableStateOf(registration.notes ?: "") }
    var isPaid by remember { mutableStateOf(registration.isPaid) }
    var attachmentUri by remember { mutableStateOf(registration.attachmentUri?.let { Uri.parse(it) }) }
    var showStartDatePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }
    val startDatePickerState = rememberDatePickerState(initialSelectedDateMillis = startDate?.time)
    val endDatePickerState = rememberDatePickerState(initialSelectedDateMillis = endDate?.time)
    
    val context = LocalContext.current
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    val calendar = Calendar.getInstance()
    
    // File picker launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        attachmentUri = uri
    }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Edit Registration",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Student name (read-only)
                OutlinedTextField(
                    value = students.find { it.id == registration.studentId }?.name ?: "Unknown",
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Student") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Amount
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Start Date
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = startDate?.let { dateFormat.format(it) } ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Start Date *") },
                        trailingIcon = {
                            IconButton(onClick = { showStartDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Select date")
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = true
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { showStartDatePicker = true }
                    )
                }
                if (showStartDatePicker) {
                    Dialog(onDismissRequest = { showStartDatePicker = false }) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DatePicker(state = startDatePickerState)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { showStartDatePicker = false }) { Text("Cancel") }
                                    Button(onClick = {
                                        startDatePickerState.selectedDateMillis?.let {
                                            startDate = Date(it)
                                        }
                                        showStartDatePicker = false
                                    }) { Text("OK") }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // End Date
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = endDate?.let { dateFormat.format(it) } ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("End Date *") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = true,
                        trailingIcon = {
                            IconButton(onClick = { showEndDatePicker = true }) {
                                Icon(Icons.Default.DateRange, contentDescription = "Select date")
                            }
                        }
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { showEndDatePicker = true }
                    )
                }
                if (showEndDatePicker) {
                    Dialog(onDismissRequest = { showEndDatePicker = false }) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DatePicker(state = endDatePickerState)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { showEndDatePicker = false }) { Text("Cancel") }
                                    Button(onClick = {
                                        endDatePickerState.selectedDateMillis?.let {
                                            endDate = Date(it)
                                        }
                                        showEndDatePicker = false
                                    }) { Text("OK") }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Notes
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Payment Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Switch(
                        checked = isPaid,
                        onCheckedChange = { isPaid = it }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Paid")
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Receipt/Attachment section (only show if paid)
                if (isPaid) {
                    Text(
                        text = "Receipt/Attachment",
                        fontWeight = FontWeight.Medium
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = { filePickerLauncher.launch("*/*") },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.AttachFile, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (attachmentUri != null) "Change Receipt" else "Add Receipt")
                        }
                        
                        if (attachmentUri != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(
                                onClick = { attachmentUri = null }
                            ) {
                                Icon(Icons.Default.Clear, contentDescription = "Remove")
                            }
                        }
                    }
                    
                    // Show current attachment
                    attachmentUri?.let { uri ->
                        Text(
                            text = "File: ${uri.lastPathSegment ?: "Unknown"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        // If it's an image, show a preview
                        if (uri.toString().startsWith("https://") || 
                            uri.toString().contains("image", ignoreCase = true)) {
                            AsyncImage(
                                model = uri,
                                contentDescription = "Receipt preview",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp)
                                    .clickable {
                                        // Open full image
                                        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                    },
                                contentScale = ContentScale.Crop
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            if (amount.isNotBlank() && startDate != null && endDate != null) {
                                onConfirm(
                                    registration.copy(
                                        amount = amount.toDoubleOrNull() ?: 0.0,
                                        startDate = startDate,
                                        endDate = endDate,
                                        notes = notes.takeIf { it.isNotBlank() },
                                        isPaid = isPaid,
                                        attachmentUri = attachmentUri?.toString()
                                    )
                                )
                            }
                        },
                        enabled = amount.isNotBlank() && startDate != null && endDate != null
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLessonDialog(
    onDismiss: () -> Unit,
    onConfirm: (Int, Int, Int, Int, Int) -> Unit
) {
    var selectedDayOfWeek by remember { mutableStateOf(1) } // Monday
    var startHour by remember { mutableStateOf(18) }
    var startMinute by remember { mutableStateOf(0) }
    var endHour by remember { mutableStateOf(19) }
    var endMinute by remember { mutableStateOf(30) }
    
    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    var expandedDays by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Add Lesson",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Day of Week Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedDays,
                    onExpandedChange = { expandedDays = !expandedDays }
                ) {
                    OutlinedTextField(
                        value = dayNames[selectedDayOfWeek - 1],
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Day of Week") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedDays) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expandedDays,
                        onDismissRequest = { expandedDays = false }
                    ) {
                        dayNames.forEachIndexed { index, dayName ->
                            DropdownMenuItem(
                                text = { Text(dayName) },
                                onClick = {
                                    selectedDayOfWeek = index + 1
                                    expandedDays = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Start Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", startHour, startMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Start Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    startHour = hour
                                    startMinute = minute
                                },
                                startHour,
                                startMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // End Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", endHour, endMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("End Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    endHour = hour
                                    endMinute = minute
                                },
                                endHour,
                                endMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            onConfirm(selectedDayOfWeek, startHour, startMinute, endHour, endMinute)
                        }
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditLessonDialog(
    lesson: WTLesson,
    onDismiss: () -> Unit,
    onConfirm: (Int, Int, Int, Int, Int) -> Unit
) {
    var selectedDayOfWeek by remember { mutableStateOf(lesson.dayOfWeek) }
    var startHour by remember { mutableStateOf(lesson.startHour) }
    var startMinute by remember { mutableStateOf(lesson.startMinute) }
    var endHour by remember { mutableStateOf(lesson.endHour) }
    var endMinute by remember { mutableStateOf(lesson.endMinute) }
    
    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    var expandedDays by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Edit Lesson",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Day of Week Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedDays,
                    onExpandedChange = { expandedDays = !expandedDays }
                ) {
                    OutlinedTextField(
                        value = if (selectedDayOfWeek in 1..7) dayNames[selectedDayOfWeek - 1] else "Unknown",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Day of Week") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedDays) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expandedDays,
                        onDismissRequest = { expandedDays = false }
                    ) {
                        dayNames.forEachIndexed { index, dayName ->
                            DropdownMenuItem(
                                text = { Text(dayName) },
                                onClick = {
                                    selectedDayOfWeek = index + 1
                                    expandedDays = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Start Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", startHour, startMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Start Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    startHour = hour
                                    startMinute = minute
                                },
                                startHour,
                                startMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // End Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", endHour, endMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("End Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    endHour = hour
                                    endMinute = minute
                                },
                                endHour,
                                endMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            onConfirm(selectedDayOfWeek, startHour, startMinute, endHour, endMinute)
                        }
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddSeminarDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Date, Int, Int, Int, Int, String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var date by remember { mutableStateOf<Date?>(null) }
    var startHour by remember { mutableStateOf(9) }
    var startMinute by remember { mutableStateOf(0) }
    var endHour by remember { mutableStateOf(13) }
    var endMinute by remember { mutableStateOf(0) }
    var description by remember { mutableStateOf("") }
    
    val context = LocalContext.current
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    val calendar = Calendar.getInstance()
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Add Seminar",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Name
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name *") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Date
                OutlinedTextField(
                    value = date?.let { dateFormat.format(it) } ?: "",
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Date *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val datePickerDialog = DatePickerDialog(
                                context,
                                { _, year, month, dayOfMonth ->
                                    calendar.set(year, month, dayOfMonth)
                                    date = calendar.time
                                },
                                calendar.get(Calendar.YEAR),
                                calendar.get(Calendar.MONTH),
                                calendar.get(Calendar.DAY_OF_MONTH)
                            )
                            datePickerDialog.setButton(DatePickerDialog.BUTTON_POSITIVE, "OK", datePickerDialog)
                            datePickerDialog.setButton(DatePickerDialog.BUTTON_NEGATIVE, "Cancel", datePickerDialog)
                            datePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Start Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", startHour, startMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Start Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    startHour = hour
                                    startMinute = minute
                                },
                                startHour,
                                startMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // End Time
                OutlinedTextField(
                    value = String.format("%02d:%02d", endHour, endMinute),
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("End Time") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val timePickerDialog = TimePickerDialog(
                                context,
                                { _, hour, minute ->
                                    endHour = hour
                                    endMinute = minute
                                },
                                endHour,
                                endMinute,
                                true
                            )
                            timePickerDialog.show()
                        },
                    interactionSource = remember { MutableInteractionSource() }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            if (name.isNotBlank() && date != null) {
                                onConfirm(
                                    name,
                                    date!!,
                                    startHour,
                                    startMinute,
                                    endHour,
                                    endMinute,
                                    description.takeIf { it.isNotBlank() }
                                )
                            }
                        },
                        enabled = name.isNotBlank() && date != null
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
} 
package com.example.allinone.ui.compose.wt

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.example.allinone.data.WTStudent
import com.example.allinone.data.WTRegistration
import com.example.allinone.data.WTLesson
import com.example.allinone.data.WTSeminar
import java.text.SimpleDateFormat
import java.util.*

// Card Components
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentCard(
    student: WTStudent,
    isRegistered: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showPhotoFullscreen by remember { mutableStateOf(false) }
    var showPhotoOptions by remember { mutableStateOf(false) }
    var showDeleteConfirmation by remember { mutableStateOf(false) }

    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        onClick = onEdit,
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        )
    ) {
        Column {
            Row(
                modifier = Modifier.padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Student Photo with enhanced interactivity
                if (student.photoUri != null) {
                    AsyncImage(
                        model = student.photoUri,
                        contentDescription = "Student photo",
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onTap = { showPhotoFullscreen = true },
                                    onLongPress = { showPhotoOptions = true }
                                )
                            },
                        contentScale = ContentScale.Crop
                    )
                } else {
                    // Modern default photo placeholder
                    Surface(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape),
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = "No photo",
                                modifier = Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = student.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        // Modern floating action button for delete - Made more visible
                        FloatingActionButton(
                            onClick = { showDeleteConfirmation = true },
                            modifier = Modifier.size(48.dp), // Increased from 40dp
                            containerColor = MaterialTheme.colorScheme.errorContainer,
                            contentColor = MaterialTheme.colorScheme.onErrorContainer,
                            elevation = FloatingActionButtonDefaults.elevation(
                                defaultElevation = 6.dp,
                                pressedElevation = 8.dp
                            )
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Delete student",
                                modifier = Modifier.size(24.dp) // Increased from 20dp
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Status chips with better design
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (isRegistered) {
                            FilterChip(
                                onClick = { },
                                label = { 
                                    Text(
                                        "Registered",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    ) 
                                },
                                selected = true,
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF4CAF50).copy(alpha = 0.15f),
                                    selectedLabelColor = Color(0xFF2E7D32)
                                ),
                                leadingIcon = {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            )
                        }
                        
                        FilterChip(
                            onClick = { },
                            label = { 
                                Text(
                                    if (student.isActive) "Active" else "Inactive",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                ) 
                            },
                            selected = student.isActive,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            leadingIcon = {
                                Icon(
                                    if (student.isActive) Icons.Default.RadioButtonChecked else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Contact information with icons
                    student.phoneNumber?.let { phone ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Icon(
                                Icons.Default.Phone,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = phone,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 14.sp
                            )
                        }
                    }
                    
                    student.email?.let { email ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Icon(
                                Icons.Default.Email,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = email,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 14.sp
                            )
                        }
                    }
                    
                    student.instagram?.let { instagram ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Icon(
                                Icons.Default.Camera,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "@$instagram",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 14.sp
                            )
                        }
                    }
                    
                    student.notes?.let { notes ->
                        if (notes.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = notes,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Fullscreen photo dialog
    if (showPhotoFullscreen && student.photoUri != null) {
        FullscreenImageDialog(
            imageUri = Uri.parse(student.photoUri),
            onDismiss = { showPhotoFullscreen = false }
        )
    }

    // Photo options dialog
    if (showPhotoOptions) {
        PhotoOptionsDialog(
            onDismiss = { showPhotoOptions = false },
            onEdit = { 
                showPhotoOptions = false
                onEdit() // This will open the edit dialog where they can change the photo
            },
            onDelete = {
                showPhotoOptions = false
                // Note: Photo deletion should be handled in the edit dialog
                onEdit()
            }
        )
    }

    // Delete confirmation dialog
    if (showDeleteConfirmation) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmation = false },
            title = { 
                Text(
                    "Delete Student",
                    fontWeight = FontWeight.Bold
                ) 
            },
            text = { 
                Text("Are you sure you want to delete ${student.name}? This action cannot be undone.") 
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirmation = false
                        onDelete()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmation = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun RegistrationCard(
    registration: WTRegistration,
    studentName: String,
    onEdit: () -> Unit,
    onLongPress: () -> Unit = {}, // Add long-press callback
    modifier: Modifier = Modifier
) {
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onEdit,
                onLongClick = onLongPress
            )
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
                    text = studentName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                
                AssistChip(
                    onClick = { },
                    label = { Text(if (registration.isPaid) "Paid" else "Unpaid") },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = if (registration.isPaid) Color.Green.copy(alpha = 0.1f) else Color.Red.copy(alpha = 0.1f),
                        labelColor = if (registration.isPaid) Color.Green else Color.Red
                    )
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Amount: $${registration.amount}",
                fontWeight = FontWeight.Medium
            )
            
            registration.startDate?.let { startDate ->
                Text(
                    text = "Start: ${dateFormat.format(startDate)}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            registration.endDate?.let { endDate ->
                Text(
                    text = "End: ${dateFormat.format(endDate)}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            registration.notes?.let { notes ->
                if (notes.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = notes,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LessonCard(
    lesson: WTLesson,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dayNames = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    val dayName = if (lesson.dayOfWeek in 1..7) dayNames[lesson.dayOfWeek - 1] else "Unknown"
    
    Card(
        modifier = modifier.fillMaxWidth(),
        onClick = onEdit
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
                    text = dayName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
            
            Text(
                text = "${String.format("%02d:%02d", lesson.startHour, lesson.startMinute)} - ${String.format("%02d:%02d", lesson.endHour, lesson.endMinute)}",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SeminarCard(
    seminar: WTSeminar,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
    
    Card(
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
                    text = seminar.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
            
            Text(
                text = dateFormat.format(seminar.date),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Text(
                text = "${String.format("%02d:%02d", seminar.startHour, seminar.startMinute)} - ${String.format("%02d:%02d", seminar.endHour, seminar.endMinute)}",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            seminar.description?.let { description ->
                if (description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = description,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

// Dialog Components
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddStudentDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String, String?, String?, String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var instagram by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var photoUri by remember { mutableStateOf<Uri?>(null) }
    var showFullscreenImage by remember { mutableStateOf(false) }
    var showPhotoOptions by remember { mutableStateOf(false) }
    
    // Photo picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        photoUri = uri
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
                    text = "Add Student",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Photo section with enhanced interactivity - Similar to EditStudentDialog
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Surface(
                        modifier = Modifier
                            .size(140.dp)
                            .clip(CircleShape)
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onTap = {
                                        // Single tap - show fullscreen if photo exists, otherwise open picker
                                        if (photoUri != null) {
                                            showFullscreenImage = true
                                        } else {
                                            photoPickerLauncher.launch("image/*")
                                        }
                                    },
                                    onLongPress = {
                                        if (photoUri != null) {
                                            showPhotoOptions = true
                                        }
                                    }
                                )
                            },
                        shape = CircleShape,
                        color = if (photoUri != null) Color.Transparent else MaterialTheme.colorScheme.primaryContainer,
                        tonalElevation = 8.dp
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            if (photoUri != null) {
                                AsyncImage(
                                    model = photoUri,
                                    contentDescription = "Student photo",
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                // Modern empty state design
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    Icon(
                                        Icons.Default.AddAPhoto,
                                        contentDescription = "Add photo",
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Add Photo",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Clean instruction text only when photo exists
                    if (photoUri != null) {
                        Text(
                            text = "Tap to view • Long press for options",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    } else {
                        Text(
                            text = "Tap to add a photo",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name *") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = instagram,
                    onValueChange = { instagram = it },
                    label = { Text("Instagram") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
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
                            if (name.isNotBlank() && phone.isNotBlank()) {
                                onConfirm(
                                    name,
                                    phone,
                                    email.takeIf { it.isNotBlank() },
                                    instagram.takeIf { it.isNotBlank() },
                                    notes.takeIf { it.isNotBlank() }
                                )
                            }
                        },
                        enabled = name.isNotBlank() && phone.isNotBlank()
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
    
    // Fullscreen Image Dialog
    if (showFullscreenImage && photoUri != null) {
        FullscreenImageDialog(
            imageUri = photoUri!!,
            onDismiss = { showFullscreenImage = false }
        )
    }
    
    // Photo Options Dialog
    if (showPhotoOptions) {
        PhotoOptionsDialog(
            onDismiss = { showPhotoOptions = false },
            onEdit = { 
                showPhotoOptions = false
                photoPickerLauncher.launch("image/*")
            },
            onDelete = {
                showPhotoOptions = false
                photoUri = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditStudentDialog(
    student: WTStudent,
    onDismiss: () -> Unit,
    onConfirm: (WTStudent) -> Unit
) {
    var name by remember { mutableStateOf(student.name) }
    var phone by remember { mutableStateOf(student.phoneNumber ?: "") }
    var email by remember { mutableStateOf(student.email ?: "") }
    var instagram by remember { mutableStateOf(student.instagram ?: "") }
    var notes by remember { mutableStateOf(student.notes ?: "") }
    var isActive by remember { mutableStateOf(student.isActive) }
    var photoUri by remember { mutableStateOf(student.photoUri?.let { Uri.parse(it) }) }
    var showFullscreenImage by remember { mutableStateOf(false) }
    var showPhotoOptions by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    
    // Photo picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        photoUri = uri
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
                    text = "Edit Student",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Photo section with clean interactive design
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Surface(
                        modifier = Modifier
                            .size(140.dp)
                            .clip(CircleShape)
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onTap = {
                                        // Single tap - show fullscreen if photo exists, otherwise open picker
                                        if (photoUri != null) {
                                            showFullscreenImage = true
                                        } else {
                                            photoPickerLauncher.launch("image/*")
                                        }
                                    },
                                    onLongPress = {
                                        if (photoUri != null) {
                                            showPhotoOptions = true
                                        }
                                    }
                                )
                            },
                        shape = CircleShape,
                        color = if (photoUri != null) Color.Transparent else MaterialTheme.colorScheme.primaryContainer,
                        tonalElevation = 8.dp
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            if (photoUri != null) {
                                AsyncImage(
                                    model = photoUri,
                                    contentDescription = "Student photo",
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                // Modern empty state design
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    Icon(
                                        Icons.Default.AddAPhoto,
                                        contentDescription = "Add photo",
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Add Photo",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Clean instruction text only when photo exists
                    if (photoUri != null) {
                        Text(
                            text = "Tap to view • Long press for options",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    } else {
                        Text(
                            text = "Tap to add a photo",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name *") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = instagram,
                    onValueChange = { instagram = it },
                    label = { Text("Instagram") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Switch(
                        checked = isActive,
                        onCheckedChange = { isActive = it }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Active")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Quick Action Buttons - Circular with Icons Only
                if (phone.isNotBlank() || email.isNotBlank() || instagram.isNotBlank()) {
                    Text(
                        text = "Quick Actions",
                        fontWeight = FontWeight.Medium,
                        fontSize = 16.sp
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterHorizontally)
                    ) {
                        // Phone button
                        if (phone.isNotBlank()) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                FloatingActionButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.size(56.dp),
                                    containerColor = Color(0xFF4CAF50),
                                    contentColor = Color.White
                                ) {
                                    Icon(
                                        Icons.Default.Phone,
                                        contentDescription = "Call",
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Call",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        
                        // WhatsApp button
                        if (phone.isNotBlank()) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                FloatingActionButton(
                                    onClick = {
                                        val cleanPhone = phone.replace(Regex("[^\\d+]"), "")
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$cleanPhone"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.size(56.dp),
                                    containerColor = Color(0xFF25D366),
                                    contentColor = Color.White
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.Message,
                                        contentDescription = "WhatsApp",
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "WhatsApp",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        
                        // Email button
                        if (email.isNotBlank()) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                FloatingActionButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.size(56.dp),
                                    containerColor = Color(0xFF2196F3),
                                    contentColor = Color.White
                                ) {
                                    Icon(
                                        Icons.Default.Email,
                                        contentDescription = "Email",
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Email",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        
                        // Instagram button
                        if (instagram.isNotBlank()) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                FloatingActionButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com/$instagram"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.size(56.dp),
                                    containerColor = Color(0xFFE4405F),
                                    contentColor = Color.White
                                ) {
                                    Icon(
                                        Icons.Default.Camera,
                                        contentDescription = "Instagram",
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Instagram",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                }
                
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
                            if (name.isNotBlank() && phone.isNotBlank()) {
                                onConfirm(
                                    student.copy(
                                        name = name,
                                        phoneNumber = phone,
                                        email = email.takeIf { it.isNotBlank() },
                                        instagram = instagram.takeIf { it.isNotBlank() },
                                        notes = notes.takeIf { it.isNotBlank() },
                                        isActive = isActive,
                                        photoUri = photoUri?.toString()
                                    )
                                )
                            }
                        },
                        enabled = name.isNotBlank() && phone.isNotBlank()
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
    
    // Fullscreen Image Dialog
    if (showFullscreenImage && photoUri != null) {
        FullscreenImageDialog(
            imageUri = photoUri!!,
            onDismiss = { showFullscreenImage = false }
        )
    }
    
    // Photo Options Dialog
    if (showPhotoOptions) {
        PhotoOptionsDialog(
            onDismiss = { showPhotoOptions = false },
            onEdit = { 
                showPhotoOptions = false
                photoPickerLauncher.launch("image/*")
            },
            onDelete = {
                showPhotoOptions = false
                photoUri = null
            }
        )
    }
} 

@Composable
fun FullscreenImageDialog(
    imageUri: Uri,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = { onDismiss() }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            AsyncImage(
                model = imageUri,
                contentDescription = "Full screen image",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit
            )
            
            // Close button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
            ) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Close",
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
            
            // Instructions at bottom
            Text(
                text = "Tap anywhere to close",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 14.sp,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(32.dp)
            )
        }
    }
}

@Composable
fun PhotoOptionsDialog(
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.Photo,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Photo Options",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "What would you like to do with this photo?",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Change Photo Button
                    ElevatedButton(
                        onClick = onEdit,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.elevatedButtonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = null,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Change",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    
                    // Delete Photo Button
                    ElevatedButton(
                        onClick = onDelete,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.elevatedButtonColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer,
                            contentColor = MaterialTheme.colorScheme.onErrorContainer
                        )
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = null,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Remove",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Cancel",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
} 
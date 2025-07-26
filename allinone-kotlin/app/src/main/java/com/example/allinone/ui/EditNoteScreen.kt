package com.example.allinone.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.allinone.data.Note
import com.example.allinone.ui.components.*
import com.example.allinone.ui.drawing.DrawingActivity
import com.example.allinone.viewmodels.NotesViewModel
import kotlinx.coroutines.launch
import java.io.File
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditNoteScreen(
    noteId: Long? = null,
    onNavigateBack: () -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }
    
    // State management
    var title by remember { mutableStateOf("") }
    var richTextState by remember { mutableStateOf(RichTextState()) }
    var mediaAttachmentsState by remember { mutableStateOf(MediaAttachmentsState()) }
    var voiceRecorderState by remember { mutableStateOf(VoiceRecorderState()) }

    var isLoading by remember { mutableStateOf(false) }
    var showMediaViewer by remember { mutableStateOf(false) }
    var mediaViewerIndex by remember { mutableStateOf(0) }
    var showSaveDialog by remember { mutableStateOf(false) }
    var hasUnsavedChanges by remember { mutableStateOf(false) }
    
    // Voice recorder manager - use the proper implementation from VoiceRecorder.kt
    val voiceRecorderManager = remember { com.example.allinone.ui.components.VoiceRecorderManager(context) }
    
    // Drawing activity launcher
    val drawingLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            result.data?.getStringExtra("drawing_uri")?.let { uriString ->
                val uri = Uri.parse(uriString)
                scope.launch {
                    addDrawingToAttachments(
                        uri = uri,
                        currentState = mediaAttachmentsState,
                        onStateChange = { mediaAttachmentsState = it }
                    )
                }
            }
        }
    }
    
    // ViewModel states
    val notes by viewModel.allNotes.observeAsState(emptyList())
    val uploadProgress by viewModel.uploadProgress.collectAsState()
    val isUploading by viewModel.isUploading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    
    // Find existing note if editing
    val existingNote = remember(notes, noteId) {
        noteId?.let { id -> notes.find { it.id == id } }
    }
    
    // Load existing note data
    LaunchedEffect(existingNote) {
        existingNote?.let { note ->
            title = note.title
            richTextState = RichTextState(
                text = note.content,
                formattedText = androidx.compose.ui.text.AnnotatedString(note.content)
            )
            
            // Load media attachments
            val attachments = viewModel.getMediaAttachmentsFromNote(note)
            mediaAttachmentsState = MediaAttachmentsState(attachments = attachments)
        }
    }
    
    // Clean up voice recorder on dispose
    DisposableEffect(Unit) {
        onDispose {
            voiceRecorderManager.release()
        }
    }
    
    // Track changes
    LaunchedEffect(title, richTextState, mediaAttachmentsState) {
        hasUnsavedChanges = title.isNotEmpty() || 
                richTextState.text.isNotEmpty() || 
                mediaAttachmentsState.attachments.isNotEmpty()
    }
    
    // Handle back button with unsaved changes
    BackHandler(enabled = hasUnsavedChanges) {
        showSaveDialog = true
    }
    
    // Voice recorder state management
    VoiceRecorderStateManager(
        voiceRecorderState = voiceRecorderState,
        onStateChange = { voiceRecorderState = it },
        voiceRecorderManager = voiceRecorderManager,
        onRecordingComplete = { audioFile ->
            scope.launch {
                addVoiceNoteToAttachments(
                    context = context,
                    audioFile = audioFile,
                    currentState = mediaAttachmentsState,
                    onStateChange = { mediaAttachmentsState = it }
                )
                // Reset voice recorder state for new recording
                voiceRecorderState = VoiceRecorderState(hasPermission = voiceRecorderState.hasPermission)
            }
        }
    )
    
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text(if (noteId == null) "New Note" else "Edit Note") },
                navigationIcon = {
                    IconButton(onClick = {
                        if (hasUnsavedChanges) {
                            showSaveDialog = true
                        } else {
                            onNavigateBack()
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Drawing button
                        IconButton(
                            onClick = {
                            val intent = Intent(context, DrawingActivity::class.java)
                            drawingLauncher.launch(intent)
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Draw,
                            contentDescription = "Open drawing",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    // Save button
                    IconButton(
                        onClick = {
                            scope.launch {
                                saveNote(
                                    noteId = noteId,
                                    title = title,
                                    richTextState = richTextState,
                                    mediaAttachmentsState = mediaAttachmentsState,
                                    viewModel = viewModel,
                                    onSaved = onNavigateBack
                                )
                            }
                        },
                        enabled = hasUnsavedChanges && !isLoading && !isUploading
                    ) {
                        if (isLoading || isUploading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Save,
                                contentDescription = "Save",
                                tint = if (hasUnsavedChanges) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Title field
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Note Title") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            // Rich text editor
            RichTextEditor(
                state = richTextState,
                onStateChange = { richTextState = it },
                placeholder = "Start writing your note...",
                modifier = Modifier.fillMaxWidth()
            )
            
            // Media attachments manager
            MediaAttachmentManager(
                state = mediaAttachmentsState,
                onStateChange = { mediaAttachmentsState = it },
                onUploadMedia = { uris, mediaType ->
                    scope.launch {
                        uploadMediaAttachments(
                            context = context,
                            uris = uris,
                            mediaType = mediaType,
                            currentState = mediaAttachmentsState,
                            onStateChange = { mediaAttachmentsState = it }
                        )
                    }
                },
                voiceRecorderState = voiceRecorderState,
                onVoiceRecorderStateChange = { voiceRecorderState = it },
                onRecordingComplete = { audioFile ->
                    scope.launch {
                        addVoiceNoteToAttachments(
                            context = context,
                            audioFile = audioFile,
                            currentState = mediaAttachmentsState,
                            onStateChange = { mediaAttachmentsState = it }
                        )
                    }
                },
                onViewAttachment = { _, index ->
                    mediaViewerIndex = index
                    showMediaViewer = true
                }
            )
            
            // Drawing is now handled by separate DrawingActivity
            
            // Voice recorder
            // Removed VoiceRecorder component as it's now part of MediaAttachmentManager
            
            // Upload progress indicator
            if (isUploading) {
                Column {
                    Text(
                        text = "Uploading media...",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    LinearProgressIndicator(
                        progress = { uploadProgress },
                modifier = Modifier
                    .fillMaxWidth()
                            .height(4.dp),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            // Error message
            errorMessage?.let { error ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = "Error",
                            tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall
                            )
                        Spacer(modifier = Modifier.weight(1f))
                        IconButton(
                            onClick = { viewModel.clearErrorMessage() }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }
            
            // Add some bottom padding for better scrolling
                Spacer(modifier = Modifier.height(16.dp))
        }
    }
    
    // Media viewer dialog
    if (showMediaViewer) {
        MediaViewerDialog(
            attachments = mediaAttachmentsState.attachments,
            initialIndex = mediaViewerIndex,
            onDismiss = { showMediaViewer = false }
        )
    }
    
    // Save confirmation dialog
    if (showSaveDialog) {
        SaveConfirmationDialog(
            onSave = {
                scope.launch {
                    saveNote(
                        noteId = noteId,
                        title = title,
                        richTextState = richTextState,
                        mediaAttachmentsState = mediaAttachmentsState,
                        viewModel = viewModel,
                        onSaved = onNavigateBack
                    )
                }
                showSaveDialog = false
            },
            onDiscard = {
                showSaveDialog = false
                onNavigateBack()
            },
            onCancel = {
                showSaveDialog = false
            }
        )
    }
}

@Composable
private fun SaveConfirmationDialog(
    onSave: () -> Unit,
    onDiscard: () -> Unit,
    onCancel: () -> Unit
) {
        AlertDialog(
        onDismissRequest = onCancel,
        title = { Text("Unsaved Changes") },
        text = { Text("You have unsaved changes. Do you want to save them before leaving?") },
            confirmButton = {
            TextButton(onClick = onSave) {
                Text("Save")
                }
            },
            dismissButton = {
            Row {
                TextButton(onClick = onDiscard) {
                    Text("Discard")
                }
                TextButton(onClick = onCancel) {
                    Text("Cancel")
                }
            }
        }
    )
}

// Handle voice recorder state management
@Composable
private fun VoiceRecorderStateManager(
    voiceRecorderState: VoiceRecorderState,
    onStateChange: (VoiceRecorderState) -> Unit,
    voiceRecorderManager: VoiceRecorderManager,
    onRecordingComplete: (File) -> Unit
) {
    // Handle recording state changes
    LaunchedEffect(voiceRecorderState.isRecording) {
        if (voiceRecorderState.isRecording) {
            val recordingFile = voiceRecorderManager.startRecording { error ->
                onStateChange(voiceRecorderState.copy(error = error, isRecording = false))
            }
            
            if (recordingFile != null) {
                onStateChange(voiceRecorderState.copy(audioFile = recordingFile, recordingDuration = 0L))
            }
        } else {
            val finalFile = voiceRecorderManager.stopRecording()
            if (finalFile != null) {
                onStateChange(voiceRecorderState.copy(audioFile = finalFile, totalDuration = voiceRecorderManager.getDuration()))
                // Auto-save the recording
                onRecordingComplete(finalFile)
            }
        }
    }
    
    // Handle recording duration updates with proper state tracking
    LaunchedEffect(voiceRecorderState.isRecording, voiceRecorderState.recordingDuration) {
        if (voiceRecorderState.isRecording) {
            kotlinx.coroutines.delay(100)
            onStateChange(voiceRecorderState.copy(recordingDuration = voiceRecorderState.recordingDuration + 100))
        }
    }
    
    // Handle playback state changes
    LaunchedEffect(voiceRecorderState.isPlaying) {
        voiceRecorderState.audioFile?.let { file ->
            if (voiceRecorderState.isPlaying) {
                voiceRecorderManager.startPlayback(file) { error ->
                    onStateChange(voiceRecorderState.copy(error = error, isPlaying = false))
                }
                
                // Update playback position
                while (voiceRecorderState.isPlaying) {
                    kotlinx.coroutines.delay(100)
                    val currentPosition = voiceRecorderManager.getCurrentPosition()
                    onStateChange(voiceRecorderState.copy(playbackPosition = currentPosition))
                    
                    // Auto-stop when playback completes
                    if (currentPosition >= voiceRecorderState.totalDuration) {
                        onStateChange(voiceRecorderState.copy(isPlaying = false, playbackPosition = 0L))
                        break
                    }
                }
            } else {
                voiceRecorderManager.pausePlayback()
            }
        }
    }
}

// Helper functions
private suspend fun saveNote(
    noteId: Long?,
    title: String,
    richTextState: RichTextState,
    mediaAttachmentsState: MediaAttachmentsState,
    viewModel: NotesViewModel,
    onSaved: () -> Unit
) {
    try {
        if (noteId == null) {
            // Create new note with rich text
            viewModel.addRichNote(
                title = title,
                richTextState = richTextState,
                mediaAttachments = mediaAttachmentsState.attachments
            )
        } else {
            // Update existing note with rich text
            viewModel.updateRichNote(
                noteId = noteId,
                title = title,
                richTextState = richTextState,
                mediaAttachments = mediaAttachmentsState.attachments
            )
        }
        
        onSaved()
    } catch (e: Exception) {
        // Handle error - this will be shown in the error message state
    }
}

private suspend fun uploadMediaAttachments(
    context: Context,
    uris: List<Uri>,
    mediaType: MediaType,
    currentState: MediaAttachmentsState,
    onStateChange: (MediaAttachmentsState) -> Unit
) {
    onStateChange(currentState.copy(isUploading = true, uploadProgress = 0f))
    
    try {
        val newAttachments = mutableListOf<MediaAttachment>()
        val firebaseManager = com.example.allinone.firebase.FirebaseManager(context)
        
        uris.forEachIndexed { index, uri ->
            try {
                // Upload to Firebase storage
                val firebaseUrl = firebaseManager.uploadAttachment(uri)
                
                // Use the extension function instead of calling private functions directly
                val attachment = uri.toMediaAttachment(mediaType, context).copy(
                    uri = firebaseUrl ?: uri.toString() // Use Firebase URL if available, fallback to local
                )
                newAttachments.add(attachment)
            } catch (e: Exception) {
                // Fallback to local URI if Firebase upload fails
                val attachment = uri.toMediaAttachment(mediaType, context)
                newAttachments.add(attachment)
            }
            
            // Update progress
            val progress = (index + 1).toFloat() / uris.size.toFloat()
            onStateChange(currentState.copy(uploadProgress = progress))
        }
        
        // Add to current attachments
        val updatedAttachments = currentState.attachments + newAttachments
        
        onStateChange(
            currentState.copy(
                attachments = updatedAttachments,
                isUploading = false,
                uploadProgress = 0f
            )
        )
    } catch (e: Exception) {
        onStateChange(
            currentState.copy(
                isUploading = false,
                uploadProgress = 0f
            )
        )
        // Handle error
    }
}

private suspend fun addVoiceNoteToAttachments(
    context: Context,
    audioFile: File,
    currentState: MediaAttachmentsState,
    onStateChange: (MediaAttachmentsState) -> Unit
) {
    try {
        val audioDuration = getAudioDuration(audioFile)
        
        // Upload to Firebase storage first
        val firebaseManager = com.example.allinone.firebase.FirebaseManager(context)
        val fileUri = android.net.Uri.fromFile(audioFile)
        val firebaseUrl = firebaseManager.uploadAttachment(fileUri)
        
        val attachment = MediaAttachment(
            uri = firebaseUrl ?: audioFile.toURI().toString(), // Use Firebase URL if available, fallback to local
            type = MediaType.AUDIO,
            name = "Voice Note ${Date().time}",
            size = audioFile.length(),
            duration = audioDuration
        )
        
        val updatedAttachments = currentState.attachments + attachment
        
        onStateChange(currentState.copy(attachments = updatedAttachments))
    } catch (e: Exception) {
        // Handle error - fallback to local storage
        val audioDuration = getAudioDuration(audioFile)
        
        val attachment = MediaAttachment(
            uri = audioFile.toURI().toString(),
            type = MediaType.AUDIO,
            name = "Voice Note ${Date().time}",
            size = audioFile.length(),
            duration = audioDuration
        )
        
        val updatedAttachments = currentState.attachments + attachment
        
        onStateChange(currentState.copy(attachments = updatedAttachments))
    }
}

private fun getAudioDuration(audioFile: File): Long {
    return try {
        val mediaPlayer = android.media.MediaPlayer()
        mediaPlayer.setDataSource(audioFile.absolutePath)
        mediaPlayer.prepare()
        val duration = mediaPlayer.duration.toLong()
        mediaPlayer.release()
        duration
    } catch (e: Exception) {
        // If we can't determine duration, return 0
        0L
    }
}

private suspend fun addDrawingToAttachments(
    uri: Uri,
    currentState: MediaAttachmentsState,
    onStateChange: (MediaAttachmentsState) -> Unit
) {
    try {
        val attachment = MediaAttachment(
            uri = uri.toString(),
            type = MediaType.IMAGE,
            name = "Drawing ${Date().time}",
            size = null
        )
        
        val updatedAttachments = currentState.attachments + attachment
        
        onStateChange(currentState.copy(attachments = updatedAttachments))
    } catch (e: Exception) {
        // Handle error
    }
} 


package com.example.allinone.ui.components

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import java.io.File
import java.util.UUID

data class MediaAttachment(
    val id: String = UUID.randomUUID().toString(),
    val uri: String,
    val type: MediaType,
    val name: String? = null,
    val size: Long? = null,
    val duration: Long? = null // For audio/video in milliseconds
)

enum class MediaType {
    IMAGE, VIDEO, AUDIO
}

data class MediaAttachmentsState(
    val attachments: List<MediaAttachment> = emptyList(),
    val isUploading: Boolean = false,
    val uploadProgress: Float = 0f
)

@Composable
fun MediaAttachmentManager(
    state: MediaAttachmentsState,
    onStateChange: (MediaAttachmentsState) -> Unit,
    onUploadMedia: (List<Uri>, MediaType) -> Unit,
    voiceRecorderState: VoiceRecorderState? = null,
    onVoiceRecorderStateChange: ((VoiceRecorderState) -> Unit)? = null,
    onRecordingComplete: ((File) -> Unit)? = null,
    onViewAttachment: ((MediaAttachment, Int) -> Unit)? = null,
    modifier: Modifier = Modifier
) {

    
    Column(modifier = modifier) {
        // Attachment buttons (including voice recorder)
        AttachmentButtons(
            onUploadMedia = onUploadMedia,
            isUploading = state.isUploading,
            voiceRecorderState = voiceRecorderState,
            onVoiceRecorderStateChange = onVoiceRecorderStateChange,
            onRecordingComplete = onRecordingComplete
        )
        
        // Voice recorder UI (when active)
        if (voiceRecorderState != null && voiceRecorderState.isRecording) {
            Spacer(modifier = Modifier.height(8.dp))
            
            VoiceRecorderCompact(
                state = voiceRecorderState,
                onStateChange = onVoiceRecorderStateChange ?: {},
                onRecordingComplete = onRecordingComplete ?: {}
            )
        }
        
        // Attachments section
        if (state.attachments.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            
            // Attachments header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Attachments (${state.attachments.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = getAttachmentsSummary(state.attachments),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Enhanced media preview grid
            EnhancedMediaPreviewGrid(
                attachments = state.attachments,
                onRemoveAttachment = { attachment ->
                    val newAttachments = state.attachments.filter { it.id != attachment.id }
                    onStateChange(state.copy(attachments = newAttachments))
                },
                onViewAttachment = { attachment ->
                    val index = state.attachments.indexOf(attachment)
                    onViewAttachment?.invoke(attachment, index)
                }
            )
        }
        
        // Upload progress indicator
        if (state.isUploading) {
            Spacer(modifier = Modifier.height(8.dp))
            
            Column {
                Text(
                    text = "Uploading media...",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                LinearProgressIndicator(
                    progress = { state.uploadProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// Helper function to get attachments summary
private fun getAttachmentsSummary(attachments: List<MediaAttachment>): String {
    val images = attachments.count { it.type == MediaType.IMAGE }
    val videos = attachments.count { it.type == MediaType.VIDEO }
    val audio = attachments.count { it.type == MediaType.AUDIO }
    
    val parts = mutableListOf<String>()
    if (images > 0) parts.add("$images image${if (images > 1) "s" else ""}")
    if (videos > 0) parts.add("$videos video${if (videos > 1) "s" else ""}")
    if (audio > 0) parts.add("$audio voice${if (audio > 1) " notes" else " note"}")
    
    return parts.joinToString(", ")
}

@Composable
private fun AttachmentButtons(
    onUploadMedia: (List<Uri>, MediaType) -> Unit,
    isUploading: Boolean,
    voiceRecorderState: VoiceRecorderState? = null,
    onVoiceRecorderStateChange: ((VoiceRecorderState) -> Unit)? = null,
    onRecordingComplete: ((File) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris.isNotEmpty()) {
            onUploadMedia(uris, MediaType.IMAGE)
        }
    }
    
    val videoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        if (uris.isNotEmpty()) {
            onUploadMedia(uris, MediaType.VIDEO)
        }
    }
    
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Image attachment button
        AttachmentButton(
            icon = Icons.Default.Photo,
            label = "Image",
            enabled = !isUploading,
            onClick = { imagePickerLauncher.launch("image/*") }
        )
        
        // Video attachment button
        AttachmentButton(
            icon = Icons.Default.VideoFile,
            label = "Video",
            enabled = !isUploading,
            onClick = { videoPickerLauncher.launch("video/*") }
        )
        
        // Voice recorder button
        if (voiceRecorderState != null && onVoiceRecorderStateChange != null) {
            VoiceRecorderButton(
                state = voiceRecorderState,
                onStateChange = onVoiceRecorderStateChange,
                onRecordingComplete = onRecordingComplete ?: {},
                enabled = !isUploading
            )
        }
    }
}

@Composable
private fun AttachmentButton(
    icon: ImageVector,
    label: String,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(40.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.primary
        ),
        border = ButtonDefaults.outlinedButtonBorder.copy(
            width = 1.dp,
            brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline)
        )
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            fontSize = 12.sp
        )
    }
}

@Composable
private fun EnhancedMediaPreviewGrid(
    attachments: List<MediaAttachment>,
    onRemoveAttachment: (MediaAttachment) -> Unit,
    onViewAttachment: (MediaAttachment) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(horizontal = 4.dp)
    ) {
        items(attachments) { attachment ->
            EnhancedMediaPreviewItem(
                attachment = attachment,
                onRemove = { onRemoveAttachment(attachment) },
                onView = { onViewAttachment(attachment) }
            )
        }
    }
}

@Composable
private fun EnhancedMediaPreviewItem(
    attachment: MediaAttachment,
    onRemove: () -> Unit,
    onView: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(100.dp)
            .height(120.dp)
            .clickable { onView() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Media preview area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(80.dp)
            ) {
                when (attachment.type) {
                    MediaType.IMAGE -> {
                        AsyncImage(
                            model = ImageRequest.Builder(LocalContext.current)
                                .data(attachment.uri)
                                .crossfade(true)
                                .build(),
                            contentDescription = "Image attachment",
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)),
                            contentScale = ContentScale.Crop
                        )
                    }
                    
                    MediaType.VIDEO -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayCircle,
                                contentDescription = "Video attachment",
                                modifier = Modifier.size(32.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    MediaType.AUDIO -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Mic,
                                    contentDescription = "Voice note",
                                    modifier = Modifier.size(24.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                if (attachment.duration != null) {
                                    Text(
                                        text = formatDuration(attachment.duration),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
                
                // Remove button
                IconButton(
                    onClick = onRemove,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(20.dp)
                        .background(
                            color = MaterialTheme.colorScheme.error.copy(alpha = 0.8f),
                            shape = RoundedCornerShape(10.dp)
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Remove attachment",
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.onError
                    )
                }
            }
            
            // Info area
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(6.dp),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = when (attachment.type) {
                        MediaType.IMAGE -> "Image"
                        MediaType.VIDEO -> "Video"
                        MediaType.AUDIO -> "Voice Note"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                attachment.name?.let { name ->
                    Text(
                        text = name,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun MediaGrid(
    attachments: List<MediaAttachment>,
    onAttachmentClick: (MediaAttachment) -> Unit,
    modifier: Modifier = Modifier,
    maxItemsPerRow: Int = 3
) {
    if (attachments.isEmpty()) return
    
    Column(modifier = modifier) {
        val chunks = attachments.chunked(maxItemsPerRow)
        
        chunks.forEach { rowItems ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                rowItems.forEach { attachment ->
                    MediaGridItem(
                        attachment = attachment,
                        onClick = { onAttachmentClick(attachment) },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                // Fill remaining space if row is not full
                repeat(maxItemsPerRow - rowItems.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun MediaGridItem(
    attachment: MediaAttachment,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .aspectRatio(1f)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (attachment.type) {
                MediaType.IMAGE -> {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(attachment.uri)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                
                MediaType.VIDEO -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayCircle,
                            contentDescription = "Video",
                            modifier = Modifier.size(32.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    // Duration overlay if available
                    attachment.duration?.let { duration ->
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(4.dp)
                                .background(
                                    color = Color.Black.copy(alpha = 0.7f),
                                    shape = RoundedCornerShape(4.dp)
                                )
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = formatDuration(duration),
                                color = Color.White,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
                
                MediaType.AUDIO -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.GraphicEq,
                                contentDescription = "Audio",
                                modifier = Modifier.size(24.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            
                            attachment.duration?.let { duration ->
                                Text(
                                    text = formatDuration(duration),
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun formatDuration(milliseconds: Long): String {
    val seconds = milliseconds / 1000
    val minutes = seconds / 60
    val remainingSeconds = seconds % 60
    
    return if (minutes > 0) {
        String.format("%d:%02d", minutes, remainingSeconds)
    } else {
        String.format("0:%02d", remainingSeconds)
    }
}

@Composable
fun rememberMediaAttachmentsState(
    initialAttachments: List<MediaAttachment> = emptyList()
): MutableState<MediaAttachmentsState> {
    return remember {
        mutableStateOf(
            MediaAttachmentsState(
                attachments = initialAttachments
            )
        )
    }
}

// Extension functions for converting URIs to MediaAttachment
fun Uri.toMediaAttachment(type: MediaType, context: Context): MediaAttachment {
    val fileName = getFileName(context)
    val fileSize = getFileSize(context)
    
    return MediaAttachment(
        uri = this.toString(),
        type = type,
        name = fileName,
        size = fileSize
    )
}

private fun Uri.getFileName(context: Context): String? {
    return try {
        context.contentResolver.query(this, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val displayNameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (displayNameIndex != -1) {
                    cursor.getString(displayNameIndex)
                } else null
            } else null
        }
    } catch (e: Exception) {
        null
    }
}

private fun Uri.getFileSize(context: Context): Long? {
    return try {
        context.contentResolver.query(this, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)
                if (sizeIndex != -1) {
                    cursor.getLong(sizeIndex)
                } else null
            } else null
        }
    } catch (e: Exception) {
        null
    }
} 

@Composable
private fun VoiceRecorderButton(
    state: VoiceRecorderState,
    onStateChange: (VoiceRecorderState) -> Unit,
    @Suppress("UNUSED_PARAMETER") onRecordingComplete: (File) -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier
) {
    val isRecording = state.isRecording
    
    OutlinedButton(
        onClick = {
            if (isRecording) {
                // Stop recording and auto-save
                onStateChange(state.copy(isRecording = false))
                // Note: Auto-save will be handled by the state manager when recording stops
            } else {
                // Start recording
                onStateChange(state.copy(isRecording = true, recordingDuration = 0L))
            }
        },
        enabled = enabled,
        modifier = modifier.height(40.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = if (isRecording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
            containerColor = if (isRecording) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f) else Color.Transparent
        ),
        border = ButtonDefaults.outlinedButtonBorder.copy(
            width = 1.dp,
            brush = androidx.compose.ui.graphics.SolidColor(
                if (isRecording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.outline
            )
        )
    ) {
        Icon(
            imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
            contentDescription = if (isRecording) "Stop recording" else "Start recording",
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = if (isRecording) "Stop" else "Voice",
            fontSize = 12.sp
        )
    }
}

@Composable
private fun VoiceRecorderCompact(
    state: VoiceRecorderState,
    @Suppress("UNUSED_PARAMETER") onStateChange: (VoiceRecorderState) -> Unit,
    @Suppress("UNUSED_PARAMETER") onRecordingComplete: (File) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.error.copy(alpha = 0.3f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Recording indicator
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = MaterialTheme.colorScheme.error,
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Column {
                Text(
                    text = "Recording...",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = formatDuration(state.recordingDuration),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}


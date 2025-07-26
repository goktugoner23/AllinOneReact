@file:Suppress("DEPRECATION")

package com.example.allinone.ui.components

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.ui.StyledPlayerView
import kotlinx.coroutines.delay

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MediaViewerDialog(
    attachments: List<MediaAttachment>,
    initialIndex: Int = 0,
    onDismiss: () -> Unit
) {
    if (attachments.isEmpty()) {
        onDismiss()
        return
    }
    
    val pagerState = rememberPagerState(
        initialPage = initialIndex,
        pageCount = { attachments.size }
    )
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnBackPress = true,
            dismissOnClickOutside = true
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.9f))
        ) {
            // Close button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
                    .size(40.dp)
                    .background(
                        color = Color.Black.copy(alpha = 0.5f),
                        shape = CircleShape
                    )
                    .zIndex(1f)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close",
                    tint = Color.White
                )
            }
            
            // Media pager
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                val attachment = attachments[page]
                
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onTap = { onDismiss() }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    when (attachment.type) {
                        MediaType.IMAGE -> {
                            ImageViewer(
                                imageUri = attachment.uri,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        
                        MediaType.VIDEO -> {
                            VideoViewer(
                                videoUri = attachment.uri,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        
                        MediaType.AUDIO -> {
                            AudioViewer(
                                audioUri = attachment.uri,
                                fileName = attachment.name,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            }
            
            // Media info and controls
            MediaViewerControls(
                attachments = attachments,
                currentIndex = pagerState.currentPage,
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}

@Composable
private fun ImageViewer(
    imageUri: String,
    modifier: Modifier = Modifier
) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(imageUri)
            .crossfade(true)
            .build(),
        contentDescription = "Image",
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        contentScale = ContentScale.Fit
    )
}

@Suppress("DEPRECATION")
@Composable
private fun VideoViewer(
    videoUri: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var exoPlayer by remember { mutableStateOf<ExoPlayer?>(null) }
    
    // Initialize ExoPlayer
    LaunchedEffect(videoUri) {
        exoPlayer?.release()
        exoPlayer = ExoPlayer.Builder(context)
            .build()
            .also { player ->
                val mediaItem = MediaItem.fromUri(videoUri)
                player.setMediaItem(mediaItem)
                player.prepare()
            }
    }
    
    // Cleanup on dispose
    DisposableEffect(videoUri) {
        onDispose {
            exoPlayer?.release()
        }
    }
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        exoPlayer?.let { player ->
            AndroidView(
                factory = { ctx ->
                    StyledPlayerView(ctx).apply {
                        this.player = player
                        useController = true
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        } ?: run {
            // Loading placeholder
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = Color.White
                )
            }
        }
    }
}

@Composable
private fun AudioViewer(
    audioUri: String,
    fileName: String?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(false) }
    var currentPosition by remember { mutableStateOf(0L) }
    var duration by remember { mutableStateOf(0L) }
    var mediaPlayer by remember { mutableStateOf<MediaPlayer?>(null) }
    
    // Initialize MediaPlayer
    LaunchedEffect(audioUri) {
        mediaPlayer?.release()
        mediaPlayer = MediaPlayer().apply {
            try {
                // Handle both file URIs and content URIs
                if (audioUri.startsWith("file://")) {
                    // For file URIs, extract the file path
                    val filePath = Uri.parse(audioUri).path
                    if (filePath != null) {
                        setDataSource(filePath)
                    } else {
                        throw IllegalArgumentException("Invalid file path")
                    }
                } else {
                    // For content URIs, use the URI directly
                    setDataSource(context, Uri.parse(audioUri))
                }
                prepare()
                duration = this.duration.toLong()
                
                setOnCompletionListener {
                    isPlaying = false
                    currentPosition = 0L
                }
            } catch (e: Exception) {
                // Handle error - log it for debugging
                android.util.Log.e("AudioViewer", "Error setting up MediaPlayer", e)
            }
        }
    }
    
    // Update position while playing
    LaunchedEffect(isPlaying) {
        while (isPlaying) {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    currentPosition = player.currentPosition.toLong()
                }
            }
            delay(100)
        }
    }
    
    // Cleanup on dispose
    DisposableEffect(audioUri) {
        onDispose {
            mediaPlayer?.release()
        }
    }
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Audio icon
            Icon(
                imageVector = Icons.Default.AudioFile,
                contentDescription = "Audio file",
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            // File name
            fileName?.let { name ->
                Text(
                    text = name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            
            // Playback controls
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        mediaPlayer?.let { player ->
                            if (isPlaying) {
                                player.pause()
                                isPlaying = false
                            } else {
                                player.start()
                                isPlaying = true
                            }
                        }
                    },
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
                    onClick = {
                        mediaPlayer?.let { player ->
                            player.seekTo(0)
                            currentPosition = 0L
                            if (isPlaying) {
                                player.start()
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Replay,
                        contentDescription = "Restart",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Progress bar
            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                val progress = if (duration > 0) {
                    currentPosition.toFloat() / duration.toFloat()
                } else 0f
                
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
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
                        text = formatDuration(duration),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun MediaViewerControls(
    attachments: List<MediaAttachment>,
    currentIndex: Int,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Black.copy(alpha = 0.7f)
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Current media info
            val currentAttachment = attachments[currentIndex]
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = when (currentAttachment.type) {
                        MediaType.IMAGE -> Icons.Default.Image
                        MediaType.VIDEO -> Icons.Default.VideoFile
                        MediaType.AUDIO -> Icons.Default.AudioFile
                    },
                    contentDescription = null,
                    tint = Color.White
                )
                
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = currentAttachment.name ?: "Media ${currentIndex + 1}",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Text(
                        text = "${currentIndex + 1} of ${attachments.size}",
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            
            // Page indicator dots
            if (attachments.size > 1) {
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    repeat(attachments.size) { index ->
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    color = if (index == currentIndex) {
                                        Color.White
                                    } else {
                                        Color.White.copy(alpha = 0.3f)
                                    },
                                    shape = CircleShape
                                )
                                .clickable {
                                    // Navigate to specific page
                                    // Note: This would need to be implemented with a coroutine
                                    // to animate to the page
                                }
                        )
                        
                        if (index < attachments.size - 1) {
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MediaThumbnailGrid(
    attachments: List<MediaAttachment>,
    onAttachmentClick: (MediaAttachment, Int) -> Unit,
    modifier: Modifier = Modifier,
    maxItemsPerRow: Int = 3
) {
    if (attachments.isEmpty()) return
    
    Column(modifier = modifier) {
        val rows = attachments.chunked(maxItemsPerRow)
        
        rows.forEach { rowItems ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                rowItems.forEach { attachment ->
                    val index = attachments.indexOf(attachment)
                    
                    MediaThumbnail(
                        attachment = attachment,
                        onClick = { onAttachmentClick(attachment, index) },
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
private fun MediaThumbnail(
    attachment: MediaAttachment,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .aspectRatio(1f)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (attachment.type) {
                MediaType.IMAGE -> {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(attachment.uri)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Image thumbnail",
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
                            contentDescription = "Video thumbnail",
                            modifier = Modifier.size(32.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    // Duration badge
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
                                contentDescription = "Audio thumbnail",
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
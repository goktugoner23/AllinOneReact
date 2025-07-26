package com.example.allinone.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.text.Html
import android.util.Log
import android.widget.TextView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Note
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.compose.rememberAsyncImagePainter
import com.example.allinone.data.Note
import com.example.allinone.ui.components.InteractiveHtmlText
import com.example.allinone.ui.components.MediaAttachment
import com.example.allinone.ui.components.MediaType
import com.example.allinone.viewmodels.NotesViewModel
import me.saket.swipe.SwipeAction
import me.saket.swipe.SwipeableActionsBox
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun NotesScreen(
    onNavigateToEditNote: (Long?) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val notes by viewModel.allNotes.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val listState = rememberLazyListState()
    val haptic = LocalHapticFeedback.current
    
    // Lazy loading state to prevent initial sticking
    var isInitialized by remember { mutableStateOf(false) }
    
    // Defer initialization to prevent sticking
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(50) // Small delay to allow initial composition
        isInitialized = true
    }
    
    var showImageDialog by remember { mutableStateOf(false) }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var selectedImageIndex by remember { mutableStateOf(0) }
    var selectedImageList by remember { mutableStateOf<List<String>>(emptyList()) }
    
    // Search state
    var searchQuery by remember { mutableStateOf("") }
    var showSearch by remember { mutableStateOf(false) }
    
    // Filter notes based on search query
    val filteredNotes = remember(notes, searchQuery) {
        if (searchQuery.isBlank()) {
            notes.sortedByDescending { it.lastEdited }
        } else {
            notes.filter { note ->
                note.title.contains(searchQuery, ignoreCase = true) ||
                        extractTextFromHtml(note.content).contains(searchQuery, ignoreCase = true)
            }.sortedByDescending { it.lastEdited }
        }
    }
    
    // Pull to refresh state
    val pullToRefreshState = rememberPullToRefreshState()
    
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            viewModel.refreshData()
        }
    }
    
    LaunchedEffect(isLoading) {
        if (!isLoading) {
            pullToRefreshState.endRefresh()
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Search bar
            AnimatedVisibility(
                visible = showSearch,
                enter = slideInHorizontally() + fadeIn(),
                exit = slideOutHorizontally() + fadeOut()
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search notes...") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.Search,
                            contentDescription = "Search"
                        )
                    },
                    trailingIcon = {
                        IconButton(
                            onClick = {
                                showSearch = false
                                searchQuery = ""
                            }
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Close search"
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    singleLine = true
                )
            }
            
            // Main content
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                if (!isInitialized || isLoading) {
                    // Show loading indicator during initialization or data loading
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                } else if (filteredNotes.isEmpty()) {
                    // Empty state
                    EmptyNotesState(
                        onCreateNote = { onNavigateToEditNote(null) },
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(
                            filteredNotes,
                            key = { it.id }
                        ) { note ->
                            NoteCard(
                                note = note,
                                onClick = { onNavigateToEditNote(note.id) },
                                onDelete = {
                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    viewModel.deleteNote(note)
                                },
                                onImageClick = { imageUri, imageList, index ->
                                    selectedImageUri = imageUri
                                    selectedImageList = imageList
                                    selectedImageIndex = index
                                    showImageDialog = true
                                },
                                modifier = Modifier
                                    .animateItem(
                                        fadeInSpec = spring(
                                            dampingRatio = Spring.DampingRatioMediumBouncy,
                                            stiffness = Spring.StiffnessLow
                                        ),
                                        fadeOutSpec = spring(
                                            dampingRatio = Spring.DampingRatioMediumBouncy,
                                            stiffness = Spring.StiffnessLow
                                        )
                                    )
                            )
                        }
                    }
                }
                
                // Pull to refresh indicator
                PullToRefreshContainer(
                    state = pullToRefreshState,
                    modifier = Modifier.align(Alignment.TopCenter)
                )
            }
        }
        
        // Floating Action Button
        FloatingActionButton(
            onClick = { onNavigateToEditNote(null) },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            containerColor = MaterialTheme.colorScheme.primary
        ) {
            Icon(
                Icons.Default.Add,
                contentDescription = "Add Note",
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
        
        // Search FAB
        FloatingActionButton(
            onClick = { showSearch = !showSearch },
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp),
            containerColor = MaterialTheme.colorScheme.secondary
        ) {
            Icon(
                if (showSearch) Icons.Default.Close else Icons.Default.Search,
                contentDescription = if (showSearch) "Close Search" else "Search Notes",
                tint = MaterialTheme.colorScheme.onSecondary
            )
        }
    }
    
    // Fullscreen image dialog
    if (showImageDialog && selectedImageUri != null) {
        FullscreenImageDialog(
            imageList = selectedImageList,
            initialIndex = selectedImageIndex,
            onDismiss = { showImageDialog = false }
        )
    }
}

@Composable
fun NoteCard(
    note: Note,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    onImageClick: (Uri, List<String>, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val haptic = LocalHapticFeedback.current
    
    // Convert note attachments to MediaAttachment objects
    val mediaAttachments = remember(note.imageUris, note.videoUris, note.voiceNoteUris) {
        val attachments = mutableListOf<MediaAttachment>()
        
        // Add images
        note.imageUris?.split(",")?.filter { it.isNotEmpty() }?.forEach { uri ->
            attachments.add(
                MediaAttachment(
                    uri = uri,
                    type = MediaType.IMAGE,
                    name = "Image"
                )
            )
        }
        
        // Add videos
        note.videoUris?.split(",")?.filter { it.isNotEmpty() }?.forEach { uri ->
            attachments.add(
                MediaAttachment(
                    uri = uri,
                    type = MediaType.VIDEO,
                    name = "Video"
                )
            )
        }
        
        // Add voice notes
        note.voiceNoteUris?.split(",")?.filter { it.isNotEmpty() }?.forEach { uri ->
            attachments.add(
                MediaAttachment(
                    uri = uri,
                    type = MediaType.AUDIO,
                    name = "Voice Note"
                )
            )
        }
        
        attachments
    }
    
    // Parse images and voice notes for backward compatibility
    val images = remember(note.imageUris) {
        note.imageUris?.split(",")?.filter { it.isNotEmpty() } ?: emptyList()
    }
    val hasVoiceNotes = mediaAttachments.any { it.type == MediaType.AUDIO }
    val hasVideos = mediaAttachments.any { it.type == MediaType.VIDEO }
    
    // Create swipe actions
    val deleteAction = SwipeAction(
        icon = {
            Icon(
                Icons.Default.Delete,
                contentDescription = "Delete",
                tint = MaterialTheme.colorScheme.onError
            )
        },
        background = MaterialTheme.colorScheme.error,
        onSwipe = {
            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
            onDelete()
        }
    )
    
    SwipeableActionsBox(
        swipeThreshold = 100.dp,
        endActions = listOf(deleteAction),
        modifier = modifier
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .animateContentSize(),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                // Header with title and indicators
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        text = note.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    
                    // Indicators
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        if (images.isNotEmpty()) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.primaryContainer,
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    Icons.Default.Image,
                                    contentDescription = "Has images",
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier
                                        .size(12.dp)
                                        .padding(4.dp)
                                )
                            }
                        }
                        
                        if (hasVideos) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    Icons.Default.VideoFile,
                                    contentDescription = "Has videos",
                                    tint = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier
                                        .size(12.dp)
                                        .padding(4.dp)
                                )
                            }
                        }
                        
                        if (hasVoiceNotes) {
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.tertiaryContainer,
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    Icons.Default.Mic,
                                    contentDescription = "Has voice notes",
                                    tint = MaterialTheme.colorScheme.onTertiaryContainer,
                                    modifier = Modifier
                                        .size(12.dp)
                                        .padding(4.dp)
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Content preview
                InteractiveHtmlText(
                    html = note.content,
                    maxLines = 3,
                    textColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                    modifier = Modifier.fillMaxWidth()
                )
                
                // Media attachments preview
                if (mediaAttachments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        mediaAttachments.take(3).forEach { attachment ->
                            when (attachment.type) {
                                MediaType.IMAGE -> {
                                    val index = images.indexOf(attachment.uri)
                                    AsyncImage(
                                        model = attachment.uri,
                                        contentDescription = "Note image",
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .clickable {
                                                onImageClick(
                                                    Uri.parse(attachment.uri),
                                                    images,
                                                    index
                                                )
                                            },
                                        contentScale = ContentScale.Crop
                                    )
                                }
                                MediaType.VIDEO -> {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surfaceVariant)
                                            .clickable {
                                                // TODO: Handle video click
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.PlayCircle,
                                            contentDescription = "Video",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                                MediaType.AUDIO -> {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f))
                                            .clickable {
                                                // TODO: Handle audio click
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.Mic,
                                            contentDescription = "Voice Note",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                            }
                        }
                        
                        if (mediaAttachments.size > 3) {
                            Surface(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable {
                                        // Show all attachments in viewer
                                        if (images.isNotEmpty()) {
                                            onImageClick(
                                                Uri.parse(images[0]), // Show first image as starting point
                                                images,
                                                0
                                            )
                                        }
                                    },
                                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            Icons.Default.Attachment,
                                            contentDescription = "More attachments",
                                            modifier = Modifier.size(16.dp),
                                            tint = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "+${mediaAttachments.size - 3}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Date
                Text(
                    text = formatDate(note.lastEdited),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
    }
}

// HtmlText function removed - now using InteractiveHtmlText for better functionality

@Composable
fun EmptyNotesState(
    onCreateNote: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.AutoMirrored.Filled.Note,
            contentDescription = "No notes",
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.outline
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "No notes yet",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Create your first note to get started",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = onCreateNote,
            modifier = Modifier.fillMaxWidth(0.6f)
        ) {
            Icon(
                Icons.Default.Add,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Create Note")
        }
    }
}

@Composable
fun FullscreenImageDialog(
    imageList: List<String>,
    initialIndex: Int,
    onDismiss: () -> Unit
) {
    var currentIndex by remember { mutableStateOf(initialIndex) }
    
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
                .background(Color.Black)
        ) {
            AsyncImage(
                model = imageList[currentIndex],
                contentDescription = "Full screen image",
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(imageList.size) {
                        detectHorizontalDragGestures(
                            onDragEnd = {
                                // Handle drag end if needed
                            }
                        ) { _, dragAmount ->
                            val threshold = 100f
                            when {
                                dragAmount > threshold && currentIndex > 0 -> {
                                    // Swipe right - go to previous image
                                    currentIndex--
                                }
                                dragAmount < -threshold && currentIndex < imageList.size - 1 -> {
                                    // Swipe left - go to next image
                                    currentIndex++
                                }
                            }
                        }
                    }
                    .clickable { 
                        // Only dismiss on tap, not during swipe
                        onDismiss() 
                    },
                contentScale = ContentScale.Fit
            )
            
            // Navigation controls for multiple images
            if (imageList.size > 1) {
                // Image counter and swipe indicator
                Card(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.Black.copy(alpha = 0.7f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "${currentIndex + 1} / ${imageList.size}",
                            color = Color.White,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        
                        Spacer(modifier = Modifier.height(4.dp))
                        
                        Text(
                            text = "Swipe to navigate",
                            color = Color.White.copy(alpha = 0.7f),
                            style = MaterialTheme.typography.bodySmall
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Dot indicators (only show if there are 5 or fewer images)
                        if (imageList.size <= 5) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                imageList.forEachIndexed { index, _ ->
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(
                                                color = if (index == currentIndex) Color.White else Color.White.copy(alpha = 0.5f),
                                                shape = CircleShape
                                            )
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        
                        // Navigation buttons
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            IconButton(
                                onClick = {
                                    if (currentIndex > 0) {
                                        currentIndex--
                                    }
                                },
                                enabled = currentIndex > 0
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = "Previous",
                                    tint = if (currentIndex > 0) Color.White else Color.White.copy(alpha = 0.5f)
                                )
                            }
                            
                            IconButton(
                                onClick = {
                                    if (currentIndex < imageList.size - 1) {
                                        currentIndex++
                                    }
                                },
                                enabled = currentIndex < imageList.size - 1
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = "Next",
                                    tint = if (currentIndex < imageList.size - 1) Color.White else Color.White.copy(alpha = 0.5f)
                                )
                            }
                        }
                    }
                }
            }
            
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
                    tint = Color.White
                )
            }
        }
    }
}

// Helper functions
private fun extractTextFromHtml(html: String): String {
    return Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT).toString()
}

private fun formatDate(date: Date): String {
    val now = Date()
    val diff = now.time - date.time
    
    return when {
        diff < 60 * 1000 -> "Just now"
        diff < 60 * 60 * 1000 -> "${diff / (60 * 1000)} min ago"
        diff < 24 * 60 * 60 * 1000 -> "${diff / (60 * 60 * 1000)} hours ago"
        diff < 7 * 24 * 60 * 60 * 1000 -> "${diff / (24 * 60 * 60 * 1000)} days ago"
        else -> SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
    }
} 
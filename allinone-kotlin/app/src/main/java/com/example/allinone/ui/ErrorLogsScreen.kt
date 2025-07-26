package com.example.allinone.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import com.example.allinone.utils.LogcatHelper
import com.example.allinone.viewmodels.LogErrorViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErrorLogsScreen() {
    // Use the same ViewModel instance as MainActivity
    val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
    val viewModel: LogErrorViewModel = remember {
        ViewModelProvider(viewModelStoreOwner)[LogErrorViewModel::class.java]
    }
    
    val context = LocalContext.current
    val pullToRefreshState = rememberPullToRefreshState()
    
    val logEntries by viewModel.logEntries.observeAsState(emptyList())
    val errorMessage by viewModel.errorMessage.observeAsState()
    
    var showFilterDialog by remember { mutableStateOf(false) }
    var selectedLogLevel by remember { mutableStateOf("ALL") }
    
    // Handle pull to refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            viewModel.refreshLogs()
            pullToRefreshState.endRefresh()
        }
    }
    
    // Show error messages as snackbar
    errorMessage?.let { message ->
        LaunchedEffect(message) {
            // Handle error message display
        }
    }
    
    // Filter logs based on selected level
    val filteredLogs = remember(logEntries, selectedLogLevel) {
        if (selectedLogLevel == "ALL") {
            logEntries
        } else {
            logEntries.filter { it.level == selectedLogLevel }
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
            // Top bar
            TopAppBar(
                title = { Text("Error Logs") },
                actions = {
                    // Filter button
                    IconButton(onClick = { showFilterDialog = true }) {
                        Icon(Icons.Default.FilterList, contentDescription = "Filter logs")
                    }
                    
                    // Share button
                    IconButton(
                        onClick = {
                            shareErrorLogs(context, logEntries)
                        }
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Share logs")
                    }
                    
                    // Clear button
                    IconButton(
                        onClick = { viewModel.clearLogs() }
                    ) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear logs")
                    }
                    
                    // Refresh button
                    IconButton(
                        onClick = { viewModel.refreshLogs() }
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh logs")
                    }
                }
            )
            
            // Stats card
            LogStatsCard(
                totalLogs = logEntries.size,
                filteredLogs = filteredLogs.size,
                selectedFilter = selectedLogLevel,
                modifier = Modifier.padding(16.dp)
            )
            
            // Content
            if (filteredLogs.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    EmptyLogsState(
                        hasFilter = selectedLogLevel != "ALL",
                        onClearFilter = { selectedLogLevel = "ALL" }
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredLogs) { logEntry ->
                        LogEntryCard(
                            logEntry = logEntry,
                            onClick = { /* TODO: Show detailed log view */ }
                        )
                    }
                }
            }
        }
        
        // Pull to refresh indicator
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
    
    // Filter dialog
    if (showFilterDialog) {
        LogFilterDialog(
            selectedLevel = selectedLogLevel,
            onLevelSelected = { selectedLogLevel = it },
            onDismiss = { showFilterDialog = false }
        )
    }
}

@Composable
fun LogStatsCard(
    totalLogs: Int,
    filteredLogs: Int,
    selectedFilter: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Error Logs",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (selectedFilter == "ALL") "All levels" else "Level: $selectedFilter",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = if (selectedFilter == "ALL") totalLogs.toString() else "$filteredLogs/$totalLogs",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Entries",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun LogEntryCard(
    logEntry: LogcatHelper.LogEntry,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Log level badge
                Surface(
                    color = getLogLevelColor(logEntry.level),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = logEntry.level,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                // Timestamp
                Text(
                    text = logEntry.formattedTimestamp,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Tag
            Text(
                text = logEntry.tag,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Message
            Text(
                text = logEntry.message,
                style = MaterialTheme.typography.bodyMedium,
                fontFamily = FontFamily.Monospace,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun EmptyLogsState(
    hasFilter: Boolean,
    onClearFilter: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                if (hasFilter) Icons.Default.FilterList else Icons.Default.BugReport,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = if (hasFilter) "No matching logs" else "No error logs",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = if (hasFilter) {
                    "Try adjusting your filter or refresh logs"
                } else {
                    "No error logs have been captured yet"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            if (hasFilter) {
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(onClick = onClearFilter) {
                    Icon(Icons.Default.Clear, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Clear Filter")
                }
            }
        }
    }
}

@Composable
fun LogFilterDialog(
    selectedLevel: String,
    onLevelSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val logLevels = listOf("ALL", "ERROR", "WARN", "INFO", "DEBUG", "VERBOSE")
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter Log Level") },
        text = {
            Column {
                logLevels.forEach { level ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedLevel == level,
                            onClick = { onLevelSelected(level) }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = level,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Done")
            }
        }
    )
}

fun getLogLevelColor(level: String): Color {
    return when (level.uppercase()) {
        "ERROR" -> Color(0xFFF44336)
        "WARN" -> Color(0xFFFF9800)
        "INFO" -> Color(0xFF2196F3)
        "DEBUG" -> Color(0xFF4CAF50)
        "VERBOSE" -> Color(0xFF9C27B0)
        else -> Color(0xFF757575)
    }
}

fun shareErrorLogs(context: Context, logEntries: List<LogcatHelper.LogEntry>) {
    val formattedLogs = logEntries.joinToString("\n") { it.toString() }
    
    // Copy to clipboard
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("Error Logs", formattedLogs)
    clipboard.setPrimaryClip(clip)
    
    // Share intent
    val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, "AllinOne App Error Logs")
        putExtra(Intent.EXTRA_TEXT, formattedLogs)
    }
    
    context.startActivity(Intent.createChooser(shareIntent, "Share Error Logs"))
}

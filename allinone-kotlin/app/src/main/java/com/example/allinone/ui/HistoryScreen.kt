package com.example.allinone.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import com.example.allinone.data.HistoryItem
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.viewmodels.HistoryViewModel
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen() {
    // Use the same ViewModel instance as MainActivity
    val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
    val viewModel: HistoryViewModel = remember {
        ViewModelProvider(viewModelStoreOwner)[HistoryViewModel::class.java]
    }
    
    val historyItems by viewModel.historyItems.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilters by remember { mutableStateOf(setOf<HistoryItem.ItemType>()) }
    var showSearchBar by remember { mutableStateOf(false) }
    
    val pullToRefreshState = rememberPullToRefreshState()
    
    // Handle pull to refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            viewModel.refreshData()
            pullToRefreshState.endRefresh()
        }
    }
    
    // Filter items based on search and filters
    val filteredItems = remember(historyItems, searchQuery, selectedFilters) {
        historyItems.filter { item ->
            // Apply search filter
            val matchesSearch = if (searchQuery.isBlank()) {
                true
            } else {
                item.title.contains(searchQuery, ignoreCase = true) ||
                item.description.contains(searchQuery, ignoreCase = true) ||
                item.amount?.toString()?.contains(searchQuery) == true
            }
            
            // Apply type filters
            val matchesFilter = if (selectedFilters.isEmpty()) {
                true
            } else {
                selectedFilters.contains(item.itemType)
            }
            
            matchesSearch && matchesFilter
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
                title = { Text("History") },
                actions = {
                    IconButton(
                        onClick = { showSearchBar = !showSearchBar }
                    ) {
                        Icon(
                            if (showSearchBar) Icons.Default.Close else Icons.Default.Search,
                            contentDescription = if (showSearchBar) "Close search" else "Search"
                        )
                    }
                }
            )
            
            // Search bar
            AnimatedVisibility(visible = showSearchBar) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    placeholder = { Text("Search history...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Search")
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(
                                onClick = { searchQuery = "" }
                            ) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true
                )
            }
            
            // Filter chips
            FilterChipsRow(
                selectedFilters = selectedFilters,
                onFiltersChanged = { selectedFilters = it },
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            
            // History list
            if (filteredItems.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    EmptyHistoryState(
                        hasFilters = selectedFilters.isNotEmpty() || searchQuery.isNotEmpty(),
                        onClearFilters = {
                            selectedFilters = emptySet()
                            searchQuery = ""
                        }
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredItems) { item ->
                        HistoryItemCard(
                            item = item,
                            onClick = { /* TODO: Navigate to item details */ },
                            onDelete = {
                            viewModel.deleteItem(item)
                            // Force refresh to ensure all related data is updated
                            viewModel.refreshData()
                        }
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
}

@Composable
fun FilterChipsRow(
    selectedFilters: Set<HistoryItem.ItemType>,
    onFiltersChanged: (Set<HistoryItem.ItemType>) -> Unit,
    modifier: Modifier = Modifier
) {
    val filterOptions = listOf(
        HistoryItem.ItemType.TRANSACTION_INCOME to "Income",
        HistoryItem.ItemType.TRANSACTION_EXPENSE to "Expense",
        HistoryItem.ItemType.INVESTMENT to "Investment",
        HistoryItem.ItemType.NOTE to "Notes",
        HistoryItem.ItemType.REGISTRATION to "Registrations"
    )
    
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        // All filter
        item {
            FilterChip(
                onClick = {
                    onFiltersChanged(emptySet())
                },
                label = { Text("All") },
                selected = selectedFilters.isEmpty()
            )
        }
        
        // Individual filters
        items(filterOptions) { (type, label) ->
            FilterChip(
                onClick = {
                    val newFilters = if (selectedFilters.contains(type)) {
                        selectedFilters - type
                    } else {
                        selectedFilters + type
                    }
                    onFiltersChanged(newFilters)
                },
                label = { Text(label) },
                selected = selectedFilters.contains(type)
            )
        }
    }
}

@Composable
fun HistoryItemCard(
    item: HistoryItem,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
    val currencyFormatter = remember { NumberFormat.getCurrencyInstance() }
    
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Type icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(getItemTypeColor(item.itemType).copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    getItemTypeIcon(item.itemType),
                    contentDescription = item.type,
                    tint = getItemTypeColor(item.itemType),
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Content
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = item.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = dateFormatter.format(item.date),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Amount and actions
            Column(
                horizontalAlignment = Alignment.End
            ) {
                item.amount?.let { amount ->
                    Text(
                        text = currencyFormatter.format(amount),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (item.itemType == HistoryItem.ItemType.TRANSACTION_INCOME) {
                            Color(0xFF4CAF50)
                        } else if (item.itemType == HistoryItem.ItemType.TRANSACTION_EXPENSE) {
                            Color(0xFFF44336)
                        } else {
                            MaterialTheme.colorScheme.primary
                        }
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                IconButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Item") },
            text = { Text("Are you sure you want to delete \"${item.title}\"? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    },
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun EmptyHistoryState(
    hasFilters: Boolean,
    onClearFilters: () -> Unit,
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
                if (hasFilters) Icons.Default.FilterList else Icons.Default.History,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (hasFilters) "No matching items" else "No history yet",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (hasFilters) {
                    "Try adjusting your search or filters"
                } else {
                    "Your activity history will appear here"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            if (hasFilters) {
                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onClearFilters
                ) {
                    Icon(Icons.Default.Clear, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Clear Filters")
                }
            }
        }
    }
}

fun getItemTypeIcon(itemType: HistoryItem.ItemType): ImageVector {
    return when (itemType) {
        HistoryItem.ItemType.TRANSACTION_INCOME -> Icons.AutoMirrored.Filled.TrendingUp
        HistoryItem.ItemType.TRANSACTION_EXPENSE -> Icons.AutoMirrored.Filled.TrendingDown
        HistoryItem.ItemType.TRANSACTION -> Icons.Default.AccountBalance
        HistoryItem.ItemType.INVESTMENT -> Icons.AutoMirrored.Filled.ShowChart
        HistoryItem.ItemType.NOTE -> Icons.AutoMirrored.Filled.Note
        HistoryItem.ItemType.REGISTRATION -> Icons.Default.School
    }
}

fun getItemTypeColor(itemType: HistoryItem.ItemType): Color {
    return when (itemType) {
        HistoryItem.ItemType.TRANSACTION_INCOME -> Color(0xFF4CAF50)
        HistoryItem.ItemType.TRANSACTION_EXPENSE -> Color(0xFFF44336)
        HistoryItem.ItemType.TRANSACTION -> Color(0xFF2196F3)
        HistoryItem.ItemType.INVESTMENT -> Color(0xFF9C27B0)
        HistoryItem.ItemType.NOTE -> Color(0xFFFF9800)
        HistoryItem.ItemType.REGISTRATION -> Color(0xFF607D8B)
    }
}

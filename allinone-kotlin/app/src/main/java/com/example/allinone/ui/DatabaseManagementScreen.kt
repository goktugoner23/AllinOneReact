package com.example.allinone.ui

import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

data class DatabaseRecord(
    val id: String,
    val title: String,
    val subtitle: String,
    val details: Map<String, Any>,
    val timestamp: Date?,
    val collection: String
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun DatabaseManagementScreen() {
    val firestore = FirebaseFirestore.getInstance()
    val pullToRefreshState = rememberPullToRefreshState()
    
    // Available collections
    val collections = listOf(
        "transactions", "investments", "notes", "students", "events", 
        "wtLessons", "registrations", "counters", "programs", "workouts"
    )
    
    var selectedCollection by remember { mutableStateOf("transactions") }
    var records by remember { mutableStateOf<List<DatabaseRecord>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    // Load data function
    suspend fun loadCollectionData(collectionName: String) {
        isLoading = true
        errorMessage = null
        try {
            val documents = withContext(Dispatchers.IO) {
                firestore.collection(collectionName).get().await().documents
            }
            
            records = documents.map { doc ->
                createDatabaseRecord(doc, collectionName)
            }
        } catch (e: Exception) {
            errorMessage = "Error loading data: ${e.message}"
        } finally {
            isLoading = false
        }
    }
    
    // Handle pull to refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            loadCollectionData(selectedCollection)
            pullToRefreshState.endRefresh()
        }
    }
    
    // Load initial data
    LaunchedEffect(selectedCollection) {
        loadCollectionData(selectedCollection)
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
                title = { Text("Database Management") },
                actions = {
                    IconButton(
                        onClick = {
                            CoroutineScope(Dispatchers.Main).launch {
                                loadCollectionData(selectedCollection)
                            }
                        }
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
            
            // Collection selector
            CollectionSelector(
                collections = collections,
                selectedCollection = selectedCollection,
                onCollectionSelected = { selectedCollection = it },
                modifier = Modifier.padding(16.dp)
            )
            
            // Stats card
            StatsCard(
                collection = selectedCollection,
                itemCount = records.size,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Content
            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator()
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Loading $selectedCollection...")
                        }
                    }
                }
                
                errorMessage != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        ErrorCard(
                            message = errorMessage!!,
                            onRetry = {
                                CoroutineScope(Dispatchers.Main).launch {
                                    loadCollectionData(selectedCollection)
                                }
                            }
                        )
                    }
                }
                
                records.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        EmptyStateCard(collection = selectedCollection)
                    }
                }
                
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(records) { record ->
                            DatabaseRecordCard(
                                record = record,
                                onClick = { /* TODO: Show record details */ }
                            )
                        }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionSelector(
    collections: List<String>,
    selectedCollection: String,
    onCollectionSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Collection",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Collection dropdown
            var expanded by remember { mutableStateOf(false) }
            
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedCollection.replaceFirstChar { it.uppercase() },
                    onValueChange = { },
                    readOnly = true,
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )
                
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    collections.forEach { collection ->
                        DropdownMenuItem(
                            text = { Text(collection.replaceFirstChar { it.uppercase() }) },
                            onClick = {
                                onCollectionSelected(collection)
                                expanded = false
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatsCard(
    collection: String,
    itemCount: Int,
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
                    text = collection.replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Collection",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = itemCount.toString(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Items",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun DatabaseRecordCard(
    record: DatabaseRecord,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }
    
    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
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
                    text = record.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                Surface(
                    color = getCollectionColor(record.collection),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = record.collection,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }
            
            if (record.subtitle.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = record.subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            record.timestamp?.let { timestamp ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = dateFormatter.format(timestamp),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun EmptyStateCard(
    collection: String,
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
                Icons.Default.Storage,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "No Data Found",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "The $collection collection is empty",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun ErrorCard(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Default.Error,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.error
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Error Loading Data",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(onClick = onRetry) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Retry")
            }
        }
    }
}

fun createDatabaseRecord(document: DocumentSnapshot, collectionName: String): DatabaseRecord {
    val data = document.data ?: emptyMap()
    val id = document.id

    return when (collectionName) {
        "transactions" -> {
            val amount = data["amount"] as? Double ?: 0.0
            val description = data["description"] as? String ?: ""
            val type = data["type"] as? String ?: "unknown"
            DatabaseRecord(
                id = id,
                title = "Transaction: $type",
                subtitle = "$description - $${String.format("%.2f", amount)}",
                details = data,
                timestamp = (data["date"] as? Timestamp)?.toDate(),
                collection = collectionName
            )
        }
        "investments" -> {
            val symbol = data["symbol"] as? String ?: ""
            val quantity = data["quantity"] as? Double ?: 0.0
            DatabaseRecord(
                id = id,
                title = "Investment: $symbol",
                subtitle = "Quantity: $quantity",
                details = data,
                timestamp = (data["purchaseDate"] as? Timestamp)?.toDate(),
                collection = collectionName
            )
        }
        "notes" -> {
            val title = data["title"] as? String ?: "Untitled Note"
            val content = data["content"] as? String ?: ""
            DatabaseRecord(
                id = id,
                title = title,
                subtitle = content.take(100) + if (content.length > 100) "..." else "",
                details = data,
                timestamp = (data["createdAt"] as? Timestamp)?.toDate(),
                collection = collectionName
            )
        }
        "students" -> {
            val name = data["name"] as? String ?: "Unknown Student"
            val level = data["level"] as? String ?: ""
            DatabaseRecord(
                id = id,
                title = name,
                subtitle = "Level: $level",
                details = data,
                timestamp = (data["registrationDate"] as? Timestamp)?.toDate(),
                collection = collectionName
            )
        }
        else -> {
            // Generic record for other collections
            val firstKey = data.keys.firstOrNull() ?: "id"
            val firstValue = data[firstKey]?.toString() ?: id
            DatabaseRecord(
                id = id,
                title = "$collectionName: $firstValue",
                subtitle = "Document ID: $id",
                details = data,
                timestamp = (data["createdAt"] as? Timestamp)?.toDate()
                    ?: (data["date"] as? Timestamp)?.toDate(),
                collection = collectionName
            )
        }
    }
}

fun getCollectionColor(collection: String): Color {
    return when (collection) {
        "transactions" -> Color(0xFF4CAF50)
        "investments" -> Color(0xFF2196F3)
        "notes" -> Color(0xFFFF9800)
        "students" -> Color(0xFF9C27B0)
        "events" -> Color(0xFFF44336)
        "wtLessons" -> Color(0xFF607D8B)
        "registrations" -> Color(0xFF795548)
        "programs" -> Color(0xFF3F51B5)
        "workouts" -> Color(0xFFE91E63)
        "counters" -> Color(0xFF009688)
        else -> Color(0xFF757575)
    }
}

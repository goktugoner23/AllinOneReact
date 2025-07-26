package com.example.allinone.ui

import androidx.compose.animation.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.allinone.data.Task
import com.example.allinone.data.TaskGroup
import com.example.allinone.firebase.DataChangeNotifier
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.viewmodels.TasksViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun TasksScreen(
    viewModel: TasksViewModel = hiltViewModel()
) {
    val allTasks by viewModel.allTasks.observeAsState(emptyList())
    val allTaskGroups by viewModel.allTaskGroups.observeAsState(emptyList())
    val groupedTasks by viewModel.groupedTasks.observeAsState(emptyMap())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val errorMessage by viewModel.errorMessage.observeAsState()
    
    var isGroupedView by remember { mutableStateOf(false) }
    var showAddTaskDialog by remember { mutableStateOf(false) }
    var showAddGroupDialog by remember { mutableStateOf(false) }
    var selectedTask by remember { mutableStateOf<Task?>(null) }
    var selectedGroup by remember { mutableStateOf<TaskGroup?>(null) }
    var showEditTaskDialog by remember { mutableStateOf(false) }
    var showEditGroupDialog by remember { mutableStateOf(false) }
    var showDeleteTaskDialog by remember { mutableStateOf(false) }
    var showDeleteGroupDialog by remember { mutableStateOf(false) }
    
    val pullToRefreshState = rememberPullToRefreshState()
    
    // Handle pull to refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            viewModel.refreshData()
            pullToRefreshState.endRefresh()
        }
    }
    
    // Show error messages
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            // In a real app, you might want to show a Snackbar here
            viewModel.clearErrorMessage()
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
            // Top bar with view toggle and add buttons
            TopAppBar(
                title = { Text("Tasks") },
                actions = {
                    // View toggle button
                    IconButton(
                        onClick = { isGroupedView = !isGroupedView }
                    ) {
                        Icon(
                            if (isGroupedView) Icons.AutoMirrored.Filled.ViewList else Icons.Default.ViewModule,
                            contentDescription = if (isGroupedView) "List View" else "Grouped View"
                        )
                    }
                    
                    // Add group button (only show in grouped view)
                    if (isGroupedView) {
                        IconButton(
                            onClick = { showAddGroupDialog = true }
                        ) {
                            Icon(Icons.Default.CreateNewFolder, contentDescription = "Add Group")
                        }
                    }
                }
            )
            
            // Main content
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (allTasks.isEmpty()) {
                    EmptyTasksState(
                        onCreateTask = { showAddTaskDialog = true },
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else {
                    if (isGroupedView) {
                        GroupedTasksList(
                            groupedTasks = groupedTasks,
                            onTaskClick = { task ->
                                viewModel.toggleTaskCompleted(task)
                            },
                            onTaskLongClick = { task ->
                                selectedTask = task
                                showEditTaskDialog = true
                            },
                            onGroupLongClick = { group ->
                                selectedGroup = group
                                showEditGroupDialog = true
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        SimpleTasksList(
                            tasks = allTasks,
                            onTaskClick = { task ->
                                viewModel.toggleTaskCompleted(task)
                            },
                            onTaskLongClick = { task ->
                                selectedTask = task
                                showEditTaskDialog = true
                            },
                            modifier = Modifier.fillMaxSize()
                        )
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
            onClick = { showAddTaskDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            containerColor = MaterialTheme.colorScheme.primary
        ) {
            Icon(
                Icons.Default.Add,
                contentDescription = "Add Task",
                tint = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
    
    // Dialogs
    if (showAddTaskDialog) {
        AddTaskDialog(
            taskGroups = allTaskGroups,
            onDismiss = { showAddTaskDialog = false },
            onConfirm = { name, description, dueDate, groupId ->
                viewModel.addTask(name, description, dueDate, groupId)
                showAddTaskDialog = false
            }
        )
    }
    
    if (showAddGroupDialog) {
        AddTaskGroupDialog(
            onDismiss = { showAddGroupDialog = false },
            onConfirm = { title, description, color ->
                viewModel.addTaskGroup(title, description, color)
                showAddGroupDialog = false
            }
        )
    }
    
    selectedTask?.let { task ->
        if (showEditTaskDialog) {
            EditTaskDialog(
                task = task,
                taskGroups = allTaskGroups,
                onDismiss = { 
                    showEditTaskDialog = false
                    selectedTask = null
                },
                onConfirm = { name, description, dueDate, groupId ->
                    viewModel.editTask(task, name, description, dueDate, groupId)
                    showEditTaskDialog = false
                    selectedTask = null
                },
                onDelete = {
                    showEditTaskDialog = false
                    showDeleteTaskDialog = true
                }
            )
        }
        
        if (showDeleteTaskDialog) {
            DeleteTaskDialog(
                task = task,
                onDismiss = {
                    showDeleteTaskDialog = false
                    selectedTask = null
                },
                onConfirm = {
                    viewModel.deleteTask(task)
                    showDeleteTaskDialog = false
                    selectedTask = null
                }
            )
        }
    }
    
    selectedGroup?.let { group ->
        if (showEditGroupDialog) {
            EditTaskGroupDialog(
                taskGroup = group,
                onDismiss = {
                    showEditGroupDialog = false
                    selectedGroup = null
                },
                onConfirm = { title, description, color ->
                    viewModel.editTaskGroup(group, title, description, color)
                    showEditGroupDialog = false
                    selectedGroup = null
                },
                onDelete = {
                    showEditGroupDialog = false
                    showDeleteGroupDialog = true
                }
            )
        }
        
        if (showDeleteGroupDialog) {
            DeleteTaskGroupDialog(
                taskGroup = group,
                onDismiss = {
                    showDeleteGroupDialog = false
                    selectedGroup = null
                },
                onConfirm = {
                    viewModel.deleteTaskGroup(group)
                    showDeleteGroupDialog = false
                    selectedGroup = null
                }
            )
        }
    }
}

@Composable
fun EmptyTasksState(
    onCreateTask: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Default.Task,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No tasks yet",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Create your first task to get started",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onCreateTask
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Create Task")
        }
    }
}

@Composable
fun SimpleTasksList(
    tasks: List<Task>,
    onTaskClick: (Task) -> Unit,
    onTaskLongClick: (Task) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(tasks.sortedBy { it.dueDate ?: Date(Long.MAX_VALUE) }) { task ->
            TaskCard(
                task = task,
                onClick = { onTaskClick(task) },
                onLongClick = { onTaskLongClick(task) }
            )
        }
    }
}

@Composable
fun GroupedTasksList(
    groupedTasks: Map<TaskGroup?, List<Task>>,
    onTaskClick: (Task) -> Unit,
    onTaskLongClick: (Task) -> Unit,
    onGroupLongClick: (TaskGroup) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        groupedTasks.forEach { (group, tasks) ->
            if (group != null) {
                // Group header
                item(key = "group_${group.id}") {
                    GroupHeader(
                        group = group,
                        taskCount = tasks.size,
                        completedCount = tasks.count { it.completed },
                        onLongClick = { onGroupLongClick(group) }
                    )
                }

                // Tasks in group
                items(tasks.sortedBy { it.dueDate ?: Date(Long.MAX_VALUE) }, key = { "task_${it.id}" }) { task ->
                    TaskCard(
                        task = task,
                        onClick = { onTaskClick(task) },
                        onLongClick = { onTaskLongClick(task) },
                        modifier = Modifier.padding(start = 16.dp)
                    )
                }
            } else {
                // Ungrouped tasks
                if (tasks.isNotEmpty()) {
                    item(key = "ungrouped_header") {
                        Text(
                            text = "Ungrouped Tasks",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }

                    items(tasks.sortedBy { it.dueDate ?: Date(Long.MAX_VALUE) }, key = { "task_${it.id}" }) { task ->
                        TaskCard(
                            task = task,
                            onClick = { onTaskClick(task) },
                            onLongClick = { onTaskLongClick(task) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCard(
    task: Task,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isOverdue = task.dueDate?.let { it.before(Date()) } == true && !task.completed
    val dateFormatter = remember { SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault()) }

    ElevatedCard(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(
            containerColor = when {
                isOverdue -> MaterialTheme.colorScheme.errorContainer
                task.completed -> MaterialTheme.colorScheme.surfaceVariant
                else -> MaterialTheme.colorScheme.surface
            }
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Completion checkbox
            Checkbox(
                checked = task.completed,
                onCheckedChange = { onClick() },
                colors = CheckboxDefaults.colors(
                    checkedColor = MaterialTheme.colorScheme.primary
                )
            )

            Spacer(modifier = Modifier.width(12.dp))

            // Task content
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = task.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (task.completed) TextDecoration.LineThrough else null,
                    color = if (task.completed)
                        MaterialTheme.colorScheme.onSurfaceVariant
                    else
                        MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                task.description?.let { description ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                task.dueDate?.let { dueDate ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Due: ${dateFormatter.format(dueDate)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isOverdue)
                            MaterialTheme.colorScheme.error
                        else
                            MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Edit button
            IconButton(
                onClick = onLongClick
            ) {
                Icon(
                    Icons.Default.MoreVert,
                    contentDescription = "Edit task",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupHeader(
    group: TaskGroup,
    taskCount: Int,
    completedCount: Int,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val groupColor = try {
        Color(android.graphics.Color.parseColor(group.color))
    } catch (e: Exception) {
        MaterialTheme.colorScheme.primary
    }

    ElevatedCard(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onLongClick() },
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Color indicator
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(groupColor)
            )

            Spacer(modifier = Modifier.width(12.dp))

            // Group info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = group.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                group.description?.let { description ->
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$completedCount/$taskCount completed",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Progress indicator
            if (taskCount > 0) {
                val progress = completedCount.toFloat() / taskCount.toFloat()
                CircularProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.size(32.dp),
                    color = groupColor,
                    strokeWidth = 3.dp,
                    trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                )
            }
        }
    }
}

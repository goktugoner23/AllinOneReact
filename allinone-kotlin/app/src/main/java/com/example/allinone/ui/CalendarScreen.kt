package com.example.allinone.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.LocalViewModelStoreOwner
import com.example.allinone.data.Event
import com.example.allinone.firebase.DataChangeNotifier
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.viewmodels.CalendarViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen() {
    // Use the same ViewModel instance as MainActivity
    val viewModelStoreOwner = LocalViewModelStoreOwner.current!!
    val viewModel: CalendarViewModel = remember {
        ViewModelProvider(viewModelStoreOwner)[CalendarViewModel::class.java]
    }
    
    val events by viewModel.events.observeAsState(emptyList())
    val isLoading by viewModel.isLoading.observeAsState(false)
    val errorMessage by viewModel.errorMessage.observeAsState()
    
    var currentMonth by remember { mutableStateOf(Calendar.getInstance()) }
    var selectedDate by remember { mutableStateOf(Calendar.getInstance()) }
    var showAddEventDialog by remember { mutableStateOf(false) }
    var selectedEvent by remember { mutableStateOf<Event?>(null) }
    var showEventDialog by remember { mutableStateOf(false) }
    
    val pullToRefreshState = rememberPullToRefreshState()
    val dateFormatter = remember { SimpleDateFormat("MMMM yyyy", Locale.getDefault()) }
    val fullDateFormatter = remember { SimpleDateFormat("EEE, MMM d, yyyy", Locale.getDefault()) }
    
    // Handle pull to refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            viewModel.forceRefresh()
            pullToRefreshState.endRefresh()
        }
    }
    
    // Show error messages
    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            viewModel.clearErrorMessage()
        }
    }

    // Listen for data changes from other modules and refresh calendar
    val registrationsChanged by DataChangeNotifier.registrationsChanged.observeAsState()
    val lessonsChanged by DataChangeNotifier.lessonsChanged.observeAsState()
    val eventsChanged by DataChangeNotifier.eventsChanged.observeAsState()

    LaunchedEffect(registrationsChanged, lessonsChanged, eventsChanged) {
        if (registrationsChanged == true || lessonsChanged == true || eventsChanged == true) {
            viewModel.forceRefresh()
        }
    }
    
    // Get events for selected date
    val selectedDateEvents = remember(events, selectedDate) {
        val selectedCalendar = Calendar.getInstance().apply { time = selectedDate.time }
        events.filter { event ->
            val eventCalendar = Calendar.getInstance().apply { time = event.date }
            eventCalendar.get(Calendar.YEAR) == selectedCalendar.get(Calendar.YEAR) &&
            eventCalendar.get(Calendar.DAY_OF_YEAR) == selectedCalendar.get(Calendar.DAY_OF_YEAR)
        }.sortedBy { it.date }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Calendar header with navigation
            CalendarHeader(
                currentMonth = currentMonth,
                dateFormatter = dateFormatter,
                onPreviousMonth = {
                    currentMonth = Calendar.getInstance().apply {
                        time = currentMonth.time
                        add(Calendar.MONTH, -1)
                    }
                },
                onNextMonth = {
                    currentMonth = Calendar.getInstance().apply {
                        time = currentMonth.time
                        add(Calendar.MONTH, 1)
                    }
                },
                onAddEvent = { showAddEventDialog = true }
            )
            
            // Calendar grid
            CalendarGrid(
                currentMonth = currentMonth,
                selectedDate = selectedDate,
                events = events,
                onDateSelected = { date ->
                    selectedDate = Calendar.getInstance().apply { time = date }
                },
                onDateLongClick = { date ->
                    selectedDate = Calendar.getInstance().apply { time = date }
                    showAddEventDialog = true
                },
                modifier = Modifier.weight(1f)
            )
            
            // Events for selected date
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Events - ${fullDateFormatter.format(selectedDate.time)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    if (selectedDateEvents.isEmpty()) {
                        Text(
                            text = "No events for this date",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(vertical = 16.dp)
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.heightIn(max = 200.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(selectedDateEvents) { event ->
                                EventCard(
                                    event = event,
                                    onClick = {
                                        selectedEvent = event
                                        showEventDialog = true
                                    }
                                )
                            }
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
        
        // Loading indicator
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
    
    // Dialogs
    if (showAddEventDialog) {
        AddEventDialog(
            selectedDate = selectedDate.time,
            onDismiss = { showAddEventDialog = false },
            onConfirm = { title, description, date, endDate ->
                viewModel.addEvent(title, description, date, endDate)
                showAddEventDialog = false
            }
        )
    }
    
    selectedEvent?.let { event ->
        if (showEventDialog) {
            EventDetailsDialog(
                event = event,
                onDismiss = {
                    showEventDialog = false
                    selectedEvent = null
                },
                onDelete = {
                    viewModel.deleteEvent(event)
                    showEventDialog = false
                    selectedEvent = null
                }
            )
        }
    }
}

@Composable
fun CalendarHeader(
    currentMonth: Calendar,
    dateFormatter: SimpleDateFormat,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onAddEvent: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onPreviousMonth) {
                Icon(Icons.Default.ChevronLeft, contentDescription = "Previous month")
            }
            
            Text(
                text = dateFormatter.format(currentMonth.time),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Row {
                IconButton(onClick = onAddEvent) {
                    Icon(Icons.Default.Add, contentDescription = "Add event")
                }
                IconButton(onClick = onNextMonth) {
                    Icon(Icons.Default.ChevronRight, contentDescription = "Next month")
                }
            }
        }
    }
}

@Composable
fun CalendarGrid(
    currentMonth: Calendar,
    selectedDate: Calendar,
    events: List<Event>,
    onDateSelected: (Date) -> Unit,
    onDateLongClick: (Date) -> Unit,
    modifier: Modifier = Modifier
) {
    val daysOfWeek = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

    // Calculate calendar days
    val calendarDays = remember(currentMonth) {
        generateCalendarDays(currentMonth)
    }
    
    // Determine highest priority event type for each date
    val eventTypeByDate = remember(events) {
        val result = mutableMapOf<String, String>()

        events.forEach { event ->
            val calendar = Calendar.getInstance().apply { time = event.date }
            val dateKey = "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.DAY_OF_YEAR)}"

            // Get current highest priority event type for this date
            val currentType = result[dateKey]

            // Determine if this event has higher priority
            val newType = when {
                event.type == "Registration End" -> "registration_end" // Red (highest priority)
                currentType == "registration_end" -> currentType

                event.type == "Registration Start" -> "registration_start" // Green (second priority)
                currentType == "registration_start" -> currentType

                event.type == "Lesson" -> "lesson" // Blue (third priority)
                currentType == "lesson" -> currentType

                else -> "event" // Yellow (lowest priority)
            }

            result[dateKey] = newType
        }

        result
    }
    
    Column(modifier = modifier.padding(horizontal = 16.dp)) {
        // Days of week header
        Row(modifier = Modifier.fillMaxWidth()) {
            daysOfWeek.forEach { day ->
                Text(
                    text = day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Calendar days grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(calendarDays) { dayInfo ->
                CalendarDay(
                    dayInfo = dayInfo,
                    isSelected = isSameDay(dayInfo.date, selectedDate.time),
                    eventType = eventTypeByDate["${dayInfo.year}-${dayInfo.dayOfYear}"],
                    onClick = { onDateSelected(dayInfo.date) },
                    onLongClick = { onDateLongClick(dayInfo.date) }
                )
            }
        }
    }
}

data class CalendarDayInfo(
    val date: Date,
    val day: Int,
    val isCurrentMonth: Boolean,
    val isToday: Boolean,
    val year: Int,
    val dayOfYear: Int
)

@Composable
fun CalendarDay(
    dayInfo: CalendarDayInfo,
    isSelected: Boolean,
    eventType: String?,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor = when {
        isSelected -> MaterialTheme.colorScheme.primary
        dayInfo.isToday -> MaterialTheme.colorScheme.primaryContainer
        else -> Color.Transparent
    }

    val textColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary
        dayInfo.isToday -> MaterialTheme.colorScheme.onPrimaryContainer
        !dayInfo.isCurrentMonth -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
        else -> MaterialTheme.colorScheme.onSurface
    }

    Box(
        modifier = modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(backgroundColor)
            .clickable { onClick() }
            .pointerInput(Unit) {
                detectTapGestures(
                    onLongPress = { onLongClick() }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = dayInfo.day.toString(),
                style = MaterialTheme.typography.bodyMedium,
                color = textColor,
                fontWeight = if (dayInfo.isToday || isSelected) FontWeight.Bold else FontWeight.Normal
            )

            if (eventType != null) {
                val dotColor = when (eventType) {
                    "registration_end" -> Color(0xFFF44336) // Red (highest priority)
                    "registration_start" -> Color(0xFF4CAF50) // Green (second priority)
                    "lesson" -> Color(0xFF2196F3) // Blue (third priority)
                    else -> Color(0xFFFFEB3B) // Yellow (lowest priority)
                }

                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(
                            if (isSelected) MaterialTheme.colorScheme.onPrimary
                            else dotColor
                        )
                )
            }
        }
    }
}

@Composable
fun EventCard(
    event: Event,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val timeFormatter = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }

    ElevatedCard(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Event type indicator
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(
                        when (event.type) {
                            "Lesson" -> Color(0xFF4CAF50)
                            "Registration Start" -> Color(0xFF2196F3)
                            "Registration End" -> Color(0xFFF44336)
                            else -> MaterialTheme.colorScheme.primary
                        }
                    )
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                event.description?.let { description ->
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Text(
                text = timeFormatter.format(event.date),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

fun generateCalendarDays(currentMonth: Calendar): List<CalendarDayInfo> {
    val days = mutableListOf<CalendarDayInfo>()
    val today = Calendar.getInstance()

    // Get first day of month
    val firstDay = Calendar.getInstance().apply {
        time = currentMonth.time
        set(Calendar.DAY_OF_MONTH, 1)
    }

    // Get last day of month
    val lastDay = Calendar.getInstance().apply {
        time = currentMonth.time
        set(Calendar.DAY_OF_MONTH, getActualMaximum(Calendar.DAY_OF_MONTH))
    }

    // Add days from previous month to fill the first week
    // Convert Calendar.DAY_OF_WEEK to Monday-based (Monday = 0, Sunday = 6)
    val firstDayOfWeek = when (firstDay.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY -> 0
        Calendar.TUESDAY -> 1
        Calendar.WEDNESDAY -> 2
        Calendar.THURSDAY -> 3
        Calendar.FRIDAY -> 4
        Calendar.SATURDAY -> 5
        Calendar.SUNDAY -> 6
        else -> 0
    }

    val prevMonth = Calendar.getInstance().apply {
        time = firstDay.time
        add(Calendar.MONTH, -1)
    }
    val prevMonthLastDay = prevMonth.getActualMaximum(Calendar.DAY_OF_MONTH)

    for (i in firstDayOfWeek - 1 downTo 0) {
        val day = prevMonthLastDay - i
        val date = Calendar.getInstance().apply {
            time = prevMonth.time
            set(Calendar.DAY_OF_MONTH, day)
        }
        days.add(
            CalendarDayInfo(
                date = date.time,
                day = day,
                isCurrentMonth = false,
                isToday = isSameDay(date.time, today.time),
                year = date.get(Calendar.YEAR),
                dayOfYear = date.get(Calendar.DAY_OF_YEAR)
            )
        )
    }

    // Add days of current month
    val currentMonthDays = lastDay.get(Calendar.DAY_OF_MONTH)
    for (day in 1..currentMonthDays) {
        val date = Calendar.getInstance().apply {
            time = currentMonth.time
            set(Calendar.DAY_OF_MONTH, day)
        }
        days.add(
            CalendarDayInfo(
                date = date.time,
                day = day,
                isCurrentMonth = true,
                isToday = isSameDay(date.time, today.time),
                year = date.get(Calendar.YEAR),
                dayOfYear = date.get(Calendar.DAY_OF_YEAR)
            )
        )
    }

    // Add days from next month to fill the last week
    val remainingDays = 42 - days.size // 6 weeks * 7 days
    val nextMonth = Calendar.getInstance().apply {
        time = lastDay.time
        add(Calendar.MONTH, 1)
    }

    for (day in 1..remainingDays) {
        val date = Calendar.getInstance().apply {
            time = nextMonth.time
            set(Calendar.DAY_OF_MONTH, day)
        }
        days.add(
            CalendarDayInfo(
                date = date.time,
                day = day,
                isCurrentMonth = false,
                isToday = isSameDay(date.time, today.time),
                year = date.get(Calendar.YEAR),
                dayOfYear = date.get(Calendar.DAY_OF_YEAR)
            )
        )
    }

    return days
}

fun isSameDay(date1: Date, date2: Date): Boolean {
    val cal1 = Calendar.getInstance().apply { time = date1 }
    val cal2 = Calendar.getInstance().apply { time = date2 }
    return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
           cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
}

package com.example.allinone.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Notes
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class NavItem(
    val route: String,
    val icon: ImageVector,
    val title: String
) {
    // Transaction Module Bottom Navigation Items (used within TransactionsDashboard)
    object Home : NavItem("home", Icons.Default.Home, "Transactions")
    object Investments : NavItem("investments", Icons.AutoMirrored.Filled.TrendingUp, "Investments")
    object Reports : NavItem("reports", Icons.Default.Assessment, "Reports")
    
    // Drawer Navigation Items
    object TransactionsDashboard : NavItem("transactions_dashboard", Icons.Default.AccountBalance, "Transactions")
    object Futures : NavItem("futures", Icons.AutoMirrored.Filled.ShowChart, "Futures Trading")
    object WTRegistry : NavItem("wt_registry", Icons.Default.School, "Wing Tzun Registry")
    object Calendar : NavItem("calendar", Icons.Default.DateRange, "Calendar")
    object Notes : NavItem("notes", Icons.AutoMirrored.Filled.Notes, "Notes")
    object EditNote : NavItem("edit_note", Icons.AutoMirrored.Filled.Notes, "Edit Note")
    object CreateNote : NavItem("create_note", Icons.AutoMirrored.Filled.Notes, "Create Note")
    object Tasks : NavItem("tasks", Icons.Default.Task, "Tasks")
    object Instagram : NavItem("instagram", Icons.Default.Camera, "Instagram Business")
    object Workout : NavItem("workout", Icons.Default.FitnessCenter, "Workout")
    object WorkoutSession : NavItem("workout_session", Icons.Default.FitnessCenter, "Workout Session")
    object WorkoutSessionWithProgram : NavItem("workout_session/{programId}", Icons.Default.FitnessCenter, "Workout Session")
    object History : NavItem("history", Icons.Default.History, "History")
    object Database : NavItem("database", Icons.Default.Storage, "Database")
    object ErrorLogs : NavItem("error_logs", Icons.Default.Error, "Error Logs")
    
    // Action Items
    object Backup : NavItem("backup", Icons.Default.Backup, "Backup")
    object ClearData : NavItem("clear_data", Icons.Default.Delete, "Clear Data")
    object ClearDatabase : NavItem("clear_database", Icons.Default.DeleteForever, "Clear Database")
}

// Transaction Module Bottom Navigation Items
val transactionBottomNavItems = listOf(
    NavItem.Home,
    NavItem.Investments,
    NavItem.Reports
)

// Workout Module Bottom Navigation Items
object WorkoutDashboard : NavItem("workout_dashboard", Icons.Default.Dashboard, "Dashboard")
object WorkoutPrograms : NavItem("workout_programs", Icons.Default.FitnessCenter, "Programs")
object WorkoutSessions : NavItem("workout_sessions", Icons.Default.History, "Sessions")

val workoutBottomNavItems = listOf(
    WorkoutDashboard,
    WorkoutPrograms,
    WorkoutSessions
)

val drawerNavItems = listOf(
    NavItem.TransactionsDashboard,
    NavItem.WTRegistry,
    NavItem.Calendar,
    NavItem.Notes,
    NavItem.Tasks,
    NavItem.Instagram,
    NavItem.Workout,
    NavItem.History,
    NavItem.Database,
    NavItem.ErrorLogs
)

val drawerActionItems = listOf(
    NavItem.Backup,
    NavItem.ClearData,
    NavItem.ClearDatabase
) 
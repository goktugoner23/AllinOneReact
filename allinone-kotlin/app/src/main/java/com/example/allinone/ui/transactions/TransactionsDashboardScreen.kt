package com.example.allinone.ui.transactions

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.allinone.ui.navigation.NavItem
import com.example.allinone.ui.navigation.transactionBottomNavItems
import com.example.allinone.ui.investments.InvestmentScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsDashboardScreen() {
    val navController = rememberNavController()
    
    Scaffold(
        bottomBar = {
            TransactionBottomNavigation(navController = navController)
        }
    ) { paddingValues ->
        TransactionNavigationHost(
            navController = navController,
            modifier = Modifier.padding(paddingValues)
        )
    }
}

@Composable
fun TransactionBottomNavigation(navController: NavHostController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    NavigationBar {
        transactionBottomNavItems.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.title) },
                label = { Text(item.title) },
                selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
fun TransactionNavigationHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = NavItem.Home.route,
        modifier = modifier
    ) {
        composable(NavItem.Home.route) {
            TransactionOverviewScreen()
        }
        
        composable(NavItem.Investments.route) {
            InvestmentScreen()
        }
        
        composable(NavItem.Reports.route) {
            TransactionReportScreen()
        }
    }
} 
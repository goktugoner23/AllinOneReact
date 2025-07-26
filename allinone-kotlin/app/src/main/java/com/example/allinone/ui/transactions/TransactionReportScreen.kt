package com.example.allinone.ui.transactions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.allinone.data.Transaction
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.ui.theme.ExpenseRed
import com.example.allinone.ui.theme.IncomeGreen
import com.example.allinone.viewmodels.HomeViewModel
import com.example.allinone.config.TransactionCategories
import com.example.allinone.utils.NumberFormatUtils
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionReportScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val allTransactions by viewModel.allTransactions.collectAsStateWithLifecycle()
    
    var selectedDateRange by remember { mutableStateOf("Last 30 Days") }
    var selectedCategory by remember { mutableStateOf("All Categories") }
    var dateRangeExpanded by remember { mutableStateOf(false) }
    var categoryExpanded by remember { mutableStateOf(false) }
    
    val dateRangeOptions = listOf("Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year", "All Time")
    val categoryOptions = listOf("All Categories") + TransactionCategories.CATEGORIES.toList()
    
    val filteredTransactions = remember(allTransactions, selectedDateRange, selectedCategory) {
        filterTransactions(allTransactions, selectedDateRange, selectedCategory)
    }
    
    val categorySpending = remember(filteredTransactions) {
        calculateCategorySpending(filteredTransactions)
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Transaction Reports",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
        
        item {
            // Filter Controls
            FilterControlsCard(
                selectedDateRange = selectedDateRange,
                onDateRangeChange = { selectedDateRange = it },
                dateRangeExpanded = dateRangeExpanded,
                onDateRangeExpandedChange = { dateRangeExpanded = it },
                dateRangeOptions = dateRangeOptions,
                selectedCategory = selectedCategory,
                onCategoryChange = { selectedCategory = it },
                categoryExpanded = categoryExpanded,
                onCategoryExpandedChange = { categoryExpanded = it },
                categoryOptions = categoryOptions
            )
        }
        
        item {
            // Summary Statistics
            SummaryStatisticsCard(
                transactions = filteredTransactions,
                dateRange = selectedDateRange
            )
        }
        
        item {
            // Chart Placeholder
            ChartCard(transactions = filteredTransactions)
        }
        
        item {
            // Category Spending Breakdown
            CategorySpendingCard(categorySpending = categorySpending)
        }
        
        item {
            // Transaction Insights
            TransactionInsightsCard(transactions = filteredTransactions)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterControlsCard(
    selectedDateRange: String,
    onDateRangeChange: (String) -> Unit,
    dateRangeExpanded: Boolean,
    onDateRangeExpandedChange: (Boolean) -> Unit,
    dateRangeOptions: List<String>,
    selectedCategory: String,
    onCategoryChange: (String) -> Unit,
    categoryExpanded: Boolean,
    onCategoryExpandedChange: (Boolean) -> Unit,
    categoryOptions: List<String>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Filters",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Date Range Filter
                ExposedDropdownMenuBox(
                    expanded = dateRangeExpanded,
                    onExpandedChange = onDateRangeExpandedChange,
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = selectedDateRange,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Date Range") },
                        trailingIcon = { 
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = dateRangeExpanded) 
                        },
                        modifier = Modifier.menuAnchor()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = dateRangeExpanded,
                        onDismissRequest = { onDateRangeExpandedChange(false) }
                    ) {
                        dateRangeOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    onDateRangeChange(option)
                                    onDateRangeExpandedChange(false)
                                }
                            )
                        }
                    }
                }
                
                // Category Filter
                ExposedDropdownMenuBox(
                    expanded = categoryExpanded,
                    onExpandedChange = onCategoryExpandedChange,
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = selectedCategory,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Category") },
                        trailingIcon = { 
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) 
                        },
                        modifier = Modifier.menuAnchor()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = categoryExpanded,
                        onDismissRequest = { onCategoryExpandedChange(false) }
                    ) {
                        categoryOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    onCategoryChange(option)
                                    onCategoryExpandedChange(false)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SummaryStatisticsCard(
    transactions: List<Transaction>,
    dateRange: String
) {
    val totalIncome = transactions.filter { it.isIncome }.sumOf { it.amount }
    val totalExpense = transactions.filter { !it.isIncome }.sumOf { it.amount }
    val netAmount = totalIncome - totalExpense
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Summary ($dateRange)",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SummaryItem(
                    label = "Total Income",
                    amount = totalIncome,
                    color = IncomeGreen,
                    icon = Icons.AutoMirrored.Filled.TrendingUp
                )
                
                SummaryItem(
                    label = "Total Expense",
                    amount = totalExpense,
                    color = ExpenseRed,
                    icon = Icons.AutoMirrored.Filled.TrendingDown
                )
                
                SummaryItem(
                    label = "Net Amount",
                    amount = netAmount,
                    color = if (netAmount >= 0) IncomeGreen else ExpenseRed,
                    icon = if (netAmount >= 0) Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "${transactions.size} transactions",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun SummaryItem(
    label: String,
    amount: Double,
    color: androidx.compose.ui.graphics.Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = color
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Text(
            text = NumberFormatUtils.formatAmount(amount),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = color,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ChartCard(@Suppress("UNUSED_PARAMETER") transactions: List<Transaction>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Spending Trends",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Placeholder for chart - will be implemented with a proper charting library
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Line Chart\n(Spending over time)",
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun CategorySpendingCard(categorySpending: List<Pair<String, Double>>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Category Breakdown",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            if (categorySpending.isEmpty()) {
                Text(
                    text = "No spending data available",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                categorySpending.forEach { (category, amount) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = category,
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f)
                        )
                        
                        Text(
                            text = NumberFormatUtils.formatAmount(amount),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = ExpenseRed
                        )
                    }
                    
                    if (category != categorySpending.last().first) {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionInsightsCard(transactions: List<Transaction>) {
    val avgTransactionAmount = if (transactions.isNotEmpty()) {
        transactions.sumOf { it.amount } / transactions.size
    } else 0.0
    
    val mostFrequentCategory = transactions
        .groupingBy { it.category }
        .eachCount()
        .maxByOrNull { it.value }?.key ?: "N/A"
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Insights",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            InsightItem(
                label = "Average Transaction",
                value = NumberFormatUtils.formatAmount(avgTransactionAmount)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            InsightItem(
                label = "Most Frequent Category",
                value = mostFrequentCategory
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            InsightItem(
                label = "Total Transactions",
                value = transactions.size.toString()
            )
        }
    }
}

@Composable
fun InsightItem(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

private fun filterTransactions(
    transactions: List<Transaction>,
    dateRange: String,
    category: String
): List<Transaction> {
    val calendar = Calendar.getInstance()
    val startDate = when (dateRange) {
        "Last 7 Days" -> {
            calendar.add(Calendar.DAY_OF_MONTH, -7)
            calendar.time
        }
        "Last 30 Days" -> {
            calendar.add(Calendar.DAY_OF_MONTH, -30)
            calendar.time
        }
        "Last 90 Days" -> {
            calendar.add(Calendar.DAY_OF_MONTH, -90)
            calendar.time
        }
        "This Year" -> {
            calendar.set(Calendar.DAY_OF_MONTH, 1)
            calendar.set(Calendar.MONTH, Calendar.JANUARY)
            calendar.time
        }
        else -> null // All Time
    }
    
    return transactions.filter { transaction ->
        val passesDateFilter = startDate == null || transaction.date.after(startDate) || transaction.date == startDate
        val passesCategoryFilter = category == "All Categories" || transaction.category == category
        
        passesDateFilter && passesCategoryFilter
    }.sortedByDescending { it.date }
}

private fun calculateCategorySpending(transactions: List<Transaction>): List<Pair<String, Double>> {
    return transactions
        .filter { !it.isIncome } // Only expenses
        .groupBy { it.category }
        .mapValues { (_, transactions) -> transactions.sumOf { it.amount } }
        .toList()
        .sortedByDescending { it.second }
}

@Preview(showBackground = true)
@Composable
fun TransactionReportScreenPreview() {
    AllInOneTheme {
        TransactionReportScreen()
    }
} 
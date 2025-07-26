package com.example.allinone.ui.transactions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
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
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionOverviewScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val allTransactions by viewModel.allTransactions.collectAsStateWithLifecycle()
    val combinedBalance by viewModel.combinedBalance.collectAsStateWithLifecycle()
    @Suppress("UNUSED_VARIABLE")
    val selectedInvestment by viewModel.selectedInvestment.collectAsStateWithLifecycle()
    
    // Force refresh transactions when this screen is first displayed
    LaunchedEffect(Unit) {
        viewModel.forceRefreshTransactions()
    }
    
    var amount by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    
    // Pull-to-refresh state
    val pullToRefreshState = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }
    
    // Handle pull-to-refresh
    LaunchedEffect(pullToRefreshState.isRefreshing) {
        if (pullToRefreshState.isRefreshing) {
            isRefreshing = true
            viewModel.forceRefreshTransactions()
            // Add a small delay to show the refresh indicator
            kotlinx.coroutines.delay(500)
            isRefreshing = false
        }
    }
    
    // Reset pull-to-refresh state when not refreshing
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }
    
    // Pagination state
    var currentPage by remember { mutableStateOf(0) }
    val pageSize = 5
    
    val sortedTransactions = remember(allTransactions) {
        allTransactions.sortedByDescending { it.date }
    }
    
    val totalPages = remember(sortedTransactions) {
        if (sortedTransactions.isEmpty()) 0 else (sortedTransactions.size - 1) / pageSize + 1
    }
    
    val pagedTransactions = remember(sortedTransactions, currentPage) {
        val startIndex = currentPage * pageSize
        val endIndex = minOf(startIndex + pageSize, sortedTransactions.size)
        if (startIndex < sortedTransactions.size) {
            sortedTransactions.subList(startIndex, endIndex)
        } else {
            emptyList()
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
        item {
            // Balance Card
            BalanceCard(
                totalIncome = combinedBalance.first,
                totalExpense = combinedBalance.second,
                balance = combinedBalance.third
            )
        }
        
        item {
            // Transaction Summary Chart
            TransactionSummaryChart(transactions = allTransactions)
        }
        
        item {
            // Transaction Input Form
            TransactionInputForm(
                amount = amount,
                onAmountChange = { amount = it },
                description = description,
                onDescriptionChange = { description = it },
                selectedCategory = selectedCategory,
                onCategoryChange = { selectedCategory = it },
                expanded = expanded,
                onExpandedChange = { expanded = it },
                onAddIncome = {
                    if (amount.isNotEmpty() && selectedCategory.isNotEmpty()) {
                        val amountValue = amount.toDoubleOrNull()
                        if (amountValue != null && amountValue > 0) {
                            viewModel.addTransaction(
                                amount = amountValue,
                                type = selectedCategory,
                                description = description.ifEmpty { null },
                                isIncome = true,
                                category = selectedCategory
                            )
                            // Clear form
                            amount = ""
                            description = ""
                            selectedCategory = ""
                        }
                    }
                },
                onAddExpense = {
                    if (amount.isNotEmpty() && selectedCategory.isNotEmpty()) {
                        val amountValue = amount.toDoubleOrNull()
                        if (amountValue != null && amountValue > 0) {
                            viewModel.addTransaction(
                                amount = amountValue,
                                type = selectedCategory,
                                description = description.ifEmpty { null },
                                isIncome = false,
                                category = selectedCategory
                            )
                            // Clear form
                            amount = ""
                            description = ""
                            selectedCategory = ""
                        }
                    }
                }
            )
        }
        
        item {
            // Transactions List Header
            Text(
                text = "Transactions",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }
        
        if (pagedTransactions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No transactions found",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            items(pagedTransactions) { transaction ->
                TransactionCard(
                    transaction = transaction,
                    onTransactionClick = { /* Handle click */ },
                    onTransactionLongClick = { viewModel.deleteTransaction(transaction) }
                )
            }
            
            if (totalPages > 1) {
                item {
                    PaginationControls(
                        currentPage = currentPage,
                        totalPages = totalPages,
                        onPreviousPage = { 
                            if (currentPage > 0) currentPage--
                        },
                        onNextPage = { 
                            if (currentPage < totalPages - 1) currentPage++
                        }
                    )
                }
            }
        }
    }
        
        // Pull-to-refresh indicator
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
fun BalanceCard(
    totalIncome: Double,
    totalExpense: Double,
    balance: Double
) {
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
                text = "Balance Overview",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                BalanceItem(
                    label = "Income",
                    amount = totalIncome,
                    color = IncomeGreen
                )
                
                BalanceItem(
                    label = "Expense",
                    amount = totalExpense,
                    color = ExpenseRed
                )
                
                BalanceItem(
                    label = "Balance",
                    amount = balance,
                    color = if (balance >= 0) IncomeGreen else ExpenseRed
                )
            }
        }
    }
}

@Composable
fun BalanceItem(
    label: String,
    amount: Double,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        Text(
            text = NumberFormatUtils.formatAmount(amount),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun TransactionSummaryChart(transactions: List<Transaction>) {
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
                text = "Transaction Summary",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Simple Pie Chart
            if (transactions.isNotEmpty()) {
                CategoryPieChart(
                    transactions = transactions,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No transactions to display",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionInputForm(
    amount: String,
    onAmountChange: (String) -> Unit,
    description: String,
    onDescriptionChange: (String) -> Unit,
    selectedCategory: String,
    onCategoryChange: (String) -> Unit,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onAddIncome: () -> Unit,
    onAddExpense: () -> Unit
) {
    // Transaction categories from config
    val categories = TransactionCategories.CATEGORIES.toList()
    
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
                text = "Add Transaction",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            OutlinedTextField(
                value = amount,
                onValueChange = onAmountChange,
                label = { Text("Amount") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )
            
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = onExpandedChange
            ) {
                OutlinedTextField(
                    value = selectedCategory,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Category") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                )
                
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { onExpandedChange(false) }
                ) {
                    categories.forEach { category ->
                        DropdownMenuItem(
                            text = { Text(category) },
                            onClick = {
                                onCategoryChange(category)
                                onExpandedChange(false)
                            }
                        )
                    }
                }
            }
            
            OutlinedTextField(
                value = description,
                onValueChange = onDescriptionChange,
                label = { Text("Description (Optional)") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Button(
                    onClick = onAddIncome,
                    colors = ButtonDefaults.buttonColors(containerColor = IncomeGreen),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Income")
                }
                
                Button(
                    onClick = onAddExpense,
                    colors = ButtonDefaults.buttonColors(containerColor = ExpenseRed),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Remove, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Expense")
                }
            }
        }
    }
}

@Composable
fun TransactionCard(
    transaction: Transaction,
    onTransactionClick: () -> Unit,
    @Suppress("UNUSED_PARAMETER") onTransactionLongClick: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy", Locale.getDefault()) }
    val formattedDate = remember(transaction.date) { dateFormat.format(transaction.date) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        onClick = onTransactionClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = transaction.type,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                
                if (transaction.description.isNotEmpty()) {
                    Text(
                        text = transaction.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Text(
                    text = formattedDate,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = "${if (transaction.isIncome) "+" else "-"}${NumberFormatUtils.formatAmount(transaction.amount).removePrefix("₺")}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (transaction.isIncome) IncomeGreen else ExpenseRed
                )
                
                Icon(
                    imageVector = if (transaction.isIncome) Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown,
                    contentDescription = if (transaction.isIncome) "Income" else "Expense",
                    tint = if (transaction.isIncome) IncomeGreen else ExpenseRed
                )
            }
        }
    }
}

@Composable
fun PaginationControls(
    currentPage: Int,
    totalPages: Int,
    onPreviousPage: () -> Unit,
    onNextPage: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(
            onClick = onPreviousPage,
            enabled = currentPage > 0
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
            Spacer(modifier = Modifier.width(4.dp))
            Text("Previous")
        }
        
        Text(
            text = "Page ${currentPage + 1} of $totalPages",
            style = MaterialTheme.typography.bodyMedium
        )
        
        TextButton(
            onClick = onNextPage,
            enabled = currentPage < totalPages - 1
        ) {
            Text("Next")
            Spacer(modifier = Modifier.width(4.dp))
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
        }
    }
}

@Composable
fun CategoryPieChart(
    transactions: List<Transaction>,
    modifier: Modifier = Modifier
) {
    val categoryData = remember(transactions) {
        val expenses = transactions.filter { !it.isIncome }
        val groupedByCategory = expenses.groupBy { it.category }
        val categoryTotals = groupedByCategory.mapValues { (_, transactions) ->
            transactions.sumOf { it.amount }
        }
        
        // Convert to list of pairs and sort by amount
        categoryTotals.toList().sortedByDescending { it.second }
    }
    
    if (categoryData.isEmpty()) {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No expense data available",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        return
    }
    
    val colors = listOf(
        Color(0xFF6200EE), // Purple
        Color(0xFF03DAC6), // Teal
        Color(0xFFFF6B6B), // Red
        Color(0xFF4ECDC4), // Light Blue
        Color(0xFF45B7D1), // Blue
        Color(0xFF96CEB4), // Light Green
        Color(0xFFFFCE56), // Yellow
        Color(0xFFFF8A65), // Orange
        Color(0xFFBA68C8), // Light Purple
        Color(0xFF81C784)  // Green
    )
    
    val totalAmount = categoryData.sumOf { it.second }
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Pie Chart
        Canvas(
            modifier = Modifier
                .size(150.dp)
                .clip(CircleShape)
        ) {
            val center = androidx.compose.ui.geometry.Offset(size.width / 2, size.height / 2)
            val radius = size.minDimension / 2
            
            var startAngle = 0f
            
            categoryData.forEachIndexed { index, (_, amount) ->
                val sweepAngle = (amount / totalAmount * 360).toFloat()
                val color = colors[index % colors.size]
                
                drawArc(
                    color = color,
                    startAngle = startAngle,
                    sweepAngle = sweepAngle,
                    useCenter = true,
                    topLeft = androidx.compose.ui.geometry.Offset(
                        center.x - radius,
                        center.y - radius
                    ),
                    size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
                )
                
                startAngle += sweepAngle
            }
        }
        
        // Legend
        Column(
            modifier = Modifier
                .weight(1f)
                .heightIn(max = 150.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            categoryData.take(5).forEach { (category, amount) ->
                val index = categoryData.indexOf(category to amount)
                val color = colors[index % colors.size]
                val percentage = (amount / totalAmount * 100).toInt()
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(color, CircleShape)
                    )
                    
                    Column {
                        Text(
                            text = category,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${NumberFormatUtils.formatAmount(amount).replace(",", ".")} ($percentage%)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            if (categoryData.size > 5) {
                Text(
                    text = "... and ${categoryData.size - 5} more",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun TransactionOverviewScreenPreview() {
    AllInOneTheme {
        // Preview with mock data would go here
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("Transaction Overview Screen")
        }
    }
} 
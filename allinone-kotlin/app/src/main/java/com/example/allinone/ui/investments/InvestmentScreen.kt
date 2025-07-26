package com.example.allinone.ui.investments

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.allinone.data.Investment
import com.example.allinone.ui.futures.FuturesScreen
import com.example.allinone.ui.theme.AllInOneTheme
import com.example.allinone.ui.theme.ExpenseRed
import com.example.allinone.ui.theme.FuturesYellow
import com.example.allinone.ui.theme.IncomeGreen
import com.example.allinone.ui.theme.InvestmentBlue
import com.example.allinone.viewmodels.HomeViewModel
import com.example.allinone.utils.NumberFormatUtils
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvestmentScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val allInvestments by viewModel.allInvestments.collectAsStateWithLifecycle()
    
    var selectedTabIndex by remember { mutableStateOf(0) }
    val tabs = listOf("Investments", "Futures")
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Tab Row
        TabRow(
            selectedTabIndex = selectedTabIndex,
            modifier = Modifier.fillMaxWidth()
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    text = { Text(title) },
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index }
                )
            }
        }
        
        // Tab Content
        when (selectedTabIndex) {
            0 -> InvestmentsTab(
                investments = allInvestments,
                viewModel = viewModel
            )
            1 -> FuturesTab(
                investments = allInvestments.filter { it.type.contains("Future", ignoreCase = true) },
                viewModel = viewModel
            )
        }
    }
}

@Composable
fun InvestmentsTab(
    investments: List<Investment>,
    viewModel: HomeViewModel
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showLiquidateDialog by remember { mutableStateOf(false) }
    var selectedInvestment by remember { mutableStateOf<Investment?>(null) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "My Investments",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                
                FloatingActionButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.size(56.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Investment")
                }
            }
        }
        
        item {
            // Investment Summary
            InvestmentSummaryCard(investments = investments)
        }
        
        if (investments.isEmpty()) {
            item {
                EmptyInvestmentsCard()
            }
        } else {
            items(investments) { investment ->
                InvestmentCard(
                    investment = investment,
                    onInvestmentClick = { /* Handle click to show details */ },
                    onDeleteClick = { 
                        selectedInvestment = investment
                        showDeleteDialog = true
                    },
                    onEditClick = { 
                        selectedInvestment = investment
                        showEditDialog = true
                    },
                    onLiquidateClick = { 
                        selectedInvestment = investment
                        showLiquidateDialog = true
                    }
                )
            }
        }
    }
    
    // Dialogs
    if (showAddDialog) {
        AddInvestmentDialog(
            onDismiss = { showAddDialog = false },
            onAddInvestment = { investment ->
                viewModel.addInvestmentAndTransaction(investment)
                showAddDialog = false
            }
        )
    }
    
    if (showEditDialog && selectedInvestment != null) {
        EditInvestmentDialog(
            investment = selectedInvestment!!,
            onDismiss = { 
                showEditDialog = false
                selectedInvestment = null
            },
            onUpdateInvestment = { updatedInvestment ->
                viewModel.updateInvestment(updatedInvestment)
                showEditDialog = false
                selectedInvestment = null
            }
        )
    }
    
    if (showDeleteDialog && selectedInvestment != null) {
        DeleteConfirmationDialog(
            investmentName = selectedInvestment!!.name,
            onDismiss = { 
                showDeleteDialog = false
                selectedInvestment = null
            },
            onConfirm = {
                viewModel.deleteInvestment(selectedInvestment!!)
                showDeleteDialog = false
                selectedInvestment = null
            }
        )
    }
    
    if (showLiquidateDialog && selectedInvestment != null) {
        LiquidateInvestmentDialog(
            investment = selectedInvestment!!,
            onDismiss = { 
                showLiquidateDialog = false
                selectedInvestment = null
            },
            onLiquidate = { amount ->
                viewModel.addIncomeToInvestment(amount, selectedInvestment!!, "Investment liquidation")
                showLiquidateDialog = false
                selectedInvestment = null
            }
        )
    }
}

@Composable
fun FuturesTab(
    @Suppress("UNUSED_PARAMETER") investments: List<Investment>,
    @Suppress("UNUSED_PARAMETER") viewModel: HomeViewModel
) {
    FuturesScreen()
}

@Composable
fun InvestmentSummaryCard(investments: List<Investment>) {
    val totalValue = investments.sumOf { it.amount }
    val totalInvestments = investments.size
    val averageInvestment = if (totalInvestments > 0) totalValue / totalInvestments else 0.0
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(containerColor = InvestmentBlue.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Investment Portfolio",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = InvestmentBlue
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SummaryItem(
                    label = "Total Value",
                    value = NumberFormatUtils.formatAmount(totalValue),
                    color = InvestmentBlue
                )
                
                SummaryItem(
                    label = "Investments",
                    value = totalInvestments.toString(),
                    color = InvestmentBlue
                )
                
                SummaryItem(
                    label = "Average",
                    value = NumberFormatUtils.formatAmount(averageInvestment),
                    color = InvestmentBlue
                )
            }
        }
    }
}

@Composable
fun SummaryItem(
    label: String,
    value: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = color
        )
        
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun EmptyInvestmentsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "No investments yet",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Start building your investment portfolio by adding your first investment",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun InvestmentCard(
    investment: Investment,
    onInvestmentClick: (Investment) -> Unit,
    onDeleteClick: (Investment) -> Unit,
    onEditClick: (Investment) -> Unit,
    onLiquidateClick: (Investment) -> Unit
) {
    val investmentColor = when (investment.type) {
        "Stock" -> IncomeGreen
        "Crypto" -> FuturesYellow
        "Bond" -> InvestmentBlue
        else -> MaterialTheme.colorScheme.primary
    }
    
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy", Locale.getDefault()) }
    val formattedDate = dateFormat.format(investment.date)
    var showDropdown by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onInvestmentClick(investment) },
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
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
                    text = investment.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = investment.type,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "Purchased: $formattedDate",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                if (!investment.description.isNullOrEmpty()) {
                    Text(
                        text = investment.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = NumberFormatUtils.formatAmount(investment.amount),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = investmentColor
                        )
                    }
                    
                    Box {
                        IconButton(onClick = { showDropdown = true }) {
                            Icon(
                                imageVector = Icons.Default.MoreVert,
                                contentDescription = "More options"
                            )
                        }
                        
                        DropdownMenu(
                            expanded = showDropdown,
                            onDismissRequest = { showDropdown = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Edit") },
                                onClick = {
                                    showDropdown = false
                                    onEditClick(investment)
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Edit, contentDescription = null)
                                }
                            )
                            
                            if (!investment.isPast) {
                                DropdownMenuItem(
                                    text = { Text("Liquidate") },
                                    onClick = {
                                        showDropdown = false
                                        onLiquidateClick(investment)
                                    },
                                    leadingIcon = {
                                        Icon(Icons.AutoMirrored.Filled.TrendingDown, contentDescription = null)
                                    }
                                )
                            }
                            
                            DropdownMenuItem(
                                text = { Text("Delete") },
                                onClick = {
                                    showDropdown = false
                                    onDeleteClick(investment)
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Delete, contentDescription = null)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}



@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddInvestmentDialog(
    onDismiss: () -> Unit,
    onAddInvestment: (Investment) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    
    val investmentTypes = listOf("Stock", "Crypto", "Bond", "ETF", "Mutual Fund", "Real Estate", "Other")
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Investment") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Investment Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = type,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Type") },
                        trailingIcon = { 
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) 
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        investmentTypes.forEach { investmentType ->
                            DropdownMenuItem(
                                text = { Text(investmentType) },
                                onClick = {
                                    type = investmentType
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val amountValue = amount.toDoubleOrNull()
                    if (name.isNotEmpty() && amountValue != null && amountValue > 0 && type.isNotEmpty()) {
                        val investment = Investment(
                            id = System.currentTimeMillis(),
                            name = name,
                            amount = amountValue,
                            type = type,
                            description = description.ifEmpty { null },
                            imageUri = null,
                            date = Date(),
                            isPast = false
                        )
                        onAddInvestment(investment)
                    }
                }
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditInvestmentDialog(
    investment: Investment,
    onDismiss: () -> Unit,
    onUpdateInvestment: (Investment) -> Unit
) {
    var name by remember { mutableStateOf(investment.name) }
    var amount by remember { mutableStateOf(investment.amount.toString()) }
    var type by remember { mutableStateOf(investment.type) }
    var description by remember { mutableStateOf(investment.description ?: "") }
    var expanded by remember { mutableStateOf(false) }
    
    val investmentTypes = listOf("Stock", "Crypto", "Bond", "ETF", "Mutual Fund", "Real Estate", "Other")
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Investment") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Investment Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = type,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Type") },
                        trailingIcon = { 
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) 
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        investmentTypes.forEach { investmentType ->
                            DropdownMenuItem(
                                text = { Text(investmentType) },
                                onClick = {
                                    type = investmentType
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val amountValue = amount.toDoubleOrNull()
                    if (name.isNotEmpty() && amountValue != null && amountValue > 0 && type.isNotEmpty()) {
                        val updatedInvestment = investment.copy(
                            name = name,
                            amount = amountValue,
                            type = type,
                            description = description.ifEmpty { null }
                        )
                        onUpdateInvestment(updatedInvestment)
                    }
                }
            ) {
                Text("Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DeleteConfirmationDialog(
    investmentName: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete Investment") },
        text = { 
            Text("Are you sure you want to delete \"$investmentName\"? This action cannot be undone.") 
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun LiquidateInvestmentDialog(
    investment: Investment,
    onDismiss: () -> Unit,
    onLiquidate: (Double) -> Unit
) {
    var liquidationAmount by remember { mutableStateOf(investment.amount.toString()) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Liquidate Investment") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Liquidating: ${investment.name}")
                Text(
                    text = "Original investment: ${NumberFormatUtils.formatAmount(investment.amount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                OutlinedTextField(
                    value = liquidationAmount,
                    onValueChange = { liquidationAmount = it },
                    label = { Text("Liquidation Amount") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                
                Text(
                    text = "This will add the liquidation amount as income to your balance.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val amount = liquidationAmount.toDoubleOrNull()
                    if (amount != null && amount > 0) {
                        onLiquidate(amount)
                    }
                }
            ) {
                Text("Liquidate")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun InvestmentScreenPreview() {
    AllInOneTheme {
        InvestmentScreen()
    }
} 
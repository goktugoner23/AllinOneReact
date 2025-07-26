package com.example.allinone.ui.futures

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.allinone.api.AccountData
import com.example.allinone.data.BinanceFutures
import com.example.allinone.data.BinanceBalance
import com.example.allinone.ui.theme.ExpenseRed
import com.example.allinone.ui.theme.FuturesYellow
import com.example.allinone.ui.theme.IncomeGreen
import com.example.allinone.viewmodels.FuturesViewModel
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs

@Composable
fun FuturesScreen(
    viewModel: FuturesViewModel = hiltViewModel()
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("USD-M", "COIN-M")
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Tab Row
        TabRow(
            selectedTabIndex = selectedTab,
            modifier = Modifier.fillMaxWidth(),
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    text = { Text(title) },
                    selected = selectedTab == index,
                    onClick = { selectedTab = index }
                )
            }
        }
        
        // Tab Content
        when (selectedTab) {
            0 -> UsdMFuturesScreen(viewModel = viewModel)
            1 -> CoinMFuturesScreen(viewModel = viewModel)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsdMFuturesScreen(
    viewModel: FuturesViewModel = hiltViewModel()
) {
    var showTpSlDialog by remember { mutableStateOf(false) }
    var selectedPosition by remember { mutableStateOf<BinanceFutures?>(null) }
    
    // Collect state from ViewModel
    val positions by viewModel.usdMPositions.collectAsStateWithLifecycle()
    val balance by viewModel.usdMBalance.collectAsStateWithLifecycle()
    val account by viewModel.usdMAccount.collectAsStateWithLifecycle()
    val connectionStatus by viewModel.usdMConnectionStatus.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()
    
    val connectionStatusText = when (connectionStatus) {
        FuturesViewModel.ConnectionStatus.CONNECTED -> "Connected"
        FuturesViewModel.ConnectionStatus.CONNECTING -> "Connecting..."
        FuturesViewModel.ConnectionStatus.DISCONNECTED -> "Disconnected"
    }
    
    fun refreshData() {
        viewModel.refreshUsdMData()
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Header with connection status and refresh button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "USD-M Futures",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ConnectionStatusChip(status = connectionStatusText)
                    
                    IconButton(
                        onClick = { refreshData() },
                        enabled = !isLoading
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                }
            }
        }
        
        item {
            // Enhanced Account Info Card
            EnhancedFuturesAccountCard(
                account = account,
                balance = balance,
                currency = "USDT"
            )
        }
        
        errorMessage?.let { message ->
            item {
                ErrorCard(
                    message = message,
                    onRetry = {
                        viewModel.clearError()
                        refreshData()
                    }
                )
            }
        }
        
        if (isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
        
        if (positions.isEmpty() && !isLoading) {
            item {
                EmptyPositionsCard()
            }
        } else {
            items(positions) { position ->
                val enhancedData = viewModel.getEnhancedPositionData(position, isUsdM = true)
                EnhancedFuturesPositionCard(
                    enhancedData = enhancedData,
                    onClick = {
                        selectedPosition = position
                        showTpSlDialog = true
                    }
                )
            }
        }
    }
    
    // TP/SL Dialog
    if (showTpSlDialog && selectedPosition != null) {
        TpSlDialog(
            position = selectedPosition!!,
            onDismiss = { showTpSlDialog = false },
            onConfirm = { takeProfit, stopLoss ->
                // Handle TP/SL update with real API calls
                val position = selectedPosition!!
                if (takeProfit > 0) {
                    viewModel.setUsdMTakeProfit(
                        symbol = position.symbol,
                        side = if (position.positionAmt > 0) "SELL" else "BUY",
                        price = takeProfit,
                        quantity = kotlin.math.abs(position.positionAmt)
                    )
                }
                if (stopLoss > 0) {
                    viewModel.setUsdMStopLoss(
                        symbol = position.symbol,
                        side = if (position.positionAmt > 0) "SELL" else "BUY",
                        price = stopLoss,
                        quantity = kotlin.math.abs(position.positionAmt)
                    )
                }
                showTpSlDialog = false
            },
            onClosePosition = {
                // Close the entire position at market price
                val position = selectedPosition!!
                viewModel.closeUsdMPosition(
                    symbol = position.symbol,
                    quantity = null // Close entire position
                )
                showTpSlDialog = false
            }
        )
    }
}

@Composable
fun CoinMFuturesScreen(
    viewModel: FuturesViewModel = hiltViewModel()
) {
    var showTpSlDialog by remember { mutableStateOf(false) }
    var selectedPosition by remember { mutableStateOf<BinanceFutures?>(null) }
    
    // Collect state from ViewModel
    val positions by viewModel.coinMPositions.collectAsStateWithLifecycle()
    val balance by viewModel.coinMBalance.collectAsStateWithLifecycle()
    val account by viewModel.coinMAccount.collectAsStateWithLifecycle()
    val connectionStatus by viewModel.coinMConnectionStatus.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()
    
    val connectionStatusText = when (connectionStatus) {
        FuturesViewModel.ConnectionStatus.CONNECTED -> "Connected"
        FuturesViewModel.ConnectionStatus.CONNECTING -> "Connecting..."
        FuturesViewModel.ConnectionStatus.DISCONNECTED -> "Disconnected"
    }
    
    fun refreshData() {
        viewModel.refreshCoinMData()
    }
    
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
                    text = "COIN-M Futures",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ConnectionStatusChip(status = connectionStatusText)
                    
                    IconButton(
                        onClick = { refreshData() },
                        enabled = !isLoading
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                }
            }
        }
        
        item {
            // Enhanced Account Info Card
            EnhancedFuturesAccountCard(
                account = account,
                balance = balance,
                currency = "BTC"
            )
        }
        
        errorMessage?.let { message ->
            item {
                ErrorCard(
                    message = message,
                    onRetry = {
                        viewModel.clearError()
                        refreshData()
                    }
                )
            }
        }
        
        if (isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
        
        if (positions.isEmpty() && !isLoading) {
            item {
                EmptyPositionsCard()
            }
        } else {
            items(positions) { position ->
                val enhancedData = viewModel.getEnhancedPositionData(position, isUsdM = false)
                EnhancedFuturesPositionCard(
                    enhancedData = enhancedData,
                    onClick = {
                        selectedPosition = position
                        showTpSlDialog = true
                    }
                )
            }
        }
    }
    
    if (showTpSlDialog && selectedPosition != null) {
        TpSlDialog(
            position = selectedPosition!!,
            onDismiss = { showTpSlDialog = false },
            onConfirm = { takeProfit, stopLoss ->
                // Handle TP/SL update with real API calls
                val position = selectedPosition!!
                if (takeProfit > 0) {
                    viewModel.setCoinMTakeProfit(
                        symbol = position.symbol,
                        side = if (position.positionAmt > 0) "SELL" else "BUY",
                        price = takeProfit,
                        quantity = kotlin.math.abs(position.positionAmt)
                    )
                }
                if (stopLoss > 0) {
                    viewModel.setCoinMStopLoss(
                        symbol = position.symbol,
                        side = if (position.positionAmt > 0) "SELL" else "BUY",
                        price = stopLoss,
                        quantity = kotlin.math.abs(position.positionAmt)
                    )
                }
                showTpSlDialog = false
            },
            onClosePosition = {
                // Close the entire position at market price
                val position = selectedPosition!!
                viewModel.closeCoinMPosition(
                    symbol = position.symbol,
                    quantity = null // Close entire position
                )
                showTpSlDialog = false
            }
        )
    }
}

@Composable
fun ConnectionStatusChip(status: String) {
    val backgroundColor = when (status) {
        "Connected" -> IncomeGreen
        "Connecting..." -> FuturesYellow
        else -> ExpenseRed
    }
    
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor.copy(alpha = 0.1f)),
        color = Color.Transparent
    ) {
        Text(
            text = status,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = backgroundColor
        )
    }
}

@Composable
fun FuturesAccountCard(
    balance: String,
    unrealizedPnl: String,
    marginRatio: String,
    currency: String = "USDT"
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
                text = "Account Info",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                AccountInfoItem(
                    label = "Balance",
                    value = "$balance $currency",
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                AccountInfoItem(
                    label = "Unrealized PnL",
                    value = "$unrealizedPnl $currency",
                    color = if (unrealizedPnl.startsWith("-")) ExpenseRed else IncomeGreen
                )
                
                AccountInfoItem(
                    label = "Margin Ratio",
                    value = marginRatio,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
fun AccountInfoItem(
    label: String,
    value: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun FuturesPositionCard(
    position: BinanceFutures,
    onClick: () -> Unit
) {
    // Calculate ROE (Return on Equity) = unrealized PnL / initial margin
    val initialMargin = abs(position.positionAmt * position.entryPrice / position.leverage)
    val roe = if (initialMargin > 0) position.unRealizedProfit / initialMargin else 0.0
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = position.symbol,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Surface(
                    modifier = Modifier.clip(RoundedCornerShape(4.dp)),
                    color = if (position.positionAmt > 0) IncomeGreen else ExpenseRed
                ) {
                    Text(
                        text = position.positionSide,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // PnL and ROE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "PnL",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatCurrency(position.unRealizedProfit),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (position.unRealizedProfit >= 0) IncomeGreen else ExpenseRed
                    )
                }
                
                Column {
                    Text(
                        text = "ROE",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${String.format("%.2f", roe * 100)}%",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (roe >= 0) IncomeGreen else ExpenseRed
                    )
                }
                
                Column {
                    Text(
                        text = "Leverage",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${position.leverage}x",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Size and margin
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Size",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${formatNumber(abs(position.positionAmt))} ${getBaseAsset(position.symbol)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Column {
                    Text(
                        text = "Entry Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatPrice(position.entryPrice),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Column {
                    Text(
                        text = "Mark Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatPrice(position.markPrice),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Margin Type and Liquidation Price
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Margin",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = position.marginType,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Column {
                    Text(
                        text = "Liq. Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (position.liquidationPrice > 0) formatPrice(position.liquidationPrice) else "N/A",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (position.liquidationPrice > 0) ExpenseRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyPositionsCard() {
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
                imageVector = Icons.AutoMirrored.Filled.ShowChart,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "No Open Positions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Your futures positions will appear here when you have active trades",
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
    onRetry: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = ExpenseRed
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = "Connection Error",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            
            IconButton(onClick = onRetry) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Retry",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TpSlDialog(
    position: BinanceFutures,
    onDismiss: () -> Unit,
    onConfirm: (takeProfit: Double, stopLoss: Double) -> Unit,
    onClosePosition: () -> Unit
) {
    var takeProfitText by remember { mutableStateOf("") }
    var stopLossText by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Set TP/SL - ${position.symbol}",
                color = MaterialTheme.colorScheme.onSurface
            )
        },
        text = {
            Column {
                Text(
                    text = "Current Position: ${if (position.positionAmt > 0) "LONG" else "SHORT"} ${abs(position.positionAmt)} at ${formatPrice(position.entryPrice)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                OutlinedTextField(
                    value = takeProfitText,
                    onValueChange = { takeProfitText = it },
                    label = { Text("Take Profit Price") },
                    placeholder = { Text("Enter take profit price") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = stopLossText,
                    onValueChange = { stopLossText = it },
                    label = { Text("Stop Loss Price") },
                    placeholder = { Text("Enter stop loss price") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Mark Price: ${formatPrice(position.markPrice)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TextButton(
                    onClick = {
                        val tp = takeProfitText.toDoubleOrNull() ?: 0.0
                        val sl = stopLossText.toDoubleOrNull() ?: 0.0
                        onConfirm(tp, sl)
                    }
                ) {
                    Text("Set TP/SL")
                }
                
                TextButton(
                    onClick = onClosePosition,
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Close Position")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

// Enhanced UI Components

@Composable
fun EnhancedFuturesAccountCard(
    account: AccountData?,
    balance: BinanceBalance?,
    currency: String = "USDT"
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
                text = "Account Overview",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            if (account != null) {
                // Main balance row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AccountInfoItem(
                        label = "Wallet Balance",
                        value = "${formatBalance(account.totalWalletBalance)} $currency",
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    AccountInfoItem(
                        label = "Unrealized PnL",
                        value = "${formatBalance(account.totalUnrealizedProfit)} $currency",
                        color = if (account.totalUnrealizedProfit >= 0) IncomeGreen else ExpenseRed
                    )
                    
                    AccountInfoItem(
                        label = "Margin Balance",
                        value = "${formatBalance(account.totalMarginBalance)} $currency",
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Secondary row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AccountInfoItem(
                        label = "Available",
                        value = "${formatBalance(account.maxWithdrawAmount)} $currency",
                        color = IncomeGreen
                    )
                    
                    val marginRatio = if (account.totalMarginBalance > 0) {
                        (account.totalPositionInitialMargin / account.totalMarginBalance * 100)
                    } else 0.0
                    
                    AccountInfoItem(
                        label = "Margin Ratio",
                        value = "${String.format("%.2f", marginRatio)}%",
                        color = when {
                            marginRatio >= 80.0 -> ExpenseRed
                            marginRatio >= 60.0 -> FuturesYellow
                            else -> IncomeGreen
                        }
                    )
                    
                    AccountInfoItem(
                        label = "Position Margin",
                        value = "${formatBalance(account.totalPositionInitialMargin)} $currency",
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            } else {
                // Fallback to basic balance info
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AccountInfoItem(
                        label = "Balance",
                        value = "${balance?.balance?.let { formatBalance(it) } ?: "0.00"} $currency",
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    AccountInfoItem(
                        label = "Unrealized PnL",
                        value = "${balance?.crossUnPnl?.let { formatBalance(it) } ?: "0.00"} $currency",
                        color = if ((balance?.crossUnPnl ?: 0.0) >= 0) IncomeGreen else ExpenseRed
                    )
                    
                    AccountInfoItem(
                        label = "Available",
                        value = "${balance?.availableBalance?.let { formatBalance(it) } ?: "0.00"} $currency",
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
fun EnhancedFuturesPositionCard(
    enhancedData: FuturesViewModel.EnhancedPositionData,
    onClick: () -> Unit
) {
    val position = enhancedData.position
    val tpOrder = enhancedData.takeProfitOrder
    val slOrder = enhancedData.stopLossOrder
    
    // Calculate ROE (Return on Equity) = unrealized PnL / initial margin
    val initialMargin = abs(position.positionAmt * position.entryPrice / position.leverage)
    val roe = if (initialMargin > 0) position.unRealizedProfit / initialMargin else 0.0
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = position.symbol,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Surface(
                        modifier = Modifier.clip(RoundedCornerShape(4.dp)),
                        color = if (position.positionAmt > 0) IncomeGreen else ExpenseRed
                    ) {
                        Text(
                            text = position.positionSide,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White
                        )
                    }
                    
                    // TP/SL Indicator
                    if (tpOrder != null || slOrder != null) {
                        Surface(
                            modifier = Modifier.clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = "TP/SL",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // PnL and ROE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "PnL",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatCurrency(position.unRealizedProfit),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (position.unRealizedProfit >= 0) IncomeGreen else ExpenseRed
                    )
                }
                
                Column {
                    Text(
                        text = "ROE",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${String.format("%.2f", roe * 100)}%",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (roe >= 0) IncomeGreen else ExpenseRed
                    )
                }
                
                Column {
                    Text(
                        text = "Leverage",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${position.leverage}x",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Size and prices
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Size",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${formatNumber(abs(position.positionAmt))} ${getBaseAsset(position.symbol)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Column {
                    Text(
                        text = "Entry Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatPrice(position.entryPrice),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Column {
                    Text(
                        text = "Mark Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatPrice(position.markPrice),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Liquidation price and TP/SL info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Liq. Price",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (position.liquidationPrice > 0) formatPrice(position.liquidationPrice) else "N/A",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (position.liquidationPrice > 0) ExpenseRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Column {
                    Text(
                        text = "Take Profit",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = tpOrder?.let { formatPrice(it.stopPrice) } ?: "Not Set",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (tpOrder != null) IncomeGreen else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Column {
                    Text(
                        text = "Stop Loss",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = slOrder?.let { formatPrice(it.stopPrice) } ?: "Not Set",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (slOrder != null) ExpenseRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Margin info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Margin",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = position.marginType,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                if (position.marginType == "ISOLATED" && position.isolatedMargin > 0) {
                    Column {
                        Text(
                            text = "Isolated Margin",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = formatPrice(position.isolatedMargin),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}

// Helper functions
private fun formatCurrency(amount: Double): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale.US)
    formatter.minimumFractionDigits = 2
    formatter.maximumFractionDigits = 2
    return formatter.format(amount)
}

private fun formatBalance(amount: Double): String {
    return when {
        amount >= 1000000 -> String.format("%.2fM", amount / 1000000)
        amount >= 1000 -> String.format("%.2fK", amount / 1000)
        amount >= 1.0 -> String.format("%.2f", amount)
        else -> String.format("%.8f", amount)
    }
}

private fun formatPrice(price: Double): String {
    return if (price >= 1.0) {
        String.format("%.2f", price)
    } else {
        String.format("%.7f", price)
    }
}

private fun formatNumber(number: Double): String {
    return String.format("%.8f", number)
}

private fun getBaseAsset(symbol: String): String {
    return when {
        symbol.contains("USD_PERP") -> symbol.replace("USD_PERP", "")
        symbol.contains("USDC_PERP") -> symbol.replace("USDC_PERP", "")
        symbol.contains("USDT") -> symbol.replace("USDT", "")
        symbol.contains("USDC") -> symbol.replace("USDC", "")
        symbol.contains("USD") -> symbol.replace("USD", "")
        else -> symbol
    }
}

@Preview(showBackground = true)
@Composable
fun FuturesScreenPreview() {
    MaterialTheme {
        FuturesScreen()
    }
} 
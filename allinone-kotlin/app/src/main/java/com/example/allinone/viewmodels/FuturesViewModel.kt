package com.example.allinone.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.allinone.api.*
import com.example.allinone.data.BinanceFutures
import com.example.allinone.data.BinanceBalance
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import javax.inject.Inject

@HiltViewModel
class FuturesViewModel @Inject constructor() : ViewModel() {
    
    private val repository = ExternalBinanceRepository()
    
    companion object {
        private const val TAG = "FuturesViewModel"
        private const val REFRESH_INTERVAL = 5000L // 5 seconds
    }
    
    // USD-M Futures State
    private val _usdMPositions = MutableStateFlow<List<BinanceFutures>>(emptyList())
    val usdMPositions: StateFlow<List<BinanceFutures>> = _usdMPositions.asStateFlow()
    
    private val _usdMBalance = MutableStateFlow<BinanceBalance?>(null)
    val usdMBalance: StateFlow<BinanceBalance?> = _usdMBalance.asStateFlow()
    
    private val _usdMConnectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val usdMConnectionStatus: StateFlow<ConnectionStatus> = _usdMConnectionStatus.asStateFlow()
    
    // USD-M Orders (for TP/SL tracking)
    private val _usdMOrders = MutableStateFlow<List<OrderData>>(emptyList())
    val usdMOrders: StateFlow<List<OrderData>> = _usdMOrders.asStateFlow()
    
    // USD-M Account Info
    private val _usdMAccount = MutableStateFlow<AccountData?>(null)
    val usdMAccount: StateFlow<AccountData?> = _usdMAccount.asStateFlow()

    // COIN-M Futures State
    private val _coinMPositions = MutableStateFlow<List<BinanceFutures>>(emptyList())
    val coinMPositions: StateFlow<List<BinanceFutures>> = _coinMPositions.asStateFlow()
    
    private val _coinMBalance = MutableStateFlow<BinanceBalance?>(null)
    val coinMBalance: StateFlow<BinanceBalance?> = _coinMBalance.asStateFlow()
    
    private val _coinMConnectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val coinMConnectionStatus: StateFlow<ConnectionStatus> = _coinMConnectionStatus.asStateFlow()
    
    // COIN-M Orders (for TP/SL tracking)
    private val _coinMOrders = MutableStateFlow<List<OrderData>>(emptyList())
    val coinMOrders: StateFlow<List<OrderData>> = _coinMOrders.asStateFlow()
    
    // COIN-M Account Info
    private val _coinMAccount = MutableStateFlow<AccountData?>(null)
    val coinMAccount: StateFlow<AccountData?> = _coinMAccount.asStateFlow()

    // Common State
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    private val _webSocketStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val webSocketStatus: StateFlow<ConnectionStatus> = _webSocketStatus.asStateFlow()
    
    enum class ConnectionStatus {
        CONNECTED, CONNECTING, DISCONNECTED
    }
    
    init {
        // Start initial data fetch
        refreshUsdMData()
        refreshCoinMData()
        
        // Start periodic refresh
        startPeriodicRefresh()
        
        // Check WebSocket status
        checkWebSocketStatus()
        
        // Start live position tracking
        startLivePositionTracking()
    }
    
    // USD-M Futures Methods
    fun refreshUsdMData() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _usdMConnectionStatus.value = ConnectionStatus.CONNECTING
                
                // Fetch positions
                repository.getFuturesPositions().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            val positions = response.data.map { position ->
                                BinanceFutures(
                                    symbol = position.symbol,
                                    positionAmt = position.positionAmount,
                                    entryPrice = position.entryPrice,
                                    markPrice = position.markPrice,
                                    unRealizedProfit = position.unrealizedProfit,
                                    liquidationPrice = 0.0, // Not provided by external API
                                    leverage = position.leverage.toInt(),
                                    marginType = position.marginType,
                                    isolatedMargin = position.isolatedMargin,
                                    isAutoAddMargin = false,
                                    positionSide = position.positionSide,
                                    futuresType = "USD-M"
                                )
                            }.filter { it.positionAmt != 0.0 } // Only show positions with non-zero amount
                            
                            _usdMPositions.value = positions
                            _usdMConnectionStatus.value = ConnectionStatus.CONNECTED
                            _errorMessage.value = null
                            
                            Log.d(TAG, "Successfully fetched ${positions.size} USD-M positions")
                        } else {
                            _usdMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                            _errorMessage.value = response.error ?: "Failed to fetch USD-M positions"
                            Log.e(TAG, "USD-M positions fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _usdMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "USD-M positions fetch error: ${error.message}")
                    }
                )
                
                // Fetch account data
                repository.getFuturesAccount().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _usdMAccount.value = response.data
                            
                            // Also create balance for backward compatibility
                            val usdtAsset = response.data.assets.find { it.asset == "USDT" }
                            if (usdtAsset != null) {
                                val balance = BinanceBalance(
                                    asset = usdtAsset.asset,
                                    balance = usdtAsset.walletBalance,
                                    crossWalletBalance = usdtAsset.marginBalance,
                                    crossUnPnl = usdtAsset.unrealizedProfit,
                                    availableBalance = usdtAsset.maxWithdrawAmount,
                                    maxWithdrawAmount = usdtAsset.maxWithdrawAmount,
                                    marginAvailable = true,
                                    futuresType = "USD-M"
                                )
                                _usdMBalance.value = balance
                            }
                            
                            Log.d(TAG, "Successfully fetched USD-M account data")
                        } else {
                            Log.e(TAG, "USD-M account fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        Log.e(TAG, "USD-M account fetch error: ${error.message}")
                    }
                )
                
                // Fetch orders for TP/SL tracking
                repository.getFuturesOrders().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _usdMOrders.value = response.data
                            Log.d(TAG, "Successfully fetched ${response.data.size} USD-M orders")
                        } else {
                            Log.e(TAG, "USD-M orders fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        Log.e(TAG, "USD-M orders fetch error: ${error.message}")
                    }
                )
                
            } catch (e: Exception) {
                _usdMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                _errorMessage.value = e.message
                Log.e(TAG, "USD-M data refresh error: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    // COIN-M Futures Methods
    fun refreshCoinMData() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _coinMConnectionStatus.value = ConnectionStatus.CONNECTING
                
                // Fetch positions
                repository.getCoinMPositions().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            val positions = response.data.map { position ->
                                BinanceFutures(
                                    symbol = position.symbol,
                                    positionAmt = position.positionAmount,
                                    entryPrice = position.entryPrice,
                                    markPrice = position.markPrice,
                                    unRealizedProfit = position.unrealizedProfit,
                                    liquidationPrice = 0.0, // Not provided by external API
                                    leverage = position.leverage.toInt(),
                                    marginType = position.marginType,
                                    isolatedMargin = position.isolatedMargin,
                                    isAutoAddMargin = false,
                                    positionSide = position.positionSide,
                                    futuresType = "COIN-M"
                                )
                            }.filter { it.positionAmt != 0.0 } // Only show positions with non-zero amount
                            
                            _coinMPositions.value = positions
                            _coinMConnectionStatus.value = ConnectionStatus.CONNECTED
                            _errorMessage.value = null
                            
                            Log.d(TAG, "Successfully fetched ${positions.size} COIN-M positions")
                        } else {
                            _coinMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                            _errorMessage.value = response.error ?: "Failed to fetch COIN-M positions"
                            Log.e(TAG, "COIN-M positions fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _coinMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "COIN-M positions fetch error: ${error.message}")
                    }
                )
                
                // Fetch account data
                repository.getCoinMAccount().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _coinMAccount.value = response.data
                            
                            // Also create balance for backward compatibility
                            val btcAsset = response.data.assets.find { it.asset == "BTC" }
                            if (btcAsset != null) {
                                val balance = BinanceBalance(
                                    asset = btcAsset.asset,
                                    balance = btcAsset.walletBalance,
                                    crossWalletBalance = btcAsset.marginBalance,
                                    crossUnPnl = btcAsset.unrealizedProfit,
                                    availableBalance = btcAsset.maxWithdrawAmount,
                                    maxWithdrawAmount = btcAsset.maxWithdrawAmount,
                                    marginAvailable = true,
                                    futuresType = "COIN-M"
                                )
                                _coinMBalance.value = balance
                            }
                            
                            Log.d(TAG, "Successfully fetched COIN-M account data")
                        } else {
                            Log.e(TAG, "COIN-M account fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        Log.e(TAG, "COIN-M account fetch error: ${error.message}")
                    }
                )
                
                // Fetch orders for TP/SL tracking
                repository.getCoinMOrders().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _coinMOrders.value = response.data
                            Log.d(TAG, "Successfully fetched ${response.data.size} COIN-M orders")
                        } else {
                            Log.e(TAG, "COIN-M orders fetch failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        Log.e(TAG, "COIN-M orders fetch error: ${error.message}")
                    }
                )
                
            } catch (e: Exception) {
                _coinMConnectionStatus.value = ConnectionStatus.DISCONNECTED
                _errorMessage.value = e.message
                Log.e(TAG, "COIN-M data refresh error: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    // TP/SL Methods
    fun setUsdMTakeProfit(symbol: String, side: String, price: Double, quantity: Double) {
        viewModelScope.launch {
            try {
                repository.setFuturesTPSL(symbol, side, price, null, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "USD-M Take Profit set successfully for $symbol")
                            // Refresh data to get updated positions
                            refreshUsdMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to set Take Profit"
                            Log.e(TAG, "USD-M Take Profit failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "USD-M Take Profit error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e(TAG, "USD-M Take Profit exception: ${e.message}")
            }
        }
    }
    
    fun setUsdMStopLoss(symbol: String, side: String, price: Double, quantity: Double) {
        viewModelScope.launch {
            try {
                repository.setFuturesTPSL(symbol, side, null, price, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "USD-M Stop Loss set successfully for $symbol")
                            // Refresh data to get updated positions
                            refreshUsdMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to set Stop Loss"
                            Log.e(TAG, "USD-M Stop Loss failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "USD-M Stop Loss error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e(TAG, "USD-M Stop Loss exception: ${e.message}")
            }
        }
    }
    
    fun setCoinMTakeProfit(symbol: String, side: String, price: Double, quantity: Double) {
        viewModelScope.launch {
            try {
                repository.setCoinMTPSL(symbol, side, price, null, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "COIN-M Take Profit set successfully for $symbol")
                            // Refresh data to get updated positions
                            refreshCoinMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to set Take Profit"
                            Log.e(TAG, "COIN-M Take Profit failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "COIN-M Take Profit error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e(TAG, "COIN-M Take Profit exception: ${e.message}")
            }
        }
    }
    
    fun setCoinMStopLoss(symbol: String, side: String, price: Double, quantity: Double) {
        viewModelScope.launch {
            try {
                repository.setCoinMTPSL(symbol, side, null, price, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "COIN-M Stop Loss set successfully for $symbol")
                            // Refresh data to get updated positions
                            refreshCoinMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to set Stop Loss"
                            Log.e(TAG, "COIN-M Stop Loss failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = error.message ?: "Unknown error"
                        Log.e(TAG, "COIN-M Stop Loss error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e(TAG, "COIN-M Stop Loss exception: ${e.message}")
            }
        }
    }
    
    // WebSocket Status
    private fun checkWebSocketStatus() {
        viewModelScope.launch {
            try {
                repository.getWebSocketStatus().fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            val isConnected = response.data.usdm.isConnected && response.data.coinm.isConnected
                            _webSocketStatus.value = if (isConnected) {
                                ConnectionStatus.CONNECTED
                            } else {
                                ConnectionStatus.DISCONNECTED
                            }
                            Log.d(TAG, "WebSocket Status - USD-M: ${response.data.usdm.isConnected}, COIN-M: ${response.data.coinm.isConnected}")
                        } else {
                            _webSocketStatus.value = ConnectionStatus.DISCONNECTED
                            Log.e(TAG, "WebSocket status check failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _webSocketStatus.value = ConnectionStatus.DISCONNECTED
                        Log.e(TAG, "WebSocket status check error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _webSocketStatus.value = ConnectionStatus.DISCONNECTED
                Log.e(TAG, "WebSocket status check exception: ${e.message}")
            }
        }
    }
    
    // Periodic refresh (silent updates without loading indicators)
    private fun startPeriodicRefresh() {
        viewModelScope.launch {
            while (true) {
                delay(REFRESH_INTERVAL)
                refreshUsdMDataSilently()
                refreshCoinMDataSilently()
                checkWebSocketStatus()
            }
        }
    }
    
    // Close Position Methods
    fun closeUsdMPosition(symbol: String, quantity: Double? = null) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                repository.closeFuturesPosition(symbol, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "USD-M position closed successfully for $symbol")
                            // Refresh positions after closing
                            refreshUsdMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to close position"
                            Log.e(TAG, "USD-M position close failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = "Error closing position: ${error.message}"
                        Log.e(TAG, "USD-M position close error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Error closing position: ${e.message}"
                Log.e(TAG, "USD-M position close exception: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun closeCoinMPosition(symbol: String, quantity: Double? = null) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                repository.closeCoinMPosition(symbol, quantity).fold(
                    onSuccess = { response ->
                        if (response.success) {
                            Log.d(TAG, "COIN-M position closed successfully for $symbol")
                            // Refresh positions after closing
                            refreshCoinMData()
                        } else {
                            _errorMessage.value = response.error ?: "Failed to close position"
                            Log.e(TAG, "COIN-M position close failed: ${response.error}")
                        }
                    },
                    onFailure = { error ->
                        _errorMessage.value = "Error closing position: ${error.message}"
                        Log.e(TAG, "COIN-M position close error: ${error.message}")
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Error closing position: ${e.message}"
                Log.e(TAG, "COIN-M position close exception: ${e.message}")
            } finally {
                _isLoading.value = false
            }
        }
    }

    // WebSocket and Live Data Methods
    fun startLivePositionTracking() {
        viewModelScope.launch {
            try {
                // Subscribe to USD-M futures ticker updates
                _usdMPositions.value.forEach { position ->
                    repository.subscribeToFuturesTicker(position.symbol)
                }
                
                // Subscribe to COIN-M futures ticker updates  
                _coinMPositions.value.forEach { position ->
                    repository.subscribeToCoinMTicker(position.symbol)
                }
                
                Log.d(TAG, "Started live position tracking for ${_usdMPositions.value.size} USD-M and ${_coinMPositions.value.size} COIN-M positions")
            } catch (e: Exception) {
                _errorMessage.value = "Error starting live tracking: ${e.message}"
                Log.e(TAG, "Live tracking error: ${e.message}")
            }
        }
    }

    // Silent refresh methods (no loading indicator for automatic updates)
    private fun refreshUsdMDataSilently() {
        viewModelScope.launch {
            try {
                // Get positions
                val positionsResult = repository.getFuturesPositions()
                positionsResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            val positions = response.data.map { position ->
                                BinanceFutures(
                                    symbol = position.symbol,
                                    positionAmt = position.positionAmount,
                                    entryPrice = position.entryPrice,
                                    markPrice = position.markPrice,
                                    unRealizedProfit = position.unrealizedProfit,
                                    liquidationPrice = 0.0, // Not provided by external API
                                    leverage = position.leverage.toInt(),
                                    marginType = position.marginType,
                                    isolatedMargin = position.isolatedMargin,
                                    isAutoAddMargin = position.isAutoAddMargin,
                                    positionSide = position.positionSide,
                                    futuresType = "USD-M"
                                )
                            }.filter { it.positionAmt != 0.0 } // Only show positions with non-zero amount
                            _usdMPositions.value = positions
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh USD-M positions: ${it.message}")
                    }
                )
                
                // Get account data
                val accountResult = repository.getFuturesAccount()
                accountResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _usdMAccount.value = response.data
                            
                            // Update balance for backward compatibility
                            val usdtAsset = response.data.assets.find { it.asset == "USDT" }
                            if (usdtAsset != null) {
                                val balance = BinanceBalance(
                                    asset = usdtAsset.asset,
                                    balance = usdtAsset.walletBalance,
                                    crossWalletBalance = usdtAsset.marginBalance,
                                    crossUnPnl = usdtAsset.unrealizedProfit,
                                    availableBalance = usdtAsset.maxWithdrawAmount,
                                    maxWithdrawAmount = usdtAsset.maxWithdrawAmount,
                                    marginAvailable = true,
                                    futuresType = "USD-M"
                                )
                                _usdMBalance.value = balance
                            }
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh USD-M account: ${it.message}")
                    }
                )
                
                // Get orders for TP/SL tracking
                val ordersResult = repository.getFuturesOrders()
                ordersResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _usdMOrders.value = response.data
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh USD-M orders: ${it.message}")
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception in refreshUsdMDataSilently: ${e.message}")
            }
        }
    }
    
    private fun refreshCoinMDataSilently() {
        viewModelScope.launch {
            try {
                // Get positions
                val positionsResult = repository.getCoinMPositions()
                positionsResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            val positions = response.data.map { position ->
                                BinanceFutures(
                                    symbol = position.symbol,
                                    positionAmt = position.positionAmount,
                                    entryPrice = position.entryPrice,
                                    markPrice = position.markPrice,
                                    unRealizedProfit = position.unrealizedProfit,
                                    liquidationPrice = 0.0, // Not provided by external API
                                    leverage = position.leverage.toInt(),
                                    marginType = position.marginType,
                                    isolatedMargin = position.isolatedMargin,
                                    isAutoAddMargin = position.isAutoAddMargin,
                                    positionSide = position.positionSide,
                                    futuresType = "COIN-M"
                                )
                            }.filter { it.positionAmt != 0.0 } // Only show positions with non-zero amount
                            _coinMPositions.value = positions
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh COIN-M positions: ${it.message}")
                    }
                )
                
                // Get account data
                val accountResult = repository.getCoinMAccount()
                accountResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _coinMAccount.value = response.data
                            
                            // Update balance for backward compatibility
                            val btcAsset = response.data.assets.find { it.asset == "BTC" }
                            if (btcAsset != null) {
                                val balance = BinanceBalance(
                                    asset = btcAsset.asset,
                                    balance = btcAsset.walletBalance,
                                    crossWalletBalance = btcAsset.marginBalance,
                                    crossUnPnl = btcAsset.unrealizedProfit,
                                    availableBalance = btcAsset.maxWithdrawAmount,
                                    maxWithdrawAmount = btcAsset.maxWithdrawAmount,
                                    marginAvailable = true,
                                    futuresType = "COIN-M"
                                )
                                _coinMBalance.value = balance
                            }
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh COIN-M account: ${it.message}")
                    }
                )
                
                // Get orders for TP/SL tracking
                val ordersResult = repository.getCoinMOrders()
                ordersResult.fold(
                    onSuccess = { response ->
                        if (response.success && response.data != null) {
                            _coinMOrders.value = response.data
                        }
                    },
                    onFailure = { 
                        Log.e(TAG, "Failed to refresh COIN-M orders: ${it.message}")
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception in refreshCoinMDataSilently: ${e.message}")
            }
        }
    }

    // Manual refresh
    fun refreshAll() {
        refreshUsdMData()
        refreshCoinMData()
        checkWebSocketStatus()
    }
    
    // Helper functions for enhanced position data
    
    /**
     * Calculate liquidation price for a position
     * Formula: Liq Price = Entry Price ± (Wallet Balance × 0.9) / (Position Size × MMR)
     * Where MMR (Maintenance Margin Rate) varies by leverage
     */
    fun calculateLiquidationPrice(
        entryPrice: Double,
        positionSize: Double,
        leverage: Int,
        walletBalance: Double,
        isLong: Boolean
    ): Double {
        if (positionSize == 0.0 || leverage == 0) return 0.0
        
        // Maintenance margin rate based on leverage (simplified)
        val mmr = when {
            leverage <= 5 -> 0.005  // 0.5%
            leverage <= 10 -> 0.01  // 1%
            leverage <= 20 -> 0.025 // 2.5%
            leverage <= 50 -> 0.05  // 5%
            else -> 0.10           // 10%
        }
        
        val maintenanceAmount = kotlin.math.abs(positionSize) * entryPrice * mmr
        val availableMargin = walletBalance * 0.9 // 90% of wallet balance
        
        return if (isLong) {
            entryPrice - (availableMargin - maintenanceAmount) / kotlin.math.abs(positionSize)
        } else {
            entryPrice + (availableMargin - maintenanceAmount) / kotlin.math.abs(positionSize)
        }.coerceAtLeast(0.0)
    }
    
    /**
     * Get TP/SL orders for a specific symbol
     */
    fun getTpSlOrders(symbol: String, isUsdM: Boolean = true): Pair<OrderData?, OrderData?> {
        val orders = if (isUsdM) _usdMOrders.value else _coinMOrders.value
        
        var takeProfitOrder: OrderData? = null
        var stopLossOrder: OrderData? = null
        
        orders.filter { it.symbol == symbol && it.status == "NEW" }.forEach { order ->
            when (order.type) {
                "TAKE_PROFIT", "TAKE_PROFIT_MARKET" -> takeProfitOrder = order
                "STOP", "STOP_MARKET", "STOP_LOSS", "STOP_LOSS_LIMIT" -> stopLossOrder = order
            }
        }
        
        return Pair(takeProfitOrder, stopLossOrder)
    }
    
    /**
     * Calculate enhanced position data with liquidation price and TP/SL info
     */
    fun getEnhancedPositionData(position: BinanceFutures, isUsdM: Boolean = true): EnhancedPositionData {
        val account = if (isUsdM) _usdMAccount.value else _coinMAccount.value
        val walletBalance = account?.totalWalletBalance ?: 0.0
        
        val isLong = position.positionAmt > 0
        val liquidationPrice = calculateLiquidationPrice(
            entryPrice = position.entryPrice,
            positionSize = position.positionAmt,
            leverage = position.leverage,
            walletBalance = walletBalance,
            isLong = isLong
        )
        
        val (tpOrder, slOrder) = getTpSlOrders(position.symbol, isUsdM)
        
        return EnhancedPositionData(
            position = position.copy(liquidationPrice = liquidationPrice),
            takeProfitOrder = tpOrder,
            stopLossOrder = slOrder,
            marginRatio = account?.let { 
                if (it.totalMarginBalance > 0) it.totalPositionInitialMargin / it.totalMarginBalance else 0.0 
            } ?: 0.0
        )
    }
    
    data class EnhancedPositionData(
        val position: BinanceFutures,
        val takeProfitOrder: OrderData?,
        val stopLossOrder: OrderData?,
        val marginRatio: Double
    )
    
    // Error handling
    fun clearError() {
        _errorMessage.value = null
    }
    
    override fun onCleared() {
        super.onCleared()
        // Clean up resources if needed
        Log.d(TAG, "FuturesViewModel cleared")
    }
} 
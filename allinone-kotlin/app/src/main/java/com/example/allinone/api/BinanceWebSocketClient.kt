package com.example.allinone.api

import okhttp3.*
import okio.ByteString
import com.google.gson.Gson
import com.google.gson.JsonObject
import timber.log.Timber
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.TimeUnit

class BinanceWebSocketClient(
    private val onMessage: (String, JsonObject) -> Unit,
    private val onConnectionChange: (Boolean) -> Unit
) {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()
    private val isConnected = AtomicBoolean(false)
    private val shouldReconnect = AtomicBoolean(true)
    private val reconnectScope = CoroutineScope(Dispatchers.IO)
    
    companion object {
        private const val TAG = "BinanceWebSocketClient"
        private const val HEARTBEAT_INTERVAL = 30000L // 30 seconds
        private const val RECONNECT_DELAY = 5000L // 5 seconds
        private const val MAX_RECONNECT_ATTEMPTS = 10
    }
    
    private var reconnectAttempts = 0
    
    fun connect() {
        try {
            Timber.d("Connecting to WebSocket: ${ExternalBinanceApiClient.WS_URL}")

            val request = Request.Builder()
                .url(ExternalBinanceApiClient.WS_URL)
                .build()

            webSocket = client.newWebSocket(request, object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    isConnected.set(true)
                    reconnectAttempts = 0
                    onConnectionChange(true)
                    Timber.d("WebSocket connected successfully")
                    
                    // Send initial connection message if needed
                    sendConnectionMessage()
                }
                
                override fun onMessage(webSocket: WebSocket, text: String) {
                    try {
                        Timber.d("Raw WebSocket message received: $text")
                        val jsonObject = gson.fromJson(text, JsonObject::class.java)
                        val type = jsonObject.get("type")?.asString ?: "unknown"

                        Timber.d("Parsed message type: $type")
                        Timber.d("Full message JSON: $jsonObject")
                        
                        // Handle different message types
                        when (type) {
                            "welcome" -> {
                                Timber.d("Welcome message received")
                                handleWelcomeMessage(jsonObject)
                            }
                            "ticker" -> {
                                Timber.d("Ticker update received: $jsonObject")
                                onMessage(type, jsonObject)
                            }
                            "depth" -> {
                                Timber.d("Depth update received")
                                onMessage(type, jsonObject)
                            }
                            "trade" -> {
                                Timber.d("Trade update received")
                                onMessage(type, jsonObject)
                            }
                            "positions_update" -> {
                                Timber.d("Positions update received")
                                onMessage(type, jsonObject)
                            }
                            "order_update" -> {
                                Timber.d("Order update received")
                                onMessage(type, jsonObject)
                            }
                            "balance_update" -> {
                                Timber.d("Balance update received")
                                onMessage(type, jsonObject)
                            }
                            "pong" -> {
                                Timber.d("Pong received")
                                onMessage(type, jsonObject)
                            }
                            "error" -> {
                                val error = jsonObject.get("error")?.asString ?: "Unknown error"
                                Timber.e("WebSocket error message: $error")
                                onMessage(type, jsonObject)
                            }
                            else -> {
                                Timber.d("Unknown message type: $type, full message: $jsonObject")
                                onMessage(type, jsonObject)
                            }
                        }
                    } catch (e: Exception) {
                        Timber.e("Error parsing WebSocket message: ${e.message}, raw message: $text")
                    }
                }
                
                override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                    // Handle binary messages if needed
                    Timber.d("Binary message received: ${bytes.hex()}")
                }

                override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                    Timber.d("WebSocket closing: $reason (code: $code)")
                    webSocket.close(1000, null)
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    isConnected.set(false)
                    onConnectionChange(false)
                    Timber.d("WebSocket closed: $reason (code: $code)")

                    // Attempt reconnection if it was not intentional
                    if (shouldReconnect.get() && code != 1000) {
                        attemptReconnect()
                    }
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    isConnected.set(false)
                    onConnectionChange(false)
                    Timber.e("WebSocket error: ${t.message}")

                    // Attempt reconnection on error
                    if (shouldReconnect.get()) {
                        attemptReconnect()
                    }
                }
            })

        } catch (e: Exception) {
            Timber.e("Failed to connect WebSocket: ${e.message}")
            isConnected.set(false)
            onConnectionChange(false)
            
            if (shouldReconnect.get()) {
                attemptReconnect()
            }
        }
    }
    
    private fun handleWelcomeMessage(message: JsonObject) {
        Timber.d("Processing welcome message")
        val welcomeMsg = message.get("message")?.asString
        if (welcomeMsg != null) {
            Timber.d("Welcome: $welcomeMsg")
        }
    }
    
    private fun sendConnectionMessage() {
        try {
            val connectionMsg = JsonObject().apply {
                addProperty("type", "connection")
                addProperty("source", "android_app")
                addProperty("timestamp", System.currentTimeMillis())
            }
            send(connectionMsg.toString())
            Timber.d("Connection message sent")
        } catch (e: Exception) {
            Timber.e("Failed to send connection message: ${e.message}")
        }
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            Timber.w("Max reconnection attempts reached. Stopping reconnection.")
            shouldReconnect.set(false)
            return
        }

        reconnectAttempts++
        Timber.d("Attempting reconnection #$reconnectAttempts")
        
        reconnectScope.launch {
            delay(RECONNECT_DELAY)
            if (shouldReconnect.get() && !isConnected.get()) {
                connect()
            }
        }
    }
    
    fun disconnect() {
        shouldReconnect.set(false)
        webSocket?.close(1000, "Disconnected by user")
        isConnected.set(false)
        Timber.d("WebSocket disconnected")
    }

    fun isConnected(): Boolean = isConnected.get()

    fun sendHeartbeat() {
        try {
            if (isConnected.get()) {
                val heartbeat = JsonObject().apply {
                    addProperty("type", "ping")
                    addProperty("timestamp", System.currentTimeMillis())
                }
                send(heartbeat.toString())
            }
        } catch (e: Exception) {
            Timber.e("Failed to send heartbeat: ${e.message}")
        }
    }

    fun send(message: String) {
        try {
            if (isConnected.get()) {
                webSocket?.send(message)
                Timber.d("Message sent: $message")
            } else {
                Timber.w("Cannot send message - WebSocket not connected")
            }
        } catch (e: Exception) {
            Timber.e("Failed to send message: ${e.message}")
        }
    }
    
    fun subscribeToTicker(symbol: String) {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "ticker")
            addProperty("symbol", symbol)
        }
        send(subscribeMsg.toString())
    }
    
    fun subscribeToDepth(symbol: String) {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "depth")
            addProperty("symbol", symbol)
        }
        send(subscribeMsg.toString())
    }
    
    fun subscribeToTrades(symbol: String) {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "trades")
            addProperty("symbol", symbol)
        }
        send(subscribeMsg.toString())
    }
    
    fun subscribeToPositions() {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "positions")
        }
        send(subscribeMsg.toString())
    }
    
    fun subscribeToOrders() {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "orders")
        }
        send(subscribeMsg.toString())
    }
    
    fun subscribeToBalance() {
        val subscribeMsg = JsonObject().apply {
            addProperty("type", "subscribe")
            addProperty("channel", "balance")
        }
        send(subscribeMsg.toString())
    }
    
    fun unsubscribeFromTicker(symbol: String) {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "ticker")
            addProperty("symbol", symbol)
        }
        send(unsubscribeMsg.toString())
    }
    
    fun unsubscribeFromDepth(symbol: String) {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "depth")
            addProperty("symbol", symbol)
        }
        send(unsubscribeMsg.toString())
    }
    
    fun unsubscribeFromTrades(symbol: String) {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "trades")
            addProperty("symbol", symbol)
        }
        send(unsubscribeMsg.toString())
    }
    
    fun unsubscribeFromPositions() {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "positions")
        }
        send(unsubscribeMsg.toString())
    }
    
    fun unsubscribeFromOrders() {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "orders")
        }
        send(unsubscribeMsg.toString())
    }
    
    fun unsubscribeFromBalance() {
        val unsubscribeMsg = JsonObject().apply {
            addProperty("type", "unsubscribe")
            addProperty("channel", "balance")
        }
        send(unsubscribeMsg.toString())
    }
    
    // Alias methods for compatibility with existing fragments
    fun subscribeToPositionUpdates() = subscribeToPositions()
    fun subscribeToOrderUpdates() = subscribeToOrders()
    fun subscribeToBalanceUpdates() = subscribeToBalance()
    fun subscribeToTickerUpdates(symbol: String) = subscribeToTicker(symbol)
    
    fun resetConnection() {
        disconnect()
        // Reconnect after a short delay
        reconnectScope.launch {
            delay(1000)
            if (shouldReconnect.get()) {
                connect()
            }
        }
    }
} 
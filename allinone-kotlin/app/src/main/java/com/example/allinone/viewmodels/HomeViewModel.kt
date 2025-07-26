package com.example.allinone.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.*
import com.example.allinone.data.*
import com.example.allinone.firebase.FirebaseRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import java.util.Calendar
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: FirebaseRepository
) : ViewModel() {

    private val _allTransactions = MutableStateFlow<List<Transaction>>(emptyList())
    val allTransactions: StateFlow<List<Transaction>> = _allTransactions.asStateFlow()

    private val _allInvestments = MutableStateFlow<List<Investment>>(emptyList())
    val allInvestments: StateFlow<List<Investment>> = _allInvestments.asStateFlow()

    // Combined balance that includes both transactions and investments
    private val _combinedBalance = MutableStateFlow(Triple(0.0, 0.0, 0.0))
    val combinedBalance: StateFlow<Triple<Double, Double, Double>> = _combinedBalance.asStateFlow()

    // Investment-related code
    private val _selectedInvestment = MutableStateFlow<Investment?>(null)
    val selectedInvestment: StateFlow<Investment?> = _selectedInvestment.asStateFlow()

    init {
        // Collect transactions from the repository flow
        viewModelScope.launch {
            repository.transactions.collect { transactions ->
                _allTransactions.value = transactions
                updateCombinedBalance()
            }
        }

        // Collect investments from the repository flow
        viewModelScope.launch {
            repository.investments.collect { investments ->
                _allInvestments.value = investments
                updateCombinedBalance()
            }
        }
    }

    private fun updateCombinedBalance() {
        viewModelScope.launch {
            try {
                // Get all transactions from repository
                val transactions = repository.transactions.value
                
                // Log transaction count for debugging
                Log.d("HomeViewModel", "Calculating balance with ${transactions.size} transactions")
                
                // Calculate total income and expense from ALL transactions
                val totalIncome = transactions.filter { it.isIncome }.sumOf { it.amount }
                val totalExpense = transactions.filter { !it.isIncome }.sumOf { it.amount }
                
                // Calculate balance
                val balance = totalIncome - totalExpense
                
                _combinedBalance.value = Triple(totalIncome, totalExpense, balance)
                
                // Log detailed breakdown for debugging
                val incomeByType = transactions.filter { it.isIncome }
                    .groupBy { it.type }
                    .mapValues { it.value.sumOf { transaction -> transaction.amount } }
                
                val expenseByType = transactions.filter { !it.isIncome }
                    .groupBy { it.type }
                    .mapValues { it.value.sumOf { transaction -> transaction.amount } }
                
                Log.d("HomeViewModel", "Balance calculation: Income=$totalIncome, Expense=$totalExpense, Balance=$balance")
                Log.d("HomeViewModel", "Income by type: $incomeByType")
                Log.d("HomeViewModel", "Expense by type: $expenseByType")
                Log.d("HomeViewModel", "Total transactions count: ${transactions.size}")
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error updating combined balance: ${e.message}", e)
            }
        }
    }

    fun addTransaction(
        amount: Double,
        type: String,
        description: String?,
        isIncome: Boolean,
        category: String
    ) {
        viewModelScope.launch {
            // Add transaction to Firebase through repository
            repository.insertTransaction(
                amount = amount,
                type = type,
                description = description,
                isIncome = isIncome,
                category = category
            )

            // Force refresh data to ensure UI consistency
            repository.refreshTransactions()
        }
    }

    /**
     * Add income to an existing investment. This method will:
     * 1. Add a transaction record for the income
     * 2. Deduct the income amount from the investment's value
     */
    fun addIncomeToInvestment(amount: Double, investment: Investment, description: String?) {
        viewModelScope.launch {
            // Create a meaningful description that includes the user's description if provided
            val transactionDescription = if (!description.isNullOrBlank()) {
                "Return from investment: ${investment.name} - $description"
            } else {
                "Return from investment: ${investment.name}"
            }

            // Add as a regular income transaction
            repository.insertTransaction(
                amount = amount,
                type = "Investment",
                description = transactionDescription,
                isIncome = true,
                category = investment.type
            )

            // Update the investment by DECREASING its amount (deduct the income)
            val updatedInvestment = investment.copy(
                amount = investment.amount - amount
            )

            // Update the investment in the repository
            repository.updateInvestment(updatedInvestment)

            // Refresh data
            repository.refreshTransactions()
            repository.refreshInvestments()
        }
    }

    /**
     * Add an expense to an existing investment. This method will:
     * 1. Add a transaction record for the expense
     * 2. Increase the investment's value by the expense amount
     */
    fun addExpenseToInvestment(amount: Double, investment: Investment, description: String?) {
        viewModelScope.launch {
            // Create a meaningful description that includes the user's description if provided
            val transactionDescription = if (!description.isNullOrBlank()) {
                "Additional investment in: ${investment.name} - $description"
            } else {
                "Additional investment in: ${investment.name}"
            }

            // Add as a regular expense transaction
            repository.insertTransaction(
                amount = amount,
                type = "Investment",
                description = transactionDescription,
                isIncome = false,
                category = investment.type
            )

            // Update the investment by INCREASING its amount (add the expense)
            val updatedInvestment = investment.copy(
                amount = investment.amount + amount
            )

            // Update the investment in the repository
            repository.updateInvestment(updatedInvestment)

            // Refresh data
            repository.refreshTransactions()
            repository.refreshInvestments()
        }
    }

    fun setSelectedInvestment(investment: Investment) {
        _selectedInvestment.value = investment
    }

    fun clearSelectedInvestment() {
        _selectedInvestment.value = null
    }

    fun deleteTransaction(transaction: Transaction) {
        viewModelScope.launch {
            // Delete from repository
            repository.deleteTransaction(transaction)

            // Force refresh to ensure UI consistency
            repository.refreshTransactions()
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            repository.refreshAllData()
        }
    }

    /**
     * Force refresh transactions and recalculate balance
     * This method should be called when transactions page becomes visible
     */
    fun forceRefreshTransactions() {
        viewModelScope.launch {
            try {
                Log.d("HomeViewModel", "Force refreshing transactions...")
                // Refresh transactions from Firebase
                repository.refreshTransactions()
                // Balance will be recalculated automatically through the flow
                Log.d("HomeViewModel", "Force refresh completed")
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error force refreshing transactions: ${e.message}", e)
            }
        }
    }

    fun addInvestmentAndTransaction(investment: Investment) {
        viewModelScope.launch {
            try {
                // Add the investment first
                repository.insertInvestment(investment)

                // Only create a transaction if it's not a past investment
                if (!investment.isPast) {
                    // Create a transaction record for this investment (as an expense)
                    val transaction = Transaction(
                        id = (System.currentTimeMillis() / 1000).toInt().toLong(), // Simple ID generation
                        amount = investment.amount,
                        date = Calendar.getInstance().time,
                        description = "Investment in ${investment.name}",
                        category = investment.type,
                        type = "Investment",
                        isIncome = false
                    )

                    // Add the transaction
                    repository.insertTransaction(
                        amount = transaction.amount,
                        type = transaction.type,
                        description = transaction.description,
                        isIncome = transaction.isIncome,
                        category = transaction.category
                    )
                    Log.d("HomeViewModel", "Created transaction for investment: ${transaction.description} with amount: ${transaction.amount}")
                } else {
                    Log.d("HomeViewModel", "No transaction created for past investment: ${investment.name}")
                }

                // Refresh data after adding
                refreshData()
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error adding investment: ${e.message}", e)
            }
        }
    }

    fun updateInvestment(investment: Investment) {
        viewModelScope.launch {
            try {
                // Update the investment in the repository
                repository.updateInvestment(investment)
                
                // Refresh data after updating
                repository.refreshInvestments()
                Log.d("HomeViewModel", "Updated investment: ${investment.name}")
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error updating investment: ${e.message}", e)
            }
        }
    }

    fun deleteInvestment(investment: Investment) {
        viewModelScope.launch {
            try {
                Log.d("HomeViewModel", "Deleting investment: ${investment.name}")

                // First, find and delete related transactions
                val transactions = _allTransactions.value
                val relatedTransactions = transactions.filter { transaction ->
                    (transaction.type == "Investment" || transaction.type.contains("Investment")) &&
                    (
                        transaction.description.contains(investment.name) ||
                        transaction.description.contains("Investment in ${investment.name}") ||
                        transaction.description.contains("Return from investment: ${investment.name}")
                    )
                }

                // Delete each related transaction
                relatedTransactions.forEach { transaction ->
                    Log.d("HomeViewModel", "Deleting related transaction: ${transaction.description}")
                    repository.deleteTransaction(transaction)
                }

                // Then delete the investment
                repository.deleteInvestment(investment)

                // Refresh data after deletion
                refreshData()
                Log.d("HomeViewModel", "Successfully deleted investment: ${investment.name}")
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error deleting investment: ${e.message}", e)
            }
        }
    }
}
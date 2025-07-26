package com.example.allinone.ui

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import com.example.allinone.adapters.CategoryDropdownAdapter
import android.widget.AutoCompleteTextView
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.allinone.MainActivity
import com.example.allinone.R
import com.example.allinone.adapters.CategorySpending
import com.example.allinone.adapters.CategorySpendingAdapter
import com.example.allinone.adapters.TransactionReportAdapter
import com.example.allinone.config.TransactionCategories
import com.example.allinone.data.Transaction
import com.example.allinone.databinding.FragmentTransactionReportBinding
import com.example.allinone.firebase.FirebaseRepository
import com.github.mikephil.charting.components.Legend
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import com.github.mikephil.charting.data.PieData
import com.github.mikephil.charting.data.PieDataSet
import com.github.mikephil.charting.data.PieEntry
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.github.mikephil.charting.formatter.PercentFormatter
import com.github.mikephil.charting.utils.ColorTemplate
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import com.example.allinone.utils.NumberFormatUtils
import java.util.concurrent.TimeUnit
import kotlin.math.abs

enum class GroupingPeriod {
    DAYS, WEEKS, MONTHS
}

class TransactionReportFragment : BaseFragment() {
    private var _binding: FragmentTransactionReportBinding? = null
    private val binding get() = _binding!!

    private val firebaseRepository by lazy { FirebaseRepository(requireContext()) }
    private val categorySpendingAdapter by lazy { CategorySpendingAdapter() }

    // Using NumberFormatUtils for consistent formatting

    // Filter options
    private val dateRangeOptions = arrayOf("Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year", "All Time")
    private var selectedDateRange = "Last 30 Days"
    private var selectedCategory = "All Categories"

    // Filtered transactions
    private var allTransactions: List<Transaction> = emptyList()
    private var filteredTransactions: List<Transaction> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTransactionReportBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Let MainActivity handle the toolbar configuration

        setupRecyclerViews()
        setupFilterOptions()
        setupApplyButton()
        setupCharts()
        observeTransactions()
    }

    private fun setupRecyclerViews() {
        // Category spending list
        binding.topCategoriesRecyclerView.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = categorySpendingAdapter
        }
    }

    private fun setupCharts() {
        // Setup pie chart
        binding.categoryPieChart.apply {
            description.isEnabled = false
            setUsePercentValues(true)
            setDrawEntryLabels(false)
            legend.isEnabled = false // Disable the legend
            setDrawCenterText(true)
            centerText = "Expenses"
            setExtraOffsets(20f, 0f, 20f, 0f)
        }

        // Setup line chart
        binding.lineChart.apply {
            description.isEnabled = false
            axisRight.isEnabled = false
            legend.textSize = 12f
            legend.verticalAlignment = Legend.LegendVerticalAlignment.BOTTOM
            legend.horizontalAlignment = Legend.LegendHorizontalAlignment.CENTER
            legend.orientation = Legend.LegendOrientation.HORIZONTAL
            legend.setDrawInside(false)
            xAxis.position = XAxis.XAxisPosition.BOTTOM
            xAxis.granularity = 1f
            xAxis.textSize = 10f
            axisLeft.textSize = 10f
        }
    }

    private fun setupFilterOptions() {
        // Date range dropdown
        val dateRangeAdapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_dropdown_item_1line,
            dateRangeOptions
        )
        (binding.dateRangeLayout.editText as? AutoCompleteTextView)?.setAdapter(dateRangeAdapter)
        (binding.dateRangeLayout.editText as? AutoCompleteTextView)?.setText(selectedDateRange, false)
        (binding.dateRangeLayout.editText as? AutoCompleteTextView)?.setOnItemClickListener { _, _, position, _ ->
            selectedDateRange = dateRangeOptions[position]
        }

        // Category dropdown
        val allCategories = mutableListOf("All Categories")
        allCategories.addAll(TransactionCategories.CATEGORIES)

        val categoryAdapter = CategoryDropdownAdapter(
            requireContext(),
            allCategories.toTypedArray()
        )
        (binding.categoryLayout.editText as? AutoCompleteTextView)?.setAdapter(categoryAdapter)
        (binding.categoryLayout.editText as? AutoCompleteTextView)?.setText(selectedCategory, false)
        (binding.categoryLayout.editText as? AutoCompleteTextView)?.setOnItemClickListener { _, _, position, _ ->
            selectedCategory = allCategories[position]
        }
    }

    private fun setupApplyButton() {
        binding.applyFiltersButton.setOnClickListener {
            applyFilters()
        }
    }

    // Pagination buttons removed

    private fun observeTransactions() {
        viewLifecycleOwner.lifecycleScope.launch {
            firebaseRepository.transactions.collectLatest { transactions ->
                allTransactions = transactions

                // Apply filters for the main transaction list
                applyFilters()
            }
        }
    }

    private fun applyFilters() {
        // Filter by date range
        val startDate = getStartDateFromRange(selectedDateRange)

        // Apply all filters
        filteredTransactions = allTransactions.filter { transaction ->
            val passesDateFilter = startDate == null || transaction.date.after(startDate) || transaction.date == startDate

            // Enhanced category filter to include investment subcategories
            val passesCategoryFilter = when {
                selectedCategory == "All Categories" -> true
                selectedCategory == "Investment" -> {
                    // Include both "Investment" category and all investment subcategories (Crypto, Stock, etc.)
                    transaction.category == "Investment" ||
                    (transaction.type == "Investment" && transaction.category != "")
                }
                else -> transaction.category == selectedCategory
            }

            passesDateFilter && passesCategoryFilter
        }.sortedByDescending { it.date }

        // Update UI with filtered transactions
        updateSummarySection()
        updateChart()
        updateCategorySpending()
        updateTransactionInsights()
    }

    private fun getStartDateFromRange(range: String): Date? {
        val calendar = Calendar.getInstance()

        when (range) {
            "Last 7 Days" -> calendar.add(Calendar.DAY_OF_MONTH, -7)
            "Last 30 Days" -> calendar.add(Calendar.DAY_OF_MONTH, -30)
            "Last 90 Days" -> calendar.add(Calendar.DAY_OF_MONTH, -90)
            "This Year" -> {
                calendar.set(Calendar.DAY_OF_MONTH, 1)
                calendar.set(Calendar.MONTH, Calendar.JANUARY)
            }
            "All Time" -> return null
        }

        return calendar.time
    }

    // Transaction list removed

    private fun updateSummarySection() {
        // Check if binding is still available
        if (_binding == null) return
        
        val totalIncome = filteredTransactions.filter { it.isIncome }.sumOf { it.amount }
        val totalExpense = filteredTransactions.filter { !it.isIncome }.sumOf { it.amount }
        val balance = totalIncome - totalExpense

        binding.totalIncomeText.text = NumberFormatUtils.formatAmount(totalIncome)
        binding.totalExpenseText.text = NumberFormatUtils.formatAmount(totalExpense)
        binding.balanceText.text = NumberFormatUtils.formatAmount(balance)

        // Set balance text color based on positive/negative
        if (balance < 0) {
            binding.balanceText.setTextColor(ContextCompat.getColor(requireContext(), R.color.red))
        } else {
            binding.balanceText.setTextColor(ContextCompat.getColor(requireContext(), R.color.green))
        }
    }

    private fun updateChart() {
        // Check if binding is still available
        if (_binding == null) return
        
        if (filteredTransactions.isEmpty()) {
            binding.lineChart.setNoDataText("No data available")
            binding.lineChart.invalidate()
            return
        }

        // Group transactions by day/week/month depending on date range
        val groupedTransactions = groupTransactionsByTimePeriod()

        // Prepare data for chart
        val incomeEntries = mutableListOf<Entry>()
        val expenseEntries = mutableListOf<Entry>()
        val labels = mutableListOf<String>()

        groupedTransactions.forEachIndexed { index, (date, transactions) ->
            val totalIncome = transactions.filter { it.isIncome }.sumOf { it.amount }.toFloat()
            val totalExpense = transactions.filter { !it.isIncome }.sumOf { it.amount }.toFloat()

            incomeEntries.add(Entry(index.toFloat(), totalIncome))
            expenseEntries.add(Entry(index.toFloat(), totalExpense))

            // Format date for label
            val dateFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
            labels.add(dateFormat.format(date))
        }

        // Create datasets
        val incomeDataSet = LineDataSet(incomeEntries, "Income").apply {
            color = ContextCompat.getColor(requireContext(), R.color.green)
            setCircleColor(ContextCompat.getColor(requireContext(), R.color.green))
            lineWidth = 2f
            circleRadius = 4f
            setDrawCircleHole(false)
            mode = LineDataSet.Mode.CUBIC_BEZIER
            setDrawValues(false)
        }

        val expenseDataSet = LineDataSet(expenseEntries, "Expense").apply {
            color = ContextCompat.getColor(requireContext(), R.color.red)
            setCircleColor(ContextCompat.getColor(requireContext(), R.color.red))
            lineWidth = 2f
            circleRadius = 4f
            setDrawCircleHole(false)
            mode = LineDataSet.Mode.CUBIC_BEZIER
            setDrawValues(false)
        }

        // Create line data with both datasets
        val lineData = LineData(incomeDataSet, expenseDataSet)

        // Configure chart
        binding.lineChart.apply {
            data = lineData
            description.isEnabled = false
            legend.isEnabled = true

            // Configure X axis (dates)
            xAxis.apply {
                position = XAxis.XAxisPosition.BOTTOM
                valueFormatter = IndexAxisValueFormatter(labels)
                granularity = 1f
                setDrawGridLines(false)
                textColor = Color.GRAY
            }

            // Configure Y axis (amounts)
            axisLeft.apply {
                setDrawGridLines(true)
                textColor = Color.GRAY
            }

            axisRight.isEnabled = false

            // Set zoom and interaction
            setTouchEnabled(true)
            isDragEnabled = true
            setScaleEnabled(true)
            setPinchZoom(true)

            // Refresh the chart
            animateX(1000)
            invalidate()
        }
    }

    private fun groupTransactionsByTimePeriod(): List<Pair<Date, List<Transaction>>> {
        val calendar = Calendar.getInstance()

        // Determine grouping period based on selected date range
        val groupingPeriod = when (selectedDateRange) {
            "Last 7 Days" -> GroupingPeriod.DAYS
            "Last 30 Days" -> GroupingPeriod.DAYS
            "Last 90 Days" -> GroupingPeriod.WEEKS
            "This Year" -> GroupingPeriod.MONTHS
            else -> GroupingPeriod.MONTHS
        }

        // Group transactions by period
        val groupedTransactions = mutableMapOf<String, MutableList<Transaction>>()
        val dateFormat = when (groupingPeriod) {
            GroupingPeriod.DAYS -> SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            GroupingPeriod.WEEKS -> SimpleDateFormat("yyyy-'W'ww", Locale.getDefault())
            GroupingPeriod.MONTHS -> SimpleDateFormat("yyyy-MM", Locale.getDefault())
        }

        // Group transactions
        for (transaction in filteredTransactions) {
            val key = dateFormat.format(transaction.date)
            if (!groupedTransactions.containsKey(key)) {
                groupedTransactions[key] = mutableListOf()
            }
            groupedTransactions[key]?.add(transaction)
        }

        // Convert to list of pairs and sort by date
        return groupedTransactions.map { (dateKey, transactions) ->
            // Parse date key back to Date object for sorting
            val date = when (groupingPeriod) {
                GroupingPeriod.DAYS -> dateFormat.parse(dateKey) ?: Date()
                GroupingPeriod.WEEKS -> {
                    // Parse week format (yyyy-'W'ww)
                    val year = dateKey.substring(0, 4).toInt()
                    val week = dateKey.substring(6).toInt()
                    calendar.clear()
                    calendar.set(Calendar.YEAR, year)
                    calendar.set(Calendar.WEEK_OF_YEAR, week)
                    calendar.time
                }
                GroupingPeriod.MONTHS -> {
                    // Parse month format (yyyy-MM)
                    val year = dateKey.substring(0, 4).toInt()
                    val month = dateKey.substring(5).toInt() - 1 // Calendar months are 0-based
                    calendar.clear()
                    calendar.set(Calendar.YEAR, year)
                    calendar.set(Calendar.MONTH, month)
                    calendar.time
                }
            }

            Pair(date, transactions)
        }.sortedBy { it.first }
    }

    private fun updateCategorySpending() {
        // Check if binding is still available
        if (_binding == null) return
        
        if (filteredTransactions.isEmpty()) {
            binding.categoryPieChart.setNoDataText("No data available")
            binding.categoryPieChart.invalidate()
            binding.topCategoriesRecyclerView.visibility = View.GONE
            return
        }

        // Only consider expenses for category spending
        val expenses = filteredTransactions.filter { !it.isIncome }
        if (expenses.isEmpty()) {
            binding.categoryPieChart.setNoDataText("No expenses in this period")
            binding.categoryPieChart.invalidate()
            binding.topCategoriesRecyclerView.visibility = View.GONE
            return
        }

        binding.topCategoriesRecyclerView.visibility = View.VISIBLE

        // Group expenses by category and calculate totals
        val categoryTotals = expenses
            .groupBy { it.category.ifEmpty { "Uncategorized" } }
            .mapValues { (_, transactions) -> transactions.sumOf { it.amount } }
            .toList()
            .sortedByDescending { it.second }

        val totalExpenses = categoryTotals.sumOf { it.second }

        // Prepare data for pie chart
        val pieEntries = mutableListOf<PieEntry>()
        val colors = mutableListOf<Int>()

        // Prepare data for the category list
        val categorySpendingList = mutableListOf<CategorySpending>()

        // Use a set of predefined colors
        val colorSet = listOf(
            Color.rgb(64, 89, 128), Color.rgb(149, 165, 124),
            Color.rgb(217, 184, 162), Color.rgb(191, 134, 134),
            Color.rgb(179, 48, 80), Color.rgb(193, 37, 82),
            Color.rgb(255, 102, 0), Color.rgb(245, 199, 0),
            Color.rgb(106, 150, 31), Color.rgb(179, 100, 53)
        )

        // Add top categories (up to 5)
        categoryTotals.take(5).forEachIndexed { index, (category, amount) ->
            val percentage = (amount / totalExpenses) * 100
            pieEntries.add(PieEntry(percentage.toFloat(), category))

            val color = colorSet[index % colorSet.size]
            colors.add(color)

            categorySpendingList.add(
                CategorySpending(
                    category = category,
                    amount = amount,
                    percentage = percentage,
                    color = color
                )
            )
        }

        // If there are more categories, group them as "Others"
        if (categoryTotals.size > 5) {
            val otherAmount = categoryTotals.drop(5).sumOf { it.second }
            val otherPercentage = (otherAmount / totalExpenses) * 100

            if (otherAmount > 0) {
                pieEntries.add(PieEntry(otherPercentage.toFloat(), "Others"))
                val otherColor = Color.GRAY
                colors.add(otherColor)

                categorySpendingList.add(
                    CategorySpending(
                        category = "Others",
                        amount = otherAmount,
                        percentage = otherPercentage,
                        color = otherColor
                    )
                )
            }
        }

        // Create dataset
        val dataSet = PieDataSet(pieEntries, "Categories")
        dataSet.colors = colors
        dataSet.sliceSpace = 3f
        dataSet.selectionShift = 5f

        // Create pie data
        val pieData = PieData(dataSet)
        pieData.setValueFormatter(PercentFormatter(binding.categoryPieChart))
        pieData.setValueTextSize(11f)
        pieData.setValueTextColor(Color.WHITE)

        // Update chart
        binding.categoryPieChart.data = pieData
        binding.categoryPieChart.invalidate()

        // Update category list
        categorySpendingAdapter.updateCategories(categorySpendingList)
    }

    private fun updateTransactionInsights() {
        // Check if binding is still available
        if (_binding == null) return
        
        if (filteredTransactions.isEmpty()) {
            binding.largestExpenseText.text = NumberFormatUtils.formatAmount(0.0)
            binding.mostSpentCategoryText.text = "N/A"
            binding.averageTransactionText.text = NumberFormatUtils.formatAmount(0.0)
            binding.transactionCountText.text = "0 transactions"
            return
        }

        // Largest expense
        val largestExpense = filteredTransactions
            .filter { !it.isIncome }
            .maxByOrNull { it.amount }

        binding.largestExpenseText.text = if (largestExpense != null) {
            NumberFormatUtils.formatAmount(largestExpense.amount)
        } else {
            NumberFormatUtils.formatAmount(0.0)
        }

        // Most spent category
        val expenses = filteredTransactions.filter { !it.isIncome }
        val mostSpentCategory = if (expenses.isNotEmpty()) {
            expenses
                .groupBy { it.category.ifEmpty { "Uncategorized" } }
                .mapValues { (_, transactions) -> transactions.sumOf { it.amount } }
                .maxByOrNull { it.value }
        } else null

        binding.mostSpentCategoryText.text = if (mostSpentCategory != null) {
            "${mostSpentCategory.key} (${NumberFormatUtils.formatAmount(mostSpentCategory.value)})"
        } else {
            "N/A"
        }

        // Average transaction
        val totalAmount = filteredTransactions.sumOf { if (it.isIncome) it.amount else -it.amount }
        val averageAmount = if (filteredTransactions.isNotEmpty()) {
            abs(totalAmount) / filteredTransactions.size
        } else 0.0

        binding.averageTransactionText.text = NumberFormatUtils.formatAmount(averageAmount)

        // Transaction count
        val count = filteredTransactions.size
        binding.transactionCountText.text = "$count ${if (count == 1) "transaction" else "transactions"}"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
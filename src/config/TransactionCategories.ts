/**
 * Configuration for transaction categories
 * Centralizes all transaction categories in one place for easier maintenance
 * Matches exactly the Kotlin app's TransactionCategories.kt
 */
export const TransactionCategories = {
  // Main categories list used for dropdown selection (exactly like Kotlin app)
  CATEGORIES: [
    "Salary",
    "Investment", 
    "Wing Tzun",
    "Work",
    "Sports",
    "General",
    "Shopping",
    "Bills",
    "Food",
    "Transport",
    "Game"
  ],

  // Income-specific categories (exactly like Kotlin app)
  INCOME_CATEGORIES: [
    "Salary",
    "Investment",
    "Wing Tzun", 
    "Work"
  ],

  // Expense-specific categories (exactly like Kotlin app)
  EXPENSE_CATEGORIES: [
    "Sports",
    "General",
    "Shopping", 
    "Bills",
    "Food",
    "Transport",
    "Wing Tzun",
    "Work",
    "Game"
  ],

  // Special adjustment categories that are shown separately in reports (exactly like Kotlin app)
  ADJUSTMENT_CATEGORIES: [
    "Wing Tzun Adjustment",
    "Salary Adjustment", 
    "Investment Adjustment",
    "Work Adjustment",
    "General Adjustment"
  ],

  // Map of category names to their icon names (matching Kotlin app)
  CATEGORY_ICONS: {
    "All Categories": { name: "list", color: "#673AB7" },
    "Salary": { name: "cash", color: "#4CAF50" },
    "Investment": { name: "trending-up", color: "#2196F3" },
    "Wing Tzun": { name: "ellipse", color: "#F44336" },
    "Work": { name: "briefcase", color: "#795548" },
    "Sports": { name: "basketball", color: "#E91E63" },
    "General": { name: "information-circle", color: "#607D8B" },
    "Shopping": { name: "bag", color: "#2196F3" },
    "Bills": { name: "receipt", color: "#F44336" },
    "Food": { name: "restaurant", color: "#FF5722" },
    "Transport": { name: "car", color: "#9C27B0" },
    "Game": { name: "game-controller", color: "#3F51B5" }
  }
}; 
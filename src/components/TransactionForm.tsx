import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TransactionCategories } from "../config/TransactionCategories";
import { TransactionService } from "../data/transactionService";
import { YinYangIcon } from "./YinYangIcon";
import { logger } from "../utils/logger";

interface TransactionFormProps {
  onTransactionAdded: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onTransactionAdded,
}) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories exactly like Kotlin app
  const categories = TransactionCategories.CATEGORIES;

  // Debug: Log categories to see if they're loaded
  logger.debug(
    "Available categories",
    { categories, count: categories.length },
    "TransactionForm",
  );

  const handleAddTransaction = async (isIncome: boolean) => {
    // Exact validation logic from Kotlin app
    if (!amount.trim() || !selectedCategory.trim()) {
      Alert.alert("Error", "Please enter both amount and category");
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await TransactionService.addTransaction({
        amount: amountValue,
        type: selectedCategory,
        description: description.trim() || "", // Handle empty description like Kotlin app
        isIncome,
        date: new Date().toISOString(),
        category: selectedCategory,
      });

      // Clear form exactly like Kotlin app
      setAmount("");
      setDescription("");
      setSelectedCategory("");
      setShowCategoryDropdown(false);

      // Notify parent to refresh transactions
      onTransactionAdded();
    } catch (error) {
      logger.error("Error adding transaction", error, "TransactionForm");
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    return numericValue;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChangeText={(text) => setAmount(formatCurrency(text))}
          keyboardType="numeric"
          editable={!isSubmitting}
        />

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.dropdownButtonText,
                !selectedCategory && styles.placeholder,
              ]}
            >
              {selectedCategory || "Category"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          <Modal
            visible={showCategoryDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCategoryDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCategoryDropdown(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {categories.map((category) => {
                    const iconData =
                      TransactionCategories.CATEGORY_ICONS[
                        category as keyof typeof TransactionCategories.CATEGORY_ICONS
                      ];
                    return (
                      <TouchableOpacity
                        key={category}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedCategory(category);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category === "Wing Tzun" ? (
                          <View style={styles.modalItemIcon}>
                            <YinYangIcon
                              size={24}
                              color={iconData?.color || "#F44336"}
                            />
                          </View>
                        ) : (
                          iconData && (
                            <Ionicons
                              name={iconData.name as any}
                              size={24}
                              color={iconData.color}
                              style={styles.modalItemIcon}
                            />
                          )
                        )}
                        <Text style={styles.modalItemText}>{category}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          editable={!isSubmitting}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.incomeButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={() => handleAddTransaction(true)}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.expenseButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={() => handleAddTransaction(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  formContainer: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholder: {
    color: "#999",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  incomeButton: {
    backgroundColor: "#4CAF50",
  },
  expenseButton: {
    backgroundColor: "#F44336",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "80%", // Increased from 70% to 80%
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  modalScroll: {
    maxHeight: 500, // Increased from 200 to 300
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    minHeight: 44,
    backgroundColor: "#fff",
  },
  modalItemIcon: {
    marginRight: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
});

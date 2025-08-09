import React, { useState, useEffect } from "react";
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
import { TransactionCategories } from "@features/transactions/config/TransactionCategories";
import { TransactionService } from "@features/transactions/services/transactionService";
import { YinYangIcon } from "@features/wtregistry/components/YinYangIcon";
import { logger } from "@shared/utils/logger";
import { fetchInvestments, updateInvestment } from "@features/transactions/services/investments";
import { Investment } from "@features/transactions/types/Investment";
import { InvestmentCategories } from "@features/transactions/config/InvestmentCategories";

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
  const [selectedInvestmentType, setSelectedInvestmentType] = useState("");
  const [showInvestmentTypeDropdown, setShowInvestmentTypeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvestmentPicker, setShowInvestmentPicker] = useState(false);
  const [investmentOptions, setInvestmentOptions] = useState<Investment[]>([]);
  const [pendingIsIncome, setPendingIsIncome] = useState<boolean>(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [pendingDescription, setPendingDescription] = useState<string>("");

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

    // If category is Investment, prompt to choose an investment and then adjust the investment amount
    if (selectedCategory === "Investment") {
      try {
        setIsSubmitting(true);
        const investments = await fetchInvestments();
        setInvestmentOptions(investments);
        setPendingIsIncome(isIncome);
        setPendingAmount(amountValue);
        setPendingDescription(description.trim() || "");
        setShowInvestmentPicker(true);
      } catch (error) {
        logger.error("Error loading investments for picker", error, "TransactionForm");
        Alert.alert("Error", "Failed to load investments");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Regular non-investment flow
    setIsSubmitting(true);
    try {
      await TransactionService.addTransaction({
        amount: amountValue,
        type: selectedCategory,
        description: description.trim() || "",
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

  const handleSelectInvestment = async (investment: Investment) => {
    // Following Kotlin logic:
    // - If income: add income transaction and DECREASE investment amount by value
    // - If expense: add expense transaction and INCREASE investment amount by value
    try {
      setIsSubmitting(true);
      // Build description string
      const txDescription = pendingIsIncome
        ? (pendingDescription ? `Return from investment: ${investment.name} - ${pendingDescription}` : `Return from investment: ${investment.name}`)
        : (pendingDescription ? `Investment in ${investment.name} - ${pendingDescription}` : `Investment in ${investment.name}`);

      // 1) Add the transaction
      await TransactionService.addTransaction({
        amount: pendingAmount,
        type: "Investment",
        description: selectedInvestmentType ? `${txDescription} [${selectedInvestmentType}]` : txDescription,
        isIncome: pendingIsIncome,
        date: new Date().toISOString(),
        category: investment.type,
        // carry linkage for revert from history
        relatedInvestmentId: investment.id,
      });

      // 2) Adjust the investment amount
      const adjustedAmount = pendingIsIncome
        ? (investment.amount - pendingAmount) // income -> deduct from investment
        : (investment.amount + pendingAmount); // expense -> add to investment

      await updateInvestment({
        ...investment,
        amount: adjustedAmount,
        currentValue: typeof investment.currentValue === 'number' ? investment.currentValue : adjustedAmount,
      });

      // Clean up UI state
      setShowInvestmentPicker(false);
      setAmount("");
      setDescription("");
      setSelectedCategory("");
      setPendingAmount(0);
      setPendingDescription("");

      // Notify parent
      onTransactionAdded();
    } catch (error) {
      logger.error("Error applying investment transaction", error, "TransactionForm");
      Alert.alert("Error", "Failed to apply investment change");
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

        {/* Investment Sub-Category Dropdown */}
        {selectedCategory === 'Investment' && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowInvestmentTypeDropdown(!showInvestmentTypeDropdown)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !selectedInvestmentType && styles.placeholder,
                ]}
              >
                {selectedInvestmentType || 'Investment Type (Stock, Crypto, ...)'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
              visible={showInvestmentTypeDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowInvestmentTypeDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowInvestmentTypeDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Investment Type</Text>
                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                    {InvestmentCategories.TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedInvestmentType(type);
                          setShowInvestmentTypeDropdown(false);
                        }}
                      >
                        <Ionicons
                          name="trending-up"
                          size={24}
                          color="#2196F3"
                          style={styles.modalItemIcon}
                        />
                        <Text style={styles.modalItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

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

      {/* Investment Picker Modal */}
      <Modal
        visible={showInvestmentPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvestmentPicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInvestmentPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Investment</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator>
              {investmentOptions.map(inv => (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectInvestment(inv)}
                >
                  <Ionicons name="trending-up" size={24} color="#2196F3" style={styles.modalItemIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemText}>{inv.name} ({inv.type})</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>Amount: {inv.amount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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

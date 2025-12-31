import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
  maxHeight?: number;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  style,
  maxHeight = 300,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find((item) => item.value === selectedValue);

  const handleToggle = () => {
    if (disabled) return;

    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      setDropdownLayout({ x: px, y: py + height, width, height });

      if (!isOpen) {
        setIsOpen(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setIsOpen(false));
      }
    });
  };

  const handleSelect = (value: string) => {
    onValueChange(value);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const screenHeight = Dimensions.get("window").height;
  const availableSpace = screenHeight - dropdownLayout.y - 20;
  const dropdownHeight = Math.min(maxHeight, availableSpace, items.length * 50);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        ref={buttonRef}
        style={[
          styles.trigger,
          isOpen && styles.triggerOpen,
          disabled && styles.triggerDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {selectedItem?.icon && (
            <View style={styles.selectedIcon}>{selectedItem.icon}</View>
          )}
          <Text
            style={[
              styles.triggerText,
              !selectedValue && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedItem?.label || placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#666"
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleToggle}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleToggle}
        >
          <Animated.View
            style={[
              styles.dropdown,
              {
                top: dropdownLayout.y,
                left: dropdownLayout.x,
                width: dropdownLayout.width,
                height: dropdownHeight,
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled
            >
              {items.map((item, index) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.item,
                      isSelected && styles.itemSelected,
                      index === items.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    {item.icon && (
                      <View style={styles.itemIcon}>{item.icon}</View>
                    )}
                    <Text
                      style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2196F3" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  triggerOpen: {
    borderColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  triggerDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  selectedIcon: {
    marginRight: 8,
  },
  triggerText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemSelected: {
    backgroundColor: "#f0f7ff",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  itemTextSelected: {
    color: "#2196F3",
    fontWeight: "500",
  },
});

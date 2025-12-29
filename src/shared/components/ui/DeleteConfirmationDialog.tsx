import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Text, useTheme } from 'react-native-paper';

interface DeleteConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  visible,
  title,
  message,
  onDismiss,
  onConfirm,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurface }]}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </Button>
          <Button onPress={onConfirm} textColor={theme.colors.error}>
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    // backgroundColor will be set dynamically
  },
  dialogTitle: {
    // Color will be set dynamically
  },
  message: {
    // Color will be set dynamically
  },
});

export default DeleteConfirmationDialog;

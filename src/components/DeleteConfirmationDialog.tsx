import React from 'react';
import { Dialog, Portal, Button, Text } from 'react-native-paper';

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
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: 'white' }}>
        <Dialog.Title style={{ color: '#000000' }}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: '#000000' }}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor="#666666">Cancel</Button>
          <Button 
            onPress={onConfirm}
            textColor="#FF3B30"
          >
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default DeleteConfirmationDialog;

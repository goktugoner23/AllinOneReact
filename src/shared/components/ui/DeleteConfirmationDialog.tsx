import React from 'react';
import { AlertDialog } from './Dialog';

interface DeleteConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  visible,
  title,
  message,
  onDismiss,
  onConfirm,
  loading = false,
}) => {
  return (
    <AlertDialog
      visible={visible}
      onClose={onDismiss}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      loading={loading}
    />
  );
};

export default DeleteConfirmationDialog;

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useColors } from '@shared/theme';
import { Button } from './Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  dismissible?: boolean;
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  showCloseButton = false,
  dismissible = true,
}: DialogProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismissible ? onClose : undefined} />
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          {title && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
          {description && <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {showCloseButton && (
            <View style={styles.footer}>
              <Button variant="ghost" onPress={onClose}>
                Close
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function AlertDialog({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: AlertDialogProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.alertDialog, { backgroundColor: colors.card }]}>
          <Text style={[styles.alertTitle, { color: colors.foreground }]}>{title}</Text>
          {description && (
            <Text style={[styles.alertDescription, { color: colors.mutedForeground }]}>{description}</Text>
          )}
          <View style={styles.alertActions}>
            <Button variant="ghost" onPress={onClose} style={styles.alertButton} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onPress={onConfirm}
              style={styles.alertButton}
              loading={loading}
            >
              {confirmText}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  content: {
    flexGrow: 0,
  },
  footer: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  alertDialog: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  alertButton: {
    minWidth: 100,
  },
});

export default Dialog;

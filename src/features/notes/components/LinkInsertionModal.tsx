import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Portal, Modal, Surface, TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useAppTheme } from '@shared/theme';

const { width: screenWidth } = Dimensions.get('window');

interface LinkInsertionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertLink: (url: string, text: string) => void;
}

const LinkInsertionModal: React.FC<LinkInsertionModalProps> = ({ visible, onDismiss, onInsertLink }) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [urlError, setUrlError] = useState('');
  const { colors, spacing, radius, textStyles } = useAppTheme();

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return false;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      setUrlError('Please enter a valid URL');
      return false;
    }

    setUrlError('');
    return true;
  };

  const handleInsert = () => {
    if (!validateUrl(url)) {
      return;
    }

    // Ensure URL has protocol
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const linkText = text.trim() || finalUrl;
    onInsertLink(finalUrl, linkText);

    // Reset form
    setUrl('');
    setText('');
    setUrlError('');
    onDismiss();
  };

  const handleCancel = () => {
    setUrl('');
    setText('');
    setUrlError('');
    onDismiss();
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (urlError) {
      setUrlError('');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleCancel} contentContainerStyle={styles.modalContainer}>
        <Surface style={[styles.modalSurface, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: colors.border,
                paddingHorizontal: spacing[5],
                paddingTop: spacing[5],
                paddingBottom: spacing[3],
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.foreground }]}>Insert Link</Text>
            <IconButton icon="close" size={20} onPress={handleCancel} />
          </View>

          <View style={[styles.modalContent, { padding: spacing[5] }]}>
            <View style={[styles.inputContainer, { marginBottom: spacing[4] }]}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>URL *</Text>
              <TextInput
                mode="outlined"
                placeholder="https://example.com"
                value={url}
                onChangeText={handleUrlChange}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {urlError ? (
                <Text style={[textStyles.caption, { color: colors.destructive, marginTop: spacing[1] }]}>
                  {urlError}
                </Text>
              ) : null}
            </View>

            <View style={[styles.inputContainer, { marginBottom: spacing[4] }]}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                Link Text (optional)
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Display text for the link"
                value={text}
                onChangeText={setText}
                style={styles.input}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={handleInsert}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              <Text
                style={[
                  textStyles.caption,
                  { color: colors.foregroundMuted, marginTop: spacing[1], fontStyle: 'italic' },
                ]}
              >
                If left empty, the URL will be used as the link text
              </Text>
            </View>

            <View
              style={[
                styles.previewContainer,
                { backgroundColor: colors.muted, padding: spacing[3], borderRadius: radius.md, marginTop: spacing[2] },
              ]}
            >
              <Text style={[textStyles.labelSmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                Preview:
              </Text>
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.primary, textDecorationLine: 'underline', marginBottom: spacing[0.5] },
                ]}
              >
                {text.trim() || url.trim() || 'No link text'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.foregroundMuted, fontStyle: 'italic' }]}>
                {url.trim() ? `-> ${url.trim()}` : 'No URL'}
              </Text>
            </View>
          </View>

          <View
            style={[styles.modalActions, { paddingHorizontal: spacing[5], paddingBottom: spacing[5], gap: spacing[3] }]}
          >
            <Button mode="outlined" onPress={handleCancel} style={styles.actionButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleInsert} style={styles.actionButton} disabled={!url.trim()}>
              Insert Link
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSurface: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalContent: {},
  inputContainer: {},
  input: {
    backgroundColor: 'transparent',
  },
  previewContainer: {},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 80,
  },
});

export default LinkInsertionModal;

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Modal, Text, Pressable } from 'react-native';
import { Button, Input, IconButton } from '@shared/components/ui';
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
    <Modal
      visible={visible}
      onRequestClose={handleCancel}
      transparent
      animationType="fade"
    >
      <Pressable style={styles.modalContainer} onPress={handleCancel}>
        <Pressable style={[styles.modalSurface, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
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
            <IconButton icon="close" size="sm" variant="ghost" onPress={handleCancel} />
          </View>

          <View style={[styles.modalContent, { padding: spacing[5] }]}>
            <Input
              label="URL *"
              placeholder="https://example.com"
              value={url}
              onChangeText={handleUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
              error={urlError}
              containerStyle={{ marginBottom: spacing[4] }}
            />

            <Input
              label="Link Text (optional)"
              placeholder="Display text for the link"
              value={text}
              onChangeText={setText}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={handleInsert}
              helperText="If left empty, the URL will be used as the link text"
              containerStyle={{ marginBottom: spacing[4] }}
            />

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
            <Button variant="outline" onPress={handleCancel} style={styles.actionButton}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleInsert} style={styles.actionButton} disabled={!url.trim()}>
              Insert Link
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalContent: {},
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

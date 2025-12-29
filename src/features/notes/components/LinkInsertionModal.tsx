import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Portal, Modal, Surface, TextInput, Button, Text, IconButton } from 'react-native-paper';

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
        <Surface style={styles.modalSurface}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insert Link</Text>
            <IconButton icon="close" size={20} onPress={handleCancel} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL *</Text>
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
              />
              {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Link Text (optional)</Text>
              <TextInput
                mode="outlined"
                placeholder="Display text for the link"
                value={text}
                onChangeText={setText}
                style={styles.input}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={handleInsert}
              />
              <Text style={styles.helpText}>If left empty, the URL will be used as the link text</Text>
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={styles.previewText}>{text.trim() || url.trim() || 'No link text'}</Text>
              <Text style={styles.previewUrl}>→ {url.trim() || 'No URL'}</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
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
    backgroundColor: 'white',
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxWidth: 400,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  previewUrl: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    minWidth: 80,
  },
});

export default LinkInsertionModal;

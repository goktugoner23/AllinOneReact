import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Alert, ScrollView, Dimensions, Linking, Modal, Text, Pressable } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { IconButton, Button, Chip, Divider } from '@shared/components/ui';
import TableInsertionModal from '@features/notes/components/TableInsertionModal';
import ChecklistModal from '@features/tasks/components/ChecklistModal';
import LinkInsertionModal from '@features/notes/components/LinkInsertionModal';
import { useAppTheme } from '@shared/theme';

export interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export interface RichTextEditorHandle {
  focus: () => void;
  blur: () => void;
  insertHTML: (html: string) => void;
  insertLink: (text: string, url: string) => void;
  getHtml?: () => Promise<string | undefined>;
}

const { width: screenWidth } = Dimensions.get('window');

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ value, onChange, placeholder = 'Start writing your note...', style }, ref) => {
    const richText = useRef<RichEditor>(null);
    const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [showChecklistModal, setShowChecklistModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const { colors, spacing, radius, textStyles, isDark } = useAppTheme();

    // Expose imperative API to parents
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          // RichEditor exposes focusContentEditor in most versions
          // Fallback to focus() if available
          (richText.current as any)?.focusContentEditor?.();
          (richText.current as any)?.focus?.();
        },
        blur: () => {
          (richText.current as any)?.blurContentEditor?.();
        },
        insertHTML: (html: string) => {
          richText.current?.insertHTML?.(html);
        },
        insertLink: (text: string, url: string) => {
          richText.current?.insertLink?.(text, url);
        },
        getHtml: async () => {
          // Some versions expose getContentHtml()
          const editor = richText.current as any;
          if (typeof editor?.getContentHtml === 'function') {
            return await editor.getContentHtml();
          }
          return undefined;
        },
      }),
      [],
    );
    const handleChange = (text: string) => {
      onChange(text);
    };

    // Basic formatting actions
    const handleBold = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("bold", false, null)');
    }, []);

    const handleItalic = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("italic", false, null)');
    }, []);

    const handleUnderline = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("underline", false, null)');
    }, []);

    const handleStrikethrough = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("strikethrough", false, null)');
    }, []);

    const handleBullets = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("insertUnorderedList", false, null)');
    }, []);

    const handleNumbers = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("insertOrderedList", false, null)');
    }, []);

    const handleHeading1 = useCallback(() => {
      richText.current?.commandDOM(`
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Check if we have selected text (not just cursor position)
        if (range.toString().trim().length > 0) {
          // If the element is already a heading (h1, h2, h3), convert to paragraph
          if (element && (element.tagName.toLowerCase() === 'h1' || element.tagName.toLowerCase() === 'h2' || element.tagName.toLowerCase() === 'h3')) {
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Wrap selected text in h1 tags
            const h1 = document.createElement('h1');
            const fragment = range.extractContents();
            h1.appendChild(fragment);
            range.insertNode(h1);
          }
        } else {
          // No text selected, check if current element is already h1
          if (element && element.tagName.toLowerCase() === 'h1') {
            // If already H1, convert to paragraph
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Apply to current block
            document.execCommand("formatBlock", false, "h1");
          }
        }
      } else {
        // No selection, apply to current block
        document.execCommand("formatBlock", false, "h1");
      }
    `);
    }, []);

    const handleHeading2 = useCallback(() => {
      richText.current?.commandDOM(`
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Check if we have selected text (not just cursor position)
        if (range.toString().trim().length > 0) {
          // If the element is already a heading (h1, h2, h3), convert to paragraph
          if (element && (element.tagName.toLowerCase() === 'h1' || element.tagName.toLowerCase() === 'h2' || element.tagName.toLowerCase() === 'h3')) {
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Wrap selected text in h2 tags
            const h2 = document.createElement('h2');
            const fragment = range.extractContents();
            h2.appendChild(fragment);
            range.insertNode(h2);
          }
        } else {
          // No text selected, check if current element is already h2
          if (element && element.tagName.toLowerCase() === 'h2') {
            // If already H2, convert to paragraph
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Apply to current block
            document.execCommand("formatBlock", false, "h2");
          }
        }
      } else {
        // No selection, apply to current block
        document.execCommand("formatBlock", false, "h2");
      }
    `);
    }, []);

    const handleHeading3 = useCallback(() => {
      richText.current?.commandDOM(`
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        
        // Check if we have selected text (not just cursor position)
        if (range.toString().trim().length > 0) {
          // If the element is already a heading (h1, h2, h3), convert to paragraph
          if (element && (element.tagName.toLowerCase() === 'h1' || element.tagName.toLowerCase() === 'h2' || element.tagName.toLowerCase() === 'h3')) {
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Wrap selected text in h3 tags
            const h3 = document.createElement('h3');
            const fragment = range.extractContents();
            h3.appendChild(fragment);
            range.insertNode(h3);
          }
        } else {
          // No text selected, check if current element is already h3
          if (element && element.tagName.toLowerCase() === 'h3') {
            // If already H3, convert to paragraph
            const p = document.createElement('p');
            p.innerHTML = element.innerHTML;
            element.parentNode.replaceChild(p, element);
          } else {
            // Apply to current block
            document.execCommand("formatBlock", false, "h3");
          }
        }
      } else {
        // No selection, apply to current block
        document.execCommand("formatBlock", false, "h3");
      }
    `);
    }, []);

    const handleBlockquote = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("formatBlock", false, "blockquote")');
    }, []);

    const handleCode = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("formatBlock", false, "pre")');
    }, []);

    const handleAlignLeft = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("justifyLeft", false, null)');
    }, []);

    const handleAlignCenter = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("justifyCenter", false, null)');
    }, []);

    const handleAlignRight = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("justifyRight", false, null)');
    }, []);

    const handleUndo = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("undo", false, null)');
    }, []);

    const handleRedo = useCallback(() => {
      richText.current?.commandDOM('document.execCommand("redo", false, null)');
    }, []);

    const onPressLink = () => {
      setShowLinkModal(true);
    };

    const handleInsertLink = (url: string, text: string) => {
      if (richText.current) {
        richText.current.insertLink(text, url);
      }
    };

    const onPressTable = () => {
      setShowTableModal(true);
    };

    const handleInsertTable = (rows: number, columns: number) => {
      if (richText.current) {
        // Create HTML table
        let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">';

        for (let i = 0; i < rows; i++) {
          tableHTML += '<tr>';
          for (let j = 0; j < columns; j++) {
            if (i === 0) {
              tableHTML +=
                '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Header</th>';
            } else {
              tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cell</td>';
            }
          }
          tableHTML += '</tr>';
        }
        tableHTML += '</table>';

        richText.current?.insertHTML(tableHTML);
      }
    };

    const onPressChecklist = () => {
      setShowChecklistModal(true);
    };

    const handleInsertChecklist = (items: string[]) => {
      if (richText.current) {
        // Create HTML checklist
        let checklistHTML = '<ul style="list-style-type: none; padding-left: 0; margin: 16px 0;">';

        items.forEach((item) => {
          checklistHTML += `
          <li style="margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9;">
            <input type="checkbox" style="margin-right: 8px;" />
            <span>${item}</span>
          </li>
        `;
        });

        checklistHTML += '</ul>';

        richText.current?.insertHTML(checklistHTML);
      }
    };

    return (
      <View
        style={[
          styles.container,
          { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md },
          style,
        ]}
      >
        {/* Basic Toolbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.toolbarContainer, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}
          contentContainerStyle={styles.toolbarContent}
        >
          {/* Text Formatting */}
          <View style={styles.toolbarSection}>
            <IconButton icon="text" size="sm" variant="ghost" onPress={handleBold} />
            <IconButton icon="text-outline" size="sm" variant="ghost" onPress={handleItalic} />
            <IconButton icon="remove-outline" size="sm" variant="ghost" onPress={handleUnderline} />
            <IconButton icon="cut-outline" size="sm" variant="ghost" onPress={handleStrikethrough} />
          </View>

          <Divider orientation="vertical" style={styles.toolbarDivider} />

          {/* Headings */}
          <View style={styles.toolbarSection}>
            <IconButton icon="heading" size="sm" variant="ghost" onPress={handleHeading1} />
            <IconButton icon="text" size="sm" variant="ghost" onPress={handleHeading2} />
            <IconButton icon="text-outline" size="sm" variant="ghost" onPress={handleHeading3} />
          </View>

          <Divider orientation="vertical" style={styles.toolbarDivider} />

          {/* Lists */}
          <View style={styles.toolbarSection}>
            <IconButton icon="list-outline" size="sm" variant="ghost" onPress={handleBullets} />
            <IconButton icon="list" size="sm" variant="ghost" onPress={handleNumbers} />
            <IconButton icon="checkbox-outline" size="sm" variant="ghost" onPress={onPressChecklist} />
          </View>

          <Divider orientation="vertical" style={styles.toolbarDivider} />

          {/* Alignment */}
          <View style={styles.toolbarSection}>
            <IconButton icon="reorder-three-outline" size="sm" variant="ghost" onPress={handleAlignLeft} />
            <IconButton icon="reorder-four-outline" size="sm" variant="ghost" onPress={handleAlignCenter} />
            <IconButton icon="reorder-two-outline" size="sm" variant="ghost" onPress={handleAlignRight} />
          </View>

          <Divider orientation="vertical" style={styles.toolbarDivider} />

          {/* Special Formatting */}
          <View style={styles.toolbarSection}>
            <IconButton icon="chatbox-outline" size="sm" variant="ghost" onPress={handleBlockquote} />
            <IconButton icon="code-slash-outline" size="sm" variant="ghost" onPress={handleCode} />
            <IconButton icon="link-outline" size="sm" variant="ghost" onPress={onPressLink} />
            <IconButton icon="grid-outline" size="sm" variant="ghost" onPress={onPressTable} />
          </View>

          <Divider orientation="vertical" style={styles.toolbarDivider} />

          {/* History */}
          <View style={styles.toolbarSection}>
            <IconButton icon="arrow-undo-outline" size="sm" variant="ghost" onPress={handleUndo} />
            <IconButton icon="arrow-redo-outline" size="sm" variant="ghost" onPress={handleRedo} />
          </View>

          {/* Advanced Toolbar Toggle */}
          <View style={styles.toolbarSection}>
            <IconButton icon="ellipsis-horizontal" size="sm" variant="ghost" onPress={() => setShowAdvancedToolbar(true)} />
          </View>
        </ScrollView>

        {/* Rich Text Editor */}
        <RichEditor
          ref={richText}
          onChange={handleChange}
          placeholder={placeholder}
          style={styles.editor}
          initialContentHTML={value}
          useContainer={false}
          initialHeight={250}
          disabled={false}
          onLink={(url) => {
            // Handle link clicks - open in browser or show options
            Alert.alert('Open Link', `Do you want to open: ${url}`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open',
                onPress: () => {
                  Linking.openURL(url).catch((err) => {
                    console.error('Error opening URL:', err);
                    Alert.alert('Error', 'Could not open the link');
                  });
                },
              },
            ]);
          }}
          editorStyle={{
            backgroundColor: colors.surface,
            color: colors.foreground,
            placeholderColor: colors.foregroundSubtle,
            contentCSSText: `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: ${colors.foreground};
            padding: 16px;
            margin: 0;
            background-color: ${colors.surface};

            /* Enhanced styling for different elements */
            h1 { font-size: 24px; font-weight: bold; margin: 16px 0 8px 0; color: ${colors.foreground}; }
            h2 { font-size: 20px; font-weight: bold; margin: 14px 0 6px 0; color: ${colors.foreground}; }
            h3 { font-size: 18px; font-weight: bold; margin: 12px 0 4px 0; color: ${colors.foreground}; }

            blockquote {
              border-left: 4px solid ${colors.primary};
              padding-left: 16px;
              margin: 16px 0;
              font-style: italic;
              color: ${colors.foregroundMuted};
            }

            code {
              background-color: ${colors.muted};
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              color: ${colors.foreground};
            }

            pre {
              background-color: ${colors.muted};
              padding: 12px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 16px 0;
              color: ${colors.foreground};
            }

            ul, ol { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }

            a {
              color: ${colors.primary};
              text-decoration: underline;
              cursor: pointer;
              padding: 2px 4px;
              border-radius: 4px;
              background-color: ${colors.primaryMuted};
            }
            a:hover {
              background-color: ${colors.primaryMuted};
            }

            table {
              border-collapse: collapse;
              width: 100%;
              margin: 16px 0;
            }
            th, td {
              border: 1px solid ${colors.border};
              padding: 8px;
              text-align: left;
              color: ${colors.foreground};
            }
            th { background-color: ${colors.muted}; font-weight: bold; }
          `,
          }}
        />

        {/* Advanced Toolbar Modal */}
        <Modal
          visible={showAdvancedToolbar}
          onRequestClose={() => setShowAdvancedToolbar(false)}
          transparent
          animationType="fade"
        >
          <Pressable style={styles.modalContainer} onPress={() => setShowAdvancedToolbar(false)}>
            <Pressable style={[styles.modalSurface, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[textStyles.h4, { color: colors.foreground }]}>Advanced Formatting</Text>
                <IconButton icon="close" size="sm" variant="ghost" onPress={() => setShowAdvancedToolbar(false)} />
              </View>

              <ScrollView style={[styles.modalContent, { padding: spacing[4] }]}>
                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                    Text Formatting
                  </Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleBold}>Bold</Chip>
                    <Chip onPress={handleItalic}>Italic</Chip>
                    <Chip onPress={handleUnderline}>Underline</Chip>
                    <Chip onPress={handleStrikethrough}>Strikethrough</Chip>
                  </View>
                </View>

                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                    Headings
                  </Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleHeading1}>Heading 1</Chip>
                    <Chip onPress={handleHeading2}>Heading 2</Chip>
                    <Chip onPress={handleHeading3}>Heading 3</Chip>
                  </View>
                </View>

                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Lists</Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleBullets}>Bullet List</Chip>
                    <Chip onPress={handleNumbers}>Numbered List</Chip>
                    <Chip onPress={onPressChecklist}>Checklist</Chip>
                  </View>
                </View>

                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                    Alignment
                  </Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleAlignLeft}>Left</Chip>
                    <Chip onPress={handleAlignCenter}>Center</Chip>
                    <Chip onPress={handleAlignRight}>Right</Chip>
                  </View>
                </View>

                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                    Special
                  </Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleBlockquote}>Quote</Chip>
                    <Chip onPress={handleCode}>Code</Chip>
                    <Chip onPress={onPressLink}>Link</Chip>
                    <Chip onPress={onPressTable}>Table</Chip>
                  </View>
                </View>

                <View style={[styles.modalSection, { marginBottom: spacing[5] }]}>
                  <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>
                    History
                  </Text>
                  <View style={[styles.chipContainer, { gap: spacing[2] }]}>
                    <Chip onPress={handleUndo}>Undo</Chip>
                    <Chip onPress={handleRedo}>Redo</Chip>
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Table Insertion Modal */}
        <TableInsertionModal
          visible={showTableModal}
          onDismiss={() => setShowTableModal(false)}
          onInsertTable={handleInsertTable}
        />

        {/* Checklist Modal */}
        <ChecklistModal
          visible={showChecklistModal}
          onDismiss={() => setShowChecklistModal(false)}
          onInsertChecklist={handleInsertChecklist}
        />

        {/* Link Insertion Modal */}
        <LinkInsertionModal
          visible={showLinkModal}
          onDismiss={() => setShowLinkModal(false)}
          onInsertLink={handleInsertLink}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbarContainer: {
    borderBottomWidth: 1,
    maxHeight: 60,
  },
  toolbarContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarDivider: {
    height: 30,
    marginHorizontal: 4,
  },
  editor: {
    flex: 1,
    minHeight: 250,
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSurface: {
    width: screenWidth * 0.9,
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalContent: {},
  modalSection: {},
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default RichTextEditor;

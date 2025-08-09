import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { 
  IconButton, 
  Portal, 
  Modal, 
  Button, 
  Chip,
  Divider,
  Text,
  Surface,
} from 'react-native-paper';
import TableInsertionModal from '@features/notes/components/TableInsertionModal';
import ChecklistModal from '@features/tasks/components/ChecklistModal';
import LinkInsertionModal from '@features/notes/components/LinkInsertionModal';

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

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({ 
  value,
  onChange,
  placeholder = 'Start writing your note...',
  style,
}, ref) => {
  const richText = useRef<RichEditor>(null);
  const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Expose imperative API to parents
  useImperativeHandle(ref, () => ({
    focus: () => {
      // RichEditor exposes focusContentEditor in most versions
      // Fallback to focus() if available
      // @ts-expect-error library method
      richText.current?.focusContentEditor?.();
      // @ts-expect-error fallback
      richText.current?.focus?.();
    },
    blur: () => {
      // @ts-expect-error library method
      richText.current?.blurContentEditor?.();
    },
    insertHTML: (html: string) => {
      richText.current?.insertHTML?.(html);
    },
    insertLink: (text: string, url: string) => {
      richText.current?.insertLink?.(text, url);
    },
    getHtml: async () => {
      // Some versions expose getContentHtml()
      // @ts-expect-error library method
      if (typeof richText.current?.getContentHtml === 'function') {
        // @ts-expect-error library method
        return await richText.current.getContentHtml();
      }
      return undefined;
    },
  }), []);
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
            tableHTML += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f5f5; font-weight: bold;">Header</th>';
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
      
      items.forEach(item => {
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
    <View style={[styles.container, style]}>
      {/* Basic Toolbar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.toolbarContainer}
        contentContainerStyle={styles.toolbarContent}
      >
        {/* Text Formatting */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="format-bold"
            size={20}
            onPress={handleBold}
          />
          <IconButton
            icon="format-italic"
            size={20}
            onPress={handleItalic}
          />
          <IconButton
            icon="format-underline"
            size={20}
            onPress={handleUnderline}
          />
          <IconButton
            icon="format-strikethrough"
            size={20}
            onPress={handleStrikethrough}
          />
        </View>

        <Divider style={styles.toolbarDivider} />

        {/* Headings */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="format-header-1"
            size={20}
            onPress={handleHeading1}
          />
          <IconButton
            icon="format-header-2"
            size={20}
            onPress={handleHeading2}
          />
          <IconButton
            icon="format-header-3"
            size={20}
            onPress={handleHeading3}
          />
        </View>

        <Divider style={styles.toolbarDivider} />

        {/* Lists */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="format-list-bulleted"
            size={20}
            onPress={handleBullets}
          />
          <IconButton
            icon="format-list-numbered"
            size={20}
            onPress={handleNumbers}
          />
          <IconButton
            icon="format-list-checks"
            size={20}
            onPress={onPressChecklist}
          />
        </View>

        <Divider style={styles.toolbarDivider} />

        {/* Alignment */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="format-align-left"
            size={20}
            onPress={handleAlignLeft}
          />
          <IconButton
            icon="format-align-center"
            size={20}
            onPress={handleAlignCenter}
          />
          <IconButton
            icon="format-align-right"
            size={20}
            onPress={handleAlignRight}
          />
        </View>

        <Divider style={styles.toolbarDivider} />

        {/* Special Formatting */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="format-quote-close"
            size={20}
            onPress={handleBlockquote}
          />
          <IconButton
            icon="code-tags"
            size={20}
            onPress={handleCode}
          />
          <IconButton
            icon="link"
            size={20}
            onPress={onPressLink}
          />
          <IconButton
            icon="table"
            size={20}
            onPress={onPressTable}
          />
        </View>

        <Divider style={styles.toolbarDivider} />

        {/* History */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="undo"
            size={20}
            onPress={handleUndo}
          />
          <IconButton
            icon="redo"
            size={20}
            onPress={handleRedo}
          />
        </View>



        {/* Advanced Toolbar Toggle */}
        <View style={styles.toolbarSection}>
          <IconButton
            icon="dots-horizontal"
            size={20}
            onPress={() => setShowAdvancedToolbar(true)}
          />
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
          Alert.alert(
            'Open Link',
            `Do you want to open: ${url}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open', onPress: () => {
                Linking.openURL(url).catch(err => {
                  console.error('Error opening URL:', err);
                  Alert.alert('Error', 'Could not open the link');
                });
              }},
            ]
          );
        }}
        editorStyle={{
          backgroundColor: 'transparent',
          contentCSSText: `
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            padding: 16px;
            margin: 0;
            
            /* Enhanced styling for different elements */
            h1 { font-size: 24px; font-weight: bold; margin: 16px 0 8px 0; }
            h2 { font-size: 20px; font-weight: bold; margin: 14px 0 6px 0; }
            h3 { font-size: 18px; font-weight: bold; margin: 12px 0 4px 0; }
            
            blockquote { 
              border-left: 4px solid #007AFF; 
              padding-left: 16px; 
              margin: 16px 0; 
              font-style: italic; 
              color: #666; 
            }
            
            code { 
              background-color: #f5f5f5; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-family: 'Courier New', monospace; 
            }
            
            pre { 
              background-color: #f5f5f5; 
              padding: 12px; 
              border-radius: 8px; 
              overflow-x: auto; 
              margin: 16px 0; 
            }
            
            ul, ol { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }
            
            a { 
              color: #007AFF; 
              text-decoration: underline; 
              cursor: pointer;
              padding: 2px 4px;
              border-radius: 4px;
              background-color: rgba(0, 122, 255, 0.1);
            }
            a:hover { 
              background-color: rgba(0, 122, 255, 0.2);
            }
            
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 16px 0; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { background-color: #f5f5f5; font-weight: bold; }
          `,
        }}
      />

      {/* Advanced Toolbar Modal */}
      <Portal>
        <Modal
          visible={showAdvancedToolbar}
          onDismiss={() => setShowAdvancedToolbar(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Formatting</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowAdvancedToolbar(false)}
              />
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Text Formatting</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleBold} style={styles.chip}>Bold</Chip>
                  <Chip onPress={handleItalic} style={styles.chip}>Italic</Chip>
                  <Chip onPress={handleUnderline} style={styles.chip}>Underline</Chip>
                  <Chip onPress={handleStrikethrough} style={styles.chip}>Strikethrough</Chip>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Headings</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleHeading1} style={styles.chip}>Heading 1</Chip>
                  <Chip onPress={handleHeading2} style={styles.chip}>Heading 2</Chip>
                  <Chip onPress={handleHeading3} style={styles.chip}>Heading 3</Chip>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Lists</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleBullets} style={styles.chip}>Bullet List</Chip>
                  <Chip onPress={handleNumbers} style={styles.chip}>Numbered List</Chip>
                  <Chip onPress={onPressChecklist} style={styles.chip}>Checklist</Chip>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Alignment</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleAlignLeft} style={styles.chip}>Left</Chip>
                  <Chip onPress={handleAlignCenter} style={styles.chip}>Center</Chip>
                  <Chip onPress={handleAlignRight} style={styles.chip}>Right</Chip>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Special</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleBlockquote} style={styles.chip}>Quote</Chip>
                  <Chip onPress={handleCode} style={styles.chip}>Code</Chip>
                  <Chip onPress={onPressLink} style={styles.chip}>Link</Chip>
                  <Chip onPress={onPressTable} style={styles.chip}>Table</Chip>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>History</Text>
                <View style={styles.chipContainer}>
                  <Chip onPress={handleUndo} style={styles.chip}>Undo</Chip>
                  <Chip onPress={handleRedo} style={styles.chip}>Redo</Chip>
                </View>
              </View>
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>

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
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  toolbarContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: 'white',
    borderRadius: 12,
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
});

export default RichTextEditor;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Card, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { AddFab } from '@shared/components';
import { fetchInvestments, addInvestment, updateInvestment, deleteInvestment, addInvestmentWithAttachments } from '@features/transactions/services/investments';
import { Investment } from '@features/transactions/types/Investment';
import { FuturesTab } from './FuturesTab';
import AttachmentGallery from '@features/notes/components/AttachmentGallery';
import { Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import { Video } from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';
import VoiceRecorder from '@shared/components/ui/VoiceRecorder';
import { uploadInvestmentAttachments } from '@features/transactions/services/investmentAttachments';
import { InvestmentCategories } from '@features/transactions/config/InvestmentCategories';
import { TransactionService } from '@features/transactions/services/transactionService';



function InvestmentsContent() {
  const theme = useTheme();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [liquidateDialogVisible, setLiquidateDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', amount: '', type: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<MediaAttachment[]>([]);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);
  const [editAttachments, setEditAttachments] = useState<MediaAttachment[]>([]);
  const [addForm, setAddForm] = useState({ name: '', amount: '', type: '', description: '' });
  const [addAttachments, setAddAttachments] = useState<MediaAttachment[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [addIsPast, setAddIsPast] = useState(false);
  const [editIsPast, setEditIsPast] = useState(false);
  const [showTypeDropdownAdd, setShowTypeDropdownAdd] = useState(false);
  const [showTypeDropdownEdit, setShowTypeDropdownEdit] = useState(false);

  const loadInvestments = async () => {
    try {
      const data = await fetchInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  };

  const handleLongPress = (investment: Investment) => {
    setSelectedInvestment(investment);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    if (selectedInvestment) {
      setEditForm({
        name: selectedInvestment.name,
        amount: selectedInvestment.amount.toString(),
        type: selectedInvestment.type,
        description: selectedInvestment.description || '',
      });
      setEditIsPast(!!selectedInvestment.isPast);
      const existing: MediaAttachment[] = [];
      const img = selectedInvestment.imageUris?.split(',').filter(Boolean) || [];
      const vid = selectedInvestment.videoUris?.split(',').filter(Boolean) || [];
      const aud = selectedInvestment.voiceNoteUris?.split(',').filter(Boolean) || [];
      img.forEach((uri, idx) => existing.push({ id: `img_${idx}`, uri, type: MediaType.IMAGE }));
      vid.forEach((uri, idx) => existing.push({ id: `vid_${idx}`, uri, type: MediaType.VIDEO }));
      aud.forEach((uri, idx) => existing.push({ id: `aud_${idx}`, uri, type: MediaType.AUDIO }));
      setEditAttachments(existing);
      setEditModalVisible(true);
    }
    setActionModalVisible(false);
  };

  const handleDelete = () => {
    setDeleteDialogVisible(true);
    setActionModalVisible(false);
  };

  const handleLiquidate = () => {
    setLiquidateDialogVisible(true);
    setActionModalVisible(false);
  };

  const confirmDelete = async () => {
    if (selectedInvestment) {
      try {
        await deleteInvestment(selectedInvestment.id);
        setDeleteDialogVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Deleted', 'Investment deleted successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to delete investment');
      }
    }
  };

  const confirmLiquidate = async () => {
    if (selectedInvestment) {
      try {
        await deleteInvestment(selectedInvestment.id); // Same as delete, but different message
        setLiquidateDialogVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Liquidated', 'Investment liquidated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to liquidate investment');
      }
    }
  };

  const confirmEdit = async () => {
    if (selectedInvestment) {
      setIsSaving(true);
      try {
        const uploaded = await uploadInvestmentAttachments(selectedInvestment.id, editAttachments);
        const imageUris = uploaded.imageUris.join(',');
        const videoUris = uploaded.videoUris.join(',');
        const voiceNoteUris = uploaded.voiceNoteUris.join(',');

        await updateInvestment({
          ...selectedInvestment,
          name: editForm.name,
          amount: parseFloat(editForm.amount),
          type: editForm.type,
          description: editForm.description,
          imageUris,
          videoUris,
          voiceNoteUris,
          imageUri: uploaded.imageUris[0] || selectedInvestment.imageUri || '',
          isPast: editIsPast,
        });
        setEditModalVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Updated', 'Investment updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update investment');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const renderInvestment = ({ item }: { item: Investment }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={300}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[styles.title, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            <Chip
              mode="outlined"
              style={{ height: 24 }}
              textStyle={{ fontSize: 12, fontWeight: '700' }}
            >
              {(item.type || '').toUpperCase()}
            </Chip>
          </View>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          {/* Attachment Previews */}
          {(() => {
            const imageUris = item.imageUris?.split(',').filter(Boolean) || [];
            const videoUris = item.videoUris?.split(',').filter(Boolean) || [];
            const voiceUris = item.voiceNoteUris?.split(',').filter(Boolean) || [];
            const allAttachments = [...imageUris, ...videoUris, ...voiceUris];
            if (allAttachments.length === 0) return null;

            const handleAttachmentPress = (uri: string) => {
              const clickedIndex = allAttachments.findIndex(att => att === uri);
              const attachments: MediaAttachment[] = allAttachments.map((att, idx) => {
                const isImage = imageUris.includes(att);
                const isVideo = videoUris.includes(att);
                const isAudio = voiceUris.includes(att);
                return {
                  id: `${item.id}_${idx}`,
                  uri: att,
                  type: isImage ? MediaType.IMAGE : isVideo ? MediaType.VIDEO : MediaType.AUDIO,
                  name: `${isImage ? 'Image' : isVideo ? 'Video' : 'Audio'} attachment`,
                };
              });
              setSelectedAttachments(attachments);
              setSelectedAttachmentIndex(clickedIndex);
              setShowAttachmentGallery(true);
            };

            return (
              <View style={styles.attachmentPreviews}>
                {allAttachments.slice(0, 3).map((uri, index) => {
                  const isImage = imageUris.includes(uri);
                  const isVideo = videoUris.includes(uri);
                  const isAudio = voiceUris.includes(uri);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.attachmentPreview}
                      onPress={() => handleAttachmentPress(uri)}
                    >
                      {isImage ? (
                        <Image source={{ uri }} style={styles.previewImage} />
                      ) : isVideo ? (
                        <View style={styles.previewVideo}>
                          <Video
                            source={{ uri }}
                            style={styles.previewVideoThumbnail}
                            resizeMode="cover"
                            paused={true}
                            muted={true}
                          />
                          <View style={styles.playOverlay}>
                            <Icon name="play-arrow" size={16} color="white" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.previewAudio}>
                          <Icon name="music-note" size={20} color="#666" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {allAttachments.length > 3 && (
                  <View style={styles.moreAttachments}>
                    <Text style={styles.moreAttachmentsText}>+{allAttachments.length - 3}</Text>
                  </View>
                )}
              </View>
            );
          })()}
          {item.isPast && (
            <View style={styles.profitLossContainer}>
              <Text style={[styles.profitLoss, (item.profitLoss || 0) >= 0 ? styles.profit : styles.loss]}>
                {(item.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(item.profitLoss || 0)}
              </Text>
              <Text style={styles.currentValue}>
                Current: {formatCurrency(item.currentValue || item.amount)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow} />

      <FlashList
        data={investments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No investments yet</Text>
        }
        estimatedItemSize={120}
      />

      {/* Attachment Gallery */}
      {showAttachmentGallery && (
        <AttachmentGallery
          attachments={selectedAttachments}
          initialIndex={selectedAttachmentIndex}
          onClose={() => setShowAttachmentGallery(false)}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
          <View style={styles.actionModal}>
            <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
              <Text style={[styles.actionOptionText, { color: theme.colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleDelete}>
              <Text style={[styles.actionOptionText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleLiquidate}>
              <Text style={[styles.actionOptionText, { color: theme.colors.error }]}>Liquidate</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Add Investment</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={addForm.name}
              onChangeText={text => setAddForm(f => ({ ...f, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={addForm.amount}
              onChangeText={text => setAddForm(f => ({ ...f, amount: text }))}
            />
            {/* Investment Type Dropdown (Add) */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdownAdd(!showTypeDropdownAdd)}
              >
                <Text style={[styles.dropdownButtonText, !addForm.type && styles.placeholder]}>
                  {addForm.type || 'Investment Type (Stock, Crypto, ... )'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              <Modal
                visible={showTypeDropdownAdd}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTypeDropdownAdd(false)}
              >
                <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowTypeDropdownAdd(false)}>
                  <View style={styles.confirmModal}>
                    <Text style={styles.confirmTitle}>Select Investment Type</Text>
                    <View style={{ width: '100%' }}>
                      {InvestmentCategories.TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.modalItem}
                          onPress={() => {
                            setAddForm(f => ({ ...f, type }));
                            setShowTypeDropdownAdd(false);
                          }}
                        >
                          <Icon name="trending-up" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                          <Text style={styles.modalItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={addForm.description}
              onChangeText={text => setAddForm(f => ({ ...f, description: text }))}
            />

            {/* Past Investment Switch (Add) */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Past Investment</Text>
              <Switch value={addIsPast} onValueChange={setAddIsPast} />
            </View>

            <View style={styles.attachmentButtons}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map(a => ({
                        id: `img_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.IMAGE,
                        name: a.fileName || 'Image',
                        size: a.fileSize,
                      }));
                      setAddAttachments(prev => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="photo" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'video', selectionLimit: 3 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map(a => ({
                        id: `vid_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.VIDEO,
                        name: a.fileName || 'Video',
                        size: a.fileSize,
                      }));
                      setAddAttachments(prev => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="videocam" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => setShowVoiceRecorder(true)}
              >
                <Icon name="mic" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Voice</Text>
              </TouchableOpacity>
            </View>

            {addAttachments.length > 0 && (
              <View style={styles.attachmentPreviews}>
                {addAttachments.map((att) => (
                  <View key={att.id} style={styles.attachmentPreview}>
                    {att.type === MediaType.IMAGE ? (
                      <Image source={{ uri: att.uri }} style={styles.previewImage} />
                    ) : att.type === MediaType.VIDEO ? (
                      <View style={styles.previewVideo}>
                        <Video source={{ uri: att.uri }} style={styles.previewVideoThumbnail} resizeMode="cover" paused muted />
                        <View style={styles.playOverlay}><Icon name="play-arrow" size={16} color="white" /></View>
                      </View>
                    ) : (
                      <View style={styles.previewAudio}>
                        <Icon name="music-note" size={20} color="#666" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                mode="contained"
                loading={isSaving}
                disabled={isSaving}
                onPress={async () => {
                  setIsSaving(true);
                  try {
                    await addInvestmentWithAttachments(
                      {
                        name: addForm.name,
                        amount: parseFloat(addForm.amount || '0'),
                        type: addForm.type,
                        description: addForm.description,
                        date: new Date().toISOString(),
                        isPast: addIsPast,
                        profitLoss: 0,
                        currentValue: parseFloat(addForm.amount || '0'),
                        imageUri: '',
                      },
                      addAttachments
                    );
                    if (!addIsPast) {
                      await TransactionService.addTransaction({
                        amount: parseFloat(addForm.amount || '0'),
                        type: 'Investment',
                        description: `Investment in ${addForm.name}`,
                        isIncome: false,
                        date: new Date().toISOString(),
                        category: addForm.type,
                      });
                    }
                    setAddModalVisible(false);
                    setAddForm({ name: '', amount: '', type: '', description: '' });
                    setAddAttachments([]);
                    setAddIsPast(false);
                    await loadInvestments();
                    Alert.alert('Added', 'Investment added successfully');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to add investment');
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Save
              </Button>
              <Button mode="text" onPress={() => setAddModalVisible(false)} disabled={isSaving}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      {/* Voice Recorder Modal for Attachments */}
      <Modal
        visible={showVoiceRecorder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceRecorder(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.editModal}>
            <VoiceRecorder
              onRecordingComplete={(filePath: string) => {
                setEditAttachments(prev => [
                  ...prev,
                  { id: `aud_${Date.now()}`, uri: filePath, type: MediaType.AUDIO, name: 'Voice Recording' },
                ]);
                setShowVoiceRecorder(false);
              }}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Edit Investment</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editForm.name}
              onChangeText={text => setEditForm(f => ({ ...f, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={editForm.amount}
              onChangeText={text => setEditForm(f => ({ ...f, amount: text }))}
            />
            {/* Investment Type Dropdown (Edit) */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdownEdit(!showTypeDropdownEdit)}
              >
                <Text style={[styles.dropdownButtonText, !editForm.type && styles.placeholder]}>
                  {editForm.type || 'Investment Type (Stock, Crypto, ... )'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              <Modal
                visible={showTypeDropdownEdit}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTypeDropdownEdit(false)}
              >
                <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowTypeDropdownEdit(false)}>
                  <View style={styles.confirmModal}>
                    <Text style={styles.confirmTitle}>Select Investment Type</Text>
                    <View style={{ width: '100%' }}>
                      {InvestmentCategories.TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.modalItem}
                          onPress={() => {
                            setEditForm(f => ({ ...f, type }));
                            setShowTypeDropdownEdit(false);
                          }}
                        >
                          <Icon name="trending-up" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                          <Text style={styles.modalItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={editForm.description}
              onChangeText={text => setEditForm(f => ({ ...f, description: text }))}
            />
            {/* Past Investment Switch (Edit) */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Past Investment</Text>
              <Switch value={editIsPast} onValueChange={setEditIsPast} />
            </View>

            {/* Attachment controls */}
            <View style={styles.attachmentButtons}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map(a => ({
                        id: `img_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.IMAGE,
                        name: a.fileName || 'Image',
                        size: a.fileSize,
                      }));
                      setEditAttachments(prev => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="photo" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'video', selectionLimit: 3 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map(a => ({
                        id: `vid_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.VIDEO,
                        name: a.fileName || 'Video',
                        size: a.fileSize,
                      }));
                      setEditAttachments(prev => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="videocam" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => setShowVoiceRecorder(true)}
              >
                <Icon name="mic" size={20} color={theme.colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: theme.colors.primary }]}>Voice</Text>
              </TouchableOpacity>
            </View>

            {editAttachments.length > 0 && (
              <View style={styles.attachmentPreviews}>
                {editAttachments.map((att) => (
                  <View key={att.id} style={styles.attachmentPreview}>
                    {att.type === MediaType.IMAGE ? (
                      <Image source={{ uri: att.uri }} style={styles.previewImage} />
                    ) : att.type === MediaType.VIDEO ? (
                      <View style={styles.previewVideo}>
                        <Video source={{ uri: att.uri }} style={styles.previewVideoThumbnail} resizeMode="cover" paused muted />
                        <View style={styles.playOverlay}><Icon name="play-arrow" size={16} color="white" /></View>
                      </View>
                    ) : (
                      <View style={styles.previewAudio}>
                        <Icon name="music-note" size={20} color="#666" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmEdit} loading={isSaving} disabled={isSaving}>
                Save
              </Button>
              <Button mode="text" onPress={() => setEditModalVisible(false)} disabled={isSaving}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Dialog */}
      <Modal
        visible={deleteDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Investment</Text>
            <Text style={styles.confirmText}>Are you sure you want to delete "{selectedInvestment?.name}"? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmDelete}>
                Delete
              </Button>
              <Button mode="text" onPress={() => setDeleteDialogVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Liquidate Dialog */}
      <Modal
        visible={liquidateDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLiquidateDialogVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Liquidate Investment</Text>
            <Text style={styles.confirmText}>Are you sure you want to liquidate "{selectedInvestment?.name}"? This will remove the investment without affecting your transaction history.</Text>
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmLiquidate}>
                Liquidate
              </Button>
              <Button mode="text" onPress={() => setLiquidateDialogVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      {/* Add Investment FAB */}
              <AddFab style={styles.fab} onPress={() => setAddModalVisible(true)} />
    </View>
  );
}



export const InvestmentsTab: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'investments' | 'futures'>('investments');

  return (
    <View style={styles.mainContainer}>
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'investments' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('investments')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'investments' && styles.activeTabButtonText
          ]}>
            Investments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'futures' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('futures')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'futures' && styles.activeTabButtonText
          ]}>
            Futures
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'investments' ? <InvestmentsContent /> : <FuturesTab />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addBtnText: {
    fontWeight: 'bold',
  },
  modalItem: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    elevation: 4,
  },
  actionOption: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 260,
    alignItems: 'stretch',
    elevation: 4,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 260,
    alignItems: 'center',
    elevation: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  card: {
    marginBottom: 8,
  },
  attachmentPreviews: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  attachmentButtonText: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '500',
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  previewVideoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  previewAudio: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
  },
  moreAttachments: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttachmentsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  profitLossContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  profitLoss: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profit: {
    color: '#4CAF50',
  },
  loss: {
    color: '#F44336',
  },
  currentValue: {
    fontSize: 14,
    color: '#666',
  },

});

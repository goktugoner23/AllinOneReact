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
import {
  fetchInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  addInvestmentWithAttachments,
} from '@features/transactions/services/investments';
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
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

function InvestmentsContent() {
  const theme = useTheme();
  const colors = useColors();
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
    <TouchableOpacity activeOpacity={0.8} onLongPress={() => handleLongPress(item)} delayLongPress={300}>
      <Card style={[styles.card, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <Chip
              mode="outlined"
              style={[styles.typeChip, { borderColor: colors.primary }]}
              textStyle={[styles.typeChipText, { color: colors.primary }]}
            >
              {(item.type || '').toUpperCase()}
            </Chip>
          </View>
          <Text style={[styles.amount, { color: colors.investment }]}>{formatCurrency(item.amount)}</Text>
          {item.description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
          ) : null}
          <Text style={[styles.date, { color: colors.foregroundSubtle }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          {/* Attachment Previews */}
          {(() => {
            const imageUris = item.imageUris?.split(',').filter(Boolean) || [];
            const videoUris = item.videoUris?.split(',').filter(Boolean) || [];
            const voiceUris = item.voiceNoteUris?.split(',').filter(Boolean) || [];
            const allAttachments = [...imageUris, ...videoUris, ...voiceUris];
            if (allAttachments.length === 0) return null;

            // Create a closure-safe handler by capturing item data
            const handleAttachmentPress = (clickedUri: string, currentItem: Investment) => {
              // Reconstruct URIs from the current item to avoid stale closures
              const currentImageUris = currentItem.imageUris?.split(',').filter(Boolean) || [];
              const currentVideoUris = currentItem.videoUris?.split(',').filter(Boolean) || [];
              const currentVoiceUris = currentItem.voiceNoteUris?.split(',').filter(Boolean) || [];
              const currentAllAttachments = [...currentImageUris, ...currentVideoUris, ...currentVoiceUris];

              const clickedIndex = currentAllAttachments.findIndex((att) => att === clickedUri);
              const attachments: MediaAttachment[] = currentAllAttachments.map((att, idx) => {
                const isImage = currentImageUris.includes(att);
                const isVideo = currentVideoUris.includes(att);
                const isAudio = currentVoiceUris.includes(att);
                return {
                  id: `${currentItem.id}_${idx}`,
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
                      onPress={() => handleAttachmentPress(uri, item)}
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
                        <View style={[styles.previewAudio, { backgroundColor: colors.muted }]}>
                          <Icon name="music-note" size={20} color={colors.mutedForeground} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {allAttachments.length > 3 && (
                  <View style={[styles.moreAttachments, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.moreAttachmentsText, { color: colors.mutedForeground }]}>
                      +{allAttachments.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
          {item.isPast && (
            <View style={styles.profitLossContainer}>
              <Text
                style={[styles.profitLoss, { color: (item.profitLoss || 0) >= 0 ? colors.income : colors.expense }]}
              >
                {(item.profitLoss || 0) >= 0 ? '+' : ''}
                {formatCurrency(item.profitLoss || 0)}
              </Text>
              <Text style={[styles.currentValue, { color: colors.mutedForeground }]}>
                Current: {formatCurrency(item.currentValue || item.amount)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow} />

      <FlashList
        data={investments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>No investments yet</Text>}
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
          <View style={[styles.actionModal, { backgroundColor: colors.card }, shadow.xl]}>
            <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
              <Text style={[styles.actionOptionText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleDelete}>
              <Text style={[styles.actionOptionText, { color: colors.destructive }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleLiquidate}>
              <Text style={[styles.actionOptionText, { color: colors.warning }]}>Liquidate</Text>
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
          <View style={[styles.editModal, { backgroundColor: colors.card }, shadow.xl]}>
            <Text style={[styles.editTitle, { color: colors.foreground }]}>Add Investment</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Name"
              placeholderTextColor={colors.foregroundSubtle}
              value={addForm.name}
              onChangeText={(text) => setAddForm((f) => ({ ...f, name: text }))}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Amount"
              placeholderTextColor={colors.foregroundSubtle}
              keyboardType="numeric"
              value={addForm.amount}
              onChangeText={(text) => setAddForm((f) => ({ ...f, amount: text }))}
            />
            {/* Investment Type Dropdown (Add) */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowTypeDropdownAdd(!showTypeDropdownAdd)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    { color: addForm.type ? colors.foreground : colors.foregroundSubtle },
                  ]}
                >
                  {addForm.type || 'Investment Type (Stock, Crypto, ... )'}
                </Text>
                <Text style={[styles.dropdownArrow, { color: colors.mutedForeground }]}>▼</Text>
              </TouchableOpacity>
              <Modal
                visible={showTypeDropdownAdd}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTypeDropdownAdd(false)}
              >
                <TouchableOpacity
                  style={styles.modalBg}
                  activeOpacity={1}
                  onPress={() => setShowTypeDropdownAdd(false)}
                >
                  <View style={[styles.confirmModal, { backgroundColor: colors.card }, shadow.xl]}>
                    <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Select Investment Type</Text>
                    <View style={{ width: '100%' }}>
                      {InvestmentCategories.TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.modalItem}
                          onPress={() => {
                            setAddForm((f) => ({ ...f, type }));
                            setShowTypeDropdownAdd(false);
                          }}
                        >
                          <Icon name="trending-up" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Description"
              placeholderTextColor={colors.foregroundSubtle}
              value={addForm.description}
              onChangeText={(text) => setAddForm((f) => ({ ...f, description: text }))}
            />

            {/* Past Investment Switch (Add) */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Past Investment</Text>
              <Switch
                value={addIsPast}
                onValueChange={setAddIsPast}
                trackColor={{ false: colors.muted, true: colors.primaryMuted }}
                thumbColor={addIsPast ? colors.primary : colors.mutedForeground}
              />
            </View>

            <View style={styles.attachmentButtons}>
              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map((a) => ({
                        id: `img_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.IMAGE,
                        name: a.fileName || 'Image',
                        size: a.fileSize,
                      }));
                      setAddAttachments((prev) => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="photo" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'video', selectionLimit: 3 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map((a) => ({
                        id: `vid_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.VIDEO,
                        name: a.fileName || 'Video',
                        size: a.fileSize,
                      }));
                      setAddAttachments((prev) => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="videocam" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowVoiceRecorder(true)}
              >
                <Icon name="mic" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Voice</Text>
              </TouchableOpacity>
            </View>

            {addAttachments.length > 0 && (
              <View style={styles.attachmentPreviews}>
                {addAttachments.map((att) => (
                  <View key={att.id} style={[styles.attachmentPreview, { backgroundColor: colors.muted }]}>
                    {att.type === MediaType.IMAGE ? (
                      <Image source={{ uri: att.uri }} style={styles.previewImage} />
                    ) : att.type === MediaType.VIDEO ? (
                      <View style={styles.previewVideo}>
                        <Video
                          source={{ uri: att.uri }}
                          style={styles.previewVideoThumbnail}
                          resizeMode="cover"
                          paused
                          muted
                        />
                        <View style={styles.playOverlay}>
                          <Icon name="play-arrow" size={16} color="white" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.previewAudio, { backgroundColor: colors.muted }]}>
                        <Icon name="music-note" size={20} color={colors.mutedForeground} />
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
                buttonColor={colors.primary}
                textColor={colors.primaryForeground}
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
                      addAttachments,
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
              <Button
                mode="text"
                onPress={() => setAddModalVisible(false)}
                disabled={isSaving}
                textColor={colors.mutedForeground}
              >
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
          <View style={[styles.editModal, { backgroundColor: colors.card }, shadow.xl]}>
            <VoiceRecorder
              onRecordingComplete={(filePath: string) => {
                setEditAttachments((prev) => [
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
          <View style={[styles.editModal, { backgroundColor: colors.card }, shadow.xl]}>
            <Text style={[styles.editTitle, { color: colors.foreground }]}>Edit Investment</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Name"
              placeholderTextColor={colors.foregroundSubtle}
              value={editForm.name}
              onChangeText={(text) => setEditForm((f) => ({ ...f, name: text }))}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Amount"
              placeholderTextColor={colors.foregroundSubtle}
              keyboardType="numeric"
              value={editForm.amount}
              onChangeText={(text) => setEditForm((f) => ({ ...f, amount: text }))}
            />
            {/* Investment Type Dropdown (Edit) */}
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowTypeDropdownEdit(!showTypeDropdownEdit)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    { color: editForm.type ? colors.foreground : colors.foregroundSubtle },
                  ]}
                >
                  {editForm.type || 'Investment Type (Stock, Crypto, ... )'}
                </Text>
                <Text style={[styles.dropdownArrow, { color: colors.mutedForeground }]}>▼</Text>
              </TouchableOpacity>
              <Modal
                visible={showTypeDropdownEdit}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTypeDropdownEdit(false)}
              >
                <TouchableOpacity
                  style={styles.modalBg}
                  activeOpacity={1}
                  onPress={() => setShowTypeDropdownEdit(false)}
                >
                  <View style={[styles.confirmModal, { backgroundColor: colors.card }, shadow.xl]}>
                    <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Select Investment Type</Text>
                    <View style={{ width: '100%' }}>
                      {InvestmentCategories.TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.modalItem}
                          onPress={() => {
                            setEditForm((f) => ({ ...f, type }));
                            setShowTypeDropdownEdit(false);
                          }}
                        >
                          <Icon name="trending-up" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                          <Text style={[styles.modalItemText, { color: colors.foreground }]}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
              ]}
              placeholder="Description"
              placeholderTextColor={colors.foregroundSubtle}
              value={editForm.description}
              onChangeText={(text) => setEditForm((f) => ({ ...f, description: text }))}
            />
            {/* Past Investment Switch (Edit) */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Past Investment</Text>
              <Switch
                value={editIsPast}
                onValueChange={setEditIsPast}
                trackColor={{ false: colors.muted, true: colors.primaryMuted }}
                thumbColor={editIsPast ? colors.primary : colors.mutedForeground}
              />
            </View>

            {/* Attachment controls */}
            <View style={styles.attachmentButtons}>
              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map((a) => ({
                        id: `img_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.IMAGE,
                        name: a.fileName || 'Image',
                        size: a.fileSize,
                      }));
                      setEditAttachments((prev) => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="photo" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => {
                  launchImageLibrary({ mediaType: 'video', selectionLimit: 3 }, (response) => {
                    if (response.assets) {
                      const newAttachments: MediaAttachment[] = response.assets.map((a) => ({
                        id: `vid_${Date.now()}_${Math.random()}`,
                        uri: a.uri!,
                        type: MediaType.VIDEO,
                        name: a.fileName || 'Video',
                        size: a.fileSize,
                      }));
                      setEditAttachments((prev) => [...prev, ...newAttachments]);
                    }
                  });
                }}
              >
                <Icon name="videocam" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.attachmentButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowVoiceRecorder(true)}
              >
                <Icon name="mic" size={20} color={colors.primary} />
                <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>Voice</Text>
              </TouchableOpacity>
            </View>

            {editAttachments.length > 0 && (
              <View style={styles.attachmentPreviews}>
                {editAttachments.map((att) => (
                  <View key={att.id} style={[styles.attachmentPreview, { backgroundColor: colors.muted }]}>
                    {att.type === MediaType.IMAGE ? (
                      <Image source={{ uri: att.uri }} style={styles.previewImage} />
                    ) : att.type === MediaType.VIDEO ? (
                      <View style={styles.previewVideo}>
                        <Video
                          source={{ uri: att.uri }}
                          style={styles.previewVideoThumbnail}
                          resizeMode="cover"
                          paused
                          muted
                        />
                        <View style={styles.playOverlay}>
                          <Icon name="play-arrow" size={16} color="white" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.previewAudio, { backgroundColor: colors.muted }]}>
                        <Icon name="music-note" size={20} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={confirmEdit}
                loading={isSaving}
                disabled={isSaving}
                buttonColor={colors.primary}
                textColor={colors.primaryForeground}
              >
                Save
              </Button>
              <Button
                mode="text"
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
                textColor={colors.mutedForeground}
              >
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
          <View style={[styles.confirmModal, { backgroundColor: colors.card }, shadow.xl]}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Delete Investment</Text>
            <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>
              Are you sure you want to delete "{selectedInvestment?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={confirmDelete}
                buttonColor={colors.destructive}
                textColor={colors.destructiveForeground}
              >
                Delete
              </Button>
              <Button mode="text" onPress={() => setDeleteDialogVisible(false)} textColor={colors.mutedForeground}>
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
          <View style={[styles.confirmModal, { backgroundColor: colors.card }, shadow.xl]}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Liquidate Investment</Text>
            <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>
              Are you sure you want to liquidate "{selectedInvestment?.name}"? This will remove the investment without
              affecting your transaction history.
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={confirmLiquidate}
                buttonColor={colors.warning}
                textColor={colors.warningForeground}
              >
                Liquidate
              </Button>
              <Button mode="text" onPress={() => setLiquidateDialogVisible(false)} textColor={colors.mutedForeground}>
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
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'investments' | 'futures'>('investments');

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }, shadow.sm]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { borderBottomColor: activeTab === 'investments' ? colors.primary : 'transparent' },
          ]}
          onPress={() => setActiveTab('investments')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'investments' ? colors.primary : colors.mutedForeground },
              activeTab === 'investments' && styles.activeTabButtonText,
            ]}
          >
            Investments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, { borderBottomColor: activeTab === 'futures' ? colors.primary : 'transparent' }]}
          onPress={() => setActiveTab('futures')}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'futures' ? colors.primary : colors.mutedForeground },
              activeTab === 'futures' && styles.activeTabButtonText,
            ]}
          >
            Futures
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>{activeTab === 'investments' ? <InvestmentsContent /> : <FuturesTab />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing[4],
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabButtonText: {
    ...textStyles.label,
  },
  activeTabButtonText: {
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  title: {
    ...textStyles.h4,
    flex: 1,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    width: '100%',
    alignItems: 'center',
  },
  modalItemText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  empty: {
    ...textStyles.body,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    borderRadius: radius.xl,
    padding: spacing[6],
    minWidth: 220,
    alignItems: 'center',
  },
  actionOption: {
    paddingVertical: spacing[3],
    width: '100%',
    alignItems: 'center',
  },
  actionOptionText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  editModal: {
    borderRadius: radius.xl,
    padding: spacing[6],
    minWidth: 280,
    maxWidth: '90%',
    alignItems: 'stretch',
  },
  editTitle: {
    ...textStyles.h4,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    ...textStyles.body,
  },
  confirmModal: {
    borderRadius: radius.xl,
    padding: spacing[6],
    minWidth: 280,
    maxWidth: '90%',
    alignItems: 'center',
  },
  confirmTitle: {
    ...textStyles.h4,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  confirmText: {
    ...textStyles.body,
    marginBottom: spacing[4],
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
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  dropdownButtonText: {
    ...textStyles.body,
  },
  dropdownArrow: {
    ...textStyles.caption,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  switchLabel: {
    ...textStyles.body,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  card: {
    marginBottom: spacing[2],
    borderRadius: radius.lg,
  },
  attachmentPreviews: {
    flexDirection: 'row',
    marginTop: spacing[2],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    gap: spacing[1.5],
  },
  attachmentButtonText: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    overflow: 'hidden',
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
    position: 'relative',
  },
  previewVideoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
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
    borderRadius: radius.md,
  },
  previewAudio: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttachments: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttachmentsText: {
    ...textStyles.caption,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[4],
  },
  amount: {
    ...textStyles.amountSmall,
    marginBottom: spacing[1],
  },
  description: {
    ...textStyles.bodySmall,
    marginBottom: spacing[1],
  },
  date: {
    ...textStyles.caption,
    marginBottom: spacing[1],
  },
  profitLossContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  profitLoss: {
    ...textStyles.label,
    fontWeight: '700',
  },
  currentValue: {
    ...textStyles.bodySmall,
  },
});

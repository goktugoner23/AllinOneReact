import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {
  IconButton,
  Text,
  Surface,
  Portal,
  Modal,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioPlayer from './AudioPlayer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Attachment {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name?: string;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
  initialIndex?: number;
  onClose: () => void;
}

const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ 
  attachments, 
  initialIndex = 0, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const currentAttachment = attachments[currentIndex];

  const renderMediaItem = ({ item, index }: { item: Attachment; index: number }) => {
    const renderMediaContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <Image
              source={{ uri: item.uri }}
              style={styles.mediaContent}
              resizeMode="contain"
            />
          );
        
        case 'video':
          return (
            <View style={styles.videoContainer}>
              <Icon name="play-circle-outline" size={80} color="#666" />
              <Text style={styles.mediaText}>Video</Text>
              <Text style={styles.mediaSubtext}>Tap to play</Text>
            </View>
          );
        
        case 'audio':
          return (
            <View style={styles.audioContainer}>
              <Icon name="music-note" size={80} color="#666" />
              <Text style={styles.mediaText}>Audio</Text>
              <AudioPlayer 
                attachment={{ 
                  uri: item.uri, 
                  type: 'audio' as any, 
                  name: item.name || 'Audio' 
                }} 
              />
            </View>
          );
        
        default:
          return (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Unsupported Media Type</Text>
            </View>
          );
      }
    };

    return (
      <View style={styles.slide}>
        {renderMediaContent()}
      </View>
    );
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented later');
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Download functionality will be implemented later');
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <Portal>
      <Modal
        visible={true}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                style={styles.headerButton}
              />
              <Text style={styles.headerTitle}>
                {currentAttachment?.name || `Attachment ${currentIndex + 1}`}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="share"
                size={24}
                onPress={handleShare}
                style={styles.headerButton}
              />
              <IconButton
                icon="download"
                size={24}
                onPress={handleDownload}
                style={styles.headerButton}
              />
            </View>
          </View>

          {/* Media Content */}
          <View style={styles.contentContainer}>
            <FlatList
              ref={flatListRef}
              data={attachments}
              renderItem={renderMediaItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              initialScrollIndex={initialIndex}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
            />
          </View>

          {/* Navigation Controls */}
          {attachments.length > 1 && (
            <View style={styles.navigationContainer}>
              <IconButton
                icon="chevron-left"
                size={32}
                onPress={handlePrevious}
                disabled={currentIndex === 0}
                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              />
              <Text style={styles.counter}>
                {currentIndex + 1} / {attachments.length}
              </Text>
              <IconButton
                icon="chevron-right"
                size={32}
                onPress={handleNext}
                disabled={currentIndex === attachments.length - 1}
                style={[styles.navButton, currentIndex === attachments.length - 1 && styles.navButtonDisabled]}
              />
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    margin: 0,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContent: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  audioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  mediaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  mediaSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  placeholderText: {
    color: 'white',
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  navButton: {
    margin: 0,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  counter: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AttachmentGallery; 
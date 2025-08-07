import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'react-native-video';
import {
  IconButton,
  Text,
  Surface,
  Portal,
  Modal,
  ProgressBar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioPlayer from '@shared/components/ui/AudioPlayer';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';

import RNFS from 'react-native-fs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AttachmentGalleryProps {
  attachments: MediaAttachment[];
  initialIndex?: number;
  onClose: () => void;
}

const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ 
  attachments, 
  initialIndex = 0, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const currentAttachment = attachments[currentIndex];

  const renderMediaItem = ({ item, index }: { item: MediaAttachment; index: number }) => {
    const renderMediaContent = () => {
      switch (item.type) {
        case MediaType.IMAGE:
          return (
            <Image
              source={{ uri: item.uri }}
              style={styles.mediaContent}
              resizeMode="contain"
            />
          );
        
        case MediaType.VIDEO:
          return (
            <View style={styles.videoContainer}>
              {playingVideo === item.uri ? (
                videoError ? (
                  <View style={styles.videoErrorContainer}>
                    <Text style={styles.videoErrorText}>Video playback failed</Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={() => {
                        setVideoError(null);
                        setPlayingVideo(null);
                        setTimeout(() => setPlayingVideo(item.uri), 100);
                      }}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Video
                    source={{ uri: item.uri }}
                    style={styles.videoPlayer}
                    resizeMode="contain"
                    paused={false}
                    onEnd={() => {
                      console.log('Video playback ended');
                      setPlayingVideo(null);
                      setVideoError(null);
                    }}
                    repeat={false}
                    muted={false}
                    controls={true}
                    onError={(error) => {
                      console.error('Video playback error:', error);
                      setVideoError('Failed to play video');
                      setPlayingVideo(null);
                    }}
                    onLoad={(data) => {
                      console.log('Video loaded successfully:', data);
                      setVideoError(null);
                    }}
                    onBuffer={(buffer) => {
                      console.log('Video buffering:', buffer.isBuffering);
                    }}
                    onProgress={(progress) => {
                      // Only log progress occasionally to avoid spam
                      if (Math.floor(progress.currentTime) % 5 === 0) {
                        console.log('Video progress:', Math.floor(progress.currentTime));
                      }
                    }}
                  />
                )
              ) : (
                <TouchableOpacity
                  style={styles.videoThumbnail}
                  onPress={() => {
                    console.log('Starting video playback for URI:', item.uri);
                    setPlayingVideo(item.uri);
                  }}
                >
                  <Video
                    source={{ uri: item.uri }}
                    style={styles.videoThumbnailPlayer}
                    resizeMode="cover"
                    paused={true}
                    muted={true}
                    onLoad={(data) => {
                      console.log('Video thumbnail loaded:', data);
                    }}
                    onError={(error) => {
                      console.error('Video thumbnail error:', error);
                    }}
                  />
                  <View style={styles.playOverlay}>
                    <Icon name="play-circle-fill" size={60} color="white" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        
        case MediaType.AUDIO:
          return (
            <View style={styles.audioContainer}>
              <View style={styles.audioThumbnail}>
                <Icon name="music-note" size={60} color="#007AFF" />
              </View>
              <Text style={styles.mediaText}>Voice Note</Text>
              <AudioPlayer 
                attachment={item}
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



  const handleDownload = async () => {
    try {
      const currentAttachment = attachments[currentIndex];
      if (!currentAttachment) return;

      setDownloading(true);
      setDownloadProgress(50); // Start at 50% since we're copying

      // Get file extension based on type
      const getFileExtension = (type: string) => {
        switch (type) {
          case 'image': return '.jpg';
          case 'video': return '.mp4';
          case 'audio': return '.m4a';

          default: return '.file';
        }
      };

      const fileName = `attachment_${Date.now()}${getFileExtension(currentAttachment.type)}`;
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Handle local files vs remote files
      if (currentAttachment.uri.startsWith('file://')) {
        // For local files, copy them
        const sourcePath = currentAttachment.uri.replace('file://', '');
        await RNFS.copyFile(sourcePath, downloadPath);
        setDownloadProgress(100);
        Alert.alert('Success', `File copied to Downloads folder as ${fileName}`);
      } else {
        // For remote files, download them
        const result = await RNFS.downloadFile({
          fromUrl: currentAttachment.uri,
          toFile: downloadPath,
          background: true,
          discretionary: true,
          progress: (res) => {
            const progressPercent = (res.bytesWritten / res.contentLength) * 100;
            setDownloadProgress(progressPercent);
            console.log(`Download progress: ${progressPercent}%`);
          },
        }).promise;

        if (result.statusCode === 200) {
          Alert.alert('Success', `File downloaded to Downloads folder as ${fileName}`);
        } else {
          throw new Error(`Download failed with status: ${result.statusCode}`);
        }
      }
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to download attachment');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setPlayingVideo(null);
      setVideoError(null);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setPlayingVideo(null);
      setVideoError(null);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      // Reset video state when switching between attachments
      setPlayingVideo(null);
      setVideoError(null);
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
                icon="download"
                size={24}
                onPress={handleDownload}
                style={styles.headerButton}
                disabled={downloading}
              />
              {downloading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </View>
          </View>
          
          {/* Download Progress */}
          {downloading && (
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={downloadProgress / 100} 
                color="#007AFF"
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                Downloading... {Math.round(downloadProgress)}%
              </Text>
            </View>
          )}

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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
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
  videoPlayer: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  videoThumbnail: {
    width: screenWidth,
    height: screenHeight * 0.7,
    position: 'relative',
  },
  videoThumbnailPlayer: {
    width: '100%',
    height: '100%',
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
  },
  audioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  audioThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  videoErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
    backgroundColor: '#1a1a1a',
  },
  videoErrorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
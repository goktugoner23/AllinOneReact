import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Video } from 'react-native-video';
import { IconButton, Text, Surface, Portal, Modal, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioPlayer from '@shared/components/ui/AudioPlayer';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import { useAppTheme } from '@shared/theme';

import RNFS from 'react-native-fs';
import { getCachedUriIfExists, warmCache } from '@shared/services/mediaCache';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface AttachmentGalleryProps {
  attachments: MediaAttachment[];
  initialIndex?: number;
  onClose: () => void;
}

export interface AttachmentGalleryHandle {
  scrollToIndex: (index: number) => void;
}

const AttachmentGallery = forwardRef<AttachmentGalleryHandle, AttachmentGalleryProps>(
  ({ attachments, initialIndex = 0, onClose }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const flatListRef = useRef<FlashList<MediaAttachment>>(null);
    const { colors, spacing, radius, textStyles } = useAppTheme();

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (index: number) => {
          if (index >= 0 && index < attachments.length) {
            setCurrentIndex(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }
        },
      }),
      [attachments.length],
    );

    const currentAttachment = attachments[currentIndex];

    // Pre-warm cache for current, previous and next attachments
    React.useEffect(() => {
      const indicesToWarm = [currentIndex, currentIndex - 1, currentIndex + 1].filter(
        (i) => i >= 0 && i < attachments.length,
      );
      indicesToWarm.forEach((i) => {
        const att = attachments[i];
        const fallbackExt = att.type === MediaType.IMAGE ? 'jpg' : att.type === MediaType.VIDEO ? 'mp4' : 'm4a';
        warmCache(att.uri, fallbackExt);
      });
    }, [currentIndex, attachments]);

    const GalleryItem: React.FC<{ item: MediaAttachment }> = React.memo(({ item }) => {
      const [cachedUri, setCachedUri] = React.useState<string>(item.uri);

      React.useEffect(() => {
        let mounted = true;
        const fallbackExt = item.type === MediaType.IMAGE ? 'jpg' : item.type === MediaType.VIDEO ? 'mp4' : 'm4a';
        getCachedUriIfExists(item.uri, fallbackExt).then((uri) => {
          if (mounted) setCachedUri(uri);
        });
        return () => {
          mounted = false;
        };
      }, [item.uri, item.type]);

      const renderMediaContent = () => {
        switch (item.type) {
          case MediaType.IMAGE:
            return <Image source={{ uri: cachedUri }} style={styles.mediaContent} resizeMode="contain" />;

          case MediaType.VIDEO:
            return (
              <View style={styles.videoContainer}>
                {playingVideo === item.uri ? (
                  videoError ? (
                    <View style={[styles.videoErrorContainer, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[textStyles.body, { color: colors.foreground, marginBottom: spacing[4] }]}>
                        Video playback failed
                      </Text>
                      <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radius.sm }]}
                        onPress={() => {
                          setVideoError(null);
                          setPlayingVideo(null);
                          setTimeout(() => setPlayingVideo(item.uri), 100);
                        }}
                      >
                        <Text style={[textStyles.button, { color: colors.primaryForeground }]}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Video
                      source={{ uri: cachedUri }}
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
                      source={{ uri: cachedUri }}
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
                <View style={[styles.audioThumbnail, { backgroundColor: colors.primaryMuted }]}>
                  <Icon name="music-note" size={60} color={colors.primary} />
                </View>
                <Text style={[textStyles.bodyLarge, { color: colors.background, marginTop: spacing[4] }]}>
                  Voice Note
                </Text>
                <AudioPlayer attachment={{ ...item, uri: cachedUri }} />
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

      return <View style={styles.slide}>{renderMediaContent()}</View>;
    });

    const renderMediaItem = ({ item }: { item: MediaAttachment; index: number }) => {
      return <GalleryItem item={item} />;
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
            case 'image':
              return '.jpg';
            case 'video':
              return '.mp4';
            case 'audio':
              return '.m4a';

            default:
              return '.file';
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
        <Modal visible={true} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
          <Surface style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View
              style={[
                styles.header,
                { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2] },
              ]}
            >
              <View style={styles.headerLeft}>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={onClose}
                  style={styles.headerButton}
                  iconColor={colors.foreground}
                />
                <Text style={[textStyles.label, { color: colors.foreground, marginLeft: spacing[2], flex: 1 }]}>
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
                  iconColor={colors.foreground}
                />
                {downloading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </View>
            </View>

            {/* Download Progress */}
            {downloading && (
              <View style={[styles.progressContainer, { paddingHorizontal: spacing[4], paddingVertical: spacing[2] }]}>
                <ProgressBar progress={downloadProgress / 100} color={colors.primary} style={styles.progressBar} />
                <Text
                  style={[textStyles.caption, { color: colors.foreground, textAlign: 'center', marginTop: spacing[1] }]}
                >
                  Downloading... {Math.round(downloadProgress)}%
                </Text>
              </View>
            )}

            {/* Media Content */}
            <View style={styles.contentContainer}>
              <FlashList
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
                estimatedItemSize={screenWidth}
              />
            </View>

            {/* Navigation Controls */}
            {attachments.length > 1 && (
              <View style={[styles.navigationContainer, { paddingHorizontal: spacing[4], paddingBottom: spacing[4] }]}>
                <IconButton
                  icon="chevron-left"
                  size={32}
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                  style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                  iconColor={colors.foreground}
                />
                <Text style={[textStyles.label, { color: colors.foreground }]}>
                  {currentIndex + 1} / {attachments.length}
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={32}
                  onPress={handleNext}
                  disabled={currentIndex === attachments.length - 1}
                  style={[styles.navButton, currentIndex === attachments.length - 1 && styles.navButtonDisabled]}
                  iconColor={colors.foreground}
                />
              </View>
            )}
          </Surface>
        </Modal>
      </Portal>
    );
  },
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  progressContainer: {},
  progressBar: {
    height: 4,
    borderRadius: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
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
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  videoErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    margin: 0,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
});

export default AttachmentGallery;

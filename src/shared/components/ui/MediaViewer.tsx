import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, Alert, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import AudioPlayer from '@shared/components/ui/AudioPlayer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaViewerProps {
  attachment: MediaAttachment;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ attachment, onClose }) => {
  const colors = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const renderMediaContent = () => {
    switch (attachment.type) {
      case MediaType.IMAGE:
        return <Image source={{ uri: attachment.uri }} style={styles.image} resizeMode="contain" />;

      case MediaType.VIDEO:
        return (
          <View style={[styles.videoContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.placeholderText, { color: colors.foreground }]}>Video Player</Text>
            <Text style={[styles.placeholderSubtext, { color: colors.mutedForeground }]}>
              Video playback will be implemented in Phase 4
            </Text>
          </View>
        );

      case MediaType.AUDIO:
        return (
          <View style={[styles.audioContainer, { backgroundColor: colors.muted }]}>
            <AudioPlayer attachment={attachment} />
          </View>
        );

      default:
        return (
          <View style={[styles.placeholderContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.placeholderText, { color: colors.foreground }]}>Unsupported Media Type</Text>
          </View>
        );
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented in Phase 6');
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Download functionality will be implemented in Phase 6');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{attachment.name}</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={handleDownload} style={styles.iconButton}>
            <Ionicons name="download-outline" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Media Content */}
      <View style={styles.content}>{renderMediaContent()}</View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <View style={styles.metaInfo}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Type: {attachment.type}</Text>
          {attachment.size && (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Size: {formatFileSize(attachment.size)}
            </Text>
          )}
          {attachment.duration && (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Duration: {formatDuration(attachment.duration)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    marginBottom: 24,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  audioDuration: {
    fontSize: 14,
  },
  placeholderContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  metaInfo: {
    paddingVertical: 16,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default MediaViewer;

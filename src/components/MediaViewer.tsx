import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  IconButton,
  Text,
  Surface,
  Portal,
  Modal,
} from 'react-native-paper';
import { MediaAttachment, MediaType } from '../types/MediaAttachment';
import AudioPlayer from './AudioPlayer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaViewerProps {
  attachment: MediaAttachment;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ attachment, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const renderMediaContent = () => {
    switch (attachment.type) {
      case MediaType.IMAGE:
        return (
          <Image
            source={{ uri: attachment.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        );
      
      case MediaType.VIDEO:
        return (
          <View style={styles.videoContainer}>
            <Text style={styles.placeholderText}>Video Player</Text>
            <Text style={styles.placeholderSubtext}>
              Video playback will be implemented in Phase 4
            </Text>
          </View>
        );
      
      case MediaType.AUDIO:
        return (
          <View style={styles.audioContainer}>
            <AudioPlayer attachment={attachment} />
          </View>
        );
      
      case MediaType.DRAWING:
        return (
          <Image
            source={{ uri: attachment.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        );
      
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Unsupported Media Type</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="close"
            size={24}
            iconColor="white"
            onPress={onClose}
          />
          <Text style={styles.headerTitle}>{attachment.name}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <IconButton
            icon="share"
            size={24}
            iconColor="white"
            onPress={handleShare}
          />
          <IconButton
            icon="download"
            size={24}
            iconColor="white"
            onPress={handleDownload}
          />
        </View>
      </View>

      {/* Media Content */}
      <View style={styles.content}>
        {renderMediaContent()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            Type: {attachment.type}
          </Text>
          {attachment.size && (
            <Text style={styles.metaText}>
              Size: {formatFileSize(attachment.size)}
            </Text>
          )}
          {attachment.duration && (
            <Text style={styles.metaText}>
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
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
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
    backgroundColor: '#1a1a1a',
  },
  audioContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  audioTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  audioDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  placeholderContainer: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  metaInfo: {
    paddingVertical: 16,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default MediaViewer; 
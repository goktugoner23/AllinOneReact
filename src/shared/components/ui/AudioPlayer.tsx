import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Card,
  IconButton,
  Text,
  ProgressBar,
  Surface,
} from 'react-native-paper';

import { MediaAttachment, MediaType } from '@shared/types/MediaAttachment';
import AudioRecorderPlayer, { PlayBackType } from 'react-native-audio-recorder-player';

const { width: screenWidth } = Dimensions.get('window');

interface AudioPlayerProps {
  attachment: MediaAttachment;
  style?: any;
}

interface PlayerState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment, style }) => {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: attachment.duration || 0,
    error: null,
  });

  const audioRecorderPlayer = useRef<AudioRecorderPlayer>(new AudioRecorderPlayer());

  useEffect(() => {
    if (attachment.type === MediaType.AUDIO) {
      loadAudio();
    }
    return () => {
      cleanup();
    };
  }, [attachment.uri, attachment.type]);

  const loadAudio = async () => {
    try {
      // Check if URI is valid
      if (!attachment.uri || attachment.uri.trim() === '') {
        setState(prev => ({ 
          ...prev, 
          error: 'Invalid audio file URI',
          isLoaded: false 
        }));
        return;
      }

      // Clean up the URI - remove double file:// prefixes
      let cleanUri = attachment.uri;
      while (cleanUri.startsWith('file://file://')) {
        cleanUri = cleanUri.replace('file://file://', 'file://');
      }

      // Use the attachment duration if available, otherwise use default
      let duration = attachment.duration || 30000; // Default to 30 seconds
      
      // Just mark as loaded without trying to determine duration
      // The duration will be updated during playback if available
      setState(prev => ({ 
        ...prev, 
        isLoaded: true, 
        duration: duration
      }));
    } catch (error) {
      console.error('Audio loading error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio file',
        isLoaded: false 
      }));
    }
  };

  const playAudio = async () => {
    if (!state.isLoaded) return;

    try {
      setState(prev => ({ ...prev, isPlaying: true }));

      // Set subscription duration for better progress tracking (recommended: 0.1)
      audioRecorderPlayer.current.setSubscriptionDuration(0.1);

      // Clean up the URI - remove double file:// prefixes
      let cleanUri = attachment.uri;
      while (cleanUri.startsWith('file://file://')) {
        cleanUri = cleanUri.replace('file://file://', 'file://');
      }

      // Add playback listener first - using proper PlayBackType interface
      audioRecorderPlayer.current.addPlayBackListener((e: PlayBackType) => {
        // Don't use Math.floor() - the library provides precise millisecond timing
        setState(prev => ({
          ...prev,
          currentTime: e.currentPosition,
          duration: e.duration,
        }));
        
        // Check if playback has ended (within 500ms of duration to account for timing differences)
        if (e.duration > 0 && e.currentPosition >= (e.duration - 500)) {
          setTimeout(() => {
            setState(prev => ({ 
              ...prev, 
              isPlaying: false, 
              currentTime: 0 
            }));
            audioRecorderPlayer.current.removePlayBackListener();
          }, 200);
        }
      });

      // Start playback
      await audioRecorderPlayer.current.startPlayer(cleanUri);
    } catch (error) {
      console.error('Playback error:', error);
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: 'Failed to play audio' 
      }));
    }
  };

  const pauseAudio = async () => {
    try {
      await audioRecorderPlayer.current.pausePlayer();
      setState(prev => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const stopAudio = async () => {
    try {
      await audioRecorderPlayer.current.stopPlayer();
      
      // Remove listeners
      audioRecorderPlayer.current.removePlayBackListener();
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }));
    } catch (error) {
      console.error('Stop error:', error);
      // Even if there's an error, reset the state
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }));
    }
  };

  const seekTo = async (position: number) => {
    if (!state.isLoaded) return;

    try {
      const seconds = (position / 100) * (state.duration / 1000);
      await audioRecorderPlayer.current.seekToPlayer(seconds);
      setState(prev => ({
        ...prev,
        currentTime: seconds * 1000,
      }));
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const cleanup = async () => {
    try {
      await audioRecorderPlayer.current.stopPlayer();
      audioRecorderPlayer.current.removePlayBackListener();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Using the library's built-in time formatting utility
  const formatDuration = (milliseconds: number) => {
    return audioRecorderPlayer.current.mmssss(milliseconds);
  };

  const getProgress = () => {
    if (state.duration > 0) {
      return state.currentTime / state.duration;
    }
    return 0;
  };

  const renderWaveform = () => {
    // Generate a simple waveform visualization
    const bars = 20;
    const waveformData = Array.from({ length: bars }, () => 
      Math.random() * 0.8 + 0.2
    );

    return (
      <View style={styles.waveformContainer}>
        {waveformData.map((height, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 40,
                backgroundColor: state.isPlaying ? '#2196f3' : '#ccc',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <IconButton icon="error" size={24} iconColor="#f44336" />
      <Text style={styles.errorText}>{state.error}</Text>
    </View>
  );

  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading audio...</Text>
    </View>
  );

  if (state.error) {
    return (
      <Card style={[styles.container, style]}>
        <Card.Content>
          {renderErrorView()}
        </Card.Content>
      </Card>
    );
  }

  if (!state.isLoaded) {
    return (
      <Card style={[styles.container, style]}>
        <Card.Content>
          {renderLoadingView()}
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{attachment.name}</Text>
            <Text style={styles.subtitle}>Audio File</Text>
          </View>
          <IconButton
            icon="music-note"
            size={24}
            iconColor="#2196f3"
          />
        </View>

        {renderWaveform()}

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={getProgress()}
            style={styles.progressBar}
            color="#2196f3"
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatDuration(state.currentTime)}
            </Text>
            <Text style={styles.timeText}>
              {formatDuration(state.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <IconButton
            icon="skip-previous"
            size={24}
            onPress={stopAudio}
          />
          <IconButton
            icon={state.isPlaying ? 'pause' : 'play'}
            size={32}
            iconColor="white"
            style={styles.playButton}
            onPress={state.isPlaying ? pauseAudio : playAudio}
          />
          <IconButton
            icon="skip-next"
            size={24}
            onPress={stopAudio}
          />
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            Duration: {formatDuration(state.duration)}
          </Text>
          {attachment.size && (
            <Text style={styles.metaText}>
              Size: {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 50,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#2196f3',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AudioPlayer; 
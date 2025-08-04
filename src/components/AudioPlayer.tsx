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
import Sound from 'react-native-sound';
import { MediaAttachment, MediaType } from '../types/MediaAttachment';

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

  const soundRef = useRef<Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (attachment.type === MediaType.AUDIO) {
      loadAudio();
    }
    return () => {
      cleanup();
    };
  }, [attachment.uri, attachment.type]);

  const loadAudio = () => {
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

      // Release previous sound if exists
      if (soundRef.current) {
        soundRef.current.release();
      }

      // Create new Sound instance
      soundRef.current = new Sound(attachment.uri, null, (error) => {
        if (error) {
          console.error('Audio loading error:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to load audio file',
            isLoaded: false 
          }));
          return;
        }

        // Get duration
        soundRef.current?.getDuration((duration) => {
          setState(prev => ({ 
            ...prev, 
            isLoaded: true, 
            duration: duration * 1000 // Convert to milliseconds
          }));
        });
      });
    } catch (error) {
      console.error('Audio loading error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio file',
        isLoaded: false 
      }));
    }
  };

  const playAudio = () => {
    if (!soundRef.current || !state.isLoaded) return;

    try {
      soundRef.current.play((success) => {
        if (success) {
          setState(prev => ({ ...prev, isPlaying: false }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            error: 'Playback failed' 
          }));
        }
      });

      setState(prev => ({ ...prev, isPlaying: true }));

      // Start progress tracking
      progressInterval.current = setInterval(() => {
        soundRef.current?.getCurrentTime((seconds) => {
          setState(prev => ({
            ...prev,
            currentTime: seconds * 1000, // Convert to milliseconds
          }));
        });
      }, 100);
    } catch (error) {
      console.error('Playback error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to play audio' 
      }));
    }
  };

  const pauseAudio = () => {
    if (!soundRef.current) return;

    soundRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const stopAudio = () => {
    if (!soundRef.current) return;

    soundRef.current.stop();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: 0 
    }));
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const seekTo = (position: number) => {
    if (!soundRef.current || !state.isLoaded) return;

    const seconds = (position / 100) * (state.duration / 1000);
    soundRef.current.setCurrentTime(seconds);
    setState(prev => ({
      ...prev,
      currentTime: seconds * 1000,
    }));
  };

  const cleanup = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (soundRef.current) {
      soundRef.current.release();
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
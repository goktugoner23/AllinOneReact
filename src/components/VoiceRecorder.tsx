import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Card,
  IconButton,
  Text,
  Button,
  ProgressBar,
  Surface,
  Portal,
  Modal,
} from 'react-native-paper';
import Sound from 'react-native-sound';
import { MediaAttachment, MediaType } from '../types/MediaAttachment';
import { MediaService } from '../services/MediaService';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceRecorderProps {
  onRecordingComplete: (attachment: MediaAttachment) => void;
  style?: any;
}

interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  recordingDuration: number;
  playbackPosition: number;
  totalDuration: number;
  audioFile: string | null;
  hasPermission: boolean;
  error: string | null;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  style,
}) => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    recordingDuration: 0,
    playbackPosition: 0,
    totalDuration: 0,
    audioFile: null,
    hasPermission: false,
    error: null,
  });

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    requestPermission();
    return () => {
      cleanup();
    };
  }, []);

  const requestPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setState(prev => ({ ...prev, hasPermission: true }));
        } else {
          setState(prev => ({ 
            ...prev, 
            hasPermission: false, 
            error: 'Microphone permission denied' 
          }));
        }
      } else {
        // iOS permissions are handled differently
        setState(prev => ({ ...prev, hasPermission: true }));
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: 'Failed to request permission' 
      }));
    }
  };

  const startRecording = async () => {
    if (!state.hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
      return;
    }

    try {
      // For now, we'll simulate recording since react-native-sound doesn't support recording
      // In a real implementation, you'd use react-native-audio-recorder-player or similar
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        recordingDuration: 0,
        error: null 
      }));

      // Simulate recording duration
      recordingInterval.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 100,
        }));
      }, 100);

      // Simulate recording completion after 10 seconds
      setTimeout(() => {
        stopRecording();
      }, 10000);

    } catch (error) {
      console.error('Recording error:', error);
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        error: 'Failed to start recording' 
      }));
    }
  };

  const stopRecording = async () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    setState(prev => ({ ...prev, isRecording: false }));

    // Simulate creating an audio file
    const audioFile = `audio_${Date.now()}.m4a`;
    setState(prev => ({ 
      ...prev, 
      audioFile,
      totalDuration: prev.recordingDuration 
    }));

    // Upload to Firebase Storage
    try {
      const result = await MediaService.uploadMedia(
        audioFile, // In real implementation, this would be the actual file path
        MediaType.AUDIO,
        'Voice Recording'
      );

      if (result.success && result.uri) {
        const attachment: MediaAttachment = {
          id: `audio_${Date.now()}`,
          uri: result.uri,
          type: MediaType.AUDIO,
          name: 'Voice Recording',
          duration: state.recordingDuration,
        };

        onRecordingComplete(attachment);
        
        // Reset state
        setState(prev => ({
          ...prev,
          audioFile: null,
          recordingDuration: 0,
          totalDuration: 0,
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to save recording' 
      }));
    }
  };

  const playRecording = () => {
    if (!state.audioFile) return;

    try {
      // Create a new Sound instance
      soundRef.current = new Sound(state.audioFile, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Sound loading error:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to load audio file' 
          }));
          return;
        }

        // Start playing
        soundRef.current?.play((success) => {
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

        // Track playback position
        playbackInterval.current = setInterval(() => {
          soundRef.current?.getCurrentTime((seconds) => {
            setState(prev => ({
              ...prev,
              playbackPosition: seconds * 1000,
            }));
          });
        }, 100);
      });
    } catch (error) {
      console.error('Playback error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to play recording' 
      }));
    }
  };

  const pausePlayback = () => {
    soundRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
    
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
  };

  const stopPlayback = () => {
    soundRef.current?.stop();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      playbackPosition: 0 
    }));
    
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
  };

  const cleanup = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
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
    if (state.isRecording) {
      return Math.min(state.recordingDuration / 60000, 1); // Max 60 seconds
    }
    if (state.totalDuration > 0) {
      return state.playbackPosition / state.totalDuration;
    }
    return 0;
  };

  const renderRecordingView = () => (
    <View style={styles.recordingContainer}>
      <View style={styles.recordingHeader}>
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
        <Text style={styles.durationText}>
          {formatDuration(state.recordingDuration)}
        </Text>
      </View>
      
      <ProgressBar 
        progress={getProgress()} 
        style={styles.progressBar}
        color="#f44336"
      />
      
      <View style={styles.recordingControls}>
        <IconButton
          icon="stop"
          size={32}
          iconColor="white"
          style={styles.stopButton}
          onPress={stopRecording}
        />
      </View>
    </View>
  );

  const renderPlaybackView = () => (
    <View style={styles.playbackContainer}>
      <View style={styles.playbackHeader}>
        <Text style={styles.playbackTitle}>Voice Recording</Text>
        <Text style={styles.durationText}>
          {formatDuration(state.playbackPosition)} / {formatDuration(state.totalDuration)}
        </Text>
      </View>
      
      <ProgressBar 
        progress={getProgress()} 
        style={styles.progressBar}
        color="#2196f3"
      />
      
      <View style={styles.playbackControls}>
        <IconButton
          icon="skip-previous"
          size={24}
          onPress={stopPlayback}
        />
        <IconButton
          icon={state.isPlaying ? 'pause' : 'play'}
          size={32}
          iconColor="white"
          style={styles.playButton}
          onPress={state.isPlaying ? pausePlayback : playRecording}
        />
        <IconButton
          icon="skip-next"
          size={24}
          onPress={stopPlayback}
        />
      </View>
    </View>
  );

  const renderPermissionView = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionText}>Microphone permission required</Text>
      <Button
        mode="contained"
        onPress={requestPermission}
        style={styles.permissionButton}
      >
        Grant Permission
      </Button>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{state.error}</Text>
      <Button
        mode="outlined"
        onPress={() => setState(prev => ({ ...prev, error: null }))}
        style={styles.errorButton}
      >
        Dismiss
      </Button>
    </View>
  );

  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        {state.error ? (
          renderErrorView()
        ) : !state.hasPermission ? (
          renderPermissionView()
        ) : state.isRecording ? (
          renderRecordingView()
        ) : state.audioFile ? (
          renderPlaybackView()
        ) : (
          <View style={styles.initialContainer}>
            <Text style={styles.initialTitle}>Voice Recorder</Text>
            <Text style={styles.initialSubtitle}>
              Tap the microphone to start recording
            </Text>
            <IconButton
              icon="microphone"
              size={48}
              iconColor="white"
              style={styles.recordButton}
              onPress={startRecording}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  initialContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  initialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  initialSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: '#f44336',
    margin: 8,
  },
  recordingContainer: {
    paddingVertical: 16,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f44336',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  recordingControls: {
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  playbackContainer: {
    paddingVertical: 16,
  },
  playbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playbackTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    backgroundColor: '#2196f3',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 8,
  },
});

export default VoiceRecorder; 
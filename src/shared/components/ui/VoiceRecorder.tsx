import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, PermissionsAndroid, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { ProgressBar } from './ProgressBar';
import { Button } from './Button';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  RecordBackType,
  PlayBackType,
} from 'react-native-audio-recorder-player';

interface VoiceRecorderProps {
  onRecordingComplete: (filePath: string, duration: number) => void;
  onCancel: () => void;
}

interface VoiceRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  recordingTime: number;
  playingTime: number;
  duration: number;
  recordedFilePath: string | null;
  hasPermission: boolean;
  error: string | null;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const colors = useColors();
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPlaying: false,
    recordingTime: 0,
    playingTime: 0,
    duration: 0,
    recordedFilePath: null,
    hasPermission: false,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const audioRecorderPlayer = useRef<AudioRecorderPlayer>(new AudioRecorderPlayer());

  useEffect(() => {
    checkPermission();
    return () => {
      cleanup();
    };
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record voice notes.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        setState((prev) => ({ ...prev, hasPermission: granted === PermissionsAndroid.RESULTS.GRANTED }));
      } catch (err) {
        console.warn(err);
        setState((prev) => ({ ...prev, hasPermission: false }));
      }
    } else {
      setState((prev) => ({ ...prev, hasPermission: true }));
    }
  };

  const startRecording = async () => {
    if (!state.hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
      return;
    }

    setIsLoading(true);
    try {
      // Set subscription duration for better progress tracking (recommended: 0.1)
      audioRecorderPlayer.current.setSubscriptionDuration(0.1);

      // Configure recording settings for proper MP4/M4A format
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        OutputFormatAndroid: OutputFormatAndroidType.MPEG_4, // Use MPEG_4 for MP4 format on Android
        AVSampleRateKeyIOS: 44100,
        AVFormatIDKeyIOS: AVEncodingOption.aac, // Explicitly set AAC format for iOS M4A
      };

      // Use platform-specific paths as recommended
      const timestamp = Date.now();
      const recordingPath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/recording_${timestamp}.m4a`,
        android: `${RNFS.ExternalDirectoryPath}/recording_${timestamp}.mp4`,
        default: `${RNFS.DocumentDirectoryPath}/recording_${timestamp}.m4a`,
      });

      // Add record back listener first - using proper RecordBackType interface
      audioRecorderPlayer.current.addRecordBackListener((e: RecordBackType) => {
        setState((prev) => ({
          ...prev,
          recordingTime: e.currentPosition, // Don't use Math.floor() for precise timing
        }));
      });

      const uri = await audioRecorderPlayer.current.startRecorder(
        recordingPath,
        audioSet,
        true, // Enable metering
      );

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        error: null,
      }));

      console.log('Recording started:', uri);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    setIsLoading(true);
    try {
      // Remove the record back listener
      audioRecorderPlayer.current.removeRecordBackListener();

      // Stop recording and get the file URI
      const uri = await audioRecorderPlayer.current.stopRecorder();

      // Check if the URI already has file:// prefix
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        recordedFilePath: fileUri,
        duration: prev.recordingTime,
      }));

      console.log('Recording stopped:', fileUri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setState((prev) => ({ ...prev, isRecording: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const playRecording = async () => {
    if (!state.recordedFilePath) return;

    setIsLoading(true);
    try {
      // Clean up the URI - remove double file:// prefixes
      let cleanUri = state.recordedFilePath;
      while (cleanUri.startsWith('file://file://')) {
        cleanUri = cleanUri.replace('file://file://', 'file://');
      }

      // Add playback listener first - using proper PlayBackType interface
      audioRecorderPlayer.current.addPlayBackListener((e: PlayBackType) => {
        // Don't use Math.floor() - the library provides precise millisecond timing
        setState((prev) => ({
          ...prev,
          playingTime: e.currentPosition,
          duration: e.duration,
        }));

        // Check if playback has ended (within 500ms of duration to account for timing differences)
        if (e.duration > 0 && e.currentPosition >= e.duration - 500) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              playingTime: 0,
            }));
            audioRecorderPlayer.current.removePlayBackListener();
          }, 200);
        }
      });

      // Note: addPlaybackEndListener doesn't exist, we'll handle end detection in the listener

      // Start playback
      await audioRecorderPlayer.current.startPlayer(cleanUri);

      setState((prev) => ({ ...prev, isPlaying: true, playingTime: 0 }));

      console.log('Playing recording:', cleanUri);
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
      setState((prev) => ({ ...prev, isPlaying: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlaying = async () => {
    setIsLoading(true);
    try {
      // Stop playback
      await audioRecorderPlayer.current.stopPlayer();

      // Remove listeners
      audioRecorderPlayer.current.removePlayBackListener();

      setState((prev) => ({ ...prev, isPlaying: false, playingTime: 0 }));
    } catch (error) {
      console.error('Error stopping playback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (state.recordedFilePath) {
      onRecordingComplete(state.recordedFilePath, state.duration);
    }
  };

  const handleCancel = async () => {
    if (state.isRecording) {
      await stopRecording();
    }
    if (state.isPlaying) {
      await stopPlaying();
    }
    onCancel();
  };

  const cleanup = async () => {
    try {
      await audioRecorderPlayer.current.stopRecorder();
      await audioRecorderPlayer.current.stopPlayer();
      audioRecorderPlayer.current.removeRecordBackListener();
      audioRecorderPlayer.current.removePlayBackListener();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Using the library's built-in time formatting utility
  const formatTime = (milliseconds: number) => {
    return audioRecorderPlayer.current.mmssss(milliseconds);
  };

  const getProgress = () => {
    if (state.duration > 0) {
      return (state.playingTime / state.duration) * 100;
    }
    return 0;
  };

  if (!state.hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
          Microphone permission is required to record audio.
        </Text>
        <Button variant="primary" onPress={checkPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {state.isRecording ? (
        // Recording View
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator}>
            <Ionicons name="radio-button-on" size={24} color={colors.destructive} />
            <Text style={[styles.recordingText, { color: colors.destructive }]}>Recording...</Text>
          </View>

          <Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(state.recordingTime)}</Text>

          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: colors.destructive }, isLoading && styles.disabledButton]}
            onPress={stopRecording}
            disabled={isLoading}
          >
            <Ionicons name="stop" size={32} color={colors.destructiveForeground} />
          </TouchableOpacity>
          {isLoading && <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Stopping...</Text>}
        </View>
      ) : state.recordedFilePath ? (
        // Playback View
        <View style={styles.playbackContainer}>
          <Text style={[styles.playbackTitle, { color: colors.foreground }]}>Voice Recording</Text>

          <View style={styles.progressContainer}>
            <ProgressBar progress={getProgress()} style={styles.progressBar} />
            <View style={styles.timeContainer}>
              <Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(state.playingTime)}</Text>
              <Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(state.duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={stopPlaying} disabled={isLoading} style={styles.controlButton}>
              <Ionicons name="stop" size={24} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={state.isPlaying ? stopPlaying : playRecording}
              disabled={isLoading}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={32} color={colors.primaryForeground} />
            </Pressable>
            <Pressable
              onPress={() => {
                stopPlaying();
                setState((prev) => ({
                  ...prev,
                  recordedFilePath: null,
                  duration: 0,
                  playingTime: 0,
                }));
              }}
              disabled={isLoading}
              style={styles.controlButton}
            >
              <Ionicons name="refresh" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {isLoading && (
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {state.isPlaying ? 'Stopping...' : 'Starting...'}
            </Text>
          )}

          <View style={styles.actionButtons}>
            <Button variant="outline" onPress={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave}>
              Save
            </Button>
          </View>
        </View>
      ) : (
        // Start Recording View
        <View style={styles.startContainer}>
          <Text style={[styles.startText, { color: colors.mutedForeground }]}>Ready to record</Text>
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
            onPress={startRecording}
            disabled={isLoading}
          >
            <Ionicons name="mic" size={32} color={colors.primaryForeground} />
          </TouchableOpacity>
          {isLoading && <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Starting...</Text>}
          <Button variant="outline" onPress={handleCancel}>
            Cancel
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 8,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stopButton: {
    borderRadius: 50,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackContainer: {
    alignItems: 'center',
  },
  playbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  startContainer: {
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    marginBottom: 16,
  },
  recordButton: {
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VoiceRecorder;

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { Card, CardContent } from './Card';
import { ProgressBar } from './ProgressBar';
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
  const colors = useColors();
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
        setState((prev) => ({
          ...prev,
          error: 'Invalid audio file URI',
          isLoaded: false,
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
      setState((prev) => ({
        ...prev,
        isLoaded: true,
        duration: duration,
      }));
    } catch (error) {
      console.error('Audio loading error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to load audio file',
        isLoaded: false,
      }));
    }
  };

  const playAudio = async () => {
    if (!state.isLoaded) return;

    try {
      setState((prev) => ({ ...prev, isPlaying: true }));

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
        setState((prev) => ({
          ...prev,
          currentTime: e.currentPosition,
          duration: e.duration,
        }));

        // Check if playback has ended (within 500ms of duration to account for timing differences)
        if (e.duration > 0 && e.currentPosition >= e.duration - 500) {
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              currentTime: 0,
            }));
            audioRecorderPlayer.current.removePlayBackListener();
          }, 200);
        }
      });

      // Start playback
      await audioRecorderPlayer.current.startPlayer(cleanUri);
    } catch (error) {
      console.error('Playback error:', error);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        error: 'Failed to play audio',
      }));
    }
  };

  const pauseAudio = async () => {
    try {
      await audioRecorderPlayer.current.pausePlayer();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const stopAudio = async () => {
    try {
      await audioRecorderPlayer.current.stopPlayer();

      // Remove listeners
      audioRecorderPlayer.current.removePlayBackListener();

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    } catch (error) {
      console.error('Stop error:', error);
      // Even if there's an error, reset the state
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    }
  };

  const seekTo = async (position: number) => {
    if (!state.isLoaded) return;

    try {
      const seconds = (position / 100) * (state.duration / 1000);
      await audioRecorderPlayer.current.seekToPlayer(seconds);
      setState((prev) => ({
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
      return (state.currentTime / state.duration) * 100;
    }
    return 0;
  };

  const renderWaveform = () => {
    // Generate a simple waveform visualization
    const bars = 20;
    const waveformData = Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);

    return (
      <View style={styles.waveformContainer}>
        {waveformData.map((height, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 40,
                backgroundColor: state.isPlaying ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={24} color={colors.destructive} />
      <Text style={[styles.errorText, { color: colors.destructive }]}>{state.error}</Text>
    </View>
  );

  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading audio...</Text>
    </View>
  );

  if (state.error) {
    return (
      <Card style={style}>
        <CardContent>{renderErrorView()}</CardContent>
      </Card>
    );
  }

  if (!state.isLoaded) {
    return (
      <Card style={style}>
        <CardContent>{renderLoadingView()}</CardContent>
      </Card>
    );
  }

  return (
    <Card style={style}>
      <CardContent>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>{attachment.name}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Audio File</Text>
          </View>
          <Ionicons name="musical-notes" size={24} color={colors.primary} />
        </View>

        {renderWaveform()}

        <View style={styles.progressContainer}>
          <ProgressBar progress={getProgress()} style={styles.progressBar} />
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {formatDuration(state.currentTime)}
            </Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatDuration(state.duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={stopAudio} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={24} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={state.isPlaying ? pauseAudio : playAudio}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={32} color={colors.primaryForeground} />
          </Pressable>
          <Pressable onPress={stopAudio} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.metaContainer}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            Duration: {formatDuration(state.duration)}
          </Text>
          {attachment.size && (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Size: {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
      </CardContent>
    </Card>
  );
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const styles = StyleSheet.create({
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
    borderRadius: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
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
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default AudioPlayer;

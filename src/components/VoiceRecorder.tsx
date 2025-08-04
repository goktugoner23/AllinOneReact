import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Text,
} from 'react-native';
import {
  ProgressBar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';

interface VoiceRecorderProps {
  onRecordingComplete: (filePath: string, duration: number) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingTime, setPlayingTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordedFilePath, setRecordedFilePath] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRecorderPlayer = useRef<AudioRecorderPlayer>(new AudioRecorderPlayer());

  useEffect(() => {
    checkPermission();
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (playingTimer.current) {
        clearInterval(playingTimer.current);
      }
      // Cleanup audio recorder player
      audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();
      audioRecorderPlayer.current.removePlayBackListener();
    };
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice notes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
      return;
    }

    try {
      // Configure recording settings
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
      };

      const uri = await audioRecorderPlayer.current.startRecorder(
        `${RNFS.DocumentDirectoryPath}/recording_${Date.now()}.m4a`,
        audioSet
      );

      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1000);
      }, 1000);

      console.log('Recording started:', uri);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop recording and get the file URI
      const uri = await audioRecorderPlayer.current.stopRecorder();
      const fileUri = `file://${uri}`;
      
      setRecordedFilePath(fileUri);
      setDuration(recordingTime);

      console.log('Recording stopped:', fileUri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordedFilePath) return;

    try {
      setIsPlaying(true);
      setPlayingTime(0);

      // Start playback
      await audioRecorderPlayer.current.startPlayer(recordedFilePath);
      
      // Start playback timer
      playingTimer.current = setInterval(async () => {
        try {
          const currentPosition = await audioRecorderPlayer.current.getCurrentPosition();
          setPlayingTime(currentPosition * 1000); // Convert to milliseconds
          
          if (currentPosition >= duration / 1000) {
            setIsPlaying(false);
            if (playingTimer.current) {
              clearInterval(playingTimer.current);
              playingTimer.current = null;
            }
          }
        } catch (error) {
          console.error('Playback timer error:', error);
        }
      }, 1000);

      console.log('Playing recording:', recordedFilePath);
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
      setIsPlaying(false);
    }
  };

  const stopPlaying = async () => {
    try {
      setIsPlaying(false);
      setPlayingTime(0);

      if (playingTimer.current) {
        clearInterval(playingTimer.current);
        playingTimer.current = null;
      }

      // Stop playback
      await audioRecorderPlayer.current.stopPlayer();
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const handleSave = () => {
    if (recordedFilePath) {
      onRecordingComplete(recordedFilePath, duration);
    }
  };

  const handleCancel = async () => {
    if (isRecording) {
      await stopRecording();
    }
    if (isPlaying) {
      await stopPlaying();
    }
    onCancel();
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (duration === 0) return 0;
    return playingTime / duration;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!recordedFilePath ? (
          // Recording interface
          <View style={styles.recordingSection}>
            <View style={styles.recordingVisualizer}>
              <Icon 
                name={isRecording ? "mic" : "mic-none"} 
                size={60} 
                color={isRecording ? "#FF3B30" : "#666"} 
              />
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                </View>
              )}
            </View>
            
            <Text style={styles.recordingTime}>
              {formatTime(recordingTime)}
            </Text>

            <View style={styles.recordingControls}>
              {!isRecording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startRecording}
                >
                  <Icon name="fiber-manual-record" size={40} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                >
                  <Icon name="stop" size={40} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.instruction}>
              {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </Text>
          </View>
        ) : (
          // Playback interface
          <View style={styles.playbackSection}>
            <View style={styles.playbackVisualizer}>
              <Icon 
                name={isPlaying ? "volume-up" : "volume-down"} 
                size={60} 
                color={isPlaying ? "#007AFF" : "#666"} 
              />
            </View>

            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={getProgress()} 
                color="#007AFF" 
                style={styles.progressBar}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playingTime)}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>

            <View style={styles.playbackControls}>
              {!isPlaying ? (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playRecording}
                >
                  <Icon name="play-arrow" size={40} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopPlaying}
                >
                  <Icon name="stop" size={40} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Icon name="check" size={24} color="white" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setRecordedFilePath(null);
                  setRecordingTime(0);
                  setPlayingTime(0);
                  setDuration(0);
                }}
              >
                <Icon name="refresh" size={24} color="#666" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  recordingSection: {
    alignItems: 'center',
  },
  recordingVisualizer: {
    position: 'relative',
    marginBottom: 20,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'monospace',
  },
  recordingControls: {
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  playbackSection: {
    alignItems: 'center',
  },
  playbackVisualizer: {
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  playbackControls: {
    marginBottom: 30,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default VoiceRecorder; 
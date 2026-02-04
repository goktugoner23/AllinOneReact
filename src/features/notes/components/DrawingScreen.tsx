import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useCanvasRef,
  SkPath,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useAppTheme } from '@shared/theme';
import { Button, IconButton } from '@shared/components/ui';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ViewShot from 'react-native-view-shot';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color palette - 14 colors
const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#FF6B00', // Orange
  '#FFD700', // Yellow
  '#00FF00', // Green
  '#00FFFF', // Cyan
  '#0000FF', // Blue
  '#8B00FF', // Purple
  '#FF00FF', // Magenta
  '#FF69B4', // Pink
  '#8B4513', // Brown
  '#808080', // Gray
  '#C0C0C0', // Light Gray
];

// Brush sizes
const BRUSH_SIZES = [1, 2, 4, 6, 8, 12, 16, 20];

interface DrawingPath {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

interface DrawingScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave: (svgContent: string, saveToGallery: boolean) => void;
}

const DrawingScreen: React.FC<DrawingScreenProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors, spacing, radius, textStyles } = useAppTheme();
  const canvasRef = useCanvasRef();
  const viewShotRef = useRef<ViewShot>(null);

  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const canvasWidth = screenWidth - 32;
  const canvasHeight = screenHeight * 0.5;

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      const path = Skia.Path.Make();
      path.moveTo(e.x, e.y);
      setCurrentPath(path);
    })
    .onUpdate((e) => {
      if (currentPath) {
        currentPath.lineTo(e.x, e.y);
        // Force re-render by creating a copy
        setCurrentPath(Skia.Path.MakeFromSVGString(currentPath.toSVGString())!);
      }
    })
    .onEnd(() => {
      if (currentPath) {
        const newPath: DrawingPath = {
          path: currentPath,
          color: isEraser ? '#FFFFFF' : selectedColor,
          strokeWidth: isEraser ? selectedSize * 3 : selectedSize,
        };
        setPaths((prev) => [...prev, newPath]);
        setCurrentPath(null);
      }
    });

  const handleUndo = useCallback(() => {
    setPaths((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    Alert.alert('Clear Drawing', 'Are you sure you want to clear the entire drawing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setPaths([]),
      },
    ]);
  }, []);

  const handleSave = useCallback(async (saveToGallery: boolean) => {
    try {
      // Generate SVG content from paths
      let svgPaths = '';
      paths.forEach((drawingPath) => {
        const pathString = drawingPath.path.toSVGString();
        svgPaths += `<path d="${pathString}" stroke="${drawingPath.color}" stroke-width="${drawingPath.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      });

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
        <rect width="100%" height="100%" fill="white"/>
        ${svgPaths}
      </svg>`;

      onSave(svgContent, saveToGallery);
    } catch (error) {
      console.error('Error saving drawing:', error);
      Alert.alert('Error', 'Failed to save drawing');
    }
  }, [paths, canvasWidth, canvasHeight, onSave]);

  const handleClose = useCallback(() => {
    if (paths.length > 0) {
      Alert.alert('Discard Drawing?', 'You have unsaved changes. Are you sure you want to discard?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setPaths([]);
            setCurrentPath(null);
            onClose();
          },
        },
      ]);
    } else {
      onClose();
    }
  }, [paths, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <IconButton
            icon="close"
            onPress={handleClose}
            variant="ghost"
          />
          <Text style={[textStyles.h4, { color: colors.foreground, flex: 1, textAlign: 'center' }]}>
            Drawing
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Canvas Area */}
        <View style={styles.canvasContainer}>
          <ViewShot ref={viewShotRef} style={styles.viewShot}>
            <GestureDetector gesture={panGesture}>
              <View style={[styles.canvasWrapper, { backgroundColor: '#FFFFFF', borderRadius: radius.lg }]}>
                <Canvas ref={canvasRef} style={{ width: canvasWidth, height: canvasHeight }}>
                  {/* Draw all completed paths */}
                  {paths.map((drawingPath, index) => (
                    <Path
                      key={index}
                      path={drawingPath.path}
                      color={drawingPath.color}
                      style="stroke"
                      strokeWidth={drawingPath.strokeWidth}
                      strokeCap="round"
                      strokeJoin="round"
                    />
                  ))}
                  {/* Draw current path */}
                  {currentPath && (
                    <Path
                      path={currentPath}
                      color={isEraser ? '#FFFFFF' : selectedColor}
                      style="stroke"
                      strokeWidth={isEraser ? selectedSize * 3 : selectedSize}
                      strokeCap="round"
                      strokeJoin="round"
                    />
                  )}
                </Canvas>
              </View>
            </GestureDetector>
          </ViewShot>
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Color Selection */}
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => setShowColorPicker(!showColorPicker)}
          >
            <View style={[styles.colorPreview, { backgroundColor: selectedColor, borderColor: colors.border }]} />
            <Text style={[styles.toolLabel, { color: colors.foregroundMuted }]}>Color</Text>
          </TouchableOpacity>

          {/* Size Selection */}
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => setShowSizePicker(!showSizePicker)}
          >
            <View style={[styles.sizePreview, { width: selectedSize + 10, height: selectedSize + 10, backgroundColor: colors.foreground }]} />
            <Text style={[styles.toolLabel, { color: colors.foregroundMuted }]}>{selectedSize}px</Text>
          </TouchableOpacity>

          {/* Eraser */}
          <TouchableOpacity
            style={[
              styles.toolButton,
              { backgroundColor: isEraser ? colors.primaryMuted : colors.backgroundSecondary },
            ]}
            onPress={() => setIsEraser(!isEraser)}
          >
            <Ionicons name="brush-outline" size={24} color={isEraser ? colors.primary : colors.foreground} />
            <Text style={[styles.toolLabel, { color: isEraser ? colors.primary : colors.foregroundMuted }]}>
              {isEraser ? 'Eraser' : 'Pen'}
            </Text>
          </TouchableOpacity>

          {/* Undo */}
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleUndo}
            disabled={paths.length === 0}
          >
            <Ionicons name="arrow-undo" size={24} color={paths.length === 0 ? colors.foregroundSubtle : colors.foreground} />
            <Text style={[styles.toolLabel, { color: colors.foregroundMuted }]}>Undo</Text>
          </TouchableOpacity>

          {/* Clear */}
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleClear}
            disabled={paths.length === 0}
          >
            <Ionicons name="trash-outline" size={24} color={paths.length === 0 ? colors.foregroundSubtle : colors.destructive} />
            <Text style={[styles.toolLabel, { color: colors.foregroundMuted }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Color Picker Popup */}
        {showColorPicker && (
          <View style={[styles.pickerPopup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[textStyles.subtitle, { color: colors.foreground, marginBottom: 12 }]}>Select Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color, borderColor: selectedColor === color ? colors.primary : colors.border },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                    setIsEraser(false);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Size Picker Popup */}
        {showSizePicker && (
          <View style={[styles.pickerPopup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[textStyles.subtitle, { color: colors.foreground, marginBottom: 12 }]}>Brush Size</Text>
            <View style={styles.sizeGrid}>
              {BRUSH_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    { backgroundColor: selectedSize === size ? colors.primaryMuted : colors.backgroundSecondary },
                  ]}
                  onPress={() => {
                    setSelectedSize(size);
                    setShowSizePicker(false);
                  }}
                >
                  <View style={[styles.sizeDot, { width: size + 4, height: size + 4, backgroundColor: colors.foreground }]} />
                  <Text style={[styles.sizeLabel, { color: colors.foreground }]}>{size}px</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Buttons */}
        <View style={[styles.saveContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            variant="outline"
            onPress={() => handleSave(false)}
            style={styles.saveButton}
            disabled={paths.length === 0}
          >
            Save to Note
          </Button>
          <Button
            variant="default"
            onPress={() => handleSave(true)}
            style={styles.saveButton}
            disabled={paths.length === 0}
          >
            Save to Note & Gallery
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewShot: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvasWrapper: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  toolLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  sizePreview: {
    borderRadius: 50,
  },
  pickerPopup: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  colorOptionSelected: {
    borderWidth: 3,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  sizeDot: {
    borderRadius: 50,
    marginBottom: 4,
  },
  sizeLabel: {
    fontSize: 12,
  },
  saveContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default DrawingScreen;

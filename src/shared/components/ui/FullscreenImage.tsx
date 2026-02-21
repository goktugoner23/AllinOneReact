import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FullscreenImageProps {
  uri: string;
  onClose: () => void;
}

export const FullscreenImage: React.FC<FullscreenImageProps> = ({ uri, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);

  const handleTouch = (evt: any) => {
    const touches = evt.nativeEvent.touches;

    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];

      const distance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2));

      if (!isPinching) {
        setInitialDistance(distance);
        setIsPinching(true);
      } else if (initialDistance > 0) {
        const scaleChange = distance / initialDistance;
        const newScale = Math.max(1, Math.min(3, scaleChange));
        setScale(newScale);
        setIsZoomed(newScale > 1);
      }
    } else if (touches.length === 1) {
      setIsPinching(false);
      setInitialDistance(0);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 1000,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <View
        onTouchMove={handleTouch}
        onTouchEnd={handleTouch}
        onTouchStart={(evt) => {
          evt.stopPropagation();
        }}
      >
        <View
          style={{
            transform: [{ scale }],
          }}
        >
          <Image
            source={{ uri }}
            style={{
              width: Dimensions.get('window').width * 0.9,
              height: Dimensions.get('window').height * 0.8,
              resizeMode: 'contain',
            }}
          />
        </View>
      </View>
    </View>
  );
};

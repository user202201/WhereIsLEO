import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGameFlow } from '../state/GameFlowContext';
import { guessGame, revealGame } from '../api/client';

const MIN_SCALE = 1;
const MAX_SCALE = 6;

function clampWorklet(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export default function GameScreen() {
  const router = useRouter();
  const { game, setResult } = useGameFlow();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!game) {
      router.replace('/');
    }
  }, [game, router]);

  const { baseWidth, baseHeight } = useMemo(() => {
    if (!game) return { baseWidth: screenWidth, baseHeight: screenHeight };
    const imageAspect = game.width / game.height;
    const screenAspect = screenWidth / screenHeight;
    if (imageAspect > screenAspect) {
      return { baseWidth: screenWidth, baseHeight: screenWidth / imageAspect };
    }
    return { baseWidth: screenHeight * imageAspect, baseHeight: screenHeight };
  }, [game, screenWidth, screenHeight]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const [startedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [marker, setMarker] = useState<{ x: number; y: number; hit: boolean } | null>(null);
  const [finished, setFinished] = useState(false);
  const [guessing, setGuessing] = useState(false);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [finished, startedAt]);

  function boundsFor(s: number) {
    'worklet';
    const overflowX = Math.max(0, (baseWidth * s - screenWidth) / 2);
    const overflowY = Math.max(0, (baseHeight * s - screenHeight) / 2);
    return { overflowX, overflowY };
  }

  function handleTap(localX: number, localY: number) {
    if (!game || finished || guessing) return;
    setGuessing(true);
    const pixelX = Math.round((localX / baseWidth) * game.width);
    const pixelY = Math.round((localY / baseHeight) * game.height);

    guessGame(game.id, { x: pixelX, y: pixelY })
      .then((result) => {
        setMarker({ x: localX, y: localY, hit: result.hit });
        if (result.hit) {
          setFinished(true);
          setTimeout(() => {
            setResult({ found: true, elapsedMs: result.elapsedMs });
            router.replace('/result');
          }, 900);
        } else {
          setTimeout(() => setMarker(null), 900);
        }
      })
      .catch(() => {})
      .finally(() => setGuessing(false));
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = clampWorklet(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;
      const { overflowX, overflowY } = boundsFor(next);
      translateX.value = clampWorklet(translateX.value, -overflowX, overflowX);
      translateY.value = clampWorklet(translateY.value, -overflowY, overflowY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      const { overflowX, overflowY } = boundsFor(scale.value);
      translateX.value = clampWorklet(savedTranslateX.value + e.translationX, -overflowX, overflowX);
      translateY.value = clampWorklet(savedTranslateY.value + e.translationY, -overflowY, overflowY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  const composed = Gesture.Simultaneous(pinch, pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  async function giveUp() {
    if (!game) return;
    try {
      await revealGame(game.id);
    } finally {
      setFinished(true);
      setResult({ found: false });
      router.replace('/result');
    }
  }

  if (!game) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width: baseWidth, height: baseHeight }, animatedStyle]}>
          <Image source={{ uri: game.compositeImageUrl }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
          {marker && (
            <View
              pointerEvents="none"
              style={[
                styles.marker,
                { left: marker.x - 20, top: marker.y - 20, borderColor: marker.hit ? '#2ecc71' : '#ff4757' },
              ]}
            />
          )}
        </Animated.View>
      </GestureDetector>

      <View style={[styles.hud, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.thumbnailBox}>
          <Image source={{ uri: game.targetThumbnailUrl }} style={styles.thumbnailImage} resizeMode="contain" />
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>{elapsedSeconds}s</Text>
        </View>
        <Pressable style={styles.giveUpButton} onPress={giveUp}>
          <Text style={styles.giveUpText}>Give Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  thumbnailBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 4,
  },
  thumbnailImage: { width: '100%', height: '100%' },
  timerPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: { color: '#fff', fontWeight: '700' },
  giveUpButton: {
    backgroundColor: 'rgba(255,90,95,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  giveUpText: { color: '#fff', fontWeight: '700' },
});

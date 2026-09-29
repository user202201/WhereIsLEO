import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameFlow } from '../state/GameFlowContext';
import { cartoonizeTarget, createGame, generateScene } from '../api/client';

const FLAVOR_TEXT = [
  'Sketching a ridiculously crowded scene...',
  'Cartoonizing your target...',
  'Hiding your target among hundreds of characters...',
  'Adding one more layer of chaos, for good measure...',
  'Almost ready to hunt...',
];

export default function LoadingScreen() {
  const router = useRouter();
  const { location, target, setTargetId, setGame, setResult } = useGameFlow();

  const [flavorIndex, setFlavorIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!location || !target) {
      router.replace('/');
    }
  }, [location, target, router]);

  useEffect(() => {
    const interval = setInterval(() => setFlavorIndex((i) => (i + 1) % FLAVOR_TEXT.length), 2500);
    return () => clearInterval(interval);
  }, []);

  const run = useCallback(async () => {
    if (!location || !target) return;
    try {
      const targetId =
        target.type === 'preset' ? target.targetId : (await cartoonizeTarget({ photoBase64: target.photoBase64 })).id;

      const scene = await generateScene({ location });
      const game = await createGame({ sceneId: scene.id, targetId });

      setTargetId(targetId);
      setGame(game);
      setResult(null);
      router.replace('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while preparing your hunt.');
    }
  }, [location, target, router, setTargetId, setGame, setResult]);

  useEffect(() => {
    // This effect fetches/generates the game asynchronously and navigates away on
    // success; every state update happens inside `run`'s async chain, not synchronously
    // during this effect's execution, so the cascading-render concern the rule guards
    // against doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Couldn’t set up the hunt</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff5a5f" />
      <Text style={styles.flavorText}>{FLAVOR_TEXT[flavorIndex]}</Text>
      <Text style={styles.hint}>This can take a minute the first time through.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  flavorText: { marginTop: 24, fontSize: 16, fontWeight: '600', textAlign: 'center', color: '#1a1a2e' },
  hint: { marginTop: 8, fontSize: 13, color: '#888', textAlign: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#c00', marginBottom: 10 },
  errorMessage: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#ff5a5f', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

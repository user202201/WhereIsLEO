import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameFlow } from '../state/GameFlowContext';
import { createGame, generateScene } from '../api/client';

function formatElapsed(ms?: number): string {
  if (!ms) return '--';
  const seconds = Math.round(ms / 1000);
  return `${seconds}s`;
}

export default function ResultScreen() {
  const router = useRouter();
  const { result, location, targetId, setGame, setResult, reset } = useGameFlow();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || !location || !targetId) {
      router.replace('/');
    }
  }, [result, location, targetId, router]);

  async function playAgainSameTarget() {
    if (!location || !targetId) return;
    setBusy(true);
    setError(null);
    try {
      const scene = await generateScene({ location });
      const game = await createGame({ sceneId: scene.id, targetId });
      setGame(game);
      setResult(null);
      router.replace('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start a new round.');
      setBusy(false);
    }
  }

  function newTargetOrLocation() {
    reset();
    router.replace('/');
  }

  if (!result) {
    return <View style={styles.container} />;
  }

  if (busy) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{result.found ? '🎉' : '🏳️'}</Text>
      <Text style={styles.title}>{result.found ? 'You found them!' : 'Better luck next time'}</Text>
      {result.found && <Text style={styles.subtitle}>Time: {formatElapsed(result.elapsedMs)}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.primaryButton} onPress={playAgainSameTarget}>
        <Text style={styles.primaryButtonText}>Play Again (New Scene)</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={newTargetOrLocation}>
        <Text style={styles.secondaryButtonText}>New Target / Location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 32 },
  error: { color: '#c00', marginBottom: 16, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#ff5a5f',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  secondaryButtonText: { color: '#666', fontWeight: '600', fontSize: 14 },
});

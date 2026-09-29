import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LOCATIONS, type Location, type PresetTargetOption } from '@whereisleo/shared';
import type { TargetSelection } from '../state/types';
import { useGameFlow } from '../state/GameFlowContext';
import { listPresetTargets } from '../api/client';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setLocation: commitLocation, setTarget: commitTarget } = useGameFlow();

  const [location, setLocation] = useState<Location | null>(null);
  const [target, setTarget] = useState<TargetSelection | null>(null);
  const [presets, setPresets] = useState<PresetTargetOption[] | null>(null);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  useEffect(() => {
    listPresetTargets()
      .then(setPresets)
      .catch((err) => setPresetsError(err instanceof Error ? err.message : 'Failed to load characters'));
  }, []);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.base64) {
      return;
    }
    const asset = result.assets[0];
    setTarget({ type: 'upload', photoBase64: asset.base64!, previewUri: asset.uri });
  }

  function startHunt() {
    if (!location || !target) return;
    commitLocation(location);
    commitTarget(target);
    router.push('/loading');
  }

  const canStart = location !== null && target !== null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Where Is LEO?</Text>
      <Text style={styles.subtitle}>Pick a place to hide in, and who we’re hiding.</Text>

      <Text style={styles.sectionLabel}>1. Choose a scene</Text>
      <View style={styles.grid}>
        {LOCATIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => setLocation(option.id)}
            style={[styles.card, location === option.id && styles.cardSelected]}
          >
            <Text style={styles.cardText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>2. Choose your target</Text>
      {presetsError && <Text style={styles.error}>{presetsError}</Text>}
      {!presets && !presetsError && <ActivityIndicator style={styles.spinner} />}
      <View style={styles.grid}>
        {presets?.map((preset) => {
          const selected = target?.type === 'preset' && target.targetId === preset.targetId;
          return (
            <Pressable
              key={preset.key}
              onPress={() =>
                setTarget({ type: 'preset', targetId: preset.targetId, name: preset.name, spriteUrl: preset.spriteUrl })
              }
              style={[styles.presetCard, selected && styles.cardSelected]}
            >
              <Image source={{ uri: preset.spriteUrl }} style={styles.presetImage} resizeMode="contain" />
              <Text style={styles.cardText}>{preset.name}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={pickPhoto}
          style={[styles.presetCard, target?.type === 'upload' && styles.cardSelected]}
        >
          {target?.type === 'upload' ? (
            <Image source={{ uri: target.previewUri }} style={styles.presetImage} resizeMode="cover" />
          ) : (
            <Text style={styles.cardText}>Upload{'\n'}Your Photo</Text>
          )}
        </Pressable>
      </View>

      <Pressable disabled={!canStart} onPress={startHunt} style={[styles.startButton, !canStart && styles.startButtonDisabled]}>
        <Text style={styles.startButtonText}>Start Hunt</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#1a1a2e' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginTop: 6, marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#1a1a2e' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f7f7fb',
    minWidth: '45%',
    alignItems: 'center',
  },
  presetCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f7f7fb',
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  presetImage: { width: 72, height: 72, borderRadius: 8 },
  cardSelected: { borderColor: '#ff5a5f', backgroundColor: '#fff0f0' },
  cardText: { fontWeight: '600', color: '#1a1a2e', textAlign: 'center', marginTop: 6, fontSize: 12 },
  spinner: { marginBottom: 16 },
  error: { color: '#c00', marginBottom: 12 },
  startButton: {
    backgroundColor: '#ff5a5f',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonDisabled: { backgroundColor: '#f0b0b2' },
  startButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

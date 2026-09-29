import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { GameSummary, Location } from '@whereisleo/shared';
import type { TargetSelection } from './types';

export interface RoundResult {
  found: boolean;
  elapsedMs?: number;
}

interface GameFlowState {
  location: Location | null;
  target: TargetSelection | null;
  targetId: string | null;
  game: GameSummary | null;
  result: RoundResult | null;
  setLocation: (location: Location) => void;
  setTarget: (target: TargetSelection) => void;
  setTargetId: (targetId: string) => void;
  setGame: (game: GameSummary) => void;
  setResult: (result: RoundResult | null) => void;
  reset: () => void;
}

// Complex per-session state (base64 photos, generated image URLs, timing) is passed
// through this context rather than expo-router URL params, since params are
// string-serialized and unsuited to carrying a full uploaded photo or image objects.
const GameFlowContext = createContext<GameFlowState | null>(null);

export function GameFlowProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [target, setTarget] = useState<TargetSelection | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [game, setGame] = useState<GameSummary | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);

  const value = useMemo<GameFlowState>(
    () => ({
      location,
      target,
      targetId,
      game,
      result,
      setLocation,
      setTarget,
      setTargetId,
      setGame,
      setResult,
      reset: () => {
        setLocation(null);
        setTarget(null);
        setTargetId(null);
        setGame(null);
        setResult(null);
      },
    }),
    [location, target, targetId, game, result]
  );

  return <GameFlowContext.Provider value={value}>{children}</GameFlowContext.Provider>;
}

export function useGameFlow(): GameFlowState {
  const ctx = useContext(GameFlowContext);
  if (!ctx) {
    throw new Error('useGameFlow must be used within a GameFlowProvider');
  }
  return ctx;
}

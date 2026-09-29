export type TargetSelection =
  | { type: 'preset'; targetId: string; name: string; spriteUrl: string }
  | { type: 'upload'; photoBase64: string; previewUri: string };

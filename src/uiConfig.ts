import type {
  SmartCaptureColors,
  SmartCaptureFonts,
  SmartCaptureStrings,
  SmartCaptureUIConfig,
} from './types';

export const DEFAULT_COLORS: SmartCaptureColors = {
  background: '#000000',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F2',
  text: '#111111',
  textInverse: '#FFFFFF',
  textMuted: '#666666',
  divider: '#E5E5E5',
  primary: '#0A84FF',
  danger: '#FF3B30',
  scrim: 'rgba(0,0,0,0.55)',
  overlay: 'rgba(0,0,0,0.55)',
  loaderOverlay: 'rgba(0,0,0,0.4)',
};

export const DEFAULT_STRINGS: SmartCaptureStrings = {
  cameraPreparing: 'Preparing camera...',
  cameraCancel: 'Cancel',
  cameraFlip: 'Flip',
  previewCancel: 'Cancel',
  previewTitle: 'Preview Image',
  previewLoading: 'Loading image...',
  previewTryAgain: 'Try again',
  previewUsePhoto: 'Use Photo',
};

export const DEFAULT_FONTS: SmartCaptureFonts = {};

export type ResolvedUIConfig = {
  colors: SmartCaptureColors;
  strings: SmartCaptureStrings;
  fonts: SmartCaptureFonts;
};

export function resolveUIConfig(config?: SmartCaptureUIConfig): ResolvedUIConfig {
  return {
    colors: {
      ...DEFAULT_COLORS,
      ...(config?.colors ?? {}),
    },
    strings: {
      ...DEFAULT_STRINGS,
      ...(config?.strings ?? {}),
    },
    fonts: {
      ...DEFAULT_FONTS,
      ...(config?.fonts ?? {}),
    },
  };
}


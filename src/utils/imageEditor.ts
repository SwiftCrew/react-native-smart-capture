import { Image, Platform } from 'react-native';
import ImageEditor from '@react-native-community/image-editor';

import type { ProfileImageResult } from '../types';

/**
 * Get the natural pixel size of an image at the given URI.
 */
export function getImageSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

export type CropRect = {
  /** X offset in source-image pixels. */
  x: number;
  /** Y offset in source-image pixels. */
  y: number;
  /** Width in source-image pixels. */
  width: number;
  /** Height in source-image pixels. */
  height: number;
};

export type CropArgs = {
  uri: string;
  rect: CropRect;
  /** Output edge length in pixels for longest side. */
  outputSize: number;
  /** JPEG quality, 0-1. */
  quality: number;
  /** Whether to also return base64. */
  includeBase64: boolean;
};

/**
 * Native-side crop using `@react-native-community/image-editor`.
 *
 * The cropper UI shows a circular overlay; the *exported file* is a square
 * containing the bounding box of that circle. Profile images are then
 * displayed with `borderRadius: width/2` to render circular — this is the
 * standard pattern used by Instagram / Twitter / WhatsApp and avoids
 * shipping a transparent PNG (smaller files, faster encode).
 */
export async function cropImage(args: CropArgs): Promise<ProfileImageResult> {
  const { uri, rect, outputSize, quality, includeBase64 } = args;
  const cropW = Math.max(1, Math.round(rect.width));
  const cropH = Math.max(1, Math.round(rect.height));
  const aspect = cropW / cropH;
  const outputW = outputSize;
  const outputH = Math.max(1, Math.round(outputW / aspect));

  // The image-editor API uses a literal `true`/`false` discriminant on
  // `includeBase64` to type-narrow the return value. Branching keeps the
  // overloads happy.
  const baseArgs = {
    offset: { x: Math.max(0, Math.round(rect.x)), y: Math.max(0, Math.round(rect.y)) },
    size: { width: cropW, height: cropH },
    displaySize: { width: outputW, height: outputH },
    resizeMode: 'cover' as const,
    format: 'jpeg' as const,
    quality,
  };

  const cropResult: unknown = includeBase64
    ? await ImageEditor.cropImage(uri, { ...baseArgs, includeBase64: true })
    : await ImageEditor.cropImage(uri, { ...baseArgs, includeBase64: false });

  // image-editor v4 returns `{ uri, base64?, width?, height? }`,
  // older versions returned a plain `string`. Support both shapes.
  const outUri =
    typeof cropResult === 'string'
      ? cropResult
      : (cropResult as { uri: string }).uri;
  const base64 =
    typeof cropResult === 'string'
      ? undefined
      : (cropResult as { base64?: string }).base64;

  const fileName = deriveFileName(outUri);

  return {
    uri: outUri,
    base64: includeBase64 ? base64 : undefined,
    fileName,
    type: 'image/jpeg',
    width: outputW,
    height: outputH,
  };
}

function deriveFileName(uri: string): string {
  try {
    const last = uri.split('/').pop() ?? `profile-${Date.now()}.jpg`;
    return last.includes('.') ? last : `${last}.jpg`;
  } catch {
    return `profile-${Date.now()}.jpg`;
  }
}

/**
 * Normalize a content:// URI from the Android camera-roll picker to one
 * that `Image.getSize` and `ImageEditor` can both read on every device.
 *
 * On Android 11+ the picker often returns `content://` URIs which are
 * fine for both APIs. On some OEM builds (Xiaomi, older Samsung) the
 * URI uses an asset library scheme; this helper is the central place
 * to add device-specific tweaks if needed.
 */
export function normalizeUri(uri: string): string {
  if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
    // ph:// URIs work with ImageEditor.cropImage but not with all
    // Image components — the consumer should use `Image.resolveAssetSource`
    // separately if they need a renderable URI.
    return uri;
  }
  return uri;
}

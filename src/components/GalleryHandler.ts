import { launchImageLibrary } from 'react-native-image-picker';

export type PickedAsset = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
  type?: string;
};

export type PickFromGalleryResult =
  | { kind: 'picked'; asset: PickedAsset }
  | { kind: 'cancelled' }
  | { kind: 'error'; error: Error };

/**
 * Thin wrapper around `react-native-image-picker` that:
 *  - Always asks for a single image
 *  - Skips the lib's built-in permission prompt (we manage permissions
 *    via `react-native-permissions` for a unified API)
 *  - Normalizes the result into our internal shape
 */
export async function pickFromGallery(): Promise<PickFromGalleryResult> {
  try {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 1,
      includeBase64: false,
      includeExtra: false,
      // We already asked the user — don't show the lib's own dialog
      // (only some platforms support this option, the lib safely ignores
      // unknown keys).
    });

    if (response.didCancel) {
      return { kind: 'cancelled' };
    }

    if (response.errorCode) {
      return {
        kind: 'error',
        error: new Error(response.errorMessage ?? response.errorCode),
      };
    }

    const first = response.assets?.[0];
    if (!first || !first.uri) {
      return { kind: 'cancelled' };
    }

    return {
      kind: 'picked',
      asset: {
        uri: first.uri,
        width: first.width,
        height: first.height,
        fileName: first.fileName,
        type: first.type,
      },
    };
  } catch (e) {
    return {
      kind: 'error',
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

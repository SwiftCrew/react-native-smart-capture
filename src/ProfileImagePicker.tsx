import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CameraScreen, PreviewScreen, pickFromGallery } from './components';
import { usePickerFlow } from './hooks';
import type {
  ProfileImageResult,
  ProfileImagePickerOptions,
  SmartCaptureSource,
} from './types';
import { resolveUIConfig } from './uiConfig';

/**
 * Default options applied when the consumer omits a field.
 * Kept here as a single source of truth.
 */
const DEFAULTS = {
  enableBase64: false,
  cropShape: 'circle' as const,
  compression: 0.85,
  maxOutputSize: 1024,
};

export type ProfileImagePickerProps = {
  /** Whether the picker is currently open. */
  visible: boolean;
  /** Called whenever the user closes / cancels the picker. */
  onClose: () => void;
  /** Called when the user has captured & cropped an image. */
  onImageSelected: (image: ProfileImageResult) => void;
  /** Called when the picker fails (e.g. native crop error). */
  onError?: (error: Error) => void;
  /** Picker options — see {@link ProfileImagePickerOptions}. */
  options?: ProfileImagePickerOptions;
  /**
   * Parent app owns source selection and passes the source to open.
   * - 'camera': open camera directly
   * - 'gallery': open gallery directly then preview
   */
  source?: SmartCaptureSource;
};

export const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  visible,
  onClose,
  onImageSelected,
  onError,
  options,
  source = 'camera',
}) => {
  const resolved = useMemo(
    () => ({
      ...DEFAULTS,
      ...(options ?? {}),
    }),
    [options],
  );

  const ui = useMemo(() => resolveUIConfig(resolved.ui), [resolved.ui]);

  const { step, goPreview, setStep } = usePickerFlow(
    source === 'gallery' ? { kind: 'gallery-loading' } : { kind: 'camera' },
  );
  const mountedRef = useRef(true);
  const galleryRequestedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset when modal closes, and initialize step when it opens.
  useEffect(() => {
    if (!visible) {
      galleryRequestedRef.current = false;
      setStep(source === 'gallery' ? { kind: 'gallery-loading' } : { kind: 'camera' });
      return;
    }
    if (source === 'gallery') {
      setStep({ kind: 'gallery-loading' });
    } else {
      setStep({ kind: 'camera' });
    }
  }, [visible, source, setStep]);

  const handleError = useCallback(
    (err: Error) => {
      onError?.(err);
      onClose();
    },
    [onError, onClose],
  );

  const handleGalleryPick = useCallback(async () => {
    const result = await pickFromGallery();
    if (!mountedRef.current) return;
    if (result.kind === 'picked') {
      goPreview(result.asset.uri);
    } else if (result.kind === 'error') {
      handleError(result.error);
    } else {
      onClose();
    }
  }, [goPreview, handleError, onClose]);

  // Launch gallery picker once on gallery flow open.
  useEffect(() => {
    if (!visible) return;
    if (step.kind !== 'gallery-loading') return;
    if (galleryRequestedRef.current) return;
    galleryRequestedRef.current = true;
    void handleGalleryPick();
  }, [visible, step.kind, handleGalleryPick]);

  const handleConfirm = useCallback(
    (img: ProfileImageResult) => {
      onImageSelected(img);
      onClose();
    },
    [onClose, onImageSelected],
  );

  /* ------------------------------------------------------------------ *
   *  Render                                                            *
   *                                                                    *
   *  IMPORTANT: We use a SINGLE outer Modal for the entire flow and    *
   *  swap the content inside. Mounting/unmounting separate Modals      *
   *  per step caused iOS to throw                                      *
   *    "Attempt to present <RCTModalHostViewController...>             *
   *     which is already presenting <RCTModalHostViewController...>"   *
   *  whenever the iOS photo picker dismissed and we tried to swap      *
   *  the BottomSheet Modal for a Preview Modal in the same tick —      *
   *  blocking the preview screen from appearing.                       *
   * ------------------------------------------------------------------ */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.fullscreen, { backgroundColor: ui.colors.background }]}>
          {step.kind === 'camera' ? (
            <CameraScreen
              onCapture={(uri) => goPreview(uri)}
              onCancel={onClose}
              onError={handleError}
              ui={ui}
            />
          ) : step.kind === 'gallery-loading' ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={ui.colors.textInverse} />
            </View>
          ) : (
            <PreviewScreen
              uri={step.uri}
              options={{
                compression: resolved.compression,
                maxOutputSize: resolved.maxOutputSize,
                enableBase64: resolved.enableBase64,
                cropShape: resolved.cropShape,
              }}
              onConfirm={handleConfirm}
              onRetake={onClose}
              onCancel={onClose}
              onError={handleError}
              ui={ui}
            />
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fullscreen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  type CameraDevice,
  type PhotoFile,
} from 'react-native-vision-camera';

import { radius, spacing } from '../theme';
import { resolveUIConfig, type ResolvedUIConfig } from '../uiConfig';

export type CameraScreenProps = {
  onCapture: (uri: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  ui?: ResolvedUIConfig;
};

const ZOOM_OPTIONS = [1, 2] as const;
type ZoomLevel = (typeof ZOOM_OPTIONS)[number];

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onCapture,
  onCancel,
  onError,
  ui,
}) => {
  const resolvedUI = useMemo(() => ui ?? resolveUIConfig(), [ui]);
  const cameraRef = useRef<Camera>(null);
  const mountedRef = useRef(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [position, setPosition] = useState<'front' | 'back'>('front');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);

  const device: CameraDevice | undefined = useCameraDevice(position);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const zoom = useMemo(() => {
    if (!device) return 1;
    const min = device.minZoom ?? 1;
    const max = device.maxZoom ?? 1;
    const target = zoomLevel * (device.neutralZoom ?? 1);
    return Math.min(Math.max(target, min), max);
  }, [device, zoomLevel]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;
      onCapture(uri);
    } catch (e) {
      onError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (mountedRef.current) setIsCapturing(false);
    }
  }, [isCapturing, onCapture, onError]);
  const styles = useMemo(() => createStyles(resolvedUI), [resolvedUI]);

  const handleFlip = useCallback(() => {
    setPosition((p) => (p === 'front' ? 'back' : 'front'));
  }, []);

  if (!device) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={resolvedUI.colors.textInverse} />
        <Text style={styles.muted}>{resolvedUI.strings.cameraPreparing}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
        zoom={zoom}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onCancel}
          hitSlop={12}
          style={styles.iconButton}
          testID="profile-image-camera-cancel"
        >
          <Text style={styles.iconText}>{resolvedUI.strings.cameraCancel}</Text>
        </Pressable>
      </View>

      {/* Zoom toggle */}
      <View style={styles.zoomRow}>
        {ZOOM_OPTIONS.map((z) => {
          const active = z === zoomLevel;
          return (
            <Pressable
              key={z}
              onPress={() => {
                setZoomLevel(z);
              }}
              style={[styles.zoomChip, active ? styles.zoomChipActive : null]}
            >
              <Text
                style={[
                  styles.zoomLabel,
                  active ? styles.zoomLabelActive : null,
                ]}
              >
                {z}x
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomSlot} />

        <Pressable
          onPress={handleCapture}
          disabled={isCapturing}
          style={({ pressed }) => [
            styles.shutter,
            pressed ? styles.shutterPressed : null,
            isCapturing ? styles.shutterDisabled : null,
          ]}
          testID="profile-image-camera-shutter"
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <View style={styles.bottomSlot}>
          <Pressable
            onPress={handleFlip}
            hitSlop={12}
            style={styles.iconButton}
            testID="profile-image-camera-flip"
          >
            <Text style={styles.iconText}>{resolvedUI.strings.cameraFlip}</Text>
          </Pressable>
        </View>
      </View>

      {isCapturing ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator color={resolvedUI.colors.textInverse} size="large" />
        </View>
      ) : null}
    </View>
  );
};

function createStyles(ui: ResolvedUIConfig) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ui.colors.background,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    muted: {
      marginTop: spacing.md,
      color: ui.colors.textInverse,
      opacity: 0.7,
      fontFamily: ui.fonts.regular,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: spacing.xxl + spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    iconButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: ui.colors.overlay,
    },
    iconText: {
      color: ui.colors.textInverse,
      fontSize: 15,
      fontWeight: '600',
      fontFamily: ui.fonts.medium,
    },
    zoomRow: {
      position: 'absolute',
      bottom: 160,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    zoomChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: ui.colors.overlay,
      minWidth: 44,
      alignItems: 'center',
    },
    zoomChipActive: {
      backgroundColor: ui.colors.surface,
    },
    zoomLabel: {
      color: ui.colors.textInverse,
      fontWeight: '600',
      fontSize: 13,
      fontFamily: ui.fonts.medium,
    },
    zoomLabelActive: {
      color: ui.colors.text,
    },
    bottomBar: {
      position: 'absolute',
      bottom: spacing.xxl,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
    },
    bottomSlot: {
      width: 64,
      alignItems: 'center',
    },
    shutter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: ui.colors.textInverse,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    shutterPressed: {
      transform: [{ scale: 0.95 }],
    },
    shutterDisabled: {
      opacity: 0.6,
    },
    shutterInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: ui.colors.textInverse,
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ui.colors.loaderOverlay,
    },
  });
}

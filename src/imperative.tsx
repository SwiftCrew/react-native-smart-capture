import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ProfileImagePicker } from './ProfileImagePicker';
import type {
  OpenProfileImagePickerArgs,
  ProfileImageResult,
  SmartCaptureSource,
} from './types';

/**
 * Internal queue of pending open requests. Only one host instance can be
 * active at a time — multiple hosts will fight over the singleton, which
 * we explicitly warn about.
 */
type Pending = OpenProfileImagePickerArgs & { source: SmartCaptureSource };

let activeHost: { open: (args: Pending) => void } | null = null;
let queuedRequest: Pending | null = null;

function registerHost(host: { open: (args: Pending) => void } | null) {
  if (host && activeHost) {
    if (__DEV__) {
      console.warn(
        '[react-native-smart-capture] Multiple <ProfileImagePickerHost /> ' +
          'instances detected. Only one is supported per app — ' +
          'the most recently mounted host will receive imperative calls.',
      );
    }
  }
  activeHost = host;
  if (activeHost && queuedRequest) {
    const next = queuedRequest;
    queuedRequest = null;
    activeHost.open(next);
  }
}

/**
 * Imperative API — opens the profile image picker programmatically.
 *
 * Requires `<ProfileImagePickerHost />` to be mounted somewhere in the
 * tree (typically near the root, alongside your navigation provider).
 *
 * If the host is not yet mounted (e.g. very early in app startup), the
 * call is queued and fired as soon as a host registers.
 */
export function openProfileImagePicker(args: OpenProfileImagePickerArgs): void {
  openProfileImageCapture(args);
}

/**
 * Open camera flow directly. Parent app controls when this is called.
 */
export function openProfileImageCapture(args: OpenProfileImagePickerArgs): void {
  const payload: Pending = { ...args, source: 'camera' };
  if (activeHost) {
    activeHost.open(payload);
  } else {
    if (__DEV__) {
      console.warn(
        '[react-native-smart-capture] openProfileImagePicker() was called ' +
          'before <ProfileImagePickerHost /> was mounted. The request will ' +
          'be queued until a host is available.',
      );
    }
    queuedRequest = payload;
  }
}

/**
 * Open gallery flow directly. Parent app controls when this is called.
 */
export function openProfileImageGallery(args: OpenProfileImagePickerArgs): void {
  const payload: Pending = { ...args, source: 'gallery' };
  if (activeHost) {
    activeHost.open(payload);
  } else {
    if (__DEV__) {
      console.warn(
        '[react-native-smart-capture] openProfileImageGallery() was called ' +
          'before <ProfileImagePickerHost /> was mounted. The request will ' +
          'be queued until a host is available.',
      );
    }
    queuedRequest = payload;
  }
}

/**
 * Mount this once near the root of your app to enable
 * {@link openProfileImagePicker}.
 *
 * If you only ever use the `<ProfileImagePicker />` component directly
 * with a `visible` prop, you do NOT need this host.
 */
export const ProfileImagePickerHost: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const argsRef = useRef<Pending | null>(null);

  const open = useCallback((args: Pending) => {
    argsRef.current = args;
    setVisible(true);
  }, []);

  useEffect(() => {
    registerHost({ open });
    return () => {
      registerHost(null);
    };
  }, [open]);

  const handleClose = useCallback(() => {
    const a = argsRef.current;
    setVisible(false);
    if (a) a.onCancel?.();
    argsRef.current = null;
  }, []);

  const handleSelected = useCallback((image: ProfileImageResult) => {
    const a = argsRef.current;
    setVisible(false);
    if (a) a.onSuccess(image);
    argsRef.current = null;
  }, []);

  const handleError = useCallback((err: Error) => {
    const a = argsRef.current;
    setVisible(false);
    if (a) a.onError?.(err);
    argsRef.current = null;
  }, []);

  return (
    <ProfileImagePicker
      visible={visible}
      onClose={handleClose}
      onImageSelected={handleSelected}
      onError={handleError}
      options={argsRef.current?.options}
      source={argsRef.current?.source}
    />
  );
};

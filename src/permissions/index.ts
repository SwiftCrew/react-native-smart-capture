import { check, request, openSettings as rnpOpenSettings } from 'react-native-permissions';

import {
  getCameraPermission,
  getGalleryPermission,
  mapStatus,
} from './mappers';
import type { PermissionResult, PermissionStatus } from './types';

export type { PermissionStatus, PermissionResult } from './types';

/* -------------------------------------------------------------------------- */
/*                              Camera                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the *current* status of the camera permission without prompting
 * the user.
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  const perm = getCameraPermission();
  if (!perm) return 'unavailable';
  return mapStatus(await check(perm));
}

/**
 * Requests the camera permission. If the user has previously selected
 * "Don't ask again" / blocked the permission, the OS will not show a
 * prompt and `'blocked'` is returned — the parent app should then
 * deep-link to settings via {@link openSettings}.
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  const perm = getCameraPermission();
  if (!perm) return 'unavailable';
  return mapStatus(await request(perm));
}

/* -------------------------------------------------------------------------- */
/*                              Gallery                                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns the *current* status of the gallery / photo-library permission
 * without prompting the user.
 *
 * - iOS *limited* photo access surfaces as `'granted'`
 * - Android <33 uses READ_EXTERNAL_STORAGE
 * - Android  33+ uses READ_MEDIA_IMAGES
 */
export async function checkGalleryPermission(): Promise<PermissionStatus> {
  const perm = getGalleryPermission();
  if (!perm) return 'unavailable';
  return mapStatus(await check(perm));
}

/**
 * Requests the gallery / photo-library permission.
 */
export async function requestGalleryPermission(): Promise<PermissionStatus> {
  const perm = getGalleryPermission();
  if (!perm) return 'unavailable';
  return mapStatus(await request(perm));
}

/* -------------------------------------------------------------------------- */
/*                              Combined helper                               */
/* -------------------------------------------------------------------------- */

/**
 * Convenience helper that:
 *  1. Checks both camera & gallery permissions.
 *  2. Requests any that are still in `'denied'` state (first-time prompt).
 *  3. Returns the final per-permission status plus a global `allGranted` flag.
 *
 * It will NOT re-prompt for `'blocked'` or `'unavailable'` permissions —
 * the parent app should surface a "Open Settings" CTA in those cases.
 */
export async function ensureAllPermissions(): Promise<PermissionResult> {
  let camera = await checkCameraPermission();
  let gallery = await checkGalleryPermission();

  if (camera === 'denied') camera = await requestCameraPermission();
  if (gallery === 'denied') gallery = await requestGalleryPermission();

  return {
    camera,
    gallery,
    allGranted: camera === 'granted' && gallery === 'granted',
  };
}

/**
 * Deep-link to the OS settings page for this app so users can manually
 * grant a permission that is currently `'blocked'`.
 */
export async function openSettings(): Promise<void> {
  try {
    await rnpOpenSettings();
  } catch {
    // swallow — user simply did not navigate
  }
}

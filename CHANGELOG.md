# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-08

### Added

- Initial release
- Camera capture with front/back camera toggle and zoom (1x / 2x)
- Gallery image selection via `react-native-image-picker`
- Interactive crop preview with pan and pinch gestures
- Circle and rectangle crop shapes
- Public permission helpers:
  - `checkCameraPermission()`
  - `requestCameraPermission()`
  - `checkGalleryPermission()`
  - `requestGalleryPermission()`
  - `ensureAllPermissions()`
  - `openSettings()`
- Imperative APIs:
  - `openProfileImageCapture()`
  - `openProfileImageGallery()`
  - `openProfileImagePicker()` (alias for `openProfileImageCapture`)
- Component API: `<ProfileImagePicker />`
- Full UI customization (strings, colors, fonts)
- iOS and Android support
- TypeScript definitions included
- Example app with crop shape toggle

### Peer-dependency compatibility

- `react-native-vision-camera`: `>=3.0.0 <5.0.0` (VisionCamera 5.x is **not** supported — its photo-capture API changed)
- `react-native-image-picker`: `>=7.0.0 <9.0.0`
- `@react-native-community/image-editor`: `>=4.0.0 <5.0.0`
- `react-native-permissions`: `>=3.0.0 <6.0.0`
- `react-native-reanimated`: `>=3.0.0` — when using Reanimated 4+, also install `react-native-worklets`
- `react-native-gesture-handler`: `>=2.0.0`
- `react-native-svg`: `>=13.0.0` (optional)

### Notes

- Parent app owns permission UX and source selection
- Output format is always JPEG for optimal file size
- Circle crop exports square bounds; use `borderRadius: width / 2` for display
- Requires Node.js `>=18`



/**
 * The result returned to the parent application when a profile image
 * has been successfully captured / selected and cropped.
 */
export type ProfileImageResult = {
  /** Local file URI, e.g. `file:///.../cropped-1700000000.jpg` */
  uri: string;
  /** Optional base64 string (no data-uri prefix). Only present when the consumer enables it. */
  base64?: string;
  /** Best-effort filename, derived from URI when source did not provide one. */
  fileName?: string;
  /** MIME type — currently always `image/jpeg` since cropping outputs JPEG. */
  type?: string;
  /** Width of the cropped output, in pixels. */
  width?: number;
  /** Height of the cropped output, in pixels (always equal to width — circle). */
  height?: number;
};

export type SmartCaptureStrings = {
  cameraPreparing: string;
  cameraCancel: string;
  cameraFlip: string;
  previewCancel: string;
  previewTitle: string;
  previewLoading: string;
  previewTryAgain: string;
  previewUsePhoto: string;
};

export type SmartCaptureColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textInverse: string;
  textMuted: string;
  divider: string;
  primary: string;
  danger: string;
  scrim: string;
  overlay: string;
  loaderOverlay: string;
};

export type SmartCaptureFonts = {
  regular?: string;
  medium?: string;
  bold?: string;
};

export type SmartCaptureUIConfig = {
  strings?: Partial<SmartCaptureStrings>;
  colors?: Partial<SmartCaptureColors>;
  fonts?: SmartCaptureFonts;
};

/**
 * Options accepted by the imperative API and the `<ProfileImagePicker />`
 * component.
 */
export type ProfileImagePickerOptions = {
  /** Include base64 representation of the cropped image in the result. Default: `false`. */
  enableBase64?: boolean;
  /** Crop shape in preview UI and exported crop area. */
  cropShape?: 'circle' | 'rectangle';
  /**
   * JPEG compression quality, 0-1. Default: `0.85`.
   * Lower = smaller file, more compression artifacts.
   */
  compression?: number;
  /**
   * Maximum output dimension in pixels (output is always square).
   * Default: `1024`. The cropped image is downscaled if larger.
   */
  maxOutputSize?: number;
  /**
   * Customize SDK labels and visual appearance without forking the component.
   */
  ui?: SmartCaptureUIConfig;
};

/**
 * The full set of callbacks accepted by the imperative API.
 */
export type OpenProfileImagePickerArgs = {
  onSuccess: (image: ProfileImageResult) => void;
  onCancel?: () => void;
  /** Called when something fails (permission denied, native crop error, etc.). */
  onError?: (error: Error) => void;
  options?: ProfileImagePickerOptions;
};

export type SmartCaptureSource = 'camera' | 'gallery';

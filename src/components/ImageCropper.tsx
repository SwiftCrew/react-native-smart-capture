import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';

import { DEFAULT_COLORS } from '../uiConfig';
import { clamp } from '../utils/clamp';
import type { CropRect } from '../utils/imageEditor';

/**
 * Imperative handle exposed to the parent, returned via `ref`.
 *
 * `getCropRect()` snapshots the *current* gesture state and translates it
 * into source-image pixel coordinates ready for native cropping.
 */
export type ImageCropperHandle = {
  getCropRect: () => CropRect;
};

export type ImageCropperProps = {
  /** Source image URI. */
  uri: string;
  /** Source image natural pixel size — required to compute crop rect. */
  imageWidth: number;
  /** Source image natural pixel size — required to compute crop rect. */
  imageHeight: number;
  /** The total available width for the cropper viewport. */
  viewportWidth: number;
  /** The total available height for the cropper viewport. */
  viewportHeight: number;
  /** Diameter of the circular crop area. Defaults to `min(width, height) * 0.88`. */
  circleDiameter?: number;
  /** Min zoom relative to base "cover" scale. Default: 1. */
  minZoom?: number;
  /** Max zoom relative to base "cover" scale. Default: 5. */
  maxZoom?: number;
  shape?: 'circle' | 'rectangle';
  overlayColor?: string;
  strokeColor?: string;
  backgroundColor?: string;
};

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 5;
const DEFAULT_CIRCLE_DIAMETER_RATIO = 0.88;
const RECT_HORIZONTAL_INSET = 24;
const RECT_HEIGHT_EXTRA_RATIO = 1 / 5;
const MAX_RECT_HEIGHT_RATIO = 0.9;
const RECT_TOP_OFFSET = 50;

/**
 * Interactive circular cropper.
 *
 * - The image is laid out with `resizeMode: 'cover'` over a square viewport
 *   so the circle is *always* fully covered by image at scale=1.
 * - The user can pan + pinch the image; gestures are clamped so the circle
 *   never reveals empty space.
 * - On confirm, `getCropRect()` returns a square in *source-image* pixels
 *   that bounds the circle — that rect is then handed off to
 *   `@react-native-community/image-editor` for the actual native crop.
 */
export const ImageCropper = forwardRef<ImageCropperHandle, ImageCropperProps>(
  function ImageCropper(props, ref) {
    const {
      uri,
      imageWidth,
      imageHeight,
      viewportWidth,
      viewportHeight,
      circleDiameter = Math.min(viewportWidth, viewportHeight) * DEFAULT_CIRCLE_DIAMETER_RATIO,
      minZoom = DEFAULT_MIN,
      maxZoom = DEFAULT_MAX,
      shape = 'circle',
      overlayColor = DEFAULT_COLORS.overlay,
      backgroundColor = DEFAULT_COLORS.background,
    } = props;
    const rectangleWidth = Math.max(120, viewportWidth - RECT_HORIZONTAL_INSET * 2);
    const rectangleHeight = Math.min(
      viewportHeight * MAX_RECT_HEIGHT_RATIO,
      rectangleWidth + rectangleWidth * RECT_HEIGHT_EXTRA_RATIO,
    );
    const overlayWidth =
      shape === 'circle' ? circleDiameter : rectangleWidth;
    const overlayHeight =
      shape === 'circle' ? circleDiameter : rectangleHeight;
    const isCircle = shape === 'circle';
    const centerX = viewportWidth / 2;
    const rectangleCenterY = RECT_TOP_OFFSET + overlayHeight / 2;
    const centerY = isCircle ? viewportHeight / 2 : rectangleCenterY;

    /* ----------------------------------------------------------------- *
     *  Geometry — all measured in *viewport* pixels (i.e. screen DPs).  *
     * ----------------------------------------------------------------- */
    const layout = useMemo(() => {
      // "Cover" the viewport: image fills both axes, with overflow on the longer one.
      const aspect = imageWidth / imageHeight;
      const viewportAspect = viewportWidth / viewportHeight;
      let coverW: number;
      let coverH: number;
      if (aspect > viewportAspect) {
        coverH = viewportHeight;
        coverW = viewportHeight * aspect;
      } else {
        coverW = viewportWidth;
        coverH = viewportWidth / aspect;
      }
      // Pixel ratio: 1 viewport pixel = `pixelsPerViewportUnit` source pixels.
      const pixelsPerViewportUnitX = imageWidth / coverW;
      const pixelsPerViewportUnitY = imageHeight / coverH;
      return {
        coverW,
        coverH,
        pixelsPerViewportUnitX,
        pixelsPerViewportUnitY,
      };
    }, [imageWidth, imageHeight, viewportHeight, viewportWidth]);

    /* ----------------------------------------------------------------- *
     *  Shared values — driven by gestures.                              *
     * ----------------------------------------------------------------- */
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);

    // Bridge live gesture values back to JS for the imperative `getCropRect`.
    const [snapshot, setSnapshot] = useState({ scale: 1, tx: 0, ty: 0 });

    const updateSnapshot = (s: number, x: number, y: number) => {
      setSnapshot({ scale: s, tx: x, ty: y });
    };

    /* ----------------------------------------------------------------- *
     *  Clamping logic (worklet) — keep circle covered at all times.     *
     * ----------------------------------------------------------------- */
    const clampTranslation = (
      nextScale: number,
      nextTx: number,
      nextTy: number,
    ) => {
      'worklet';
      const scaledW = layout.coverW * nextScale;
      const scaledH = layout.coverH * nextScale;
      // Half the slack we have between scaled image and circle diameter.
      const slackX = (scaledW - overlayWidth) / 2;
      const slackY = (scaledH - overlayHeight) / 2;
      // Translation is measured from the *centered* base position.
      const maxTx = Math.max(0, slackX);
      const maxTy = Math.max(0, slackY);
      return {
        tx: clamp(nextTx, -maxTx, maxTx),
        ty: clamp(nextTy, -maxTy, maxTy),
      };
    };

    /* ----------------------------------------------------------------- *
     *  Gestures                                                         *
     * ----------------------------------------------------------------- */
    const panGesture = Gesture.Pan()
      .averageTouches(true)
      .onStart(() => {
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      })
      .onUpdate((e) => {
        const next = clampTranslation(
          scale.value,
          savedTx.value + e.translationX,
          savedTy.value + e.translationY,
        );
        tx.value = next.tx;
        ty.value = next.ty;
      })
      .onEnd(() => {
        runOnJS(updateSnapshot)(scale.value, tx.value, ty.value);
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        savedScale.value = scale.value;
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      })
      .onUpdate((e) => {
        const nextScale = clamp(savedScale.value * e.scale, minZoom, maxZoom);
        scale.value = nextScale;
        // Re-clamp translation against the new scale.
        const next = clampTranslation(nextScale, savedTx.value, savedTy.value);
        tx.value = next.tx;
        ty.value = next.ty;
      })
      .onEnd(() => {
        // Spring back if user somehow exceeded bounds (shouldn't, but guard).
        const next = clampTranslation(scale.value, tx.value, ty.value);
        tx.value = withTiming(next.tx, { duration: 120 });
        ty.value = withTiming(next.ty, { duration: 120 });
        runOnJS(updateSnapshot)(scale.value, next.tx, next.ty);
      });

    const composed = Gesture.Simultaneous(panGesture, pinchGesture);

    /* ----------------------------------------------------------------- *
     *  Animated style                                                   *
     * ----------------------------------------------------------------- */
    const imageStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: scale.value },
      ],
    }));

    /* ----------------------------------------------------------------- *
     *  Imperative API: compute final crop rect in source-image pixels.  *
     * ----------------------------------------------------------------- */
    useImperativeHandle(ref, () => ({
      getCropRect(): CropRect {
        const { scale: s, tx: x, ty: y } = snapshot;

        // Where is the circle (in *image-local viewport* pixels)?
        // The image is centered in the viewport; (tx, ty) shifts it.
        // Circle is centered in the viewport, with diameter `circleDiameter`.
        // ⇒ in image-local space (before scaling), the circle's center is
        //   at `imageCenter - (tx, ty)` and its radius scales with `s`.
        const imgLocalHalfW = overlayWidth / 2 / s;
        const imgLocalHalfH = overlayHeight / 2 / s;
        const imgLocalCenterX = layout.coverW / 2 - x / s;
        const imgLocalCenterY = layout.coverH / 2 - y / s;

        const localX = imgLocalCenterX - imgLocalHalfW;
        const localY = imgLocalCenterY - imgLocalHalfH;
        const localW = imgLocalHalfW * 2;
        const localH = imgLocalHalfH * 2;

        // Convert from "viewport pixels" to "source-image pixels".
        return {
          x: localX * layout.pixelsPerViewportUnitX,
          y: localY * layout.pixelsPerViewportUnitY,
          width: localW * layout.pixelsPerViewportUnitX,
          height: localH * layout.pixelsPerViewportUnitY,
        };
      },
    }));

    /* ----------------------------------------------------------------- *
     *  Render                                                           *
     * ----------------------------------------------------------------- */
    return (
      <View
        style={[
          styles.viewport,
          { width: viewportWidth, height: viewportHeight, backgroundColor },
        ]}
      >
        <GestureDetector gesture={composed}>
          <Animated.View
            style={[
              styles.imageWrap,
              { width: layout.coverW, height: layout.coverH },
              imageStyle,
            ]}
          >
            <Image
              source={{ uri }}
              style={{ width: layout.coverW, height: layout.coverH }}
              resizeMode="cover"
              fadeDuration={0}
            />
          </Animated.View>
        </GestureDetector>

        {/* Dimming overlay with circular cut-out */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={viewportWidth} height={viewportHeight}>
            <Defs>
              <Mask id="hole">
                <Rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill="white" />
                {isCircle ? (
                  <Circle
                    cx={centerX}
                    cy={centerY}
                    r={overlayWidth / 2}
                    fill="black"
                  />
                ) : (
                  <Rect
                    x={centerX - overlayWidth / 2}
                    y={centerY - overlayHeight / 2}
                    width={overlayWidth}
                    height={overlayHeight}
                    fill="black"
                  />
                )}
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={viewportWidth}
              height={viewportHeight}
              fill={overlayColor}
              mask="url(#hole)"
            />
          </Svg>
        </View>
      </View>
    );
  },
);
ImageCropper.displayName = 'ImageCropper';

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    // Centered by parent's flex centering. We avoid `position:'absolute'`
    // so flex-centering applies; `overflow:'hidden'` on the viewport then
    // clips the cover-sized image.
  },
});

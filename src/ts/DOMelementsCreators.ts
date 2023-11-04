import { createDOMElement } from "./utils";

import ImageEditor from "./imageEditor";

import icons from "../assets/icons";
/**
 * @property {Function} createCropperControls - Create all cropper related stuff in DOM
 */
export const createCropperControls = (editor: ImageEditor): void => {
  // Create cropper button in cp
  editor.cropModeBtn = createDOMElement({
    elementName: "button",
    id: "crop-mode",
    content: icons.cropMode,
  });

  // Create zoom +/- buttons in cp
  editor.cropperZoomInBtn = createDOMElement({
    elementName: "button",
    id: "cropper-zoom-in-btn",
    content: icons.zoomIn,
  });

  editor.cropperZoomOutBtn = createDOMElement({
    elementName: "button",
    id: "cropper-zoom-out-btn",
    content: icons.zoomOut,
  });

  // Create undo button in cp
  editor.cropperUndoBtn = createDOMElement({
    elementName: "button",
    id: "cropper-undo-btn",
    content: icons.undo,
  });

  // Create format button in cp
  editor.imageFormatBtn = createDOMElement({
    elementName: "button",
    id: "cropper-format-btn",
    content: icons.formatJPEG100,
  });

  // Create cropper downlad button in cp
  editor.cropperDownloadBtn = createDOMElement({
    elementName: "button",
    id: "cropper-download-btn",
    content: icons.downloadImage,
  });

  // Aspect Ratio crop buttons + add them to array
  const aspectRationButtonsContainer = createDOMElement({
    elementName: "div",
    className: "aspect-ratio-buttons",
    parentToAppend: editor.cropperControlsContainer,
  });

  editor.cropperBtnAspectSquare = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-square-btn",
    content: icons.aspectRatioSquare,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspectSquare);

  editor.cropperBtnAspect34 = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-3-4-btn",
    content: icons.aspectRatio34,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspect34);

  editor.cropperBtnAspect43 = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-4-3-btn",
    content: icons.aspectRatio43,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspect43);

  editor.cropperBtnAspect169 = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-16-9-btn",
    content: icons.aspectRatio169,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspect169);

  editor.cropperBtnAspect916 = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-9-16-btn",
    content: icons.aspectRatio916,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspect916);

  editor.cropperBtnAspectFree = createDOMElement({
    elementName: "button",
    id: "cropper-aspect-free-btn",
    content: icons.aspectRatioFree,
    parentToAppend: aspectRationButtonsContainer,
  });
  editor.aspectRatioBtns.push(editor.cropperBtnAspectFree);

  // Rotation buttons
  const rotationButtonsContainer = createDOMElement({
    elementName: "div",
    className: "rotation-buttons",
    parentToAppend: editor.cropperControlsContainer,
  });

  editor.cropperBtnRotateRight = createDOMElement({
    elementName: "button",
    id: "cropper-rotate-right-btn",
    content: icons.rotateRight,
    parentToAppend: rotationButtonsContainer,
  });

  editor.cropperBtnRotateLeft = createDOMElement({
    elementName: "button",
    id: "cropper-rotate-left-btn",
    content: icons.rotateLeft,
    parentToAppend: rotationButtonsContainer,
  });

  editor.cropperBtnReflectX = createDOMElement({
    elementName: "button",
    id: "cropper-reflect-x-btn",
    content: icons.reflectX,
    parentToAppend: rotationButtonsContainer,
  });

  editor.cropperBtnReflectY = createDOMElement({
    elementName: "button",
    id: "cropper-reflect-y-btn",
    content: icons.reflectY,
    parentToAppend: rotationButtonsContainer,
  });

  // Apply crop button
  const applyCropButtonContainer = createDOMElement({
    elementName: "div",
    className: "apply-crop-container",
    parentToAppend: editor.cropperControlsContainer,
  });

  editor.cropperBtnApply = createDOMElement({
    elementName: "button",
    id: "cropper-apply-btn",
    content: icons.applyCrop,
    parentToAppend: applyCropButtonContainer,
  });
};

/**
 * @property {Function} createPaintingControls - Create all painting stuff in DOM
 */
export const createPaintingControls = (editor: ImageEditor): void => {
  // Create paint button in cp
  editor.paintModeBtn = createDOMElement({
    elementName: "button",
    id: "paint-mode",
    content: icons.paintingMode,
  });

  const paintingToolsContainer = createDOMElement({
    elementName: "div",
    className: "painting-tools",
    parentToAppend: editor.paintingControlsContainer,
  });

  // Color picker
  editor.colorPicker = createDOMElement({
    elementName: "input",
    id: "color-picker",
    parentToAppend: paintingToolsContainer,
    attributes: { type: "color" },
  });

  // Brush size options
  const brushSizeSettingsContainer = createDOMElement({
    elementName: "div",
    className: "brush-size-settings",
    parentToAppend: paintingToolsContainer,
  });

  editor.decreaseBrushSize = createDOMElement({
    elementName: "button",
    id: "decrease-brush",
    parentToAppend: brushSizeSettingsContainer,
    content: icons.brushDecrease,
  });

  editor.brushSizeEl = createDOMElement({
    elementName: "span",
    id: "size-brush",
    parentToAppend: brushSizeSettingsContainer,
  });

  editor.brushSizeEl.textContent = editor.brushSize.toString();

  editor.increaseBrushSize = createDOMElement({
    elementName: "button",
    id: "increase-brush",
    parentToAppend: brushSizeSettingsContainer,
    content: icons.brushIncrease,
  });

  // Brush mode options
  editor.brushModeBtn = createDOMElement({
    elementName: "button",
    id: "painting-brush",
    parentToAppend: paintingToolsContainer,
    content: icons.pencil,
  });

  editor.eraserModeBtn = createDOMElement({
    elementName: "button",
    id: "eraser-brush",
    parentToAppend: paintingToolsContainer,
    content: icons.eraser,
  });

  editor.blurModeBtn = createDOMElement({
    elementName: "button",
    id: "blur-brush",
    parentToAppend: paintingToolsContainer,
    content: icons.blurTool,
  });

  // Apply/clear painting options
  const paintingApplyButtonsContainer = createDOMElement({
    elementName: "div",
    className: "painting-apply-container",
    parentToAppend: paintingToolsContainer,
  });

  editor.applyPaintingCanvasBtn = createDOMElement({
    elementName: "button",
    id: "apply-drawing-canvas",
    parentToAppend: paintingApplyButtonsContainer,
    content: icons.paintApply,
  });

  editor.clearPaintingCanvasBtn = createDOMElement({
    elementName: "button",
    id: "clear-drawing-canvas",
    parentToAppend: paintingApplyButtonsContainer,
    content: icons.paintClean,
  });
};

/**
 * @property {Function} createFiltersControls - Create all filters stuff in DOM
 */
export const createFiltersControls = (editor: ImageEditor): void => {
  // Create filters button in cp
  editor.filtersModeBtn = createDOMElement({
    elementName: "button",
    id: "filters-mode",
    content: icons.filtersMode,
  });

  // Create filters controls in DOM
  // Left Col
  const filtersLeftColumnContainer = createDOMElement({
    elementName: "div",
    className: "filters-left-col",
    parentToAppend: editor.filterControlsContainer,
  });

  // Brightness
  const brightnessSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersLeftColumnContainer,
  });

  const brightnessSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: brightnessSliderContainer,
    content: icons.filterBrightness,
    attributes: { for: "brightness" },
  });

  const brightnessSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: brightnessSliderContainer,
    id: "brightness",
    attributes: { type: "range", value: "100", min: "0", max: "200" },
  });

  editor.filtersSliders.push(brightnessSliderInput);

  // Contrast
  const contrastSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersLeftColumnContainer,
  });

  const contrastSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: contrastSliderContainer,
    content: icons.filterContrast,
    attributes: { for: "contrast" },
  });

  const contrastSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: contrastSliderContainer,
    id: "contrast",
    attributes: { type: "range", value: "100", min: "0", max: "200" },
  });

  editor.filtersSliders.push(contrastSliderInput);

  // Saturation
  const saturationSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersLeftColumnContainer,
  });

  const saturationSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: saturationSliderContainer,
    content: icons.filterSaturation,
    attributes: { for: "saturation" },
  });

  const saturationSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: saturationSliderContainer,
    id: "saturation",
    attributes: { type: "range", value: "100", min: "0", max: "200" },
  });

  editor.filtersSliders.push(saturationSliderInput);

  // Right Col
  const filtersRightColumnContainer = createDOMElement({
    elementName: "div",
    className: "filters-right-col",
    parentToAppend: editor.filterControlsContainer,
  });

  // Inversion
  const inversionSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersRightColumnContainer,
  });

  const inversionSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: inversionSliderContainer,
    content: icons.filterInversion,
    attributes: { for: "inversion" },
  });

  const inversionSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: inversionSliderContainer,
    id: "inversion",
    attributes: { type: "range", value: "0", min: "0", max: "100" },
  });

  editor.filtersSliders.push(inversionSliderInput);

  // Blur
  const blurSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersRightColumnContainer,
  });

  const blurSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: blurSliderContainer,
    content: icons.filterBlur,
    attributes: { for: "blur" },
  });

  const blurSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: blurSliderContainer,
    id: "blur",
    attributes: { type: "range", value: "0", min: "0", max: "20" },
  });

  editor.filtersSliders.push(blurSliderInput);

  // Hue
  const hueSliderContainer = createDOMElement({
    elementName: "div",
    className: "filter-range-slider",
    parentToAppend: filtersRightColumnContainer,
  });

  const hueSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: hueSliderContainer,
    content: icons.filterHue,
    attributes: { for: "hue" },
  });

  const hueSliderInput = createDOMElement({
    elementName: "input",
    parentToAppend: hueSliderContainer,
    id: "hue",
    attributes: { type: "range", value: "0", min: "0", max: "360" },
  });

  editor.filtersSliders.push(hueSliderInput);

  // Filters Apply/Reset buttons
  const filtersApplyButtonsContainer = createDOMElement({
    elementName: "div",
    className: "filters-apply-reset",
    parentToAppend: editor.filterControlsContainer,
  });

  editor.resetFiltersBtn = createDOMElement({
    elementName: "button",
    id: "reset-filters",
    parentToAppend: filtersApplyButtonsContainer,
    content: icons.filtersReset,
  });

  editor.applyFiltersBtn = createDOMElement({
    elementName: "button",
    id: "apply-filters",
    parentToAppend: filtersApplyButtonsContainer,
    content: icons.filtersApply,
  });
};

/**
 * @property {Function} createRotationControls - Create all rotation stuff in DOM
 */
export const createRotationControls = (editor: ImageEditor): void => {
  // Create rotation button in cp
  editor.rotationModeBtn = createDOMElement({
    elementName: "button",
    id: "rotation-mode",
    content: icons.rotationMode,
  });

  const rotationSliderContainer = createDOMElement({
    elementName: "div",
    className: "rotation-slider-container",
    parentToAppend: editor.rotationControlsContainer,
  });

  const rotationSliderLabel = createDOMElement({
    elementName: "label",
    parentToAppend: rotationSliderContainer,
    attributes: { for: "rotation-slider" },
  });

  editor.imageRotationValue = createDOMElement({
    elementName: "span",
    id: "rotation-value",
    content: "0",
    parentToAppend: rotationSliderLabel,
  });

  const rotationSliderElementsContainer = createDOMElement({
    elementName: "div",
    className: "slider-elements",
    parentToAppend: rotationSliderContainer,
  });

  editor.imageRotationSlider = createDOMElement({
    elementName: "input",
    id: "rotation-slider",
    parentToAppend: rotationSliderElementsContainer,
    attributes: {
      type: "range",
      step: "0.1",
      value: "0",
      min: "-180",
      max: "180",
    },
  });

  const rotationSliderRulerImageContainer = createDOMElement({
    elementName: "div",
    parentToAppend: rotationSliderElementsContainer,
    content: icons.rotationRuler,
  });

  const rotationSliderButtonsContainer = createDOMElement({
    elementName: "div",
    className: "rotation-slider-buttons",
    parentToAppend: editor.rotationControlsContainer,
  });

  editor.imageRotationSliderReset = createDOMElement({
    elementName: "button",
    id: "reset-rotation-btn",
    content: icons.rotationReset,
    parentToAppend: rotationSliderButtonsContainer,
  });

  editor.imageRotationSliderApply = createDOMElement({
    elementName: "button",
    id: "apply-rotation-btn",
    content: icons.rotationApply,
    parentToAppend: rotationSliderButtonsContainer,
  });
};

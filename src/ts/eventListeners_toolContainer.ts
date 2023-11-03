import { BrushSizeAction, Filters } from "./types/imageEditor.types";

import ImageEditor from "./imageEditor";

/**
 * @property {Function} addCropperEvents - Assign event listeners to crop stuff
 */
export const addCropperEvents = (editor: ImageEditor): void => {
  editor.cropperZoomInBtn.addEventListener("click", () => {
    editor.cropper.zoom(0.1);
  });

  editor.cropperZoomOutBtn.addEventListener("click", () => {
    editor.cropper.zoom(-0.1);
  });

  editor.cropperUndoBtn.addEventListener("click", () => {
    editor.undoChange();
  });

  editor.imageFormatBtn.addEventListener("click", () => {
    editor.updateImageFormat();
  });

  editor.cropperDownloadBtn.addEventListener("click", () => {
    editor.downloadImage();
  });

  editor.cropperBtnAspectSquare.addEventListener("click", () => {
    editor.cropper.crop();
    editor.cropper.setAspectRatio(1);
  });

  editor.cropperBtnAspect34.addEventListener("click", () => {
    editor.cropper.crop();
    editor.cropper.setAspectRatio(1.333333);
  });

  editor.cropperBtnAspect43.addEventListener("click", () => {
    editor.cropper.crop();
    editor.cropper.setAspectRatio(0.75);
  });
  editor.cropperBtnAspect169.addEventListener("click", () => {
    editor.cropper.crop();
    editor.cropper.setAspectRatio(0.5625);
  });
  editor.cropperBtnAspect916.addEventListener("click", () => {
    editor.cropper.crop();
    editor.cropper.setAspectRatio(1.777777);
  });
  editor.cropperBtnAspectFree.addEventListener("click", () => {
    if (editor.cropper.cropped) {
      editor.cropper.clear();
    } else {
      editor.cropper.options.autoCropArea = 1;
      editor.cropper.crop();
      editor.cropper.setAspectRatio(0);
    }
  });

  editor.cropperBtnRotateRight.addEventListener("click", () => {
    editor.cropper.clear();
    editor.cropper.rotate(90);
    editor.applyChange();
  });

  editor.cropperBtnRotateLeft.addEventListener("click", () => {
    editor.cropper.clear();
    editor.cropper.rotate(-90);
    editor.applyChange();
  });

  editor.cropperBtnReflectX.addEventListener("click", () => {
    editor.cropper.scaleX(editor.cropper.getImageData().scaleX === -1 ? 1 : -1);
    editor.applyChange();
  });

  editor.cropperBtnReflectY.addEventListener("click", () => {
    editor.cropper.scaleY(editor.cropper.getImageData().scaleY === -1 ? 1 : -1);
    editor.applyChange();
  });

  editor.cropperBtnApply.addEventListener("click", () => {
    editor.applyChange();
  });
};

/**
 * @property {Function} addPaintingEvents - Assign event listeners to paint stuff
 */
export const addPaintingEvents = (editor: ImageEditor): void => {
  editor.colorPicker.addEventListener(
    "change",
    (e) => (editor.brushColor = (e.target as HTMLInputElement).value)
  );

  editor.increaseBrushSize.addEventListener("click", () => {
    editor.changeBrushSize(BrushSizeAction.Increase);
  });

  editor.decreaseBrushSize.addEventListener("click", () => {
    editor.changeBrushSize(BrushSizeAction.Decrease);
  });

  editor.brushModeBtn.addEventListener("click", () => {
    if (editor.blurCanvas) {
      editor.applyBlurCanvas();
    }

    editor.brushIsEraser = false;
  });

  editor.eraserModeBtn.addEventListener("click", () => {
    if (editor.blurCanvas) {
      editor.applyBlurCanvas();
    }

    editor.brushIsEraser = true;
  });

  editor.blurModeBtn.addEventListener("click", () => {
    editor.brushIsEraser = false;
    editor.createBlurCanvas();

    if (editor.paintingCanvas) {
      editor.paintingCanvas
        .getContext("2d")
        ?.clearRect(
          0,
          0,
          editor.paintingCanvas.width,
          editor.paintingCanvas.height
        );
    }
  });

  editor.clearPaintingCanvasBtn.addEventListener("click", () => {
    if (editor.blurCanvas) {
      editor.clearBlurCanvas();
      editor.createBlurCanvas();
    }

    if (editor.paintingCanvas) {
      editor.paintingCanvas
        .getContext("2d")
        ?.clearRect(
          0,
          0,
          editor.paintingCanvas.width,
          editor.paintingCanvas.height
        );
    }
  });

  editor.applyPaintingCanvasBtn.addEventListener("click", () => {
    editor.applyPaintingCanvas();
  });
};

/**
 * @property {Function} addFiltersEvents - Adds events on filter elements in DOM
 */
export const addFiltersEvents = (editor: ImageEditor): void => {
  editor.filtersSliders.forEach((filterRange) => {
    filterRange.addEventListener("input", (e) => {
      const currentElementId = (e.target as HTMLInputElement).id as Filters;

      if (currentElementId in Filters) {
        editor.filtersState[currentElementId] = Number(
          (e.target as HTMLInputElement).value
        );
      }

      editor.applyFilters(editor.previewImage);
      editor.applyFilters(editor.croppedBox);
    });
  });

  editor.resetFiltersBtn.addEventListener("click", () => {
    editor.resetFilters();
  });

  editor.applyFiltersBtn.addEventListener("click", () => {
    editor.applyChange(true);
  });
};

/**
 * @property {Function} addRotationEvents - Adds events on rotation-related DOM elements
 */
export const addRotationEvents = (editor: ImageEditor): void => {
  editor.imageRotationSlider.addEventListener("input", (e) => {
    if (!editor.cropper.cropped) {
      editor.cropper.options.autoCropArea = 0.75;
      editor.cropper.setAspectRatio(0);
    }

    editor.cropper.rotateTo(Number((e.target as HTMLInputElement).value));
    editor.imageRotationValue.textContent = (
      e.target as HTMLInputElement
    ).value;
    editor.cropper.crop();
  });

  editor.imageRotationSliderReset.addEventListener("click", () => {
    editor.resetRotation();
  });

  editor.imageRotationSliderApply.addEventListener("click", () => {
    editor.applyRotation();
  });
};

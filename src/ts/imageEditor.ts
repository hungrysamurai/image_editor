import Cropper from "cropperjs";

import {
  EditorMode,
  ImageFormats,
  ImageMimeType,
  Filters,
  FiltersState,
  LoadingState,
  ZoomButtonsState,
  BrushSizeAction,
  BrushDOMElementsObject,
  BrushMode,
} from "./types/imageEditor.types";

import {
  createDOMElement,
  addKeyboardShortcuts,
  setActivePaintModeDOM,
  removeToolActiveStates,
} from "./utils";

import { drawLine, drawCircle } from "./paintUtils";

import {
  createCropperControls,
  createPaintingControls,
  createFiltersControls,
  createRotationControls,
} from "./DOMelementsCreators";

import { initImageDOM, initCPDOM } from "./DOMInitializers";

import {
  addCropperEvents,
  addPaintingEvents,
  addFiltersEvents,
  addRotationEvents,
} from "./eventListeners_toolContainer";

import { addCPEvents } from "./eventListeners_controlPanel";

import { canvasRGBA } from "stackblur-canvas";

/**
 * SVG icons
 * @type {Object}
 */
import icons from "../assets/icons";
import { addMicroAnimations } from "./animationUtils";

/**
 * Class that generates ImageEditor and inits it in DOM
 */
export default class ImageEditor {
  private static instanceRef: ImageEditor;

  static getInstance(): undefined | ImageEditor {
    return ImageEditor.instanceRef;
  }

  static editorMode: EditorMode = EditorMode.Crop;

  /**
   * @property {Function} createLoader - Create loader element in DOM
   */
  static createLoader(container: HTMLDivElement): void {
    ImageEditor.loadingScreen = createDOMElement({
      elementName: "div",
      className: "loading-screen hide",
      content: icons.loadingSpinner,
    });
    container.insertAdjacentElement("beforebegin", ImageEditor.loadingScreen);
  }

  /**
   * @property {Function} loading - show/hide loader
   * @param {string} action
   * @param {boolean} initial - first run - true
   */
  static loading(action: LoadingState, initial?: boolean): void {
    if (action === LoadingState.Hide) {
      ImageEditor.loadingScreen.classList.add(LoadingState.Hide);
      if (!initial) {
        ImageEditor.instanceRef.cpContainer.style.pointerEvents = "auto";
        ImageEditor.instanceRef.toolContainer.style.pointerEvents = "auto";
      }
    } else if (action === LoadingState.Show) {
      ImageEditor.loadingScreen.classList.remove(LoadingState.Hide);
      if (!initial) {
        ImageEditor.instanceRef.cpContainer.style.pointerEvents = "none";
        ImageEditor.instanceRef.toolContainer.style.pointerEvents = "none";
      }
    }
  }

  static create(
    DOMContainers: HTMLDivElement[],
    imageFile: File,
    isMobile: boolean
  ) {
    ImageEditor.instanceRef = new ImageEditor(
      DOMContainers,
      imageFile,
      isMobile
    );
  }

  static reset(imageFile: File) {
    ImageEditor.loading(LoadingState.Show);
    const { cropper } = ImageEditor.instanceRef;

    // Reset current cropper
    cropper.reset();
    cropper.clear();
    cropper.setCanvasData(cropper.imageCenter);

    // Default mode - crop
    ImageEditor.instanceRef.activateEditorMode(EditorMode.Crop, true);
    removeToolActiveStates(ImageEditor.instanceRef.aspectRatioBtns);

    // Replace image
    cropper.replace(URL.createObjectURL(imageFile));

    // Clear history, and set initial canvas to new image
    ImageEditor.instanceRef.#cropperHistory.length = 0;
    ImageEditor.instanceRef.initialCanvas = null;

    ImageEditor.instanceRef.setImageFormat(imageFile.type as ImageMimeType);
  }

  static loadingScreen: HTMLDivElement;

  /**
   * @property {Array} #imageFormats - array of image formats and corresponding settings
   */
  #imageFormats: ImageFormats = [
    [ImageMimeType.JPEG, 0.3, icons.formatJPEG30],
    [ImageMimeType.JPEG, 0.5, icons.formatJPEG50],
    [ImageMimeType.JPEG, 0.8, icons.formatJPEG80],
    [ImageMimeType.JPEG, 1.0, icons.formatJPEG100],
    [ImageMimeType.PNG, 1, icons.formatPNG],
    [ImageMimeType.WEBP, 1, icons.formatWEBP],
  ];

  currentImageFormatIndex: number;

  /**
   * @property {Object} filtersState - filters values that applies to image preview
   */
  filtersState: FiltersState = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    inversion: 0,
    blur: 0,
    hue: 0,
  };

  cpContainer: HTMLDivElement;
  mainContainer: HTMLDivElement;
  toolContainer: HTMLDivElement;

  isMobile: boolean;

  imageName: string;

  cropperControlsContainer: HTMLDivElement;
  paintingControlsContainer: HTMLDivElement;
  filterControlsContainer: HTMLDivElement;
  rotationControlsContainer: HTMLDivElement;

  toolContainers!: HTMLDivElement[];

  cropModeBtn!: HTMLButtonElement;
  cropperZoomInBtn!: HTMLButtonElement;
  cropperZoomOutBtn!: HTMLButtonElement;
  cropperUndoBtn!: HTMLButtonElement;
  imageFormatBtn!: HTMLButtonElement;
  cropperDownloadBtn!: HTMLButtonElement;

  cropperBtnAspectSquare!: HTMLButtonElement;
  cropperBtnAspect34!: HTMLButtonElement;
  cropperBtnAspect43!: HTMLButtonElement;
  cropperBtnAspect169!: HTMLButtonElement;
  cropperBtnAspect916!: HTMLButtonElement;
  cropperBtnAspectFree!: HTMLButtonElement;
  cropperBtnRotateRight!: HTMLButtonElement;
  cropperBtnRotateLeft!: HTMLButtonElement;
  cropperBtnReflectX!: HTMLButtonElement;
  cropperBtnReflectY!: HTMLButtonElement;
  cropperBtnApply!: HTMLButtonElement;

  aspectRatioBtns: NodeListOf<HTMLButtonElement>;

  paintModeBtn!: HTMLButtonElement;

  colorPicker!: HTMLInputElement;
  decreaseBrushSize!: HTMLButtonElement;
  brushSizeEl!: HTMLSpanElement;
  increaseBrushSize!: HTMLButtonElement;
  brushModeBtn!: HTMLButtonElement;
  eraserModeBtn!: HTMLButtonElement;
  blurModeBtn!: HTMLButtonElement;
  applyPaintingCanvasBtn!: HTMLButtonElement;
  clearPaintingCanvasBtn!: HTMLButtonElement;

  brushToolsObject: BrushDOMElementsObject;

  filtersModeBtn!: HTMLButtonElement;

  filtersSliders: HTMLInputElement[];
  resetFiltersBtn!: HTMLButtonElement;
  applyFiltersBtn!: HTMLButtonElement;

  rotationModeBtn!: HTMLButtonElement;

  imageRotationValue!: HTMLSpanElement;
  imageRotationSlider!: HTMLInputElement;
  imageRotationSliderApply!: HTMLButtonElement;
  imageRotationSliderReset!: HTMLButtonElement;

  uploadNewImgBtn!: HTMLLabelElement;

  brushCursor!: HTMLDivElement | undefined;

  // Some global variables for painting

  /**
   * @property {string} this.brushColor - color of painting brush in HEX format
   */
  brushColor!: string;

  /**
   * @property {number} this.brushSize - size of painting brush
   */
  brushSize!: number;

  /**
   * @property {boolean} this.brushIsPressed
   */
  brushIsPressed!: boolean;

  /**
   * @property {boolean} this.brushIsEraser - is brush in eraser mode
   */
  brushIsEraser!: boolean;

  /**
   * @property {Cropper} cropper - cropper instance
   */
  cropper: Cropper;

  /**
   * @property {Array} #cropperHistory - array of previous canvas elements
   */
  #cropperHistory: HTMLCanvasElement[] = [];

  /**
   * @property {number} #croppersCounter - counts how many times new Cropper object was created. 0 by default, 1 after first initialization
   */
  #croppersCounter = 0;

  /**
   * @property {HTMLElement} croppedBox - img element inside cropper box
   */
  croppedBox!: HTMLImageElement;

  /**
   * @property {HTMLElement} previewImage - img element in DOM
   */
  previewImage!: HTMLImageElement;

  /**
   * @property {HTMLElement} paintingCanvas - canvas element for painting
   */
  paintingCanvas!: HTMLCanvasElement | undefined;

  /**
   * @property {HTMLElement} paintingCanvas - canvas element for painting with blur brush
   */
  blurCanvas!: HTMLCanvasElement | undefined;

  /**
   * @property {HTMLElement} offScreenCanvas - off screen temp canvas element that holds all blur-brush strokes
   */
  offScreenCanvas!: HTMLCanvasElement | undefined;

  /**
   * @property {HTMLElement} drawBackCanva - canvas element with captured ogiginal data of painting canvas
   */
  drawBackCanvas!: HTMLCanvasElement | undefined;

  /**
   * @property {HTMLElement} initialCanvas - initially loaded canvas element, first ([0]) element in #cropperHistory array
   */
  initialCanvas!: HTMLCanvasElement | null;

  /**
   *
   * @param {Array} DOMContainers - array of DOM elements that will hold ImageEditor components
   * @param {File} imageFile - file object - image
   * @param {boolean} isMobile - true if mobile
   * @this ImageEditor
   */
  private constructor(
    DOMContainers: HTMLDivElement[],
    imageFile: File,
    isMobile: boolean
  ) {
    ImageEditor.loading(LoadingState.Show, true);

    const [cpContainer, mainContainer, toolContainer] = DOMContainers;

    this.cpContainer = cpContainer;
    this.mainContainer = mainContainer;
    this.toolContainer = toolContainer;

    // Get individual tool container
    this.cropperControlsContainer = this.toolContainer.querySelector(
      ".crop-controls"
    ) as HTMLDivElement;
    this.paintingControlsContainer = this.toolContainer.querySelector(
      ".paint-controls"
    ) as HTMLDivElement;
    this.filterControlsContainer = this.toolContainer.querySelector(
      ".filters-controls"
    ) as HTMLDivElement;
    this.filtersSliders = [];
    this.rotationControlsContainer = this.toolContainer.querySelector(
      ".rotation-controls"
    ) as HTMLDivElement;

    // Group tool containers to array
    this.toolContainers = [
      this.cropperControlsContainer,
      this.paintingControlsContainer,
      this.filterControlsContainer,
      this.rotationControlsContainer,
    ];

    this.isMobile = isMobile;

    // Set name of file
    this.imageName = imageFile.name.substring(0, imageFile.name.length - 4);

    this.currentImageFormatIndex = 3;
    this.brushSize = 20;

    createCropperControls(this);
    createPaintingControls(this);
    createFiltersControls(this);
    createRotationControls(this);

    // Init cropper
    this.cropper = new Cropper(
      initImageDOM(this, URL.createObjectURL(imageFile)),
      //Cropper settings object
      {
        viewMode: 2,
        dragMode: "none",
        modal: true,
        background: false,
        autoCrop: false,
        autoCropArea: 1,
        ready: () => {
          // Apply filters to current preview image
          this.previewImage = this.cropper.image;
          this.applyFilters(this.previewImage);

          this.croppedBox = this.cropper.viewBox.querySelector(
            "img"
          ) as HTMLImageElement;
          this.applyFilters(this.croppedBox);

          // Capture initial canvas data width to disable moving if fully zoomed out
          const initialCanvasData = this.cropper.getCanvasData();

          this.cropper.zoomOutWidth = initialCanvasData.width;
          this.cropper.imageCenter = initialCanvasData;

          // Fix horizontal shift of image
          let topMargin =
            (this.mainContainer.clientHeight -
              this.cropper.getCanvasData().height) /
            2;

          this.cropper.setCanvasData({
            top: topMargin,
          });

          // Add cropper events if it is first initialiization
          this.#croppersCounter++;
          if (this.#croppersCounter === 1) {
            addCropperEvents(this);
          }

          // Save initial canvas in history
          if (!this.initialCanvas) {
            this.initialCanvas = this.cropper.getCroppedCanvas({
              minWidth: 256,
              minHeight: 256,
              maxWidth: 8192,
              maxHeight: 8192,
            });

            this.#cropperHistory.push(this.initialCanvas);
            this.setUndoBtn();
          }

          if (this.#croppersCounter === 1 && this.isMobile) {
            this.applyChange();
          }

          ImageEditor.loading(LoadingState.Hide);
        },

        zoom: () => {
          const currentCanvasData = this.cropper.getCanvasData();
          // Enable/disable zoom/move mode
          if (currentCanvasData.width > this.cropper.zoomOutWidth) {
            this.cropper.setDragMode("move");
            this.setZoombuttonsState(ZoomButtonsState.Active);
          } else {
            this.cropper.setCropBoxData({
              height: currentCanvasData.height,
            });

            this.cropper.setDragMode("none");

            // Center image if zoom out
            this.cropper.setCanvasData(this.cropper.imageCenter);

            // Fix horizontal shift of image
            let topMargin =
              (this.mainContainer.clientHeight - currentCanvasData.height) / 2;
            this.cropper.setCanvasData({
              top: topMargin,
            });

            this.setZoombuttonsState(ZoomButtonsState.ZoomOut);
          }
        },
      }
    );

    // Aspect Ratio buttons as NodeList
    this.aspectRatioBtns = (
      this.cropperControlsContainer.querySelector(
        ".aspect-ratio-buttons"
      ) as HTMLDivElement
    ).querySelectorAll("button");

    initCPDOM(this);

    addPaintingEvents(this);
    addFiltersEvents(this);
    addRotationEvents(this);

    addKeyboardShortcuts(this);

    this.setImageFormat(imageFile.type as ImageMimeType);

    this.brushToolsObject = {
      [BrushMode.Paint]: this.brushModeBtn,
      [BrushMode.Blur]: this.blurModeBtn,
      [BrushMode.Eraser]: this.eraserModeBtn,
    };

    addCPEvents(this);
    this.activateEditorMode(EditorMode.Crop, true);
    addMicroAnimations(this);
  }

  /**
   *
   * @property {Function} activateEditorMode - Activate mode. Initially - crop mode.
   * @param {string} mode - new mode of ImageEditor
   * @param {boolean} isNewImage - if it is first initialization
   */
  activateEditorMode(mode: EditorMode, isNewImage?: boolean): void {
    if (isNewImage) {
      this.cropModeBtn.classList.add("active");
    }

    if (ImageEditor.editorMode === mode && !isNewImage) return;

    if (ImageEditor.editorMode === EditorMode.Paint && this.paintingCanvas) {
      this.cropper.enable();

      if (this.blurCanvas) {
        this.clearBlurCanvas();
      }

      this.paintingCanvas.remove();
      this.paintingCanvas = undefined;
      this.setZoombuttonsState(ZoomButtonsState.Active);
      this.setUndoBtn(false);

      if (!this.isMobile) {
        this.initBrushCursor(undefined, false);
      }
    }

    if (ImageEditor.editorMode === EditorMode.Filters) {
      this.resetFilters();
    }

    if (ImageEditor.editorMode === EditorMode.Rotation) {
      this.resetRotation();
    }

    // Set current mode to new
    ImageEditor.editorMode = mode;

    // Activate proper tool container in DOM
    this.toolContainers.forEach((container) => {
      container.classList.add("hide");
    });

    (
      this.toolContainer.querySelector(`.${mode}-controls`) as HTMLDivElement
    ).classList.remove("hide");

    // Update icons in cp
    this.cpContainer
      .querySelectorAll(".cp-toolbox button")
      .forEach((button) => {
        button.classList.remove("active");
        if (button.id === `${mode}-mode`) {
          button.classList.add("active");
        }
      });

    if (mode === "paint") {
      this.cropper.clear();
      this.cropper.disable();
      this.createPaintingCanvas();
      this.setZoombuttonsState(ZoomButtonsState.Paint);
      this.setUndoBtn(true);

      setActivePaintModeDOM(this.brushToolsObject, BrushMode.Paint);
    }
  }

  /**
   * @property {Function}
   * @param {string} action - increase/decrease
   */
  changeBrushSize(action: BrushSizeAction): void {
    if (action === BrushSizeAction.Increase) {
      this.brushSize += 1;
      if (this.brushSize > 50) {
        this.brushSize = 50;
      }
    } else if (action === BrushSizeAction.Decrease) {
      this.brushSize -= 1;
      if (this.brushSize < 1) {
        this.brushSize = 1;
      }
    }

    this.brushSizeEl.textContent = this.brushSize.toString();
  }

  /**
   * @property {Function} applyRotation - Apply rotation and apply change
   */
  applyRotation(): void {
    if (!this.cropper.cropped) {
      this.cropper.crop();
      this.cropper.setAspectRatio(0);
    }
    this.applyChange();

    this.resetRotation();
  }

  /**
   * @property {Function} resetRotation - reset rotation to 0
   */
  resetRotation(): void {
    this.imageRotationValue.textContent = "0";
    this.cropper.rotateTo(0);
    this.imageRotationSlider.value = "0";
    this.cropper.clear();
  }

  /**
   * @property {Function} applyFilters - apply values from filtersState object as styles to DOM element
   * @param {HTMLElement} - DOM element, img, to apply filters as styles
   * @returns {string} - string with filters properties to apply on canvas element
   */
  applyFilters(element?: HTMLImageElement): string {
    if (element) {
      element.style.filter = `brightness(${this.filtersState.brightness}%)contrast(${this.filtersState.contrast}%)saturate(${this.filtersState.saturation}%)invert(${this.filtersState.inversion}%) blur(${this.filtersState.blur}px)hue-rotate(${this.filtersState.hue}deg)`;
    }

    return `brightness(${this.filtersState.brightness}%)contrast(${this.filtersState.contrast}%)saturate(${this.filtersState.saturation}%)invert(${this.filtersState.inversion}%) hue-rotate(${this.filtersState.hue}deg)`;
  }

  /**
   * @property {Function} resetFilters - resets filtersState object values to initial, reset filters styles of this.previewImage and this.croppedBox
   */
  resetFilters(): void {
    this.filtersSliders.forEach((filterRange) => {
      if (
        filterRange.id === Filters.brightness ||
        filterRange.id === Filters.saturation ||
        filterRange.id === Filters.contrast
      ) {
        filterRange.value = "100";
        this.filtersState[filterRange.id] = 100;
      } else if (
        filterRange.id === Filters.inversion ||
        filterRange.id === Filters.blur ||
        filterRange.id === Filters.hue
      ) {
        filterRange.value = "0";
        this.filtersState[filterRange.id] = 0;
      }
    });
    this.applyFilters(this.previewImage);
    this.applyFilters(this.croppedBox);
  }

  /**
   * @property {Function} setUndoBtn - disable global Undo button in painting mode and when only 1 (initial) canvas in #cropperHistory
   * @param {boolean} paintMode - if true - paint mode is active
   */
  setUndoBtn(paintMode?: boolean): void {
    if (this.#cropperHistory.length === 1 || paintMode) {
      this.cropperUndoBtn.disabled = true;
      this.cropperUndoBtn.style.opacity = "0.5";
    } else {
      this.cropperUndoBtn.disabled = false;
      this.cropperUndoBtn.style.opacity = "1";
    }
  }

  /**
   * @property {Function} saveCanvas - save canvas element to #cropperHistory array
   * @param {HTMLElement} canvas - canvas element
   */
  saveCanvas(canvas: HTMLCanvasElement): void {
    this.#cropperHistory.push(canvas);
    this.setUndoBtn();
  }

  /**
   * @property {Function} loadCanvas - remove last canvas (current working canvas) from #cropperHistory, and return last canvas of this array
   * @returns {HTMLElement} - canvas to restore
   */
  loadCanvas(): HTMLCanvasElement {
    this.#cropperHistory.pop();
    let previous = this.#cropperHistory[this.#cropperHistory.length - 1];
    this.setUndoBtn();

    return previous;
  }

  /**
   * @property {Function} canvasReplace - replace current canvas with provided by using .toBlob method
   * @param {HTMLCanvasElement} canvas - canvas element
   */
  canvasReplace(canvas: HTMLCanvasElement) {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          let newImage = new Image();
          let url = URL.createObjectURL(blob);
          newImage.src = url;

          newImage.onload = () => {
            ImageEditor.loading(LoadingState.Hide);
          };

          this.cropper.replace(newImage.src);
        }
      },
      this.#imageFormats[this.currentImageFormatIndex][0],
      this.#imageFormats[this.currentImageFormatIndex][1]
    );
  }

  /**
   * @property {Function} applyChange - apply crop/painting/rotation/filters
   * @param {boolean} filters - if true - draw all current filters (#this.filtersState object values) on canvas
   */
  applyChange(filters?: boolean): void {
    ImageEditor.loading(LoadingState.Show);

    let nextCanvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 8192,
      maxHeight: 8192,
    });

    if (filters) {
      // Draw all current filters on canvas
      let ctx = nextCanvas.getContext("2d") as CanvasRenderingContext2D;

      ctx.filter = this.applyFilters();

      canvasRGBA(
        nextCanvas,
        0,
        0,
        nextCanvas.width,
        nextCanvas.height,
        this.filtersState.blur * 3
      );
      ctx.drawImage(nextCanvas, 0, 0);

      // Reset filters after drawing
      this.resetFilters();
    }

    this.saveCanvas(nextCanvas);
    this.canvasReplace(nextCanvas);
  }

  /**
   * @property {Function} undoChange - return previous state
   */
  undoChange(): void {
    ImageEditor.loading(LoadingState.Show);
    if (this.#cropperHistory.length === 1) {
      if (this.initialCanvas) {
        this.canvasReplace(this.initialCanvas);
      }
      this.setUndoBtn();
      this.resetFilters();
    } else if (this.#cropperHistory.length === 2) {
      this.#cropperHistory.pop();
      if (this.initialCanvas) {
        this.canvasReplace(this.initialCanvas);
      }
      this.setUndoBtn();
      this.resetFilters();
    } else {
      let previous = this.loadCanvas();
      this.canvasReplace(previous);
      this.resetFilters();
    }
  }

  /**
   * @property {Function} setImageFormat - sets format and quality of current image
   * @param {string} type - jpeg/png/webp
   */
  setImageFormat(type: ImageMimeType): void {
    let index;

    this.#imageFormats.forEach((format, i) => {
      if (format[0] === type) {
        index = i;
      }
    });

    if (index) {
      this.currentImageFormatIndex = index;
    } else {
      this.currentImageFormatIndex = 3;
    }

    this.imageFormatBtn.innerHTML =
      this.#imageFormats[this.currentImageFormatIndex][2];
  }

  /**
   * @property {Function} updateImageFormat - change format of image
   */
  updateImageFormat(): void {
    this.currentImageFormatIndex++;
    if (this.currentImageFormatIndex > this.#imageFormats.length - 1) {
      this.currentImageFormatIndex = 0;
    }

    this.imageFormatBtn.innerHTML =
      this.#imageFormats[this.currentImageFormatIndex][2];
  }

  /**
   * @property {Function} downloadImage - download current canvas as image with current format & filters
   */
  downloadImage(): void {
    let canvas = this.cropper.getCroppedCanvas();
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    ctx.filter = this.applyFilters();

    canvasRGBA(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      this.filtersState.blur * 3
    );

    ctx.drawImage(canvas, 0, 0);

    let result = canvas.toDataURL(
      this.#imageFormats[this.currentImageFormatIndex][0],
      this.#imageFormats[this.currentImageFormatIndex][1]
    );

    const createEl = document.createElement("a");
    createEl.href = result;
    createEl.download = this.imageName;
    createEl.click();
    createEl.remove();
  }

  /**
   * @property {Function} createPaintingCanvas - create new painting canvas element, set it in front of image and add event listeners to it
   */
  createPaintingCanvas(): void {
    // Create canvas element
    let paintingCanvas = document.createElement("canvas");

    // Set current painting canvas
    this.paintingCanvas = paintingCanvas;

    // Set canvas element styles
    paintingCanvas.style.position = "absolute";
    paintingCanvas.style.left = `${this.cropper.getCanvasData().left}px`;
    paintingCanvas.style.top = `${this.cropper.getCanvasData().top}px`;
    paintingCanvas.style.zIndex = "1";
    paintingCanvas.style.overflow = "hidden";

    paintingCanvas.height = this.previewImage.height;
    paintingCanvas.width = this.previewImage.width;

    // Drawing functionality
    const ctx = paintingCanvas.getContext("2d");

    // Insert drawing canvas element in DOM
    this.mainContainer.insertAdjacentElement("afterbegin", paintingCanvas);

    // Some global variables for painting
    this.brushColor = "#000000";
    this.brushSize = 10;
    this.brushSizeEl.textContent = this.brushSize.toString();
    this.colorPicker.value = this.brushColor;
    this.brushIsPressed = false;
    this.brushIsEraser = false;

    let x: number | undefined;
    let y: number | undefined;

    paintingCanvas.addEventListener("mousedown", (e) => {
      this.brushIsPressed = true;

      x = e.offsetX;
      y = e.offsetY;
    });

    paintingCanvas.addEventListener("touchstart", (e) => {
      this.brushIsPressed = true;

      let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      let tx = e.targetTouches[0].pageX - rect.left;
      let ty = e.targetTouches[0].pageY - rect.top;

      x = tx;
      y = ty;
    });

    paintingCanvas.addEventListener("mouseup", () => {
      this.brushIsPressed = false;

      x = undefined;
      y = undefined;
    });

    paintingCanvas.addEventListener("touchend", () => {
      this.brushIsPressed = false;

      x = undefined;
      y = undefined;
    });

    paintingCanvas.addEventListener("mousemove", (e) => {
      if (this.brushIsPressed && ctx) {
        if (this.brushIsEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        const x2 = e.offsetX;
        const y2 = e.offsetY;
        drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        drawLine(
          ctx,
          this.brushColor,
          this.brushSize,
          x as number,
          y as number,
          x2,
          y2
        );

        x = x2;
        y = y2;
        ctx.globalCompositeOperation = "source-over";
      }
    });

    paintingCanvas.addEventListener("touchmove", (e) => {
      if (this.brushIsPressed && ctx) {
        if (this.brushIsEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        let tx = e.targetTouches[0].pageX - rect.left;
        let ty = e.targetTouches[0].pageY - rect.top;

        const x2 = tx;
        const y2 = ty;
        drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        drawLine(
          ctx,
          this.brushColor,
          this.brushSize,
          x as number,
          y as number,
          x2,
          y2
        );

        x = x2;
        y = y2;
        ctx.globalCompositeOperation = "source-over";
      }
    });

    if (!this.isMobile) {
      this.initBrushCursor(this.paintingCanvas, true);
    }
  }

  /**
   * @property {Function} createBlurCanvas - init new canvas to paint with blur brush, set it on top of mixed canvas (initial + painting).
   */
  createBlurCanvas(): void {
    if (this.blurCanvas) return;

    let blurCanvas = document.createElement("canvas");
    let blurCtx = blurCanvas.getContext("2d") as CanvasRenderingContext2D;

    this.blurCanvas = blurCanvas;

    let offScreenCanvas = document.createElement("canvas");
    let offScreenCtx = offScreenCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    this.offScreenCanvas = offScreenCanvas;

    // Position canvas on top of painting canvas
    blurCanvas.style.position = "absolute";
    blurCanvas.style.left = `${this.cropper.getCanvasData().left}px`;
    blurCanvas.style.top = `${this.cropper.getCanvasData().top}px`;
    blurCanvas.style.zIndex = "3";
    blurCanvas.style.overflow = "hidden";

    blurCanvas.height = this.previewImage.height;
    blurCanvas.width = this.previewImage.width;

    offScreenCanvas.height = this.previewImage.height;
    offScreenCanvas.width = this.previewImage.width;

    let blurPressed = false;

    let x: number;
    let y: number;

    // Get base canvas
    let baseCanvas = this.cropper.clear().getCroppedCanvas();

    // Merge base with painting canvas
    let merged = document.createElement("canvas");

    if (this.paintingCanvas) {
      const mergedCtx = merged.getContext("2d") as CanvasRenderingContext2D;

      merged.width = baseCanvas.width;
      merged.height = baseCanvas.height;

      mergedCtx.drawImage(baseCanvas, 0, 0);
      mergedCtx.drawImage(
        this.paintingCanvas,
        0,
        0,
        merged.width,
        merged.height
      );

      // Save painting progress
      this.drawBackCanvas = document.createElement("canvas");
      const drawBackCtx = this.drawBackCanvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      this.drawBackCanvas.width = this.paintingCanvas.width;
      this.drawBackCanvas.height = this.paintingCanvas.height;
      drawBackCtx.drawImage(
        this.paintingCanvas,
        0,
        0,
        this.drawBackCanvas.width,
        this.drawBackCanvas.height
      );
    }

    //  Draw merged canvas on blur context
    blurCtx.drawImage(merged, 0, 0, blurCanvas.width, blurCanvas.height);

    // Append blur canvas in front of painting canvas
    this.mainContainer.insertAdjacentElement("afterbegin", blurCanvas);

    // Blur paint functionality
    blurCanvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      blurPressed = true;

      x = e.offsetX;
      y = e.offsetY;
    });

    blurCanvas.addEventListener("touchstart", (e) => {
      blurPressed = true;

      let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      let tx = e.targetTouches[0].pageX - rect.left;
      let ty = e.targetTouches[0].pageY - rect.top;

      x = tx;
      y = ty;
    });

    blurCanvas.addEventListener("mousemove", (e) => {
      if (!blurPressed) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const x2 = e.offsetX;
      const y2 = e.offsetY;

      drawCircle(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x2, y2);
      drawLine(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x, y, x2, y2);

      drawCircle(offScreenCtx, undefined, this.brushSize, x, y);
      drawLine(offScreenCtx, undefined, this.brushSize, x, y, x2, y2);

      x = x2;
      y = y2;
    });

    blurCanvas.addEventListener("touchmove", (e) => {
      if (!blurPressed) {
        return;
      }

      let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      let tx = e.targetTouches[0].pageX - rect.left;
      let ty = e.targetTouches[0].pageY - rect.top;

      const x2 = tx;
      const y2 = ty;

      drawCircle(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x2, y2);
      drawLine(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x, y, x2, y2);

      drawCircle(offScreenCtx, undefined, this.brushSize, x, y);
      drawLine(offScreenCtx, undefined, this.brushSize, x, y, x2, y2);

      x = x2;
      y = y2;
    });

    blurCanvas.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();

      blurPressed = false;
      offScreenCtx.save();
      offScreenCtx.globalCompositeOperation = "source-in";
      offScreenCtx.filter = "blur(12px)";

      offScreenCtx.drawImage(merged, 0, 0, blurCanvas.width, blurCanvas.height);

      offScreenCtx.restore();
      blurCtx.save();

      blurCtx.drawImage(offScreenCanvas, 0, 0);
      blurCtx.globalCompositeOperation = "destination-over";
      blurCtx.drawImage(merged, 0, 0, blurCanvas.width, blurCanvas.height);
      blurCtx.restore();
    });

    blurCanvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();

      blurPressed = false;
      offScreenCtx.save();
      offScreenCtx.globalCompositeOperation = "source-in";
      offScreenCtx.filter = "blur(12px)";

      offScreenCtx.drawImage(merged, 0, 0, blurCanvas.width, blurCanvas.height);

      offScreenCtx.restore();
      blurCtx.save();

      blurCtx.drawImage(offScreenCanvas, 0, 0);
      blurCtx.globalCompositeOperation = "destination-over";
      blurCtx.drawImage(merged, 0, 0, blurCanvas.width, blurCanvas.height);
      blurCtx.restore();
    });

    blurCanvas.addEventListener("mouseout", (e) => {
      e.preventDefault();
      e.stopPropagation();
      blurPressed = false;
    });

    if (!this.isMobile) {
      this.initBrushCursor(this.blurCanvas, true);
    }
  }

  /**
   * @property {Function} applyBlurCanvas - merge original painting canvas with 'blur-brushed' offscreen canvas
   */
  applyBlurCanvas(): void {
    if (!this.blurCanvas) return;

    if (this.paintingCanvas && this.drawBackCanvas && this.offScreenCanvas) {
      let paintingCanvasCtx = this.paintingCanvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

      paintingCanvasCtx.drawImage(
        this.drawBackCanvas,
        0,
        0,
        this.paintingCanvas.width,
        this.paintingCanvas.height
      );

      paintingCanvasCtx.drawImage(
        this.offScreenCanvas,
        0,
        0,
        this.paintingCanvas.width,
        this.paintingCanvas.height
      );

      this.clearBlurCanvas();
    }
  }

  /**
   * @property {Function} clearBlurCanvas - Removes blur canvas & offscreen canvas
   */
  clearBlurCanvas(): void {
    this.blurCanvas?.remove();
    this.blurCanvas = undefined;

    this.offScreenCanvas?.remove();
    this.offScreenCanvas = undefined;

    this.drawBackCanvas?.remove();
    this.drawBackCanvas = undefined;
  }

  /**
   * @property {Function} initBrushCursor - on desktop init brush circle cursor instead of regular arrow
   * @param {HTMLElement} canvas - current painting canvas
   * @param {boolean} state - init or remove custom cursor
   */
  initBrushCursor(canvas: HTMLCanvasElement | undefined, state: boolean): void {
    if (state && canvas) {
      canvas.addEventListener("mouseenter", () => {
        this.brushCursor = createDOMElement({
          elementName: "div",
          className: "paint-brush-cursor",
        });

        this.brushCursor.style.width = `${this.brushSize * 2}px`;
        this.brushCursor.style.height = `${this.brushSize * 2}px`;

        this.mainContainer.insertAdjacentElement(
          "beforebegin",
          this.brushCursor
        );
      });

      canvas.addEventListener("mousemove", (e) => {
        const mouseY = e.clientY - this.brushSize;
        const mouseX = e.clientX - this.brushSize;
        if (this.brushCursor) {
          this.brushCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        }
      });

      canvas.addEventListener("mouseleave", () => {
        this.brushCursor?.remove();
        this.brushCursor = undefined;
      });
    } else {
      if (this.brushCursor) {
        this.brushCursor.remove();
      }
      this.brushCursor = undefined;
    }
  }

  /**
   * @property {Function} applyPaintingCanvas - Save painting canvas and merge it with base canvas
   */
  applyPaintingCanvas(): void {
    ImageEditor.loading(LoadingState.Show);
    this.applyBlurCanvas();

    this.cropper.enable();
    this.cropper.crop();

    // Get base canvas
    let baseCanvas = this.cropper.clear().getCroppedCanvas();

    // Merge base with painting canvas
    let merged = document.createElement("canvas");
    merged.width = baseCanvas.width;
    merged.height = baseCanvas.height;

    const ctx = merged.getContext("2d") as CanvasRenderingContext2D;

    if (this.paintingCanvas) {
      ctx.drawImage(baseCanvas, 0, 0);
      ctx.drawImage(this.paintingCanvas, 0, 0, merged.width, merged.height);

      // Save merged canvas
      this.saveCanvas(merged);
      this.canvasReplace(merged);

      // Destroy current painting canvas
      this.paintingCanvas.remove();
      this.paintingCanvas = undefined;
      this.setZoombuttonsState(ZoomButtonsState.Active);
    }
  }

  /**
   * @property {Function} setZoombuttonsState - enable/disable zoom buttons
   * @param {string} state
   */
  setZoombuttonsState(state: ZoomButtonsState) {
    if (state === ZoomButtonsState.ZoomOut) {
      this.cropperZoomOutBtn.style.opacity = "0.5";
    } else if (state === ZoomButtonsState.Paint) {
      this.cropperZoomOutBtn.style.opacity = "0.5";
      this.cropperZoomInBtn.style.opacity = "0.5";
    } else if (state === ZoomButtonsState.Active) {
      this.cropperZoomOutBtn.style.opacity = "1";
      this.cropperZoomInBtn.style.opacity = "1";
    }
  }
}

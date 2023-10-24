import {
  ImageFormats,
  ImageMimeType,
  Filters,
  FiltersState,
  CropperExtended,
  LoadingState,
  ZoomButtonsState,
  BrushSizeAction,
  CreateDOMElementParams
} from './types/imageEditor.types';

import { canvasRGBA } from 'stackblur-canvas'

/**
 * SVG icons
 * @type {Object}
 */
import icons from "../assets/icons";

/**
 * Class that generates ImageEditor and inits it in DOM
 */
export default class ImageEditor {

  private static instanceRef: ImageEditor;

  static getInstance(): undefined | ImageEditor {
    return ImageEditor.instanceRef;
  }

  static create(DOMContainers: HTMLDivElement[], imageFile: File, isMobile: boolean) {
    ImageEditor.instanceRef = new ImageEditor(
      DOMContainers, imageFile, isMobile
    )
  }

  static reset(imageFile: File) { }
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
   * @property {Object} #filtersState - filters values that applies to image preview
   */
  #filtersState: FiltersState = {
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

  loadingScreen!: HTMLDivElement;

  cropperControlsContainer: HTMLDivElement;
  paintingControlsContainer: HTMLDivElement;
  filterControlsContainer: HTMLDivElement;
  rotationControlsContainer: HTMLDivElement;

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
  brushSize!: number

  /**
  * @property {boolean} this.brushIsPressed
  */
  brushIsPressed!: boolean

  /**
   * @property {boolean} this.brushIsEraser - is brush in eraser mode
   */
  brushIsEraser!: boolean;

  /**
* @property {Cropper} cropper - cropper instance
*/
  cropper: CropperExtended

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
  initialCanvas!: HTMLCanvasElement;

  /**
   *
   * @param {Array} DOMContainers - array of DOM elements that will hold ImageEditor components
   * @param {File} imageFile - file object - image
   * @param {boolean} isMobile - true if mobile
   * @this ImageEditor
   */
  private constructor(DOMContainers: HTMLDivElement[], imageFile: File, isMobile: boolean) {
    const [cpContainer, mainContainer, toolContainer] = DOMContainers;

    this.cpContainer = cpContainer;
    this.mainContainer = mainContainer;
    this.toolContainer = toolContainer;

    this.createLoader();
    this.loading(LoadingState.Show);

    this.cropperControlsContainer =
      this.toolContainer.querySelector(".crop-controls") as HTMLDivElement;
    this.paintingControlsContainer =
      this.toolContainer.querySelector(".paint-controls") as HTMLDivElement;
    this.filterControlsContainer =
      this.toolContainer.querySelector(".filters-controls") as HTMLDivElement;
    this.filtersSliders = [];
    this.rotationControlsContainer =
      this.toolContainer.querySelector(".rotation-controls") as HTMLDivElement;

    this.isMobile = isMobile;

    // Set name of file
    this.imageName = imageFile.name.substring(0, imageFile.name.length - 4);

    this.currentImageFormatIndex = 3;
    this.brushSize = 20;

    this.createCropperControls();
    this.createPaintingControls();
    this.createFiltersControls();
    this.createRotationControls();

    // Init cropper
    this.cropper = new CropperExtended(
      this.initImageDOM(URL.createObjectURL(imageFile)),
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

          this.croppedBox = this.cropper.viewBox.querySelector("img") as HTMLImageElement;
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
            this.addCropperEvents();
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

          this.loading(LoadingState.Hide);
        },

        zoom: () => {
          const currentCanvasData = this.cropper.getCanvasData();
          // Enable/disable zoom/move mode
          if (currentCanvasData.width > this.cropper.zoomOutWidth) {
            this.cropper.setDragMode("move");
            this.setZoombuttonsState(ZoomButtonsState.Active);
          } else {

            this.cropper.setCropBoxData({
              height: currentCanvasData.height
            });

            this.cropper.setDragMode("none");

            // Center image if zoom out
            this.cropper.setCanvasData(this.cropper.imageCenter);

            // Fix horizontal shift of image
            let topMargin =
              (this.mainContainer.clientHeight -
                currentCanvasData.height) /
              2;
            this.cropper.setCanvasData({
              top: topMargin,
            });

            this.setZoombuttonsState(ZoomButtonsState.ZoomOut);
          }
        },
      }
    );

    this.initCPDOM();

    this.addPaintingEvents();
    this.addFiltersEvents();
    this.addRotationEvents();

    this.setImageFormat(imageFile.type as ImageMimeType);
  }

  /**
  * @property {Function} createLoader - Create loader element in DOM
  */
  createLoader(): void {
    this.loadingScreen = this.createDOMElement({
      elementName: 'div',
      className: 'loading-screen hide',
      content: icons.loadingSpinner
    });
    this.mainContainer.insertAdjacentElement("beforebegin", this.loadingScreen);
  }

  /**
  * @property {Function} loading - show/hide loader
  * @param {string} action
  */
  loading(action: LoadingState): void {
    if (action === LoadingState.Hide) {
      this.loadingScreen.classList.add(LoadingState.Hide);
      this.cpContainer.style.pointerEvents = "auto";
      this.toolContainer.style.pointerEvents = "auto";
    } else if (action === LoadingState.Show) {
      this.loadingScreen.classList.remove(LoadingState.Hide);
      this.cpContainer.style.pointerEvents = "none";
      this.toolContainer.style.pointerEvents = "none";
    }
  }


  /**
  * @property {Function} createCropperControls - Create all cropper related stuff in DOM
  */
  createCropperControls(): void {
    // Create cropper button in cp
    this.cropModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'crop-mode',
      content: icons.cropMode
    });

    // Create zoom +/- buttons in cp
    this.cropperZoomInBtn = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-zoom-in-btn',
      content: icons.zoomIn
    });

    this.cropperZoomOutBtn = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-zoom-out-btn',
      content: icons.zoomOut
    });

    // Create undo button in cp
    this.cropperUndoBtn = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-undo-btn',
      content: icons.undo
    });

    // Create format button in cp
    this.imageFormatBtn = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-format-btn',
      content: icons.formatJPEG100
    });

    // Create cropper downlad button in cp
    this.cropperDownloadBtn = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-download-btn',
      content: icons.downloadImage
    });

    // Aspect Ratio crop buttons
    const aspectRationButtonsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'aspect-ratio-buttons',
      parentToAppend: this.cropperControlsContainer
    })

    this.cropperBtnAspectSquare = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-square-btn',
      content: icons.aspectRatioSquare,
      parentToAppend: aspectRationButtonsContainer
    });

    this.cropperBtnAspect34 = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-3-4-btn',
      content: icons.aspectRatio34,
      parentToAppend: aspectRationButtonsContainer
    });

    this.cropperBtnAspect43 = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-4-3-btn',
      content: icons.aspectRatio43,
      parentToAppend: aspectRationButtonsContainer
    });

    this.cropperBtnAspect169 = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-16-9-btn',
      content: icons.aspectRatio169,
      parentToAppend: aspectRationButtonsContainer
    });

    this.cropperBtnAspect916 = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-9-16-btn',
      content: icons.aspectRatio916,
      parentToAppend: aspectRationButtonsContainer
    });

    this.cropperBtnAspectFree = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-aspect-free-btn',
      content: icons.aspectRatioFree,
      parentToAppend: aspectRationButtonsContainer
    });

    // Rotation buttons
    const rotationButtonsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'rotation-buttons',
      parentToAppend: this.cropperControlsContainer
    })

    this.cropperBtnRotateRight = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-rotate-right-btn',
      content: icons.rotateRight,
      parentToAppend: rotationButtonsContainer
    });

    this.cropperBtnRotateLeft = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-rotate-left-btn',
      content: icons.rotateLeft,
      parentToAppend: rotationButtonsContainer
    });

    this.cropperBtnReflectX = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-reflect-x-btn',
      content: icons.reflectX,
      parentToAppend: rotationButtonsContainer
    });

    this.cropperBtnReflectY = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-reflect-y-btn',
      content: icons.reflectY,
      parentToAppend: rotationButtonsContainer
    });

    // Apply crop button
    const applyCropButtonContainer = this.createDOMElement({
      elementName: 'div',
      className: 'apply-crop-container',
      parentToAppend: this.cropperControlsContainer
    })

    this.cropperBtnApply = this.createDOMElement({
      elementName: 'button',
      id: 'cropper-apply-btn',
      content: icons.applyCrop,
      parentToAppend: applyCropButtonContainer
    });
  }

  /**
 * @property {Function} createPaintingControls - Create all painting stuff in DOM
 */
  createPaintingControls(): void {
    // Create paint button in cp
    this.paintModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'paint-mode',
      content: icons.paintingMode
    });

    const paintingToolsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'painting-tools',
      parentToAppend: this.paintingControlsContainer
    })

    // Color picker
    this.colorPicker = this.createDOMElement({
      elementName: 'input',
      id: 'color-picker',
      parentToAppend: paintingToolsContainer,
      attributes: { type: 'color' }
    });

    // Brush size options
    const brushSizeSettingsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'brush-size-settings',
      parentToAppend: paintingToolsContainer
    });

    this.decreaseBrushSize = this.createDOMElement({
      elementName: 'button',
      id: 'decrease-brush',
      parentToAppend: brushSizeSettingsContainer,
      content: icons.brushDecrease
    });

    this.brushSizeEl = this.createDOMElement({
      elementName: 'span',
      id: 'size-brush',
      parentToAppend: brushSizeSettingsContainer,
    });

    this.brushSizeEl.textContent = this.brushSize.toString();

    this.increaseBrushSize = this.createDOMElement({
      elementName: 'button',
      id: 'increase-brush',
      parentToAppend: brushSizeSettingsContainer,
      content: icons.brushIncrease
    });

    // Brush mode options
    this.brushModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'painting-brush',
      parentToAppend: paintingToolsContainer,
      content: icons.pencil
    });

    this.eraserModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'eraser-brush',
      parentToAppend:
        paintingToolsContainer,
      content: icons.eraser
    });

    this.blurModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'blur-brush',
      parentToAppend: paintingToolsContainer,
      content: icons.blurTool
    });

    // Apply/clear painting options
    const paintingApplyButtonsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'painting-apply-container',
      parentToAppend:
        paintingToolsContainer
    });

    this.applyPaintingCanvasBtn = this.createDOMElement({
      elementName: 'button',
      id: 'apply-drawing-canvas',
      parentToAppend: paintingApplyButtonsContainer,
      content: icons.paintApply
    });

    this.clearPaintingCanvasBtn = this.createDOMElement({
      elementName: 'button',
      id: 'clear-drawing-canvas',
      parentToAppend: paintingApplyButtonsContainer,
      content: icons.paintClean
    });
  }

  /**
  * @property {Function} createFiltersControls - Create all filters stuff in DOM
  */
  createFiltersControls(): void {
    // Create filters button in cp
    this.filtersModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'filters-mode',
      content: icons.filtersMode
    });

    // Create filters controls in DOM
    // Left Col
    const filtersLeftColumnContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filters-left-col',
      parentToAppend: this.filterControlsContainer
    });

    // Brightness
    const brightnessSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersLeftColumnContainer
    });

    const brightnessSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: brightnessSliderContainer,
      content: icons.filterBrightness,
      attributes: { for: 'brightness' }
    });

    const brightnessSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: brightnessSliderContainer,
      id: 'brightness',
      attributes: { type: 'range', value: '100', min: '0', max: '200' }
    });

    this.filtersSliders.push(brightnessSliderInput);

    // Contrast
    const contrastSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersLeftColumnContainer
    });

    const contrastSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: contrastSliderContainer,
      content: icons.filterContrast,
      attributes: { for: 'contrast' }
    });

    const contrastSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: contrastSliderContainer,
      id: 'contrast',
      attributes: { type: 'range', value: '100', min: '0', max: '200' }
    });

    this.filtersSliders.push(contrastSliderInput);

    // Saturation
    const saturationSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersLeftColumnContainer
    });

    const saturationSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: saturationSliderContainer,
      content: icons.filterSaturation,
      attributes: { for: 'saturation' }
    });

    const saturationSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: saturationSliderContainer,
      id: 'saturation',
      attributes: { type: 'range', value: '100', min: '0', max: '200' }
    });

    this.filtersSliders.push(saturationSliderInput);

    // Right Col
    const filtersRightColumnContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filters-right-col',
      parentToAppend: this.filterControlsContainer
    });

    // Inversion
    const inversionSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersRightColumnContainer
    });

    const inversionSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: inversionSliderContainer,
      content: icons.filterInversion,
      attributes: { for: 'inversion' }
    });

    const inversionSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: inversionSliderContainer,
      id: 'inversion',
      attributes: { type: 'range', value: '0', min: '0', max: '100' }
    });

    this.filtersSliders.push(inversionSliderInput);

    // Blur
    const blurSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersRightColumnContainer
    });

    const blurSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: blurSliderContainer,
      content: icons.filterBlur,
      attributes: { for: 'blur' }
    });

    const blurSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: blurSliderContainer,
      id: 'blur',
      attributes: { type: 'range', value: '0', min: '0', max: '20' }
    });

    this.filtersSliders.push(blurSliderInput);

    // Hue
    const hueSliderContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filter-range-slider',
      parentToAppend: filtersRightColumnContainer
    });

    const hueSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: hueSliderContainer,
      content: icons.filterHue,
      attributes: { for: 'hue' }
    });

    const hueSliderInput = this.createDOMElement({
      elementName: 'input',
      parentToAppend: hueSliderContainer,
      id: 'hue',
      attributes: { type: 'range', value: '0', min: '0', max: '360' }
    });

    this.filtersSliders.push(hueSliderInput);


    // Filters Apply/Reset buttons
    const filtersApplyButtonsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'filters-apply-reset',
      parentToAppend: this.filterControlsContainer
    });

    this.resetFiltersBtn = this.createDOMElement({
      elementName: 'button',
      id: 'reset-filters',
      parentToAppend: filtersApplyButtonsContainer, content: icons.filtersReset
    });

    this.applyFiltersBtn = this.createDOMElement({
      elementName: 'button',
      id: 'apply-filters',
      parentToAppend: filtersApplyButtonsContainer,
      content: icons.filtersApply
    });
  }

  /**
* @property {Function} createRotationControls - Create all rotation stuff in DOM
*/
  createRotationControls(): void {
    // Create rotation button in cp
    this.rotationModeBtn = this.createDOMElement({
      elementName: 'button',
      id: 'rotation-mode',
      content: icons.rotationMode
    });

    const rotationSliderContainer = this.createDOMElement({ elementName: 'div', className: 'rotation-slider-container', parentToAppend: this.rotationControlsContainer });

    const rotationSliderLabel = this.createDOMElement({
      elementName: 'label',
      parentToAppend: rotationSliderContainer,
      attributes: { for: 'rotation-slider' }
    });

    this.imageRotationValue = this.createDOMElement({
      elementName: 'span',
      id: 'rotation-value',
      content: '0',
      parentToAppend: rotationSliderLabel
    });

    const rotationSliderElementsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'slider-elements',
      parentToAppend: rotationSliderContainer
    });

    this.imageRotationSlider = this.createDOMElement({
      elementName: 'input',
      id: 'rotation-slider',
      parentToAppend: rotationSliderElementsContainer,
      attributes: { type: 'range', step: '0.1', value: '0', min: '-180', max: '180' }
    });

    const rotationSliderRulerImageContainer = this.createDOMElement({
      elementName: 'div',
      parentToAppend: rotationSliderElementsContainer,
      content: icons.rotationRuler
    });

    const rotationSliderButtonsContainer = this.createDOMElement({
      elementName: 'div',
      className: 'rotation-slider-buttons',
      parentToAppend: this.rotationControlsContainer
    });

    this.imageRotationSliderReset = this.createDOMElement({
      elementName: 'button',
      id: 'reset-rotation-btn',
      content: icons.rotationReset,
      parentToAppend: rotationSliderButtonsContainer
    });

    this.imageRotationSliderApply = this.createDOMElement({
      elementName: 'button',
      id: 'apply-rotation-btn',
      content: icons.rotationApply,
      parentToAppend: rotationSliderButtonsContainer
    });
  }


  /**
 * @property {Function} initImageDOM - creates image element from provided Blob URL
 * @param {string} blob - blob URL of image 
 * @returns {HTMLElement} - img element for Cropper
 */
  initImageDOM(blob: string): HTMLImageElement {
    this.mainContainer.innerHTML = "";
    const imageContainer = this.createDOMElement({
      elementName: 'div',
      className: 'image-container',
      parentToAppend:
        this.mainContainer
    });

    const imageElement = this.createDOMElement({
      elementName: 'img',
      className: 'image-element',
      parentToAppend: imageContainer,
      attributes: { src: blob }
    });

    // Set aspect ratio of imageContainer and init aspectRatio
    imageElement.onload = () => {
      const aspectRatio =
        imageElement.naturalWidth / imageElement.naturalHeight;

      // Set asp-ratio of container
      imageContainer.style.aspectRatio = `${aspectRatio} / 1`;
    };

    return imageElement;
  }

  /**
  * @property {Function} initCPDOM - create and append control panet (top panel) elements in DOM
  */
  initCPDOM(): void {
    // Add inner container
    const inner = this.createDOMElement({
      elementName: 'div',
      className: 'inner-container',
      parentToAppend: this.cpContainer
    });

    // Add tools buttons
    const toolbox = this.createDOMElement({
      elementName: 'div',
      className: 'cp-toolbox',
      parentToAppend: inner
    });

    toolbox.append(this.cropModeBtn);
    toolbox.append(this.paintModeBtn);
    toolbox.append(this.filtersModeBtn);
    toolbox.append(this.rotationModeBtn);

    // Add zoom buttons
    const zoomButtons = this.createDOMElement({
      elementName: 'div',
      className: 'cp-zoom-buttons',
      parentToAppend: inner
    });

    zoomButtons.append(this.cropperZoomInBtn);
    zoomButtons.append(this.cropperZoomOutBtn);

    // Add undo button
    const undoContainer = this.createDOMElement({
      elementName: 'div',
      className: 'cp-undo-container',
      parentToAppend: inner
    })

    undoContainer.append(this.cropperUndoBtn);

    // Add upload/download buttons
    const uploadDownloadBtns = this.createDOMElement({
      elementName: 'div',
      className: 'upload-download-buttons',
      parentToAppend: inner
    });

    // Create new upload btn
    this.uploadNewImgBtn = this.createDOMElement({
      elementName: 'label',
      className: 'upload-btn-top',
      content: icons.uploadNewImage,
      attributes: { for: 'upload-input' }
    });

    uploadDownloadBtns.append(this.imageFormatBtn);
    uploadDownloadBtns.append(this.cropperDownloadBtn);
    uploadDownloadBtns.append(this.uploadNewImgBtn);
  }

  /**
  * @property {Function} createDOMElement - create DOM HTML Elements with given params
  */
  createDOMElement<tagName extends keyof HTMLElementTagNameMap>(params: CreateDOMElementParams<tagName>): HTMLElementTagNameMap[tagName] {
    const element = document.createElement<tagName>(params.elementName);

    if (params.id) {
      element.id = params.id;
    }

    if (params.className) {
      element.className = params.className;
    }

    if (params.content) {
      element.innerHTML = params.content;
    }

    if (params.parentToAppend) {
      params.parentToAppend.appendChild(element);
    }

    if (params.attributes) {
      for (const [name, value] of Object.entries(params.attributes)) {
        element.setAttribute(name, value);
      }
    }

    return element;
  }

  /**
 * @property {Function} addCropperEvents - Assign event listeners to crop stuff
 */
  addCropperEvents(): void {
    this.cropperZoomInBtn.addEventListener("click", () => {
      this.cropper.zoom(0.1);
    });

    this.cropperZoomOutBtn.addEventListener("click", () => {
      this.cropper.zoom(-0.1);
    });

    this.cropperUndoBtn.addEventListener("click", () => {
      this.undoChange();
    });

    this.imageFormatBtn.addEventListener("click", () => {
      this.updateImageFormat();
    });

    this.cropperDownloadBtn.addEventListener("click", () => {
      this.downloadImage();
    });

    this.cropperBtnAspectSquare.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1);
    });

    this.cropperBtnAspect34.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1.333333);
    });

    this.cropperBtnAspect43.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(0.75);
    });
    this.cropperBtnAspect169.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(0.5625);
    });
    this.cropperBtnAspect916.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1.777777);
    });
    this.cropperBtnAspectFree.addEventListener("click", () => {
      if (this.cropper.cropped) {
        this.cropper.clear();
      } else {
        this.cropper.options.autoCropArea = 1;
        this.cropper.crop();
        this.cropper.setAspectRatio(0);
      }
    });

    this.cropperBtnRotateRight.addEventListener("click", () => {
      this.cropper.clear();
      this.cropper.rotate(90);
      this.applyChange();
    });

    this.cropperBtnRotateLeft.addEventListener("click", () => {
      this.cropper.clear();
      this.cropper.rotate(-90);
      this.applyChange();
    });

    this.cropperBtnReflectX.addEventListener("click", () => {
      this.cropper.scaleX(this.cropper.getImageData().scaleX === -1 ? 1 : -1);
      this.applyChange();
    });

    this.cropperBtnReflectY.addEventListener("click", () => {
      this.cropper.scaleY(this.cropper.getImageData().scaleY === -1 ? 1 : -1);
      this.applyChange();
    });

    this.cropperBtnApply.addEventListener("click", () => {
      this.applyChange();
    });
  }

  /**
 * @property {Function} addPaintingEvents - Assign event listeners to paint stuff
 */
  addPaintingEvents(): void {
    this.colorPicker.addEventListener(
      "change",
      (e) => (this.brushColor = (e.target as HTMLInputElement).value)
    );

    this.increaseBrushSize.addEventListener("click", () => {
      this.changeBrushSize(BrushSizeAction.Increase);
    });

    this.decreaseBrushSize.addEventListener("click", () => {
      this.changeBrushSize(BrushSizeAction.Decrease);
    });

    this.brushModeBtn.addEventListener("click", () => {
      if (this.blurCanvas) {
        this.applyBlurCanvas();
      }

      this.brushIsEraser = false;
    });

    this.eraserModeBtn.addEventListener("click", () => {
      if (this.blurCanvas) {
        this.applyBlurCanvas();
      }

      this.brushIsEraser = true;
    });

    this.blurModeBtn.addEventListener("click", () => {
      this.brushIsEraser = false;
      this.createBlurCanvas();

      if (this.paintingCanvas) {
        this.paintingCanvas
          .getContext("2d")
          ?.clearRect(0, 0, this.paintingCanvas.width, this.paintingCanvas.height);
      }

    });

    this.clearPaintingCanvasBtn.addEventListener("click", () => {
      if (this.blurCanvas) {
        this.clearBlurCanvas();
        this.createBlurCanvas();
      }

      if (this.paintingCanvas) {
        this.paintingCanvas
          .getContext("2d")
          ?.clearRect(0, 0, this.paintingCanvas.width, this.paintingCanvas.height);
      }
    });

    this.applyPaintingCanvasBtn.addEventListener("click", () => {
      this.applyPaintingCanvas();
    });
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
   * @property {Function} addFiltersEvents - Adds events on filter elements in DOM
   */
  addFiltersEvents(): void {
    this.filtersSliders.forEach((filterRange) => {
      filterRange.addEventListener("input", (e) => {
        const currentElementId = (e.target as HTMLInputElement).id as Filters;

        if (currentElementId in Filters) {
          this.#filtersState[currentElementId] = Number((e.target as HTMLInputElement).value);
        }

        this.applyFilters(this.previewImage);
        this.applyFilters(this.croppedBox);
      });
    });

    this.resetFiltersBtn.addEventListener("click", () => {
      this.resetFilters();
    });

    this.applyFiltersBtn.addEventListener("click", () => {
      this.applyChange(true);
    });
  }


  /**
  * @property {Function} addRotationEvents - Adds events on rotation-related DOM elements
  */
  addRotationEvents(): void {
    this.imageRotationSlider.addEventListener("input", (e) => {
      if (!this.cropper.cropped) {
        this.cropper.options.autoCropArea = 0.75;
        this.cropper.setAspectRatio(0);
      }

      this.cropper.rotateTo(Number((e.target as HTMLInputElement).value));
      this.imageRotationValue.textContent = (e.target as HTMLInputElement).value;
      this.cropper.crop();
    });

    this.imageRotationSliderReset.addEventListener("click", () => {
      this.resetRotation();
    });

    this.imageRotationSliderApply.addEventListener("click", () => {
      this.applyRotation();
    });
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
    this.imageRotationValue.textContent = '0';
    this.cropper.rotateTo(0);
    this.imageRotationSlider.value = '0';
    this.cropper.clear();
  }

  /**
   * @property {Function} applyFilters - apply values from #filtersState object as styles to DOM element
   * @param {HTMLElement} - DOM element, img, to apply filters as styles
   * @returns {string} - string with filters properties to apply on canvas element
   */
  applyFilters(element?: HTMLImageElement): string {

    if (element) {
      element.style.filter = `brightness(${this.#filtersState.brightness}%)contrast(${this.#filtersState.contrast}%)saturate(${this.#filtersState.saturation}%)invert(${this.#filtersState.inversion}%) blur(${this.#filtersState.blur}px)hue-rotate(${this.#filtersState.hue}deg)`;
    }

    return `brightness(${this.#filtersState.brightness}%)contrast(${this.#filtersState.contrast}%)saturate(${this.#filtersState.saturation}%)invert(${this.#filtersState.inversion}%) hue-rotate(${this.#filtersState.hue}deg)`;
  }


  /**
   * @property {Function} resetFilters - resets #filtersState object values to initial, reset filters styles of this.previewImage and this.croppedBox
   */
  resetFilters(): void {
    this.filtersSliders.forEach((filterRange) => {
      if (
        filterRange.id === Filters.brightness ||
        filterRange.id === Filters.saturation ||
        filterRange.id === Filters.contrast
      ) {
        filterRange.value = '100';
        this.#filtersState[filterRange.id] = 100;
      } else if (
        filterRange.id === Filters.inversion ||
        filterRange.id === Filters.blur ||
        filterRange.id === Filters.hue
      ) {
        filterRange.value = '0';
        this.#filtersState[filterRange.id] = 0;
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
      this.cropperUndoBtn.style.opacity = '0.5';
    } else {
      this.cropperUndoBtn.disabled = false;
      this.cropperUndoBtn.style.opacity = '1';
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
            this.loading(LoadingState.Hide);
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
    this.loading(LoadingState.Show);

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
        this.#filtersState.blur * 3
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
    this.loading(LoadingState.Show);
    if (this.#cropperHistory.length === 1) {
      this.canvasReplace(this.initialCanvas);
      this.setUndoBtn();
      this.resetFilters();
    } else if (this.#cropperHistory.length === 2) {
      this.#cropperHistory.pop();
      this.canvasReplace(this.initialCanvas);
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
      console.log(type);

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
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;

    ctx.filter = this.applyFilters();

    canvasRGBA(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      this.#filtersState.blur * 3
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
    paintingCanvas.style.zIndex = '1';
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
        this.drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        this.drawLine(ctx, this.brushColor, this.brushSize, x as number, y as number, x2, y2);

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
        this.drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        this.drawLine(ctx, this.brushColor, this.brushSize, x as number, y as number, x2, y2);

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
    let offScreenCtx = offScreenCanvas.getContext("2d") as CanvasRenderingContext2D;

    this.offScreenCanvas = offScreenCanvas;

    // Position canvas on top of painting canvas
    blurCanvas.style.position = "absolute";
    blurCanvas.style.left = `${this.cropper.getCanvasData().left}px`;
    blurCanvas.style.top = `${this.cropper.getCanvasData().top}px`;
    blurCanvas.style.zIndex = '3';
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
      mergedCtx.drawImage(this.paintingCanvas, 0, 0, merged.width, merged.height);

      // Save painting progress
      this.drawBackCanvas = document.createElement("canvas");
      const drawBackCtx = this.drawBackCanvas.getContext("2d") as CanvasRenderingContext2D;
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

      this.drawCircle(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x2, y2);
      this.drawLine(
        blurCtx,
        "rgba(0, 0, 0, 0.05)",
        this.brushSize,
        x,
        y,
        x2,
        y2
      );

      this.drawCircle(offScreenCtx, undefined, this.brushSize, x, y);
      this.drawLine(offScreenCtx, undefined, this.brushSize, x, y, x2, y2);

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

      this.drawCircle(blurCtx, "rgba(0, 0, 0, 0.05)", this.brushSize, x2, y2);
      this.drawLine(
        blurCtx,
        "rgba(0, 0, 0, 0.05)",
        this.brushSize,
        x,
        y,
        x2,
        y2
      );

      this.drawCircle(offScreenCtx, undefined, this.brushSize, x, y);
      this.drawLine(offScreenCtx, undefined, this.brushSize, x, y, x2, y2);

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
      let paintingCanvasCtx = this.paintingCanvas.getContext("2d") as CanvasRenderingContext2D;

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

  // Drawing methods

  /**
  * @property {Function} drawCircle - draw circle on canvas
  * @param {CanvasRenderingContex2d} ctx - context to draw on
  * @param {string} color - HEX value of current brush color
  * @param {number} size - size of circle to draw
  * @param {number} x - x-coordinates of circle 
  * @param {number} y - y-coordinates of circle 
  */
  drawCircle(
    ctx: CanvasRenderingContext2D,
    color: string | undefined,
    size: number,
    x: number,
    y: number
  ): void {

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    if (color) {
      ctx.fillStyle = color;
    }
    ctx.closePath();
    ctx.fill();

  }

  /**
  * @property {Function} drawLine - draw line between two positions on canvas
  * @param {CanvasRenderingContex2d} ctx - context to draw on
  * @param {string} color - HEX value of current brush color
  * @param {number} size - size of circle to draw
  * @param {number} x1 - x-coordinates of start
  * @param {number} y1 - y-coordinates of start 
  * @param {number} x2 - x-coordinates of end
  * @param {number} y2 - y-coordinates of end 
  */
  drawLine(
    ctx: CanvasRenderingContext2D,
    color: string | undefined,
    size: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (color) {
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size * 2;
    ctx.stroke();
  }

  /**
 * @property {Function} initBrushCursor - on desktop init brush circle cursor instead of regular arrow
 * @param {HTMLElement} canvas - current painting canvas
 * @param {boolean} state - init or remove custom cursor
 */
  initBrushCursor(canvas: HTMLCanvasElement, state: boolean): void {
    if (state) {
      canvas.addEventListener("mouseenter", () => {
        this.brushCursor = this.createDOMElement({
          elementName: 'div',
          className: 'paint-brush-cursor'
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
    this.loading(LoadingState.Show);
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
      this.cropperZoomOutBtn.style.opacity = '0.5';
    } else if (state === ZoomButtonsState.Paint) {
      this.cropperZoomOutBtn.style.opacity = '0.5';
      this.cropperZoomInBtn.style.opacity = '0.5';
    } else if (state === ZoomButtonsState.Active) {
      this.cropperZoomOutBtn.style.opacity = '1';
      this.cropperZoomInBtn.style.opacity = '1';
    }
  }
}

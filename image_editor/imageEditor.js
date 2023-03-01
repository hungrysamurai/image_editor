import Cropper from "./assets/cropperjs/cropper.esm.js";
import * as StackBlur from "./assets/stackblur/stackblur-es.min.js";
import icons from "./assets/icons.js";

export default class ImageEditor {
  constructor(DOMContainers, imageFile) {
    const [cpContainer, mainContainer, toolContainer] = DOMContainers;

    this.cpContainer = cpContainer;
    this.mainContainer = mainContainer;
    this.toolContainer = toolContainer;

    this.croppedBox;
    this.previewImage;

    this.paintingCanvas;
    this.blurCanvas;
    this.offScreenCanvas;
    this.drawBackCanvas;

    // Set name of file
    this.imageName = imageFile.name.substring(0, imageFile.name.length - 4);

    this.imageFormats = [
      ["image/jpeg", 0.3, icons.formatJPEG30],
      ["image/jpeg", 0.5, icons.formatJPEG50],
      ["image/jpeg", 0.8, icons.formatJPEG80],
      ["image/jpeg", 1.0, icons.formatJPEG100],
      ["image/png", 1, icons.formatPNG],
      ["image/webp", 1, icons.formatWEBP],
    ];

    this.currentImageFormatIndex = 3;

    this.filtersState = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      inversion: 0,
      blur: 0,
      hue: 0,
    };

    this.initialCanvas;
    this.cropperHistory = [];
    this.croppersCounter = 0;

    this.createLoader();
    this.loading("show");

    this.createCropperControls();
    this.createPaintingControls();
    this.createFiltersControls();
    this.createRotationControls();

    // Init cropper
    this.cropper = new Cropper(
      this.initImageDOM(URL.createObjectURL(imageFile)),
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

          this.croppedBox = this.cropper.viewBox.querySelector("img");
          this.applyFilters(this.croppedBox);

          // Capture initial canvas width to disable moving if fully zoomed out
          this.cropper.zoomOutWidth = this.cropper.canvasData.width;
          this.cropper.imageCenter = this.cropper.getCanvasData();

          // Fix horizontal shift of image
          let topMargin =
            (this.mainContainer.clientHeight -
              this.cropper.getCanvasData().height) /
            2;

          this.cropper.setCanvasData({
            top: topMargin,
          });

          // Add cropper events if it is first initialiization
          this.croppersCounter++;
          if (this.croppersCounter === 1) {
            this.addCropperEvents();
          }

          // Save initial canvas in history
          if (!this.initialCanvas) {
            this.initialCanvas = this.cropper.getCroppedCanvas({
              minWidth: 256,
              minHeight: 256,
              maxWidth: 4096,
              maxHeight: 4096,
            });

            this.cropperHistory.push(this.initialCanvas);
            this.setUndoBtn();
          }

          this.loading("hide");
        },

        zoom: () => {
          // Enable/disable zoom/move mode
          if (this.cropper.canvasData.width > this.cropper.zoomOutWidth) {
            this.cropper.setDragMode("move");
            this.setZoombuttonsState("both-active");
          } else {
            this.cropper.setDragMode("none");

            // Center image if zoom out
            this.cropper.setCanvasData(this.cropper.imageCenter);

            // Fix horizontal shift of image
            let topMargin =
              (this.mainContainer.clientHeight -
                this.cropper.getCanvasData().height) /
              2;
            this.cropper.setCanvasData({
              top: topMargin,
            });

            this.setZoombuttonsState("full-out");
          }
        },
      }
    );

    this.initCPDOM();

    this.addPaintingEvents();
    this.addFiltersEvents();
    this.addRotationEvents();

    this.setImageFormat(imageFile.type);
  }
  initCPDOM() {
    // Add inner container
    const inner = document.createElement("div");
    inner.classList.add("inner-container");

    // Add tools buttons
    const toolbox = document.createElement("div");
    toolbox.classList.add("cp-toolbox");

    toolbox.append(this.cropModeBtn);
    toolbox.append(this.paintModeBtn);
    toolbox.append(this.filtersModeBtn);
    toolbox.append(this.rotationModeBtn);

    inner.append(toolbox);

    // Add zoom buttons
    const zoomButtons = document.createElement("div");
    zoomButtons.classList.add("cp-zoom-buttons");

    zoomButtons.append(this.cropperZoomInBtn);
    zoomButtons.append(this.cropperZoomOutBtn);

    inner.append(zoomButtons);

    // Add undo button
    const undoContainer = document.createElement("div");
    undoContainer.classList.add("cp-undo-container");

    undoContainer.append(this.cropperUndoBtn);

    inner.append(undoContainer);

    // Add upload/download buttons
    const uploadDownloadBtns = document.createElement("div");
    uploadDownloadBtns.classList.add("upload-download-buttons");

    // Create new upload btn
    this.uploadNewImgBtn = document.createElement("label");
    this.uploadNewImgBtn.className = "upload-btn-top";
    this.uploadNewImgBtn.setAttribute("for", "upload-input");
    this.uploadNewImgBtn.innerHTML = icons.uploadNewImage;

    uploadDownloadBtns.append(this.imageFormatBtn);
    uploadDownloadBtns.append(this.cropperDownloadBtn);
    uploadDownloadBtns.append(this.uploadNewImgBtn);

    inner.append(uploadDownloadBtns);

    this.cpContainer.append(inner);
  }

  initImageDOM(blob) {
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");

    const imageElement = document.createElement("img");
    imageElement.classList.add("image-element");
    imageElement.src = blob;

    // Set aspect ratio of imageContainer and init aspectRatio
    imageElement.onload = () => {
      const aspectRatio =
        imageElement.naturalWidth / imageElement.naturalHeight;

      // Set asp-ratio of container
      imageContainer.style.aspectRatio = `${aspectRatio} / 1`;
    };

    imageContainer.appendChild(imageElement);
    this.mainContainer.innerHTML = "";
    this.mainContainer.appendChild(imageContainer);

    return imageElement;
  }

  // Create all crop stuff in DOM
  createCropperControls() {
    // Get cropper container in tool panel
    this.cropperControlsContainer =
      this.toolContainer.querySelector(".crop-controls");

    // Create cropper button in cp
    this.cropModeBtn = document.createElement("button");
    this.cropModeBtn.id = "crop-mode";
    this.cropModeBtn.innerHTML = icons.cropMode;

    // Create zoom +/- buttons in cp
    this.cropperZoomInBtn = document.createElement("button");
    this.cropperZoomInBtn.id = "cropper-zoom-in-btn";
    this.cropperZoomInBtn.innerHTML = icons.zoomIn;

    this.cropperZoomOutBtn = document.createElement("button");
    this.cropperZoomOutBtn.id = "cropper-zoom-out-btn";
    this.cropperZoomOutBtn.innerHTML = icons.zoomOut;

    // Create undo button in cp
    this.cropperUndoBtn = document.createElement("button");
    this.cropperUndoBtn.id = "cropper-undo-btn";
    this.cropperUndoBtn.innerHTML = icons.undo;

    // Create format button in cp
    this.imageFormatBtn = document.createElement("button");
    this.imageFormatBtn.id = "cropper-format-btn";
    this.imageFormatBtn.innerHTML = icons.formatJPEG100;

    // Create cropper downlad button in cp
    this.cropperDownloadBtn = document.createElement("button");
    this.cropperDownloadBtn.id = "cropper-download-btn";
    this.cropperDownloadBtn.innerHTML = icons.downloadImage;

    // Add buttons to tool container
    this.cropperControlsContainer.innerHTML = `
    <div class="aspect-ratio-buttons">
      <button id="cropper-aspect-square-btn">
      ${icons.aspectRatioSquare}
      </button>
      <button id="cropper-aspect-3-4-btn">
      ${icons.aspectRatio34}
      </button>
      <button id="cropper-aspect-4-3-btn">
      ${icons.aspectRatio43}
      </button>
      <button id="cropper-aspect-16-9-btn">
      ${icons.aspectRatio169}
      </button>
      <button id="cropper-aspect-9-16-btn">
      ${icons.aspectRatio916}
      </button>
      <button id="cropper-aspect-free-btn">
      ${icons.aspectRatioFree}
      </button>
      </div>

    <div class="rotation-buttons">
      <button id="cropper-rotate-right-btn">
      ${icons.rotateRight}
      </button>
      <button id="cropper-rotate-left-btn">
      ${icons.rotateLeft}
      </button>
      <button id="cropper-reflect-y-btn">
      ${icons.reflectY}
      </button>
      <button id="cropper-reflect-x-btn">
      ${icons.reflectX}
      </button>
    </div>

    <div class="apply-crop-container">
      <button id="cropper-apply-btn">
      ${icons.applyCrop}
      </button>
    </div>
    `;

    // Init buttons
    this.cropperBtnAspectSquare = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-square-btn"
    );
    this.cropperBtnAspect34 = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-3-4-btn"
    );
    this.cropperBtnAspect43 = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-4-3-btn"
    );
    this.cropperBtnAspect169 = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-16-9-btn"
    );
    this.cropperBtnAspect916 = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-9-16-btn"
    );
    this.cropperBtnAspectFree = this.cropperControlsContainer.querySelector(
      "#cropper-aspect-free-btn"
    );
    this.cropperBtnRotateRight = this.cropperControlsContainer.querySelector(
      "#cropper-rotate-right-btn"
    );
    this.cropperBtnRotateLeft = this.cropperControlsContainer.querySelector(
      "#cropper-rotate-left-btn"
    );
    this.cropperBtnReflectX = this.cropperControlsContainer.querySelector(
      "#cropper-reflect-x-btn"
    );
    this.cropperBtnReflectY = this.cropperControlsContainer.querySelector(
      "#cropper-reflect-y-btn"
    );
    this.cropperBtnApply =
      this.cropperControlsContainer.querySelector("#cropper-apply-btn");
  }

  // Assign event listeners to crop stuff
  addCropperEvents() {
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
        this.cropper.options.autoCropArea = 0.75;
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
      this.cropper.scaleX(this.cropper.imageData.scaleX === -1 ? 1 : -1);
      this.applyChange();
    });

    this.cropperBtnReflectY.addEventListener("click", () => {
      this.cropper.scaleY(this.cropper.imageData.scaleY === -1 ? 1 : -1);
      this.applyChange();
    });

    this.cropperBtnApply.addEventListener("click", () => {
      this.applyChange();
    });
  }

  // Create all painting stuff in DOM
  createPaintingControls() {
    // Get painting container in tool panel
    this.paintingControlsContainer =
      this.toolContainer.querySelector(".paint-controls");

    // Create paint button in cp
    this.paintModeBtn = document.createElement("button");
    this.paintModeBtn.id = "paint-mode";
    this.paintModeBtn.innerHTML = icons.paintingMode;

    // Add buttons to tool container
    this.paintingControlsContainer.innerHTML = ` 
    <div class="painting-tools">
    <input type="color" name="" id="color-picker" />
    <div class="brush-size-settings">
         <button id="decrease-brush">
     ${icons.brushDecrease}
     </button>
     <span id="size-brush">20</span>
     <button id="increase-brush">
     ${icons.brushIncrease}
     </button>
     </div>
     <button id="painting-brush">
     ${icons.pencil}
     </button>
     <button id="eraser-brush">
     ${icons.eraser}
     </button>
     <button id="blur-brush">
     ${icons.blurTool}
     </button>
    </div>

    <div class="painting-apply-container">
    <button id="apply-drawing-canvas">
    ${icons.paintApply}
    </button>
    <button id="clear-drawing-canvas">
    ${icons.paintClean}
    </button>
    </div>
      `;

    // Init buttons
    this.colorPicker =
      this.paintingControlsContainer.querySelector("#color-picker");
    this.increaseBrushSize =
      this.paintingControlsContainer.querySelector("#increase-brush");
    this.decreaseBrushSize =
      this.paintingControlsContainer.querySelector("#decrease-brush");
    this.brushSizeEl =
      this.paintingControlsContainer.querySelector("#size-brush");
    this.brushModeBtn =
      this.paintingControlsContainer.querySelector("#painting-brush");
    this.eraserModeBtn =
      this.paintingControlsContainer.querySelector("#eraser-brush");
    this.blurModeBtn =
      this.paintingControlsContainer.querySelector("#blur-brush");

    this.applyPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#apply-drawing-canvas"
    );
    this.clearPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#clear-drawing-canvas"
    );
  }

  // Assign event listeners to painting stuff
  addPaintingEvents() {
    // Some global variables for painting
    this.brushColor;
    this.brushSize;
    this.brushIsPressed;
    this.brushIsEraser;

    this.brushSizeEl.textContent = this.brushSize;

    this.colorPicker.addEventListener(
      "change",
      (e) => (this.brushColor = e.target.value)
    );

    this.increaseBrushSize.addEventListener("click", () => {
      this.brushSize += 5;
      if (this.brushSize > 50) {
        this.brushSize = 50;
      }
      this.brushSizeEl.textContent = this.brushSize;
    });

    this.decreaseBrushSize.addEventListener("click", () => {
      this.brushSize -= 5;
      if (this.brushSize < 5) {
        this.brushSize = 5;
      }
      this.brushSizeEl.textContent = this.brushSize;
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

      this.paintingCanvas
        .getContext("2d")
        .clearRect(0, 0, this.paintingCanvas.width, this.paintingCanvas.height);
    });

    this.clearPaintingCanvasBtn.addEventListener("click", () => {
      if (this.blurCanvas) {
        this.clearBlurCanvas();
        this.createBlurCanvas();
      }

      this.paintingCanvas
        .getContext("2d")
        .clearRect(0, 0, this.paintingCanvas.width, this.paintingCanvas.height);
    });

    this.applyPaintingCanvasBtn.addEventListener("click", () => {
      this.applyPaintingCanvas();
    });
  }

  // Create all filters stuff in DOM
  createFiltersControls() {
    // Get container in filters panel
    this.filterControlsContainer =
      this.toolContainer.querySelector(".filters-controls");

    // Create filters button in cp
    this.filtersModeBtn = document.createElement("button");
    this.filtersModeBtn.id = "filters-mode";
    this.filtersModeBtn.innerHTML = icons.filtersMode;

    // Create filters controls in DOM
    this.filterControlsContainer.innerHTML = `
    <div class="filters-left-col">

      <div class="filter-range-slider">
        <label for="brightness">${icons.filterBrightness}</label>
        <input type="range" value="100" min="0" max="200" id="brightness" />
      </div>
      <div class="filter-range-slider">
        <label for="contrast">${icons.filterContrast}</label>
        <input type="range" value="100" min="0" max="200" id="contrast" />
      </div>
      <div class="filter-range-slider">
      <label for="saturation">${icons.filterSaturation}</label>
        <input type="range" value="100" min="0" max="200" id="saturation" />
        </div>
      </div>

        <div class="filters-right-col">

      <div class="filter-range-slider">
        <label for="inversion">${icons.filterInversion}</label>
        <input type="range" value="0" min="0" max="100" id="inversion" />
      </div>
      <div class="filter-range-slider">
         <label for="blur">${icons.filterBlur}</label>
        <input type="range" value="0" min="0" max="20" id="blur" />
      </div>
      <div class="filter-range-slider">
         <label for="hue">${icons.filterHue}</label>
        <input type="range" value="0" min="0" max="360" id="hue" />
      </div>
      
      </div>

      <div class="filters-apply-reset">
      <button id="reset-filters">
      ${icons.filtersReset}
      </button>
      <button id="apply-filters">
      ${icons.filtersApply}
      </button>
      </div>
    `;

    // Init filters sliders
    this.filtersSliders = this.filterControlsContainer.querySelectorAll(
      ".filter-range-slider input"
    );
    this.resetFiltersBtn =
      this.filterControlsContainer.querySelector("#reset-filters");
    this.applyFiltersBtn =
      this.filterControlsContainer.querySelector("#apply-filters");
  }

  addFiltersEvents() {
    this.filtersSliders.forEach((filterRange) => {
      filterRange.addEventListener("input", (e) => {
        this.filtersState[e.target.id] = e.target.value;

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

  createRotationControls() {
    // Get rotation container in tool panel
    this.rotationControlsContainer =
      this.toolContainer.querySelector(".rotation-controls");

    // Create rotation button in cp
    this.rotationModeBtn = document.createElement("button");
    this.rotationModeBtn.id = "rotation-mode";
    this.rotationModeBtn.innerHTML = icons.rotationMode;

    this.rotationControlsContainer.innerHTML = `
    <div class="rotation-slider-container">
      <label for="rotation-slider"><span id="rotation-value">0</span>°</label>
      <div class="slider-elements">
      <input type="range" value="0" min="-180" max="180" id="rotation-slider" />
      ${icons.rotationRuler}
      </div>
      </div>
      <div class="rotation-slider-buttons">
      <button id="reset-rotation-btn">${icons.rotationReset}</button>
      <button id="apply-rotation-btn">${icons.rotationApply}</button>
      </div>
      `;

    // Init
    this.imageRotationSlider =
      this.rotationControlsContainer.querySelector("#rotation-slider");
    this.imageRotationSliderReset =
      this.rotationControlsContainer.querySelector("#reset-rotation-btn");
    this.imageRotationSliderApply =
      this.rotationControlsContainer.querySelector("#apply-rotation-btn");
    this.imageRotationValue =
      this.rotationControlsContainer.querySelector("#rotation-value");
  }

  addRotationEvents() {
    this.imageRotationSlider.addEventListener("input", (e) => {
      if (!this.cropper.cropped) {
        this.cropper.options.autoCropArea = 0.5;
        this.cropper.setAspectRatio(0);
      }
      this.cropper.rotateTo(e.target.value);
      this.imageRotationValue.textContent = e.target.value;
      this.cropper.crop();
    });

    this.imageRotationSliderReset.addEventListener("click", () => {
      this.resetRotation();
    });

    this.imageRotationSliderApply.addEventListener("click", () => {
      this.applyRotation();
    });
  }

  applyRotation() {
    if (!this.cropper.cropped) {
      this.cropper.crop();
      this.cropper.setAspectRatio(0);
    }
    this.applyChange();

    this.resetRotation();
  }

  resetRotation() {
    this.imageRotationValue.textContent = 0;
    this.cropper.rotateTo(0);
    this.imageRotationSlider.value = 0;
    this.cropper.clear();
  }

  applyFilters(element) {
    let filtersString = `brightness(${this.filtersState.brightness}%)contrast(${this.filtersState.contrast}%)saturate(${this.filtersState.saturation}%)invert(${this.filtersState.inversion}%) blur(${this.filtersState.blur}px)hue-rotate(${this.filtersState.hue}deg)`;

    if (element) {
      element.style.filter = filtersString;
    }
    // return filtersString;

    return `brightness(${this.filtersState.brightness}%)contrast(${this.filtersState.contrast}%)saturate(${this.filtersState.saturation}%)invert(${this.filtersState.inversion}%) hue-rotate(${this.filtersState.hue}deg)`;
  }

  resetFilters() {
    this.filtersSliders.forEach((filterRange) => {
      if (
        filterRange.id === "brightness" ||
        filterRange.id === "saturation" ||
        filterRange.id === "contrast"
      ) {
        filterRange.value = 100;
        this.filtersState[filterRange.id] = 100;
      } else {
        filterRange.value = 0;
        this.filtersState[filterRange.id] = 0;
      }
    });
    this.applyFilters(this.previewImage);
    this.applyFilters(this.croppedBox);
  }

  setUndoBtn(paintMode) {
    if (this.cropperHistory.length === 1 || paintMode) {
      this.cropperUndoBtn.disabled = true;
      this.cropperUndoBtn.style.opacity = 0.5;
    } else {
      this.cropperUndoBtn.disabled = false;
      this.cropperUndoBtn.style.opacity = 1;
    }
  }

  saveCanvas(canvas) {
    this.cropperHistory.push(canvas);
    this.setUndoBtn();
  }

  loadCanvas() {
    this.cropperHistory.pop();
    let previous = this.cropperHistory[this.cropperHistory.length - 1];
    this.setUndoBtn();

    return previous;
  }

  canvasReplace(canvas) {
    canvas.toBlob(
      (blob) => {
        let newImage = new Image();
        let url = URL.createObjectURL(blob);
        newImage.src = url;

        newImage.onload = () => {
          this.loading("hide");
        };

        this.cropper.replace(newImage.src);
      },
      this.imageFormats[this.currentImageFormatIndex][0],
      this.imageFormats[this.currentImageFormatIndex][1]
    );
  }

  createLoader() {
    this.loadingScreen = document.createElement("div");
    this.loadingScreen.classList.add("loading-screen");
    this.loadingScreen.classList.add("hide");

    this.loadingScreen.innerHTML = icons.loadingSpinner;
    this.mainContainer.insertAdjacentElement("beforebegin", this.loadingScreen);
  }

  loading(action) {
    if (action === "hide") {
      this.loadingScreen.classList.add("hide");
      this.cpContainer.style.pointerEvents = "auto";
      this.toolContainer.style.pointerEvents = "auto";
    } else if (action === "show") {
      this.loadingScreen.classList.remove("hide");
      this.cpContainer.style.pointerEvents = "none";
      this.toolContainer.style.pointerEvents = "none";
    }
  }

  applyChange(filters) {
    this.loading("show");

    let nextCanvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
    });

    if (filters) {
      // Draw all current filters on canvas
      let ctx = nextCanvas.getContext("2d");
      ctx.filter = this.applyFilters();

      StackBlur.canvasRGBA(
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

  undoChange() {
    this.loading("show");
    if (this.cropperHistory.length === 1) {
      this.canvasReplace(this.initialCanvas);
      this.setUndoBtn();
      this.resetFilters();
    } else if (this.cropperHistory.length === 2) {
      this.cropperHistory.pop();
      this.canvasReplace(this.initialCanvas);
      this.setUndoBtn();
      this.resetFilters();
    } else {
      let previous = this.loadCanvas();
      this.canvasReplace(previous);
      this.resetFilters();
    }
  }

  setImageFormat(type) {
    let index;

    this.imageFormats.forEach((format, i) => {
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
      this.imageFormats[this.currentImageFormatIndex][2];
  }

  updateImageFormat() {
    this.currentImageFormatIndex++;
    if (this.currentImageFormatIndex > this.imageFormats.length - 1) {
      this.currentImageFormatIndex = 0;
    }

    this.imageFormatBtn.innerHTML =
      this.imageFormats[this.currentImageFormatIndex][2];
  }

  downloadImage() {
    let canvas = this.cropper.getCroppedCanvas();
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.filter = this.applyFilters();

    StackBlur.canvasRGBA(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      this.filtersState.blur * 3
    );

    ctx.drawImage(canvas, 0, 0);

    let result = canvas.toDataURL(
      this.imageFormats[this.currentImageFormatIndex][0],
      this.imageFormats[this.currentImageFormatIndex][1]
    );

    const createEl = document.createElement("a");
    createEl.href = result;
    createEl.download = this.imageName;
    createEl.click();
    createEl.remove();
  }

  createPaintingCanvas() {
    // Create canvas element
    let paintingCanvas = document.createElement("canvas");

    // Set current painting canvas
    this.paintingCanvas = paintingCanvas;

    // Set canvas element styles
    paintingCanvas.style.position = "absolute";
    paintingCanvas.style.left = `${this.cropper.getCanvasData().left}px`;
    paintingCanvas.style.top = `${this.cropper.getCanvasData().top}px`;
    paintingCanvas.style.zIndex = 1;
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
    this.brushSizeEl.textContent = this.brushSize;
    this.colorPicker.value = this.brushColor;
    this.brushIsPressed = false;
    this.brushIsEraser = false;

    let x;
    let y;

    paintingCanvas.addEventListener("mousedown", (e) => {
      this.brushIsPressed = true;

      x = e.offsetX;
      y = e.offsetY;
    });

    paintingCanvas.addEventListener("touchstart", (e) => {
      this.brushIsPressed = true;

      let rect = e.target.getBoundingClientRect();
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
      if (this.brushIsPressed) {
        if (this.brushIsEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        const x2 = e.offsetX;
        const y2 = e.offsetY;
        this.drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        this.drawLine(ctx, this.brushColor, this.brushSize, x, y, x2, y2);

        x = x2;
        y = y2;
        ctx.globalCompositeOperation = "source-over";
      }
    });

    paintingCanvas.addEventListener("touchmove", (e) => {
      if (this.brushIsPressed) {
        if (this.brushIsEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        let rect = e.target.getBoundingClientRect();
        let tx = e.targetTouches[0].pageX - rect.left;
        let ty = e.targetTouches[0].pageY - rect.top;

        const x2 = tx;
        const y2 = ty;
        this.drawCircle(ctx, this.brushColor, this.brushSize, x2, y2);
        this.drawLine(ctx, this.brushColor, this.brushSize, x, y, x2, y2);

        x = x2;
        y = y2;
        ctx.globalCompositeOperation = "source-over";
      }
    });

    this.initBrushCursor(this.paintingCanvas, true);
  }

  initBrushCursor(canvas, state) {
    if (state) {
      canvas.addEventListener("mouseenter", () => {
        this.brushCursor = document.createElement("div");
        this.brushCursor.style.width = `${this.brushSize * 2}px`;
        this.brushCursor.style.height = `${this.brushSize * 2}px`;
        this.brushCursor.classList.add("paint-brush-cursor");
        this.mainContainer.insertAdjacentElement(
          "beforebegin",
          this.brushCursor
        );
      });

      canvas.addEventListener("mousemove", (e) => {
        const mouseY = e.clientY - this.brushSize;
        const mouseX = e.clientX - this.brushSize;
        this.brushCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      });

      canvas.addEventListener("mouseleave", () => {
        this.brushCursor.remove();
        this.brushCursor = undefined;
      });
    } else {
      if (this.brushCursor) {
        this.brushCursor.remove();
      }
      this.brushCursor = undefined;
    }
  }

  createBlurCanvas() {
    if (this.blurCanvas) return;

    let blurCanvas = document.createElement("canvas");
    let blurCtx = blurCanvas.getContext("2d");

    this.blurCanvas = blurCanvas;

    let offScreenCanvas = document.createElement("canvas");
    let offScreenCtx = offScreenCanvas.getContext("2d");

    this.offScreenCanvas = offScreenCanvas;

    // Position canvas on top of painting canvas
    blurCanvas.style.position = "absolute";
    blurCanvas.style.left = `${this.cropper.getCanvasData().left}px`;
    blurCanvas.style.top = `${this.cropper.getCanvasData().top}px`;
    blurCanvas.style.zIndex = 3;
    blurCanvas.style.overflow = "hidden";

    blurCanvas.height = this.previewImage.height;
    blurCanvas.width = this.previewImage.width;

    offScreenCanvas.height = this.previewImage.height;
    offScreenCanvas.width = this.previewImage.width;

    let blurPressed = false;
    let x, y;

    // Get base canvas
    let baseCanvas = this.cropper.clear().getCroppedCanvas();

    // Merge base with painting canvas
    let merged = document.createElement("canvas");
    const mergedCtx = merged.getContext("2d");
    merged.width = baseCanvas.width;
    merged.height = baseCanvas.height;

    mergedCtx.drawImage(baseCanvas, 0, 0);
    mergedCtx.drawImage(this.paintingCanvas, 0, 0, merged.width, merged.height);

    // Save painting progress
    this.drawBackCanvas = document.createElement("canvas");
    const drawBackCtx = this.drawBackCanvas.getContext("2d");
    this.drawBackCanvas.width = this.paintingCanvas.width;
    this.drawBackCanvas.height = this.paintingCanvas.height;
    drawBackCtx.drawImage(
      this.paintingCanvas,
      0,
      0,
      this.drawBackCanvas.width,
      this.drawBackCanvas.height
    );

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

      let rect = e.target.getBoundingClientRect();
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

      let rect = e.target.getBoundingClientRect();
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
      offScreenCtx.filter = "blur(10px)";

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
      offScreenCtx.filter = "blur(10px)";

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

    this.initBrushCursor(this.blurCanvas, true);
  }

  applyBlurCanvas() {
    if (!this.blurCanvas) return;

    let paintingCanvasCtx = this.paintingCanvas.getContext("2d");

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

  clearBlurCanvas() {
    this.blurCanvas.remove();
    this.blurCanvas = undefined;

    this.offScreenCanvas.remove();
    this.offScreenCanvas = undefined;

    this.drawBackCanvas.remove();
    this.drawBackCanvas = undefined;
  }

  // Drawing methods
  drawCircle(ctx, color, size, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    if (color) {
      ctx.fillStyle = color;
    }
    ctx.closePath();
    ctx.fill();
  }

  drawLine(ctx, color, size, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (color) {
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size * 2;
    ctx.stroke();
  }

  // Save painting canvas and merge it with base canvas
  applyPaintingCanvas() {
    this.loading("show");
    this.applyBlurCanvas();
    this.cropper.enable();

    // Get base canvas
    let baseCanvas = this.cropper.clear().getCroppedCanvas();

    // Merge base with painting canvas
    let merged = document.createElement("canvas");
    merged.width = baseCanvas.width;
    merged.height = baseCanvas.height;

    const ctx = merged.getContext("2d");

    ctx.drawImage(baseCanvas, 0, 0);
    ctx.drawImage(this.paintingCanvas, 0, 0, merged.width, merged.height);

    // Save merged canvas
    this.saveCanvas(merged);
    this.canvasReplace(merged);

    // Destroy current painting canvas
    this.paintingCanvas.remove();
    this.paintingCanvas = undefined;
    this.setZoombuttonsState("both-active");
  }

  setZoombuttonsState(state) {
    if (state === "full-out") {
      this.cropperZoomOutBtn.style.opacity = 0.5;
    } else if (state === "paint") {
      this.cropperZoomOutBtn.style.opacity = 0.5;
      this.cropperZoomInBtn.style.opacity = 0.5;
    } else if (state === "both-active") {
      this.cropperZoomOutBtn.style.opacity = 1;
      this.cropperZoomInBtn.style.opacity = 1;
    }
  }
}

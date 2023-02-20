import Cropper from "./cropperjs/cropper.esm.js";
import icons from "./icons.js";

class ImageEditor {
  constructor(DOMContainers, imageFile) {
    const [cpContainer, mainContainer, toolContainer] = DOMContainers;

    this.cpContainer = cpContainer;
    this.mainContainer = mainContainer;
    this.toolContainer = toolContainer;

    this.croppedBox;
    this.previewImage;

    this.paintingCanvas;

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
            this.setZoombuttonsState('both-active');
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

            this.setZoombuttonsState('full-out');
          }
        },
      }
    );

    this.initCPDOM();

    this.addPaintingEvents();
    this.addFiltersEvents();
    this.addRotationEvents();
  }

  initCPDOM() {
    // Add inner container
    const inner = document.createElement("div");
    inner.classList.add("inner-container");

    // Add tools buttons
    const toolbox = document.createElement("div");
    toolbox.classList.add("cp-toolbox");

    toolbox.append(this.cropperTogglerBtn);
    toolbox.append(this.createPaintingCanvasBtn);
    toolbox.append(this.filtersToggleBtn);
    toolbox.append(this.rotationToggleBtn);

    inner.append(toolbox);

    // Add zoom buttons
    const zoomButtons = document.createElement("div");
    zoomButtons.classList.add("cp-zoom-buttons");

    zoomButtons.append(this.cropperZoomInBtn);
    zoomButtons.append(this.cropperZoomOutBtn);

    inner.append(zoomButtons);

    // Add undo buttons
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
    this.cropperTogglerBtn = document.createElement("button");
    this.cropperTogglerBtn.id = "crop-mode";
    this.cropperTogglerBtn.innerHTML = icons.cropMode;

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
      this.cropper.rotate(90);
      this.applyChange();
    });

    this.cropperBtnRotateLeft.addEventListener("click", () => {
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
    this.createPaintingCanvasBtn = document.createElement("button");
    this.createPaintingCanvasBtn.id = "paint-mode";
    this.createPaintingCanvasBtn.innerHTML = icons.paintingMode;

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

    this.applyPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#apply-drawing-canvas"
    );
    this.clearPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#clear-drawing-canvas"
    );
  }

  // Assign event listeners to painting stuff
  addPaintingEvents() {
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
    this.filtersToggleBtn = document.createElement("button");
    this.filtersToggleBtn.id = "filters-mode";
    this.filtersToggleBtn.innerHTML = icons.filtersMode;

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
    this.rotationToggleBtn = document.createElement("button");
    this.rotationToggleBtn.id = "rotation-mode";
    this.rotationToggleBtn.innerHTML = icons.rotationMode;

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
      this.cropper.options.autoCropArea = 0.5;
      this.cropper.setAspectRatio(0);

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
    return filtersString;
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
      "image/jpeg",
      1
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
    } else if (action === "show") {
      this.loadingScreen.classList.remove("hide");
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
    // this.loadingScreen(false);
    if (filters) {
      // Draw all current filters on canvas
      let ctx = nextCanvas.getContext("2d");
      ctx.filter = this.applyFilters();
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

  downloadImage() {
    let canvas = this.cropper.getCroppedCanvas();
    const ctx = canvas.getContext("2d");

    ctx.filter = this.applyFilters();

    ctx.drawImage(canvas, 0, 0);

    let result = canvas.toDataURL("image/jpeg");

    const createEl = document.createElement("a");
    createEl.href = result;
    createEl.download = "download-this-canvas";
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

    // Init brush
    let color = "#000000";
    let size = 10;

    let isPressed = false;
    let isEraser = false;
    let x;
    let y;

    this.colorPicker.value = color;
    this.brushSizeEl.textContent = size;

    // Add brush events
    this.brushModeBtn.addEventListener("click", () => {
      isEraser = false;
    });

    this.eraserModeBtn.addEventListener("click", () => {
      isEraser = true;
    });

    this.colorPicker.addEventListener(
      "change",
      (e) => (color = e.target.value)
    );

    this.increaseBrushSize.addEventListener("click", () => {
      size += 5;
      if (size > 50) {
        size = 50;
      }
      this.brushSizeEl.textContent = size;
    });

    this.decreaseBrushSize.addEventListener("click", () => {
      size -= 5;
      if (size < 5) {
        size = 5;
      }
      this.brushSizeEl.textContent = size;
    });

    this.clearPaintingCanvasBtn.addEventListener("click", () => {
      ctx.clearRect(0, 0, paintingCanvas.width, paintingCanvas.height);
    });

    paintingCanvas.addEventListener("mousedown", (e) => {
      isPressed = true;

      x = e.offsetX;
      y = e.offsetY;
    });

    paintingCanvas.addEventListener("touchstart", (e) => {
      isPressed = true;

      let rect = e.target.getBoundingClientRect();
      let tx = e.targetTouches[0].pageX - rect.left;
      let ty = e.targetTouches[0].pageY - rect.top;

      x = tx;
      y = ty;
    });

    paintingCanvas.addEventListener("mouseup", () => {
      isPressed = false;

      x = undefined;
      y = undefined;
    });

    paintingCanvas.addEventListener("touchend", () => {
      isPressed = false;

      x = undefined;
      y = undefined;
    });

    paintingCanvas.addEventListener("mousemove", (e) => {
      if (isPressed) {
        if (isEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        const x2 = e.offsetX;
        const y2 = e.offsetY;
        this.drawCircle(ctx, color, size, x2, y2);
        this.drawLine(ctx, color, size, x, y, x2, y2);

        x = x2;
        y = y2;
      }
    });

    paintingCanvas.addEventListener("touchmove", (e) => {
      if (isPressed) {
        if (isEraser) {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        let rect = e.target.getBoundingClientRect();
        let tx = e.targetTouches[0].pageX - rect.left;
        let ty = e.targetTouches[0].pageY - rect.top;

        const x2 = tx;
        const y2 = ty;
        this.drawCircle(ctx, color, size, x2, y2);
        this.drawLine(ctx, color, size, x, y, x2, y2);

        x = x2;
        y = y2;
      }
    });
  }

  // Drawing methods
  drawCircle(ctx, color, size, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawLine(ctx, color, size, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 2;
    ctx.stroke();
  }

  // Save painting canvas and merge it with base canvas
  applyPaintingCanvas() {
    this.loading("show");

    this.cropper.enable();

    // Get base canvas
    let baseCanvas = this.cropper.clear().getCroppedCanvas();

    // Draw all current filters on base canvas
    let baseCtx = baseCanvas.getContext("2d");
    baseCtx.filter = this.applyFilters();
    baseCtx.drawImage(baseCanvas, 0, 0);

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

    // Reset filters after merging
    this.resetFilters();

    // Destroy current painting canvas
    this.paintingCanvas.remove();
    this.paintingCanvas = undefined;
    this.setZoombuttonsState('both-active');
  }

  setZoombuttonsState(state) {
    if (state === 'full-out') {
      this.cropperZoomOutBtn.style.opacity = 0.5;
    } else if (state === 'paint') {
      this.cropperZoomOutBtn.style.opacity = 0.5;
      this.cropperZoomInBtn.style.opacity = 0.5;
    } else if (state === 'both-active') {
      this.cropperZoomOutBtn.style.opacity = 1;
      this.cropperZoomInBtn.style.opacity = 1;
    }
  }
}

// DOM elements
const cpContainer = document.querySelector(".control-panel-container");
const mainContainer = document.querySelector(".main-container");
const toolContainer = document.querySelector(".tool-container");

const DOMContainers = [cpContainer, mainContainer, toolContainer];

const toolContainers = [
  toolContainer.querySelector(".crop-controls"),
  toolContainer.querySelector(".paint-controls"),
  toolContainer.querySelector(".filters-controls"),
  toolContainer.querySelector(".rotation-controls"),
];

// Upload input element
const uploadInput = document.querySelector("#upload-input");

// Drag'n'Drop input element
const dropArea = document.querySelector(".drag-area");

// Init
let imageEditor;
let currentMode;

// Event listeners

// Button upload
uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length !== 1) return;
  if (!e.target.files[0].type.startsWith("image/")) return;

  uploadFile(e.target.files[0]);
});

// Drag'n'Drop upload
["dragenter", "dragover", "dragleave", "drop"].forEach((e) => {
  dropArea.addEventListener(e, preventDefaults);
});

// Highlight/unhighlight area
["dragenter", "dragover"].forEach((e) => {
  dropArea.addEventListener(e, () => {
    dropArea.classList.add("active");
  });
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("active");
});

dropArea.addEventListener("drop", (e) => {
  let dt = e.dataTransfer;
  let file = dt.files[0];

  if (!file.type.startsWith("image/")) return;

  uploadFile(file);
});

// Functions
function uploadFile(file) {
  // Initially delete upload button
  if (document.querySelector(".placeholder-button")) {
    document.querySelector(".placeholder-button").remove();
  }

  mainContainer.innerHTML = "";
  cpContainer.innerHTML = "";

  imageEditor = new ImageEditor(DOMContainers, file);

  initEvents();
  activateMode("crop");
}

function initEvents() {
  imageEditor.cropperTogglerBtn.addEventListener("click", () => {
    activateMode("crop");
  });

  imageEditor.createPaintingCanvasBtn.addEventListener("click", () => {
    activateMode("paint");
  });

  imageEditor.filtersToggleBtn.addEventListener("click", () => {
    activateMode("filters");
  });

  imageEditor.rotationToggleBtn.addEventListener("click", () => {
    activateMode("rotation");
  });

  imageEditor.applyPaintingCanvasBtn.addEventListener("click", () => {
    activateMode("crop");
  });

  console.log(imageEditor);
}

function activateMode(mode) {
  if (currentMode === mode) return;

  if (currentMode === "paint" && imageEditor.paintingCanvas) {
    imageEditor.cropper.enable();
    imageEditor.paintingCanvas.remove();
    imageEditor.paintingCanvas = undefined;
    imageEditor.setZoombuttonsState('both-active');
  }

  if (currentMode === "filters") {
    imageEditor.resetFilters();
  }

  if (currentMode === "rotation") {
    imageEditor.resetRotation();
  }

  currentMode = mode;

  // Activate proper panel in DOM
  toolContainers.forEach((container) => {
    container.classList.add("hide");
  });
  document.querySelector(`.${mode}-controls`).classList.remove("hide");

  // Update icons in cp
  imageEditor.cpContainer
    .querySelectorAll(".cp-toolbox button")
    .forEach((button) => {
      button.classList.remove("active");
      if (button.id === `${mode}-mode`) {
        button.classList.add("active");
      }
    });

  if (mode === "paint") {
    imageEditor.cropper.clear();
    imageEditor.cropper.disable();
    imageEditor.createPaintingCanvas();
    imageEditor.setZoombuttonsState('paint');
    imageEditor.setUndoBtn(true);
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

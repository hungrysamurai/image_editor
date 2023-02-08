import Cropper from "./cropperjs/cropper.esm.js";

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


    this.createCropperControls();
    this.createInitialPaintingControls();
    this.createFiltersControls();

    this.blob = URL.createObjectURL(imageFile);
    this.croppersCounter = 0;

    // Init cropper
    this.initialCanvas;
    this.cropperHistory = [];

    this.cropper = new Cropper(this.initImageDOM(this.blob), {
      viewMode: 2,
      dragMode: "none",
      modal: true,
      background: false,
      autoCrop: false,
      ready: () => {

        // Apply filters to current preview image
        this.previewImage = this.cropper.image;
        this.applyFilters(this.previewImage);

        this.croppedBox = this.cropper.viewBox.querySelector("img");
        this.applyFilters(this.croppedBox);

        // Capture initial canvas width to disable moving if fully zoomed out
        this.cropper.zoomOutWidth = this.cropper.canvasData.width;

        // Fix horizontal shift of image
        let topMargin =
          (this.mainContainer.clientHeight - this.cropper.getCanvasData().height) /
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
      },

      zoom: () => {

        // Enable/disable zoom/move mode
        if (
          Math.round(this.cropper.canvasData.width) !==
          this.mainContainer.clientWidth
        ) {
          this.cropper.setDragMode("move");
        } else {
          this.cropper.setDragMode("none");

          // Fix horizontal shift of image
          let topMargin =
            (this.mainContainer.clientHeight -
              this.cropper.getCanvasData().height) /
            2;
          this.cropper.setCanvasData({
            top: topMargin,
          });
        }

        // console.log(this.cropper.getCanvasData());
        // console.log(this.cropper.getData());
      },
    });

    this.initCPDOM();

    this.addFiltersEvents();
    this.addPaintingEvents();
  }

  initCPDOM() {
    this.cpContainer.append(this.cropperTogglerBtn);
    this.cpContainer.append(this.createPaintingCanvasBtn);
    this.cpContainer.append(this.cropperDownloadBtn);
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

  createCropperControls() {

    // Add cropper toggler button to cp
    this.cropperTogglerBtn = document.createElement('button');
    this.cropperTogglerBtn.id = 'cropper-crop-btn';
    this.cropperTogglerBtn.textContent = 'Crop-mode on';

    // Add cropper downlad button to cp
    this.cropperDownloadBtn = document.createElement('button'); this.cropperDownloadBtn.id = 'cropper-download-btn';
    this.cropperDownloadBtn.textContent = 'Download';

    // Add buttons to tool container
    cropperControlsContainer.innerHTML = `
      <button id="cropper-aspect-square-btn">Square</button>
      <button id="cropper-aspect-3-4-btn">3:4</button>
      <button id="cropper-aspect-4-3-btn">4:3</button>
      <button id="cropper-aspect-16-9-btn">16:9</button>
      <button id="cropper-aspect-9-16-btn">9:16</button>
      <button id="cropper-aspect-free-btn">Free Ratio</button>
      <button id="cropper-rotate-right-btn">Rotate Right</button>
      <button id="cropper-rotate-left-btn">Rotate Left</button>
      <button id="cropper-reflect-y-btn">Reflect Y</button>
      <button id="cropper-reflect-x-btn">Reflect X</button>
      <button id="cropper-apply-btn">Apply Crop</button>
      <button id="cropper-undo-btn">Undo</button>
    `;

    // Init buttons
    this.cropperBtnAspectSquare = cropperControlsContainer.querySelector(
      "#cropper-aspect-square-btn"
    );
    this.cropperBtnAspect34 = cropperControlsContainer.querySelector(
      "#cropper-aspect-3-4-btn"
    );
    this.cropperBtnAspect43 = cropperControlsContainer.querySelector(
      "#cropper-aspect-4-3-btn"
    );
    this.cropperBtnAspect169 = cropperControlsContainer.querySelector(
      "#cropper-aspect-16-9-btn"
    );
    this.cropperBtnAspect916 = cropperControlsContainer.querySelector(
      "#cropper-aspect-9-16-btn"
    );
    this.cropperBtnAspectFree = cropperControlsContainer.querySelector(
      "#cropper-aspect-free-btn"
    );
    this.cropperBtnRotateRight = cropperControlsContainer.querySelector(
      "#cropper-rotate-right-btn"
    );
    this.cropperBtnRotateLeft = cropperControlsContainer.querySelector(
      "#cropper-rotate-left-btn"
    );
    this.cropperBtnReflectX = cropperControlsContainer.querySelector(
      "#cropper-reflect-x-btn"
    );
    this.cropperBtnReflectY = cropperControlsContainer.querySelector(
      "#cropper-reflect-y-btn"
    );
    this.cropperBtnApply =
      cropperControlsContainer.querySelector("#cropper-apply-btn");
    this.cropperUndoBtn =
      cropperControlsContainer.querySelector("#cropper-undo-btn");
  }

  createFiltersControls() {
    // Create filters controls in DOM
    filterControlsContainer.innerHTML = `
     <h3>Filters Sliders</h3>
      <div class="filter-range-slider">
        <input type="range" value="100" min="0" max="200" id="brightness" />
        <label for="brightness">Brightness</label>
      </div>
      <div class="filter-range-slider">
        <input type="range" value="100" min="0" max="200" id="contrast" />
        <label for="contrast">Contrast</label>
      </div>
      <div class="filter-range-slider">
        <input type="range" value="100" min="0" max="200" id="saturation" />
        <label for="saturation">Saturation</label>
      </div>
      <div class="filter-range-slider">
        <input type="range" value="0" min="0" max="100" id="inversion" />
        <label for="inversion">Inversion</label>
      </div>
      <div class="filter-range-slider">
        <input type="range" value="0" min="0" max="20" id="blur" />
        <label for="blur">Blur</label>
      </div>
      <div class="filter-range-slider">
        <input type="range" value="0" min="0" max="360" id="hue" />
        <label for="hue">Hue</label>
      </div>
      <button id="reset-filters">Reset Filters</button>
    `;

    // Init filters sliders
    this.filtersSliders = filterControlsContainer.querySelectorAll(
      ".filter-range-slider input"
    );
    this.resetFiltersBtn =
      filterControlsContainer.querySelector("#reset-filters");
  }

  createInitialPaintingControls() {

    // Create painting mode button
    this.createPaintingCanvasBtn = document.createElement('button');
    this.createPaintingCanvasBtn.id = "create-drawing-canvas";
    this.createPaintingCanvasBtn.textContent = 'Create canvas';


    paintingControlsContainer.innerHTML = `
      <div class="painting-buttons">    

        <div id="current-painting-controls"></div>
      
       </div>
    `;

    // Init controls
    this.currentPaintingControls = paintingControlsContainer.querySelector(
      "#current-painting-controls"
    );
  }

  createCurrentPaintingControls() {
    this.currentPaintingControls.innerHTML = ` 
     <button id="remove-drawing-canvas">Remove canvas</button>
        <button id="apply-drawing-canvas">Apply canvas</button>
        <button id="clear-drawing-canvas">Clear canvas</button>
        
        <button id="painting-brush">Brush</button>
      <button id="eraser-brush">Eraser</button>
      <button id="decrease-brush">-</button>
      <span id="size-brush">20</span>
      <button id="increase-brush">+</button>
      <input type="color" name="" id="color-picker" />
      `;

    this.applyPaintingCanvasBtn = this.currentPaintingControls.querySelector(
      "#apply-drawing-canvas"
    );
    this.removePaintingCanvasBtn = this.currentPaintingControls.querySelector(
      "#remove-drawing-canvas"
    );
    this.clearPaintingCanvasBtn = this.currentPaintingControls.querySelector(
      "#clear-drawing-canvas"
    );
    this.colorPicker =
      this.currentPaintingControls.querySelector("#color-picker");
    this.increaseBrushSize =
      this.currentPaintingControls.querySelector("#increase-brush");
    this.decreaseBrushSize =
      this.currentPaintingControls.querySelector("#decrease-brush");
    this.brushSizeEl =
      this.currentPaintingControls.querySelector("#size-brush");
    this.brushModeBtn =
      this.currentPaintingControls.querySelector("#painting-brush");
    this.eraserModeBtn =
      this.currentPaintingControls.querySelector("#eraser-brush");

    this.removePaintingCanvasBtn.addEventListener("click", () => {
      if (!this.paintingCanvas) return;
      this.paintingCanvas.remove();
      this.paintingCanvas = undefined;
      this.removeCurrentPaintingControls();
      this.cropper.enable();
    });

    this.applyPaintingCanvasBtn.addEventListener("click", () => {
      this.applyPaintingCanvas();
    });
  }

  removeCurrentPaintingControls() {
    this.currentPaintingControls.innerHTML = "";
  }

  applyFilters(element) {
    let filtersString = `
  brightness(${this.filtersState.brightness}%) 
  contrast(${this.filtersState.contrast}%) 
  saturate(${this.filtersState.saturation}%) 
  invert(${this.filtersState.inversion}%) 
  blur(${this.filtersState.blur}px) 
  hue-rotate(${this.filtersState.hue}deg)
      `;
    if (element) {
      element.style.filter = filtersString;
    }

    return filtersString;
  }

  setUndoBtn() {
    if (this.cropperHistory.length === 1) {
      this.cropperUndoBtn.disabled = true;
    } else {
      this.cropperUndoBtn.disabled = false;
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

  applyCrop() {
    let nextCanvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
    });

    this.saveCanvas(nextCanvas);
    this.canvasReplace(nextCanvas);
  }

  undoCrop() {
    if (this.cropperHistory.length === 1) {
      this.canvasReplace(this.initialCanvas);
      this.setUndoBtn();
    } else if (this.cropperHistory.length === 2) {
      this.cropperHistory.pop();
      this.canvasReplace(this.initialCanvas);
      this.setUndoBtn();
    } else {
      let previous = this.loadCanvas();
      this.canvasReplace(previous);
    }
  }

  canvasReplace(canvas) {
    canvas.toBlob(
      (blob) => {
        let newImage = new Image();
        let url = URL.createObjectURL(blob);
        newImage.src = url;

        // newImage.onload = () => {
        //   URL.revokeObjectURL(url);
        // };

        this.cropper.replace(newImage.src);
      },
      "image/jpeg",
      1
    );
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
    if (this.paintingCanvas) return;

    // Disable cropper
    this.cropper.clear();
    this.cropper.disable();

    // Create canvas element
    let paintingCanvas = document.createElement("canvas");

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

    // Set current painting canvas
    this.paintingCanvas = paintingCanvas;

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

    paintingCanvas.addEventListener("mouseup", (e) => {
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
    if (!this.paintingCanvas) return;

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
    this.removeCurrentPaintingControls();
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
  }

  addPaintingEvents() {
    this.createPaintingCanvasBtn.addEventListener("click", () => {
      this.createCurrentPaintingControls();
      this.createPaintingCanvas();
    });
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

      this.applyFilters(this.previewImage);
      this.applyFilters(this.croppedBox);
    });
  }

  addCropperEvents() {
    this.cropperTogglerBtn.addEventListener("click", () => {
      if (!this.cropper.cropped) {
        this.cropper.crop();
      } else {
        this.cropper.clear();
      }
    });

    this.cropperBtnAspectSquare.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1);
    });

    this.cropperBtnAspect34.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(0.75);
    });

    this.cropperBtnAspect43.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1.333333);
    });
    this.cropperBtnAspect169.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(1.777777);
    });
    this.cropperBtnAspect916.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(0.5625);
    });
    this.cropperBtnAspectFree.addEventListener("click", () => {
      this.cropper.crop();
      this.cropper.setAspectRatio(0);
    });

    this.cropperBtnRotateRight.addEventListener("click", () => {
      this.cropper.rotate(90);
      let previous = this.cropper.getCanvasData();
      this.applyCrop();
    });

    this.cropperBtnRotateLeft.addEventListener("click", () => {
      this.cropper.rotate(-90);
      this.applyCrop();
    });

    this.cropperBtnReflectX.addEventListener("click", () => {
      this.cropper.scaleX(this.cropper.imageData.scaleX === -1 ? 1 : -1);
      this.applyCrop();
    });

    this.cropperBtnReflectY.addEventListener("click", () => {
      this.cropper.scaleY(this.cropper.imageData.scaleY === -1 ? 1 : -1);
      this.applyCrop();
    });

    this.cropperBtnApply.addEventListener("click", () => {
      this.applyCrop();
    });

    this.cropperUndoBtn.addEventListener("click", () => {
      this.undoCrop();
    });

    this.cropperDownloadBtn.addEventListener("click", () => {
      this.downloadImage();
    });
  }
}

// DOM elements
const cpContainer = document.querySelector('.control-panel-container');
const mainContainer = document.querySelector(".main-container");
const toolContainer = document.querySelector('.tool-container');

const DOMContainers = [cpContainer, mainContainer, toolContainer];

const uploadInput = document.querySelector("#upload-input");
const uploadLabelBtn = document.querySelector(".upload-btn");

// Filters panel
const filtersPanel = document.querySelector('.filters-panel')
const filterControlsContainer = filtersPanel.querySelector(".filters-controls");

// Cropper controls container
const cropperControlsContainer = toolContainer.querySelector(".cropper-controls");

// Painting Controls container
const paintingControlsContainer = toolContainer.querySelector(".painting-controls");

let imageEditor;

uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length !== 1) return;

  mainContainer.innerHTML = "";
  imageEditor = new ImageEditor(DOMContainers, e.target.files[0]);
});


// Loading screen
// Return to previous state:
// this.cropper.setCanvasData({
//   top: -2678.298442751011,
//   width: 8636.424696196778,
//   left: -3211.8762591259397,
//   height: 5757.616464131186,
// });
// Add top container

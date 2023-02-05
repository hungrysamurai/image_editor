import Cropper from "./cropperjs/cropper.esm.js";

class ImageEditor {
  constructor(parentContainer, imageFile) {
    this.parentContainer = parentContainer;

    this.aspectRatio;
    this.croppedBox;
    this.previewImage;

    this.filtersState = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      inversion: 0,
      blur: 0,
      hue: 0,
    };
    this.createFiltersControls();

    this.blob = URL.createObjectURL(imageFile);
    this.croppersCounter = 0;

    // Init cropper
    this.createCropperControls();
    this.initialCanvas;
    this.cropperHistory = [];

    this.cropper = new Cropper(this.initImageDOM(this.blob), {
      viewMode: 2,
      dragMode: "none",
      modal: true,
      background: false,
      autoCrop: false,
      ready: () => {
        this.previewImage = this.cropper.image;
        this.applyFilters(this.previewImage);
        this.croppedBox = this.cropper.viewBox.querySelector("img");
        this.applyFilters(this.croppedBox);

        // Capture initial canvas width to disable moving if fully zoomed out
        this.cropper.zoomOutWidth = this.cropper.canvasData.width;

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
        if (this.cropper.canvasData.width !== this.cropper.zoomOutWidth) {
          this.cropper.setDragMode("move");
        } else {
          this.cropper.setDragMode("none");
        }
      },
    });

    this.addFiltersEvents();
  }

  initImageDOM(blob) {
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");

    // const canvasElement = document.createElement("canvas");

    const imageElement = document.createElement("img");
    imageElement.classList.add("image-element");
    imageElement.src = blob;

    // Set aspect ratio of imageContainer and init aspectRatio
    imageElement.onload = () => {
      const aspectRatio =
        imageElement.naturalWidth / imageElement.naturalHeight;

      // Set asp-ratio of container
      imageContainer.style.aspectRatio = `${aspectRatio} / 1`;
      this.aspectRatio = aspectRatio;

      // canvasElement.height = imageContainer.offsetHeight;
      // canvasElement.width = imageContainer.offsetHeight * aspectRatio;

      // const ctx = canvasElement.getContext("2d");
      // ctx.drawImage(
      //   imageElement,
      //   0,
      //   0,
      //   canvasElement.width,
      //   canvasElement.height,
      // );
    };

    // imageContainer.appendChild(canvasElement);
    imageContainer.appendChild(imageElement);
    this.parentContainer.innerHTML = "";
    this.parentContainer.appendChild(imageContainer);

    return imageElement;
  }

  createCropperControls() {
    // Add buttons to DOM
    cropperControlsContainer.innerHTML = `
      <button id="cropper-clear-btn">Crop-mode off</button>
      <button id="cropper-crop-btn">Crop-mode on</button>
      <button id="cropper-disable-btn">Disable</button>
      <button id="cropper-enable-btn">Enable</button>
      <button id="cropper-aspect-square-btn">Square</button>
      <button id="cropper-aspect-3-4-btn">3:4</button>
      <button id="cropper-aspect-4-3-btn">3:4</button>
      <button id="cropper-aspect-16-9-btn">16:9</button>
      <button id="cropper-aspect-9-16-btn">9:16</button>
      <button id="cropper-aspect-free-btn">Free Ratio</button>
      <button id="cropper-rotate-right-btn">Rotate Right</button>
      <button id="cropper-rotate-left-btn">Rotate Left</button>
      <button id="cropper-reflect-y-btn">Reflect Y</button>
      <button id="cropper-reflect-x-btn">Reflect X</button>
      <button id="cropper-apply-btn">Apply Crop</button>
      <button id="cropper-download-btn">Download</button>
      <input type="range" value="0" min="-180" max="180" id="cropper-rotation" />
      <label for="cropper-rotation">Rotation deg</label>
      <button id="cropper-reset-rotation-btn">Reset</button>
      <button id="cropper-undo-btn">Undo</button>
    `;

    // Init buttons
    this.cropperBtnCrop =
      cropperControlsContainer.querySelector("#cropper-crop-btn");
    this.cropperBtnClear =
      cropperControlsContainer.querySelector("#cropper-clear-btn");
    this.cropperBtnApply =
      cropperControlsContainer.querySelector("#cropper-apply-btn");
    this.cropperBtnDownload = cropperControlsContainer.querySelector(
      "#cropper-download-btn"
    );
    this.cropperBtnDisable = cropperControlsContainer.querySelector(
      "#cropper-disable-btn"
    );
    this.cropperBtnEnable = cropperControlsContainer.querySelector(
      "#cropper-enable-btn"
    );
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
    this.cropperRotationSlider =
      cropperControlsContainer.querySelector("#cropper-rotation");
    this.cropperRotationSliderReset = cropperControlsContainer.querySelector(
      "#cropper-reset-rotation-btn"
    );
    this.cropperUndoBtn =
      cropperControlsContainer.querySelector("#cropper-undo-btn");
  }

  createFiltersControls() {
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

    this.filtersSliders = filterControlsContainer.querySelectorAll(
      ".filter-range-slider input"
    );
    this.resetFiltersBtn =
      filterControlsContainer.querySelector("#reset-filters");
  }

  applyFilters(element) {
    element.style.filter = `
  brightness(${this.filtersState.brightness}%) 
  contrast(${this.filtersState.contrast}%) 
  saturate(${this.filtersState.saturation}%) 
  invert(${this.filtersState.inversion}%) 
  blur(${this.filtersState.blur}px) 
  hue-rotate(${this.filtersState.hue}deg)
      `;
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

    this.cropperRotationSlider.value = 0;
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
    this.cropperRotationSlider.value = 0;
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

    ctx.filter = `
      brightness(${this.filtersState.brightness}%) 
      contrast(${this.filtersState.contrast}%) 
      saturate(${this.filtersState.saturation}%) 
      invert(${this.filtersState.inversion}%) 
      blur(${this.filtersState.blur}px) 
      hue-rotate(${this.filtersState.hue}deg)`;

    ctx.drawImage(canvas, 0, 0);

    let result = canvas.toDataURL("image/jpeg");
    const createEl = document.createElement("a");
    createEl.href = result;
    createEl.download = "download-this-canvas";
    createEl.click();
    createEl.remove();
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
    });
  }

  addCropperEvents() {
    this.cropperBtnCrop.addEventListener("click", () => {
      this.cropper.crop();
    });

    this.cropperBtnClear.addEventListener("click", () => {
      this.cropper.clear();
    });

    this.cropperBtnEnable.addEventListener("click", () => {
      this.cropper.enable();
    });

    this.cropperBtnDisable.addEventListener("click", () => {
      this.cropper.disable();
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
    });

    this.cropperBtnRotateLeft.addEventListener("click", () => {
      this.cropper.rotate(-90);
    });

    this.cropperBtnReflectX.addEventListener("click", () => {
      this.cropper.scaleX(this.cropper.imageData.scaleX === -1 ? 1 : -1);
    });

    this.cropperBtnReflectY.addEventListener("click", () => {
      this.cropper.scaleY(this.cropper.imageData.scaleY === -1 ? 1 : -1);
    });

    this.cropperRotationSlider.addEventListener("input", (e) => {
      this.cropper.rotateTo(e.target.value);
    });

    this.cropperRotationSliderReset.addEventListener("click", () => {
      this.cropper.rotateTo(0);
      this.cropperRotationSlider.value = 0;
    });

    this.cropperBtnApply.addEventListener("click", () => {
      this.applyCrop();
    });

    this.cropperUndoBtn.addEventListener("click", () => {
      this.undoCrop();
    });

    this.cropperBtnDownload.addEventListener("click", () => {
      this.downloadImage();
    });
  }
}

// DOM elements
const parentElement = document.querySelector(".main-container");
const uploadInput = document.querySelector("#upload-input");

// Filters controls container
const filterControlsContainer = document.querySelector(".filters-controls");

// Cropper controls container
const cropperControlsContainer = document.querySelector(".cropper-controls");

let imageEditor;

uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length !== 1) return;

  parentElement.innerHTML = "";
  imageEditor = new ImageEditor(parentElement, e.target.files[0]);
});

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

    this.blob = URL.createObjectURL(imageFile);
    this.croppersCounter = 0;

    this.initialCanvas;
    this.cropperHistory = [];

    // Init cropper
    this.cropper = new Cropper(this.initImageDOM(this.blob), {
      viewMode: 2,
      dragMode: "none",
      modal: false,
      background: false,
      autoCrop: false,
      ready: () => {
        this.previewImage = this.cropper.image;
        this.croppedBox = this.cropper.viewBox;

        // Apply filters to preview according to filtersState
        this.applyFilters(this.previewImage);
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

  setUndoBtn() {
    if (this.cropperHistory.length > 1) {
      cropperUndoBtn.disabled = false;
    } else {
      cropperUndoBtn.disabled = true;
    }
  }

  saveCanvas(canvas) {
    this.cropperHistory.push(canvas);
    this.setUndoBtn();
    console.log(this.cropperHistory);
  }

  loadCanvas() {
    let previous = this.cropperHistory.pop();
    this.setUndoBtn();
    console.log(this.cropperHistory);
    return previous;
  }

  applyCrop() {
    let currentCanvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
    });

    this.saveCanvas(currentCanvas);
    this.canvasReplace(currentCanvas);
  }

  undoCrop() {
    if (this.cropperHistory.length === 1) {
      this.canvasReplace(this.initialCanvas);
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

  addFiltersEvents() {
    filtersSliders.forEach((filterRange) => {
      filterRange.addEventListener("input", (e) => {
        this.filtersState[e.target.id] = e.target.value;

        this.applyFilters(this.previewImage);
        this.applyFilters(this.croppedBox);
      });
    });
  }

  addCropperEvents() {
    cropperBtnCrop.addEventListener("click", () => {
      this.cropper.crop();
    });

    cropperBtnClear.addEventListener("click", () => {
      this.cropper.clear();
    });

    cropperBtnEnable.addEventListener("click", () => {
      this.cropper.enable();
    });

    cropperBtnDisable.addEventListener("click", () => {
      this.cropper.disable();
    });

    cropperBtnDestroy.addEventListener("click", () => {
      this.cropper.destroy();
    });

    cropperBtnRotateRight.addEventListener("click", () => {
      this.cropper.rotate(90);
    });

    cropperBtnRotateLeft.addEventListener("click", () => {
      this.cropper.rotate(-90);
    });

    cropperBtnReflectX.addEventListener("click", () => {
      this.cropper.scaleX(this.cropper.imageData.scaleX === -1 ? 1 : -1);
    });

    cropperBtnReflectY.addEventListener("click", () => {
      this.cropper.scaleY(this.cropper.imageData.scaleY === -1 ? 1 : -1);
    });

    cropperRotationSlider.addEventListener("input", (e) => {
      this.cropper.rotateTo(e.target.value);
    });

    cropperBtnApply.addEventListener("click", () => {
      this.applyCrop();
    });

    cropperUndoBtn.addEventListener("click", () => {
      this.undoCrop();
    });

    cropperBtnDownload.addEventListener("click", () => {
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
      // let result = canvas
      //   .toDataURL("image/jpeg")
      // window.location.href = result;

      canvas.toBlob((blob) => {
        let downloadUrl = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "cropper-img.jpg";
        a.click();
      });
    });
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
}

// DOM elements
const parentElement = document.querySelector(".main-container");
const uploadInput = document.querySelector("#upload-input");

// Filters sliders
const filtersSliders = document.querySelectorAll(".filter-range-slider input");

// Cropper operations buttons
const cropperBtnCrop = document.querySelector("#cropper-crop-btn");
const cropperBtnClear = document.querySelector("#cropper-clear-btn");
const cropperBtnApply = document.querySelector("#cropper-apply-btn");
const cropperBtnDownload = document.querySelector("#cropper-download-btn");
const cropperBtnDisable = document.querySelector("#cropper-disable-btn");
const cropperBtnEnable = document.querySelector("#cropper-enable-btn");
const cropperBtnDestroy = document.querySelector("#cropper-destroy-btn");
const cropperBtnRotateRight = document.querySelector(
  "#cropper-rotate-right-btn"
);
const cropperBtnRotateLeft = document.querySelector("#cropper-rotate-left-btn");
const cropperBtnReflectX = document.querySelector("#cropper-reflect-x-btn");
const cropperBtnReflectY = document.querySelector("#cropper-reflect-y-btn");
const cropperRotationSlider = document.querySelector("#cropper-rotation");
const cropperUndoBtn = document.querySelector("#cropper-undo-btn");

let imageEditor;

uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length !== 1) return;

  resetFiltersInputs();
  parentElement.innerHTML = "";

  imageEditor = new ImageEditor(parentElement, e.target.files[0]);
});

function resetFiltersInputs() {
  filtersSliders.forEach((filterRange) => {
    if (
      filterRange.id === "brightness" ||
      filterRange.id === "saturation" ||
      filterRange.id === "contrast"
    ) {
      filterRange.value = 100;
    } else {
      filterRange.value = 0;
    }
  });
}

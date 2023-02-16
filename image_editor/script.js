import Cropper from "./cropperjs/cropper.esm.js";

class ImageEditor {
  constructor(DOMContainers, imageFile) {
    const [cpContainer, mainContainer, toolContainer, filtersPanel] =
      DOMContainers;

    this.cpContainer = cpContainer;
    this.mainContainer = mainContainer;
    this.toolContainer = toolContainer;
    this.filtersPanel = filtersPanel;

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

    this.createCropperControls();
    this.createPaintingControls();
    this.createFiltersControls();

    // Init cropper
    this.cropper = new Cropper(
      this.initImageDOM(URL.createObjectURL(imageFile)),
      {
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
      }
    );

    this.initCPDOM();

    this.addPaintingEvents();
    this.addFiltersEvents();
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
    // this.uploadNewImgBtn.textContent = "Загрузить";
    this.uploadNewImgBtn.innerHTML = `
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.9315 0C26.5853 0 32.0017 5.235 32.3538 11.82C36.6225 12.5917 39.863 16.33 39.863 20.8333C39.863 25.895 35.7721 30 30.7277 30H24.9144V26.6667H30.7277C33.9334 26.6667 36.5411 24.05 36.5411 20.8333C36.5411 15.885 32.0764 14.5567 29.1781 14.6333C29.7162 7.995 25.6668 3.33333 19.9315 3.33333C14.3523 3.33333 10.4076 7.60333 10.6849 14.6333C7.43944 14.445 3.32192 16.1717 3.32192 20.8333C3.32192 24.05 5.92962 26.6667 9.13527 26.6667H14.9486V30H9.13527C4.09094 30 0 25.895 0 20.8333C0 16.33 3.24053 12.5917 7.5092 11.82C7.86132 5.235 13.2777 0 19.9315 0ZM26.4385 21.4612H21.4556V29.7946H18.1337V21.4612H13.1508L19.7947 14.7946L26.4385 21.4612Z" fill="white"/>
</svg>

    `;
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
      this.toolContainer.querySelector(".cropper-controls");

    // Create cropper toggler button
    this.cropperTogglerBtn = document.createElement("button");
    this.cropperTogglerBtn.id = "cropper-crop-btn";
    // this.cropperTogglerBtn.textContent = "Toggle crop-mode";
    this.cropperTogglerBtn.innerHTML = `
    <svg width="36" height="30" viewBox="0 0 36 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M33 3V27H3V3H33ZM36 0H0V30H36V0ZM28.5 19.638V10.362C29.3715 10.0515 30 9.228 30 8.25C30 7.008 28.992 6 27.75 6C26.772 6 25.9485 6.6285 25.638 7.5H10.362C10.0515 6.6285 9.228 6 8.25 6C7.008 6 6 7.008 6 8.25C6 9.228 6.6285 10.0515 7.5 10.362V19.638C6.6285 19.9485 6 20.772 6 21.75C6 22.992 7.008 24 8.25 24C9.228 24 10.0515 23.3715 10.362 22.5H25.638C25.9485 23.3715 26.772 24 27.75 24C28.992 24 30 22.992 30 21.75C30 20.772 29.3715 19.9485 28.5 19.638ZM25.638 9C25.8645 9.636 26.364 10.1355 27 10.362V12H22.5V9H25.638ZM21 9V12H15V9H21ZM21 13.5V16.5H15V13.5H21ZM9 10.362C9.636 10.1355 10.1355 9.636 10.362 9H13.5V12H9V10.362ZM9 13.5H13.5V16.5H9V13.5ZM10.362 21C10.137 20.364 9.636 19.8645 9 19.638V18H13.5V21H10.362ZM15 21V18H21V21H15ZM27 19.638C26.364 19.8645 25.863 20.364 25.638 21H22.5V18H27V19.638ZM22.5 16.5V13.5H27V16.5H22.5Z" fill="white"/>
</svg>
    `;

    // Create cropper downlad button
    this.cropperDownloadBtn = document.createElement("button");
    this.cropperDownloadBtn.id = "cropper-download-btn";
    // this.cropperDownloadBtn.textContent = "Download";
    this.cropperDownloadBtn.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M16.25 3.75H19.995V10H16.25V3.75ZM30 5V30H18.4391L20.9306 27.5L27.5 27.5V6.03625L23.965 2.5H23.75V13.75H6.25V2.5H2.5V27.5L8.75007 27.5L11.2416 30H0V0H25L30 5ZM8.75 11.25H21.25V2.5H8.75V11.25ZM8.74997 23.8889H13.3177V16.25H16.3628V23.8889H20.9305L14.8403 30L8.74997 23.8889Z" fill="white"/>
</svg>

    `;

    // Create undo button
    this.cropperUndoBtn = document.createElement("button");
    this.cropperUndoBtn.id = "cropper-undo-btn";
    // this.cropperUndoBtn.textContent = "Undo";
    this.cropperUndoBtn.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.711 5.98347C14.8439 3.80081 6.71336 8.31752 4.35775 16.0871L0.650918 14.9408L5.53795 23.5786L13.6817 18.971L10.0847 17.8588C11.4874 13.1781 16.3775 10.4545 21.1073 11.7662C28.5035 13.8174 30.5644 24.0714 22.6992 28.5213L25.6543 33.7444C29.6892 31.4616 32.0855 28.3189 33.1586 24.4495C35.3727 16.4655 30.695 8.19764 22.711 5.98347Z" fill="white"/>
</svg>
    `;

    // Create zoom +/- buttons
    this.cropperZoomInBtn = document.createElement("button");
    this.cropperZoomInBtn.id = "cropper-zoom-in-btn";
    // this.cropperZoomInBtn.textContent = "+";
    this.cropperZoomInBtn.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M29.1128 25.0719L22.8433 18.8508C24.0589 16.9508 24.7618 14.6984 24.7618 12.2872C24.7618 5.51234 19.2078 -3.33778e-05 12.3803 -3.33778e-05C5.55273 -3.33778e-05 0 5.51234 0 12.2872C0 19.062 5.55273 24.5744 12.3815 24.5744C14.6918 24.5744 16.856 23.9432 18.7077 22.8457L25.0326 29.1218C27.7334 31.798 31.8148 27.7518 29.1128 25.0719ZM3.83828 12.2872C3.83828 7.61354 7.67153 3.80988 12.3815 3.80988C17.0915 3.80988 20.9248 7.61229 20.9248 12.2872C20.9248 16.9621 17.0915 20.7645 12.3815 20.7645C7.67153 20.7645 3.83828 16.9608 3.83828 12.2872ZM7.39988 12C7.39988 11.4477 7.8476 11 8.39988 11H11.0001V8.39999C11.0001 7.84771 11.4478 7.39999 12.0001 7.39999C12.5524 7.39999 13.0001 7.84771 13.0001 8.39999V11H15.5999C16.1522 11 16.5999 11.4477 16.5999 12C16.5999 12.5523 16.1522 13 15.5999 13H13.0001V15.6C13.0001 16.1523 12.5524 16.6 12.0001 16.6C11.4478 16.6 11.0001 16.1523 11.0001 15.6V13H8.39988C7.8476 13 7.39988 12.5523 7.39988 12Z" fill="white"/>
</svg>
    `;

    this.cropperZoomOutBtn = document.createElement("button");
    this.cropperZoomOutBtn.id = "cropper-zoom-out-btn";
    // this.cropperZoomOutBtn.textContent = "-";
    this.cropperZoomOutBtn.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22.8433 18.8508L29.1128 25.0719C31.8148 27.7518 27.7334 31.798 25.0326 29.1218L18.7077 22.8457C16.856 23.9432 14.6918 24.5744 12.3815 24.5744C5.55273 24.5744 0 19.062 0 12.2872C0 5.51234 5.55273 -3.33778e-05 12.3803 -3.33778e-05C19.2078 -3.33778e-05 24.7618 5.51234 24.7618 12.2872C24.7618 14.6984 24.0589 16.9508 22.8433 18.8508ZM12.3815 3.80988C7.67153 3.80988 3.83828 7.61354 3.83828 12.2872C3.83828 16.9608 7.67153 20.7645 12.3815 20.7645C17.0915 20.7645 20.9248 16.9621 20.9248 12.2872C20.9248 7.61229 17.0915 3.80988 12.3815 3.80988ZM8.40027 11C7.84798 11 7.40027 11.4477 7.40027 12C7.40027 12.5523 7.84798 13 8.40027 13H15.6003C16.1526 13 16.6003 12.5523 16.6003 12C16.6003 11.4477 16.1526 11 15.6003 11H8.40027Z" fill="white"/>
</svg>

    `;

    // Add buttons to tool container
    this.cropperControlsContainer.innerHTML = `
    <div class="aspect-ratio-buttons">
      <button id="cropper-aspect-square-btn">Square</button>
      <button id="cropper-aspect-3-4-btn">3:4</button>
      <button id="cropper-aspect-4-3-btn">4:3</button>
      <button id="cropper-aspect-16-9-btn">16:9</button>
      <button id="cropper-aspect-9-16-btn">9:16</button>
      <button id="cropper-aspect-free-btn">Free Ratio</button>
      </div>

    <div class="rotation-buttons">
      <button id="cropper-rotate-right-btn">Rotate Right</button>
      <button id="cropper-rotate-left-btn">Rotate Left</button>
      <button id="cropper-reflect-y-btn">Reflect Y</button>
      <button id="cropper-reflect-x-btn">Reflect X</button>
    </div>

    <div class="apply-crop-container">
      <button id="cropper-apply-btn">Apply Crop</button>
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
    this.cropperTogglerBtn.addEventListener("click", () => {
      if (!this.cropper.cropped) {
        this.cropper.crop();
      } else {
        this.cropper.clear();
      }

      if (this.paintingCanvas) {
        this.applyPaintingCanvas();
      }
    });

    this.cropperZoomInBtn.addEventListener("click", () => {
      this.cropper.zoom(0.1);
    });

    this.cropperZoomOutBtn.addEventListener("click", () => {
      this.cropper.zoom(-0.1);
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

  // Create all painting stuff in DOM
  createPaintingControls() {
    // Get painting container in tool panel
    this.paintingControlsContainer =
      this.toolContainer.querySelector(".painting-controls");

    // Create painting toggler button
    this.createPaintingCanvasBtn = document.createElement("button");
    this.createPaintingCanvasBtn.id = "create-drawing-canvas";
    // this.createPaintingCanvasBtn.textContent = "Toggle canvas";
    this.createPaintingCanvasBtn.innerHTML = `
    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.8123 26.125C10.5971 26.125 8.31738 25.1501 6.875 23.144L7.55013 23.1729C13.0213 23.1729 11.1416 16.9634 16.7571 16.9042L19.2871 19.0149C19.6721 23.6803 16.3226 26.125 12.8123 26.125ZM26.2157 13.3609C27.8465 10.8006 31.4848 3.98337 32.8763 1.33237C32.9629 1.1825 33 1.03263 33 0.88825C33 0.402875 32.571 0 32.098 0C31.9096 0 31.7144 0.064625 31.537 0.213125C29.2408 2.156 23.4272 7.11562 21.208 9.185C19.1029 11.154 19.0946 12.0546 18.4126 15.301L20.7226 17.226C23.7834 15.9679 24.6647 15.796 26.2157 13.3609ZM27.5 16.2566V30.25H2.75V11H16.6348C17.534 8.54012 19.0273 7.337 24.3403 2.75H0V33H30.25V11.9391C29.3026 13.6097 28.4969 15.0549 27.5 16.2566Z" fill="white"/>
</svg>

    `;

    // Add buttons to tool container
    this.paintingControlsContainer.innerHTML = ` 
    <div class="painting-controls">
    <input type="color" name="" id="color-picker" />
     <button id="increase-brush">+</button>
     <span id="size-brush">20</span>
     <button id="decrease-brush">-</button>
     <button id="painting-brush">Brush</button>
     <button id="eraser-brush">Eraser</button>
    </div>

    <div class="painting-apply-container">
    <button id="apply-drawing-canvas">Apply canvas</button>
    <button id="clear-drawing-canvas">Clear canvas</button>
    </div>
      `;

    // Init buttons
    this.applyPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#apply-drawing-canvas"
    );
    this.clearPaintingCanvasBtn = this.paintingControlsContainer.querySelector(
      "#clear-drawing-canvas"
    );
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
  }

  // Assign event listeners to painting stuff
  addPaintingEvents() {
    this.createPaintingCanvasBtn.addEventListener("click", () => {
      if (!this.paintingCanvas) {
        // Disable cropper
        this.cropper.clear();
        this.cropper.disable();

        this.createPaintingCanvas();
      } else {
        this.paintingCanvas.remove();
        this.paintingCanvas = undefined;

        // Enable cropper
        this.cropper.enable();
      }
    });

    this.applyPaintingCanvasBtn.addEventListener("click", () => {
      this.applyPaintingCanvas();
    });
  }

  // Create all filters stuff in DOM
  createFiltersControls() {
    // Get container in filters panel
    this.filterControlsContainer =
      this.filtersPanel.querySelector(".filters-controls");

    // Create filters toggler button
    this.filtersToggleBtn = document.createElement("button");
    this.filtersToggleBtn.id = "toggle-filters-panel";
    // this.filtersToggleBtn.textContent = "Filters";
    this.filtersToggleBtn.innerHTML = `
    <svg width="33" height="30" viewBox="0 0 33 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.3636 10.9091C17.1164 10.9091 17.7273 11.5214 17.7273 12.2727C17.7273 13.0241 17.1164 13.6364 16.3636 13.6364C15.6109 13.6364 15 13.0241 15 12.2727C15 11.5214 15.6109 10.9091 16.3636 10.9091ZM16.3636 8.18182C14.1041 8.18182 12.2727 10.0132 12.2727 12.2727C12.2727 14.5323 14.1041 16.3636 16.3636 16.3636C18.6232 16.3636 20.4545 14.5323 20.4545 12.2727C20.4545 10.0132 18.6232 8.18182 16.3636 8.18182ZM4.09091 13.6364C1.83136 13.6364 0 15.4677 0 17.7273C0 19.9868 1.83136 21.8182 4.09091 21.8182C6.35045 21.8182 8.18182 19.9868 8.18182 17.7273C8.18182 15.4677 6.35045 13.6364 4.09091 13.6364ZM28.6364 13.6364C26.3768 13.6364 24.5455 15.4677 24.5455 17.7273C24.5455 19.9868 26.3768 21.8182 28.6364 21.8182C30.8959 21.8182 32.7273 19.9868 32.7273 17.7273C32.7273 15.4677 30.8959 13.6364 28.6364 13.6364ZM16.3636 5.45455C16.8314 5.45455 17.2868 5.50227 17.7273 5.59227V1.36364C17.7273 0.610909 17.1177 0 16.3636 0C15.6095 0 15 0.610909 15 1.36364V5.59227C15.4405 5.50227 15.8959 5.45455 16.3636 5.45455ZM28.6364 10.9091C29.1041 10.9091 29.5595 10.9568 30 11.0468V1.36364C30 0.610909 29.3905 0 28.6364 0C27.8823 0 27.2727 0.610909 27.2727 1.36364V11.0468C27.7132 10.9568 28.1686 10.9091 28.6364 10.9091ZM28.6364 24.5455C28.1686 24.5455 27.7132 24.4977 27.2727 24.4077V28.6364C27.2727 29.3891 27.8823 30 28.6364 30C29.3905 30 30 29.3891 30 28.6364V24.4077C29.5595 24.4977 29.1041 24.5455 28.6364 24.5455ZM4.09091 10.9091C4.55864 10.9091 5.01409 10.9568 5.45455 11.0468V1.36364C5.45455 0.610909 4.845 0 4.09091 0C3.33682 0 2.72727 0.610909 2.72727 1.36364V11.0468C3.16773 10.9568 3.62318 10.9091 4.09091 10.9091ZM16.3636 19.0909C15.8959 19.0909 15.4405 19.0432 15 18.9532V28.6364C15 29.3891 15.6095 30 16.3636 30C17.1177 30 17.7273 29.3891 17.7273 28.6364V18.9532C17.2868 19.0432 16.8314 19.0909 16.3636 19.0909ZM4.09091 24.5455C3.62318 24.5455 3.16773 24.4977 2.72727 24.4077V28.6364C2.72727 29.3891 3.33682 30 4.09091 30C4.845 30 5.45455 29.3891 5.45455 28.6364V24.4077C5.01409 24.4977 4.55864 24.5455 4.09091 24.5455Z" fill="white"/>
</svg>
    `;

    // Create filters controls in DOM
    this.filterControlsContainer.innerHTML = `
    <div class="filters-left-col">

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

      </div>

        <div class="filters-right-col">

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
      
      </div>

      
      <button id="reset-filters">Reset Filters</button>
    `;

    // Init filters sliders
    this.filtersSliders = this.filterControlsContainer.querySelectorAll(
      ".filter-range-slider input"
    );
    this.resetFiltersBtn =
      this.filterControlsContainer.querySelector("#reset-filters");
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
  }
}

// DOM elements
const cpContainer = document.querySelector(".control-panel-container");
const mainContainer = document.querySelector(".main-container");
const toolContainer = document.querySelector(".tool-container");
const filtersPanel = document.querySelector(".filters-panel");

const DOMContainers = [cpContainer, mainContainer, toolContainer, filtersPanel];

// Upload input
const uploadInput = document.querySelector("#upload-input");

let imageEditor;

uploadInput.addEventListener("change", (e) => {
  if (e.target.files.length !== 1) return;

  if (document.querySelector("#initial-upload")) {
    document.querySelector("#initial-upload").remove();
  }

  uploadFile(e.target.files[0]);

  imageEditor.filtersToggleBtn.addEventListener("click", () => {
    filtersPanel.classList.toggle("hide");
  });

  imageEditor.cropperTogglerBtn.addEventListener("click", () => {
    updateToolContainer("crop");
  });
  imageEditor.createPaintingCanvasBtn.addEventListener("click", () => {
    if (!imageEditor.paintingCanvas) {
      updateToolContainer("crop");
    } else {
      updateToolContainer("paint");
    }
  });

  imageEditor.applyPaintingCanvasBtn.addEventListener("click", () => {
    updateToolContainer("crop");
  });

  updateToolContainer("crop");
});

function updateToolContainer(mode) {
  if (mode === "crop") {
    imageEditor.cropperControlsContainer.className = "cropper-controls";
    imageEditor.paintingControlsContainer.className = "painting-controls hide";
  } else if (mode === "paint") {
    imageEditor.cropperControlsContainer.className = "cropper-controls hide";
    imageEditor.paintingControlsContainer.className = "painting-controls";
  }
}

function uploadFile(file) {
  mainContainer.innerHTML = "";
  cpContainer.innerHTML = "";

  imageEditor = new ImageEditor(DOMContainers, file);
}

// Add zoom buttons
// Loading screen
// Return to previous state:
// this.cropper.setCanvasData({
//   top: -2678.298442751011,
//   width: 8636.424696196778,
//   left: -3211.8762591259397,
//   height: 5757.616464131186,
// });

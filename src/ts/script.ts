import { gsap } from "gsap";

import ImageEditor from "./imageEditor";
import {
  animateElTopBottom,
  animateElLeftRight,
  animateElZoom,
  animateElRotation,
  animateElFade,
} from "./animations";

/**
 * If mobile - true, else - false
 */
const isMobile: boolean = window.matchMedia("(pointer:coarse)").matches;

// DOM elements
const cpContainer = document.querySelector(".control-panel-container") as HTMLDivElement;
const mainContainer = document.querySelector(".main-container") as HTMLDivElement;
const toolContainer = document.querySelector(".tool-container") as HTMLDivElement;

/**
 * Array of DOM elements that will hold ImageEditor components
 */
const DOMContainers: HTMLDivElement[] = [cpContainer, mainContainer, toolContainer];

/**
 * Array of DOM elements that will hold ImageEditors tools panels
 */
const toolContainers: HTMLDivElement[] = [
  toolContainer.querySelector(".crop-controls") as HTMLDivElement,
  toolContainer.querySelector(".paint-controls") as HTMLDivElement,
  toolContainer.querySelector(".filters-controls") as HTMLDivElement,
  toolContainer.querySelector(".rotation-controls") as HTMLDivElement,
];

// Upload input element
const uploadInput = document.querySelector("#upload-input") as HTMLInputElement;
const initUploadLabel = document.querySelector("#initial-upload") as HTMLLabelElement;

// Initial Upload button
const initialUploadButton = toolContainer.querySelector(".placeholder-button") as HTMLDivElement;

// Drag'n'Drop input element
const dragArea = document.querySelector(".drag-area") as HTMLDivElement;

// Init
/**
 * Current mode
 * @type {string}
 */
let currentMode: string;

// Event listeners

// Button upload
uploadInput.addEventListener("change", (e) => {
  if (e.target instanceof HTMLInputElement && e.target.files) {
    if (e.target.files.length !== 1) return;
    if (!e.target.files[0].type.startsWith("image/")) return;

    uploadFile(e.target.files[0]);
  }
});

// Drag'n'Drop upload
["dragenter", "dragover", "dragleave", "drop"].forEach((e) => {
  dragArea.addEventListener(e, preventDefaults);
});

// Highlight/unhighlight area
["dragenter", "dragover"].forEach((e) => {
  dragArea.addEventListener(e, () => {
    dragArea.classList.add("active");
  });
});

dragArea.addEventListener("dragleave", () => {
  dragArea.classList.remove("active");
});

dragArea.addEventListener("drop", (e) => {
  let dt = e.dataTransfer;
  if (dt) {
    let file = dt.files[0];

    if (!file.type.startsWith("image/")) return;

    uploadFile(file);
  }
});

// Functions

/**
 * @property {Function} uploadFile - upload file, init new ImageEditor, initially activate crop-mode, add events on ImageEditor DOM elements
 * @param {Object} file - file object from input 
 */
function uploadFile(file: File): void {
  if (!ImageEditor.getInstance()) {
    // Initially delete upload button & drag area
    initialUploadButton.remove();
    dragArea.remove();

    // Init instance of ImageEditor
    ImageEditor.create(DOMContainers, file, isMobile)
  } else {
    ImageEditor.reset(file)
  }

  // Remove old event listener for keyboard shortcuts 
  // document.removeEventListener('keydown', keyboardShortcuts);

  // currentEditor = new ImageEditor(DOMContainers, file, isMobile);

  initEvents();
  activateMode("crop", true);
}

/**
  * @property {Function} initEvents - Adds events on DOM elements of ImageEditor
  * @returns {void}
  */
function initEvents() {
  // Tools
  const aspectRatioBtns = ImageEditor.getInstance().cropperControlsContainer
    .querySelector(".aspect-ratio-buttons")
    .querySelectorAll("button");
  const rotateReflectBtns = ImageEditor.getInstance().cropperControlsContainer
    .querySelector(".rotation-buttons")
    .querySelectorAll("button");

  const paintingBrush = ImageEditor.getInstance().brushModeBtn;
  const eraserBrush = ImageEditor.getInstance().eraserModeBtn;
  const blurBrush = ImageEditor.getInstance().blurModeBtn;

  // Mode switching events
  ImageEditor.getInstance().cropModeBtn.addEventListener("click", () => {
    activateMode("crop");
    removeToolActiveStates(aspectRatioBtns);
  });

  ImageEditor.getInstance().paintModeBtn.addEventListener("click", () => {
    activateMode("paint");
    removeToolActiveStates(aspectRatioBtns);
  });

  ImageEditor.getInstance().filtersModeBtn.addEventListener("click", () => {
    activateMode("filters");
    removeToolActiveStates(aspectRatioBtns);
  });

  ImageEditor.getInstance().rotationModeBtn.addEventListener("click", () => {
    activateMode("rotation");
    removeToolActiveStates(aspectRatioBtns);
  });

  ImageEditor.getInstance().applyPaintingCanvasBtn.addEventListener("click", () => {
    activateMode("crop");
  });

  // Undo behaviour
  ImageEditor.getInstance().cropperUndoBtn.addEventListener("click", () => {
    removeToolActiveStates(aspectRatioBtns);
  });

  // Crop tools events
  aspectRatioBtns.forEach((button) => {
    button.addEventListener("click", (e) => {
      const currentBtn = e.currentTarget;

      removeToolActiveStates(aspectRatioBtns);
      if (currentBtn.id === "cropper-aspect-free-btn") {
        if (!ImageEditor.getInstance().cropper.cropped) {
          currentBtn.classList.toggle("active");
        }
      } else {
        currentBtn.classList.add("active");
      }
    });
  });

  // Apply crop
  ImageEditor.getInstance().cropperBtnApply.addEventListener("click", () => {
    removeToolActiveStates(aspectRatioBtns);
  });

  // Rotation/reflection buttons behaviour
  rotateReflectBtns.forEach((button) => {
    button.addEventListener("click", () => {
      removeToolActiveStates(aspectRatioBtns);
    });
  });

  // Keyboard brush events
  document.addEventListener('keydown', keyboardShortcuts)

  // Eraser tool
  eraserBrush.addEventListener("click", () => {
    eraserBrush.classList.add("active");
    paintingBrush.classList.remove("active");
    blurBrush.classList.remove("active");
  });

  // Blur tool
  blurBrush.addEventListener("click", () => {
    eraserBrush.classList.remove("active");
    paintingBrush.classList.remove("active");
    blurBrush.classList.add("active");
  });

  paintingBrush.addEventListener("click", () => {
    setPaintBrush();
  });

  // addMicroAnimations();
}


/**
 * 
 * @property {Function} activateMode - Activate mode. Initially - crop mode. 
 * @param {string} mode - new mode of ImageEditor
 * @param {boolean} newFile - if it is first initialization
 * @returns {void}
 */
function activateMode(mode, newFile) {

  if (newFile) {
    ImageEditor.getInstance().cropModeBtn.classList.add("active");
  }

  if (currentMode === mode) return;

  if (currentMode === "paint" && ImageEditor.getInstance().paintingCanvas) {
    ImageEditor.getInstance().cropper.enable();

    if (ImageEditor.getInstance().blurCanvas) {
      ImageEditor.getInstance().clearBlurCanvas();
    }

    ImageEditor.getInstance().paintingCanvas.remove();
    ImageEditor.getInstance().paintingCanvas = undefined;
    ImageEditor.getInstance().setZoombuttonsState("both-active");
    ImageEditor.getInstance().setUndoBtn(false);

    if (!isMobile) {
      ImageEditor.getInstance().initBrushCursor(undefined, false);
    }

  }

  if (currentMode === "filters") {
    ImageEditor.getInstance().resetFilters();
  }

  if (currentMode === "rotation") {
    ImageEditor.getInstance().resetRotation();
  }

  // Set current mode to new
  currentMode = mode;

  // Activate proper panel in DOM
  toolContainers.forEach((container) => {
    container.classList.add("hide");
  });
  document.querySelector(`.${mode}-controls`).classList.remove("hide");

  // Update icons in cp
  ImageEditor.getInstance().cpContainer
    .querySelectorAll(".cp-toolbox button")
    .forEach((button) => {
      button.classList.remove("active");
      if (button.id === `${mode}-mode`) {
        button.classList.add("active");
      }
    });

  if (mode === "paint") {
    ImageEditor.getInstance().cropper.clear();
    ImageEditor.getInstance().cropper.disable();
    ImageEditor.getInstance().createPaintingCanvas();
    ImageEditor.getInstance().setZoombuttonsState("paint");
    ImageEditor.getInstance().setUndoBtn(true);

    setPaintBrush();
  }
}

/**
 * 
 * @property {Function} preventDefaults - Prevents default for some events
 * @param {DragEvent} e - event object that cames from drag and drop events
 * @returns {void}
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 
 * @property {Function} removeToolActiveStates - remove class 'active' from all provided elements
 * @param {HTMLCollection} elements
 * @returns {void}
 */
function removeToolActiveStates(elements) {
  elements.forEach((btn) => btn.classList.remove("active"));
}

/**
 * 
 * @property {Function} setPaintBrush - Highlight DOM elements of paint mode
 * @returns {void}
 */
function setPaintBrush() {
  ImageEditor.getInstance().brushModeBtn.classList.add("active");
  ImageEditor.getInstance().eraserModeBtn.classList.remove("active");
  ImageEditor.getInstance().blurModeBtn.classList.remove("active");
}

/**
 * 
 * @property {Function} addBasicMicroAnimation - Adds basic (with 2 states and one callback invocation) microanimation to element.
 * @param {HTMLElement} element - element that will recieve 2 event listeners 
 * @param {Function} callback - callback that will be added to invoke whet events from listeners fires 
 * @param {string} innerElementSelector - inner element (element to animate) selector
 * @param {number} val1 - initial value for gsap 
 * @param {number} val2 - value animate to for gsap 
 * @param {string} setOrigin - optional string that set element styles before animation 
 * @returns {void}
 */
function addBasicMicroAnimation(element, callback, innerElementSelector, val1, val2, setOrigin) {
  element.addEventListener('mouseenter', function () {
    const innerElement = element.querySelector(innerElementSelector);
    if (setOrigin) {
      gsap.set(innerElement, {
        transformOrigin: setOrigin,
      });
    }
    callback(innerElement, val1, val2);
  });

  element.addEventListener('mouseleave', function () {
    const innerElement = element.querySelector(innerElementSelector);
    callback(innerElement, val2, val1);
  })
}

// Animation funcions

/**
 * 
 * @property {Function} addMicroAnimations - add all micro animations to ImageEditor buttons/labels and elements
 * @returns {void}
 */
function addMicroAnimations() {

  // Formats Btn
  addBasicMicroAnimation(
    ImageEditor.getInstance().imageFormatBtn,
    animateElZoom,
    'svg',
    1,
    1.3,
  );

  // Download Btn
  addBasicMicroAnimation(
    currentEditor.cropperDownloadBtn,
    animateElTopBottom,
    "#arrow",
    0,
    2,
  );

  // Upload Btn
  addBasicMicroAnimation(
    currentEditor.uploadNewImgBtn,
    animateElTopBottom,
    "#arrow",
    0,
    -5,
  );

  // Undo Btn
  currentEditor.cropperUndoBtn.addEventListener("mouseenter", function () {
    animateElRotation(this.querySelector("svg"), 0, -30, 0.6);
  });

  currentEditor.cropperUndoBtn.addEventListener("click", function () {
    animateElRotation(this.querySelector("svg"), -30, 0, 0.6);
  });

  currentEditor.cropperUndoBtn.addEventListener("mouseleave", function () {
    animateElRotation(this.querySelector("svg"), -30, 0, 0.6);
  });

  // Zoom out Btn
  addBasicMicroAnimation(
    currentEditor.cropperZoomOutBtn,
    animateElZoom,
    "svg",
    1,
    0.8,
  );

  // Zoom in Btn
  addBasicMicroAnimation(
    currentEditor.cropperZoomInBtn,
    animateElZoom,
    "svg",
    1,
    1.2,
  );

  // Rotation Mode btn
  currentEditor.rotationModeBtn.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("#arrow"), { transformOrigin: "center" });
    animateElLeftRight(this.querySelector("#left-half"), 0, -2);
    animateElLeftRight(this.querySelector("#right-half"), 0, 2);
    animateElRotation(this.querySelector("#arrow"), 0, 10);
  });

  currentEditor.rotationModeBtn.addEventListener("mouseleave", function () {
    animateElLeftRight(this.querySelector("#left-half"), -2, 0);
    animateElLeftRight(this.querySelector("#right-half"), 2, 0);
    animateElRotation(this.querySelector("#arrow"), 10, 0);
  });

  // Filters Mode btn
  currentEditor.filtersModeBtn.addEventListener("mouseenter", function () {
    animateElLeftRight(this.querySelector("#top_control"), 0, -5);
    animateElLeftRight(this.querySelector("#middle_control"), 0, 3);
    animateElLeftRight(this.querySelector("#bottom_control"), 0, -2);
  });

  currentEditor.filtersModeBtn.addEventListener("mouseleave", function () {
    animateElLeftRight(this.querySelector("#top_control"), -5, 0);
    animateElLeftRight(this.querySelector("#middle_control"), 3, 0);
    animateElLeftRight(this.querySelector("#bottom_control"), -2, 0);
  });

  // Painting Mode btn
  currentEditor.paintModeBtn.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("#paint_brush"), {
      transformOrigin: "right right",
    });
    animateElRotation(this.querySelector("#paint_brush"), 0, 10);
  });

  currentEditor.paintModeBtn.addEventListener("mouseleave", function () {
    animateElRotation(this.querySelector("#paint_brush"), 10, 0);
  });

  // Crop Mode btn
  currentEditor.cropModeBtn.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("#crop_grid"), {
      transformOrigin: "center center",
    });
    gsap.set(this.querySelector("#outer"), {
      transformOrigin: "center center",
    });

    animateElZoom(this.querySelector("#crop_grid"), 1, 1.3);
    animateElZoom(this.querySelector("#outer"), 1, 1.25, 1, 1, 0);
  });

  currentEditor.cropModeBtn.addEventListener("mouseleave", function () {
    animateElZoom(this.querySelector("#crop_grid"), 1.3, 1);
    animateElZoom(this.querySelector("#outer"), 1.25, 1, 1, 0, 1);
  });

  // Crop aspect ratio btns

  // Square
  addBasicMicroAnimation(
    currentEditor.cropperBtnAspectSquare,
    animateElZoom,
    "#grid",
    1,
    1.2,
    'center center'
  );

  // 3:4
  addBasicMicroAnimation(
    currentEditor.cropperBtnAspect34,
    animateElZoom,
    "#grid",
    1,
    1.2,
    'center center'
  );

  // 4:3
  addBasicMicroAnimation(
    currentEditor.cropperBtnAspect43,
    animateElZoom,
    "#grid",
    1,
    1.2,
    'center center'
  );

  // 16:9
  addBasicMicroAnimation(
    currentEditor.cropperBtnAspect169,
    animateElZoom,
    "#grid",
    1,
    1.2,
    'center center'
  );

  // 9:16
  addBasicMicroAnimation(
    currentEditor.cropperBtnAspect916,
    animateElZoom,
    "#grid",
    1,
    1.2,
    'center center'
  );

  // Free
  currentEditor.cropperBtnAspectFree.addEventListener(
    "mouseenter",
    function () {
      gsap.set(this.querySelector("#grid"), {
        transformOrigin: "center center",
      });
      animateElZoom(this.querySelector("#grid"), 1, 1.2);
      animateElTopBottom(this.querySelector("#arrow_up"), 0, -5);
      animateElTopBottom(this.querySelector("#arrow_down"), 0, 5);
      animateElLeftRight(this.querySelector("#arrow_right"), 0, 5);
      animateElLeftRight(this.querySelector("#arrow_left"), 0, -5);
    }
  );

  currentEditor.cropperBtnAspectFree.addEventListener(
    "mouseleave",
    function () {
      animateElZoom(this.querySelector("#grid"), 1.2, 1);
      animateElTopBottom(this.querySelector("#arrow_up"), -5, 0);
      animateElTopBottom(this.querySelector("#arrow_down"), 5, 0);
      animateElLeftRight(this.querySelector("#arrow_right"), 5, 0);
      animateElLeftRight(this.querySelector("#arrow_left"), -5, 0);
    }
  );

  // Rotations/Reflections btns

  // 90deg
  currentEditor.cropperBtnRotateRight.addEventListener(
    "mouseenter",
    function () {
      gsap.set(this.querySelector("#main"), {
        transformOrigin: "center center",
      });
      animateElRotation(this.querySelector("#main"), 0, 90);
      animateElTopBottom(this.querySelector("#main"), 0, 10);
      animateElFade(this.querySelector("#top"), 1, 0);
    }
  );

  currentEditor.cropperBtnRotateRight.addEventListener(
    "mouseleave",
    function () {
      animateElRotation(this.querySelector("#main"), 90, 0);
      animateElTopBottom(this.querySelector("#main"), 10, 0);
      animateElFade(this.querySelector("#top"), 0, 1);
    }
  );

  // -90deg
  currentEditor.cropperBtnRotateLeft.addEventListener(
    "mouseenter",
    function () {
      gsap.set(this.querySelector("#main"), {
        transformOrigin: "center center",
      });
      animateElRotation(this.querySelector("#main"), 0, -90);
      animateElTopBottom(this.querySelector("#main"), 0, 10);
      animateElFade(this.querySelector("#top"), 1, 0);
    }
  );

  currentEditor.cropperBtnRotateLeft.addEventListener(
    "mouseleave",
    function () {
      animateElRotation(this.querySelector("#main"), -90, 0);
      animateElTopBottom(this.querySelector("#main"), 10, 0);
      animateElFade(this.querySelector("#top"), 0, 1);
    }
  );

  // Reflect X
  currentEditor.cropperBtnReflectX.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("svg"), {
      transformOrigin: "center center",
    });
    animateElRotation(this.querySelector("svg"), 0, 180, 0.9);
  });

  currentEditor.cropperBtnReflectX.addEventListener("mouseleave", function () {
    animateElRotation(this.querySelector("svg"), 180, 0, 0.9);
  });

  // Reflect Y
  currentEditor.cropperBtnReflectY.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("svg"), {
      transformOrigin: "center center",
    });
    animateElRotation(this.querySelector("svg"), 0, 180, 0.9);
  });

  currentEditor.cropperBtnReflectY.addEventListener("mouseleave", function () {
    animateElRotation(this.querySelector("svg"), 180, 0, 0.9);
  });

  // Apply crop btn
  addBasicMicroAnimation(
    currentEditor.cropperBtnApply,
    animateElZoom,
    "svg",
    1,
    0.8
  );

  // Painting tools

  // Brush
  addBasicMicroAnimation(
    currentEditor.brushModeBtn,
    animateElRotation,
    "#pencil_el",
    0,
    -6,
    "top right"
  );

  // Eraser
  currentEditor.eraserModeBtn.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("#eraser_el"), {
      transformOrigin: "top right",
    });
    animateElTopBottom(this.querySelector("#eraser_el"), 0, 3);
    animateElLeftRight(this.querySelector("#eraser_el"), 0, -5);
  });

  currentEditor.eraserModeBtn.addEventListener("mouseleave", function () {
    animateElTopBottom(this.querySelector("#eraser_el"), 3, 0);
    animateElLeftRight(this.querySelector("#eraser_el"), -5, 0);
  });

  // Blur tool
  currentEditor.blurModeBtn.addEventListener("mouseenter", function () {
    gsap.set(this.querySelector("#blur_el"), {
      transformOrigin: "top right",
    });
    animateElTopBottom(this.querySelector("#blur_el"), 0, 3);
    animateElLeftRight(this.querySelector("#blur_el"), 0, -5);
  });

  currentEditor.blurModeBtn.addEventListener("mouseleave", function () {
    animateElTopBottom(this.querySelector("#blur_el"), 3, 0);
    animateElLeftRight(this.querySelector("#blur_el"), -5, 0);
  });

  // Apply paint
  addBasicMicroAnimation(
    currentEditor.applyPaintingCanvasBtn,
    animateElZoom,
    "svg",
    1,
    0.8,
  );

  // Clear painting canvas
  currentEditor.clearPaintingCanvasBtn.addEventListener(
    "mouseenter",
    function () {
      animateElRotation(this.querySelector("svg"), 0, -30, 0.6);
    }
  );

  currentEditor.clearPaintingCanvasBtn.addEventListener(
    "mouseleave",
    function () {
      animateElRotation(this.querySelector("svg"), -30, 0, 0.6);
    }
  );

  // Apply filters
  addBasicMicroAnimation(
    currentEditor.applyFiltersBtn,
    animateElZoom,
    "svg",
    1,
    0.8,
  );

  // Reset filters btn
  currentEditor.resetFiltersBtn.addEventListener("mouseenter", function () {
    animateElRotation(this.querySelector("svg"), 0, -30, 0.6);
  });

  currentEditor.resetFiltersBtn.addEventListener("mouseleave", function () {
    animateElRotation(this.querySelector("svg"), -30, 0, 0.6);
  });

  // Apply rotation
  addBasicMicroAnimation(
    currentEditor.imageRotationSliderApply,
    animateElZoom,
    "svg",
    1,
    0.8,
  );

  // Reset filters btn
  currentEditor.imageRotationSliderReset.addEventListener(
    "mouseenter",
    function () {
      animateElRotation(this.querySelector("svg"), 0, -30, 0.6);
    }
  );

  currentEditor.imageRotationSliderReset.addEventListener(
    "mouseleave",
    function () {
      animateElRotation(this.querySelector("svg"), -30, 0, 0.6);
    }
  );
}

/**
 * @property {Function} keyboardShortcuts - increase/decrease paint brush size by pressing '[' ']' buttons on keyboard
 * @param {KeyboardEvent} e - event object, that comes from listener that fires on keyboard input
 * @returns {void}
 */
function keyboardShortcuts(e) {
  console.log(e);
  if (currentEditor.paintingCanvas) {
    if (e.keyCode == 219) {
      currentEditor.changeBrushSize('decrease');
    } else if (e.keyCode == 221) {
      currentEditor.changeBrushSize('increase');
    }

    if (currentEditor.brushCursor) {
      currentEditor.brushCursor.style.width = `${currentEditor.brushSize * 2}px`;
      currentEditor.brushCursor.style.height = `${currentEditor.brushSize * 2}px`;
    }
  }
}

// Placeholder btn
addBasicMicroAnimation(
  initUploadLabel,
  animateElTopBottom,
  "#arrow",
  0,
  -10,
);

initUploadLabel.addEventListener("click", function () {
  animateElTopBottom(this.querySelector("#arrow"), -10, -125);
});
import ImageEditor from "./imageEditor";

import { addBasicMicroAnimation } from "./animationUtils";
import { animateElTopBottom } from "./animationCreators";

/**
 * If mobile - true, else - false
 */
const isMobile: boolean = window.matchMedia("(pointer:coarse)").matches;

// DOM elements
const cpContainer = document.querySelector(
  ".control-panel-container"
) as HTMLDivElement;
const mainContainer = document.querySelector(
  ".main-container"
) as HTMLDivElement;
const toolContainer = document.querySelector(
  ".tool-container"
) as HTMLDivElement;

/**
 * Array of DOM elements that will hold ImageEditor components
 */
const DOMContainers: HTMLDivElement[] = [
  cpContainer,
  mainContainer,
  toolContainer,
];

// Upload input element
const uploadInput = document.querySelector("#upload-input") as HTMLInputElement;
const initUploadLabel = document.querySelector(
  "#initial-upload"
) as HTMLLabelElement;

// Initial Upload button
const initialUploadButton = toolContainer.querySelector(
  ".placeholder-button"
) as HTMLDivElement;

// Drag'n'Drop input element
const dragArea = document.querySelector(".drag-area") as HTMLDivElement;

// Init
ImageEditor.createLoader(mainContainer);

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
["dragenter", "dragover", "dragleave", "drop"].forEach((eventType) => {
  dragArea.addEventListener(eventType, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
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
    ImageEditor.create(DOMContainers, file, isMobile);
  } else {
    ImageEditor.reset(file);
  }
}

// Placeholder btn
addBasicMicroAnimation(initUploadLabel, animateElTopBottom, "#arrow", 0, -10);

initUploadLabel.addEventListener("click", function () {
  animateElTopBottom(this.querySelector("#arrow") as HTMLElement, -10, -125);
});

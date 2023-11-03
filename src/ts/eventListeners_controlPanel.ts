import ImageEditor from "./imageEditor";
import { EditorMode, BrushMode, BrushDOMElementsObject } from "./types/imageEditor.types";

import { removeToolActiveStates, setActivePaintModeDOM } from "./utils";

export const addCPEvents = (editor: ImageEditor) => {
 // Aspect Ratio buttons as NodeList
 const aspectRatioBtns = (editor.cropperControlsContainer
  .querySelector(".aspect-ratio-buttons") as HTMLDivElement)
  .querySelectorAll("button") as NodeListOf<HTMLButtonElement>;

 // Mode switching events
 editor.cropModeBtn.addEventListener("click", () => {
  editor.activateEditorMode(EditorMode.Crop);
  removeToolActiveStates(aspectRatioBtns);
 });

 editor.paintModeBtn.addEventListener("click", () => {
  editor.activateEditorMode(EditorMode.Paint);
  removeToolActiveStates(aspectRatioBtns);
 });

 editor.filtersModeBtn.addEventListener("click", () => {
  editor.activateEditorMode(EditorMode.Filters);
  removeToolActiveStates(aspectRatioBtns);
 });

 editor.rotationModeBtn.addEventListener("click", () => {
  editor.activateEditorMode(EditorMode.Rotation);
  removeToolActiveStates(aspectRatioBtns);
 });

 editor.applyPaintingCanvasBtn.addEventListener("click", () => {
  editor.activateEditorMode(EditorMode.Crop);
 });

 // Undo behaviour
 editor.cropperUndoBtn.addEventListener("click", () => {
  removeToolActiveStates(aspectRatioBtns);
 });

 // Crop tools events
 aspectRatioBtns.forEach((button) => {
  button.addEventListener("click", (e) => {
   const currentBtn = e.currentTarget;
   removeToolActiveStates(aspectRatioBtns);

   if (currentBtn && currentBtn instanceof HTMLButtonElement) {
    if (currentBtn.id === "cropper-aspect-free-btn") {
     if (!editor.cropper.cropped) {
      currentBtn.classList.toggle("active");
     }
    } else {
     currentBtn.classList.add("active");
    }
   }
  });
 });

 // Apply crop
 editor.cropperBtnApply.addEventListener("click", () => {
  removeToolActiveStates(aspectRatioBtns);
 });


 // Rotate-reflect buttons as NodeList
 const rotateReflectBtns = (editor.cropperControlsContainer
  .querySelector(".rotation-buttons") as HTMLDivElement)
  .querySelectorAll("button") as NodeListOf<HTMLButtonElement>

 // Rotation/reflection buttons behaviour
 rotateReflectBtns.forEach((button) => {
  button.addEventListener("click", () => {
   removeToolActiveStates(aspectRatioBtns);
  });
 });

 editor.eraserModeBtn.addEventListener("click", () => {
  setActivePaintModeDOM(editor.brushToolsObject, BrushMode.Eraser);
 });

 // Blur tool
 editor.blurModeBtn.addEventListener("click", () => {
  setActivePaintModeDOM(editor.brushToolsObject, BrushMode.Blur);
 });

 // Paint tool
 editor.brushModeBtn.addEventListener("click", () => {
  setActivePaintModeDOM(editor.brushToolsObject, BrushMode.Paint);
 });
}
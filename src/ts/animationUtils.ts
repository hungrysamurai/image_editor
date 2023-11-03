import { gsap } from "gsap";

import ImageEditor from "./imageEditor";
import { AnimationCallback } from "./types/types";

import {
 animateElTopBottom,
 animateElLeftRight,
 animateElZoom,
 animateElRotation,
 animateElFade,
} from "./animationCreators";

/**
 * 
 * @property {Function} addBasicMicroAnimation - Adds basic (with 2 states and one callback invocation) microanimation to element.
 * @param {HTMLElement} element - element that will recieve 2 event listeners 
 * @param {Function} callback - callback that will be added to invoke whet events from listeners fires 
 * @param {string} innerElementSelector - inner element (element to animate) selector
 * @param {number} val1 - initial value for gsap 
 * @param {number} val2 - value animate to for gsap 
 * @param {string} setOrigin - optional string that set element styles before animation 
 */
export const addBasicMicroAnimation = (
 element: HTMLElement,
 callback: AnimationCallback,
 innerElementSelector: string,
 val1: number,
 val2: number,
 setOrigin?: string
): void => {
 element.addEventListener('mouseenter', function () {
  const innerElement = element.querySelector(innerElementSelector) as HTMLElement;
  if (setOrigin) {
   gsap.set(innerElement, {
    transformOrigin: setOrigin,
   });
  }
  callback(innerElement, val1, val2);
 });

 element.addEventListener('mouseleave', function () {
  const innerElement = element.querySelector(innerElementSelector) as HTMLElement;
  callback(innerElement, val2, val1);
 })
}


/**
 * 
 * @property {Function} addMicroAnimations - add all micro animations to ImageEditor buttons/labels and elements
 */
export const addMicroAnimations = (editor: ImageEditor): void => {
 // Formats Btn
 addBasicMicroAnimation(
  editor.imageFormatBtn,
  animateElZoom,
  'svg',
  1,
  1.3,
 );

 // Download Btn
 addBasicMicroAnimation(
  editor.cropperDownloadBtn,
  animateElTopBottom,
  "#arrow",
  0,
  2,
 );

 // Upload Btn
 addBasicMicroAnimation(
  editor.uploadNewImgBtn,
  animateElTopBottom,
  "#arrow",
  0,
  -5,
 );

 // Undo Btn
 editor.cropperUndoBtn.addEventListener("mouseenter", function () {
  animateElRotation((this.querySelector("svg") as Element), 0, -30, 0.6);
 });

 editor.cropperUndoBtn.addEventListener("click", function () {
  animateElRotation((this.querySelector("svg") as Element), -30, 0, 0.6);
 });

 editor.cropperUndoBtn.addEventListener("mouseleave", function () {
  animateElRotation((this.querySelector("svg") as Element), -30, 0, 0.6);
 });

 // Zoom out Btn
 addBasicMicroAnimation(
  editor.cropperZoomOutBtn,
  animateElZoom,
  "svg",
  1,
  0.8,
 );

 // Zoom in Btn
 addBasicMicroAnimation(
  editor.cropperZoomInBtn,
  animateElZoom,
  "svg",
  1,
  1.2,
 );

 // Rotation Mode btn
 editor.rotationModeBtn.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("#arrow"), { transformOrigin: "center" });
  animateElLeftRight((this.querySelector("#left-half") as Element), 0, -2);
  animateElLeftRight((this.querySelector("#right-half") as Element), 0, 2);
  animateElRotation((this.querySelector("#arrow") as Element), 0, 10);
 });

 editor.rotationModeBtn.addEventListener("mouseleave", function () {
  animateElLeftRight((this.querySelector("#left-half") as Element), -2, 0);
  animateElLeftRight((this.querySelector("#right-half") as Element), 2, 0);
  animateElRotation((this.querySelector("#arrow") as Element), 10, 0);
 });

 // Filters Mode btn
 editor.filtersModeBtn.addEventListener("mouseenter", function () {
  animateElLeftRight((this.querySelector("#top_control") as Element), 0, -5);
  animateElLeftRight((this.querySelector("#middle_control") as Element), 0, 3);
  animateElLeftRight((this.querySelector("#bottom_control") as Element), 0, -2);
 });

 editor.filtersModeBtn.addEventListener("mouseleave", function () {
  animateElLeftRight((this.querySelector("#top_control") as Element), -5, 0);
  animateElLeftRight((this.querySelector("#middle_control") as Element), 3, 0);
  animateElLeftRight((this.querySelector("#bottom_control") as Element), -2, 0);
 });

 // Painting Mode btn
 editor.paintModeBtn.addEventListener("mouseenter", function () {
  gsap.set((this.querySelector("#paint_brush") as Element), {
   transformOrigin: "right right",
  });
  animateElRotation((this.querySelector("#paint_brush") as Element), 0, 10);
 });

 editor.paintModeBtn.addEventListener("mouseleave", function () {
  animateElRotation((this.querySelector("#paint_brush") as Element), 10, 0);
 });

 // Crop Mode btn
 editor.cropModeBtn.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("#crop_grid"), {
   transformOrigin: "center center",
  });
  gsap.set(this.querySelector("#outer"), {
   transformOrigin: "center center",
  });

  animateElZoom((this.querySelector("#crop_grid") as Element), 1, 1.3);
  animateElZoom((this.querySelector("#outer") as Element), 1, 1.25, 1, 1, 0);
 });

 editor.cropModeBtn.addEventListener("mouseleave", function () {
  animateElZoom((this.querySelector("#crop_grid") as Element), 1.3, 1);
  animateElZoom((this.querySelector("#outer") as Element), 1.25, 1, 1, 0, 1);
 });

 // Crop aspect ratio btns

 // Square
 addBasicMicroAnimation(
  editor.cropperBtnAspectSquare,
  animateElZoom,
  "#grid",
  1,
  1.2,
  'center center'
 );

 // 3:4
 addBasicMicroAnimation(
  editor.cropperBtnAspect34,
  animateElZoom,
  "#grid",
  1,
  1.2,
  'center center'
 );

 // 4:3
 addBasicMicroAnimation(
  editor.cropperBtnAspect43,
  animateElZoom,
  "#grid",
  1,
  1.2,
  'center center'
 );

 // 16:9
 addBasicMicroAnimation(
  editor.cropperBtnAspect169,
  animateElZoom,
  "#grid",
  1,
  1.2,
  'center center'
 );

 // 9:16
 addBasicMicroAnimation(
  editor.cropperBtnAspect916,
  animateElZoom,
  "#grid",
  1,
  1.2,
  'center center'
 );

 // Free
 editor.cropperBtnAspectFree.addEventListener(
  "mouseenter",
  function () {
   gsap.set(this.querySelector("#grid"), {
    transformOrigin: "center center",
   });
   animateElZoom((this.querySelector("#grid") as Element), 1, 1.2);
   animateElTopBottom((this.querySelector("#arrow_up") as Element), 0, -5);
   animateElTopBottom((this.querySelector("#arrow_down") as Element), 0, 5);
   animateElLeftRight((this.querySelector("#arrow_right") as Element), 0, 5);
   animateElLeftRight((this.querySelector("#arrow_left") as Element), 0, -5);
  }
 );

 editor.cropperBtnAspectFree.addEventListener(
  "mouseleave",
  function () {
   animateElZoom((this.querySelector("#grid") as Element), 1.2, 1);
   animateElTopBottom((this.querySelector("#arrow_up") as Element), -5, 0);
   animateElTopBottom((this.querySelector("#arrow_down") as Element), 5, 0);
   animateElLeftRight((this.querySelector("#arrow_right") as Element), 5, 0);
   animateElLeftRight((this.querySelector("#arrow_left") as Element), -5, 0);
  }
 );

 // Rotations/Reflections btns

 // 90deg
 editor.cropperBtnRotateRight.addEventListener(
  "mouseenter",
  function () {
   gsap.set(this.querySelector("#main"), {
    transformOrigin: "center center",
   });
   animateElRotation((this.querySelector("#main") as Element), 0, 90);
   animateElTopBottom((this.querySelector("#main") as Element), 0, 10);
   animateElFade((this.querySelector("#top") as Element), 1, 0);
  }
 );

 editor.cropperBtnRotateRight.addEventListener(
  "mouseleave",
  function () {
   animateElRotation((this.querySelector("#main") as Element), 90, 0);
   animateElTopBottom((this.querySelector("#main") as Element), 10, 0);
   animateElFade((this.querySelector("#top") as Element), 0, 1);
  }
 );

 // -90deg
 editor.cropperBtnRotateLeft.addEventListener(
  "mouseenter",
  function () {
   gsap.set(this.querySelector("#main"), {
    transformOrigin: "center center",
   });
   animateElRotation((this.querySelector("#main") as Element), 0, -90);
   animateElTopBottom((this.querySelector("#main") as Element), 0, 10);
   animateElFade((this.querySelector("#top") as Element), 1, 0);
  }
 );

 editor.cropperBtnRotateLeft.addEventListener(
  "mouseleave",
  function () {
   animateElRotation((this.querySelector("#main") as Element), -90, 0);
   animateElTopBottom((this.querySelector("#main") as Element), 10, 0);
   animateElFade((this.querySelector("#top") as Element), 0, 1);
  }
 );

 // Reflect X
 editor.cropperBtnReflectX.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("svg"), {
   transformOrigin: "center center",
  });
  animateElRotation((this.querySelector("svg") as Element), 0, 180, 0.9);
 });

 editor.cropperBtnReflectX.addEventListener("mouseleave", function () {
  animateElRotation((this.querySelector("svg") as Element), 180, 0, 0.9);
 });

 // Reflect Y
 editor.cropperBtnReflectY.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("svg"), {
   transformOrigin: "center center",
  });
  animateElRotation((this.querySelector("svg") as Element), 0, 180, 0.9);
 });

 editor.cropperBtnReflectY.addEventListener("mouseleave", function () {
  animateElRotation((this.querySelector("svg") as Element), 180, 0, 0.9);
 });

 // Apply crop btn
 addBasicMicroAnimation(
  editor.cropperBtnApply,
  animateElZoom,
  "svg",
  1,
  0.8
 );

 // Painting tools

 // Brush
 addBasicMicroAnimation(
  editor.brushModeBtn,
  animateElRotation,
  "#pencil_el",
  0,
  -6,
  "top right"
 );

 // Eraser
 editor.eraserModeBtn.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("#eraser_el"), {
   transformOrigin: "top right",
  });
  animateElTopBottom((this.querySelector("#eraser_el") as Element), 0, 3);
  animateElLeftRight((this.querySelector("#eraser_el") as Element), 0, -5);
 });

 editor.eraserModeBtn.addEventListener("mouseleave", function () {
  animateElTopBottom((this.querySelector("#eraser_el") as Element), 3, 0);
  animateElLeftRight((this.querySelector("#eraser_el") as Element), -5, 0);
 });

 // Blur tool
 editor.blurModeBtn.addEventListener("mouseenter", function () {
  gsap.set(this.querySelector("#blur_el"), {
   transformOrigin: "top right",
  });
  animateElTopBottom((this.querySelector("#blur_el") as Element), 0, 3);
  animateElLeftRight((this.querySelector("#blur_el") as Element), 0, -5);
 });

 editor.blurModeBtn.addEventListener("mouseleave", function () {
  animateElTopBottom((this.querySelector("#blur_el") as Element), 3, 0);
  animateElLeftRight((this.querySelector("#blur_el") as Element), -5, 0);
 });

 // Apply paint
 addBasicMicroAnimation(
  editor.applyPaintingCanvasBtn,
  animateElZoom,
  "svg",
  1,
  0.8,
 );

 // Clear painting canvas
 editor.clearPaintingCanvasBtn.addEventListener(
  "mouseenter",
  function () {
   animateElRotation((this.querySelector("svg") as Element), 0, -30, 0.6);
  }
 );

 editor.clearPaintingCanvasBtn.addEventListener(
  "mouseleave",
  function () {
   animateElRotation((this.querySelector("svg") as Element), -30, 0, 0.6);
  }
 );

 // Apply filters
 addBasicMicroAnimation(
  editor.applyFiltersBtn,
  animateElZoom,
  "svg",
  1,
  0.8,
 );

 // Reset filters btn
 editor.resetFiltersBtn.addEventListener("mouseenter", function () {
  animateElRotation((this.querySelector("svg") as Element), 0, -30, 0.6);
 });

 editor.resetFiltersBtn.addEventListener("mouseleave", function () {
  animateElRotation((this.querySelector("svg") as Element), -30, 0, 0.6);
 });

 // Apply rotation
 addBasicMicroAnimation(
  editor.imageRotationSliderApply,
  animateElZoom,
  "svg",
  1,
  0.8,
 );

 // Reset filters btn
 editor.imageRotationSliderReset.addEventListener(
  "mouseenter",
  function () {
   animateElRotation((this.querySelector("svg") as Element), 0, -30, 0.6);
  }
 );

 editor.imageRotationSliderReset.addEventListener(
  "mouseleave",
  function () {
   animateElRotation((this.querySelector("svg") as Element), -30, 0, 0.6);
  }
 );
}
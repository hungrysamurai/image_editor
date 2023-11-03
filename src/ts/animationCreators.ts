import { gsap } from "gsap";
import { AnimationCallback } from "./types/types";

/**
 * @property {Function} animateElTopBottom - animate element by moving on Y axis
 * @param {Element} el - DOM element to animate
 * @param {number} startPos 
 * @param {number} endPos 
 */
const animateElTopBottom: AnimationCallback = (
  el: Element,
  startPos: number,
  endPos: number
): void => {
  gsap.fromTo(
    el,
    { y: startPos },
    {
      y: endPos,
      duration: 1,
      ease: "elastic.out(1,0.4)",
    }
  );
};

/**
 * @property {Function} animateElLeftRight - animate element by moving on X axis
 * @param {Element} el - DOM element to animate
 * @param {number} startPos 
 * @param {number} endPos 
 */
const animateElLeftRight: AnimationCallback = (
  el: Element,
  startPos: number,
  endPos: number
): void => {
  gsap.fromTo(
    el,
    { x: startPos },
    {
      x: endPos,
      duration: 1,
      ease: "elastic.out(1,0.4)",
    }
  );
};


/**
 * @property {Function} animateElZoom - animate element by zooming it in/out
 * @param {Element} el - DOM element to animate
 * @param {number} startRatio 
 * @param {number} endRatio
 * @param {number} easeRatio
 * @param {number} opacityStart - initial opacity
 * @param {number} opacityEnd - target opacity
 */
const animateElZoom: AnimationCallback = (
  el: Element,
  startRatio: number,
  endRatio: number,
  easeRatio: number = 0.4,
  opacityStart: number = 1,
  opacityEnd: number = 1
): void => {
  gsap.fromTo(
    el,
    {
      scaleX: startRatio,
      scaleY: startRatio,
      opacity: opacityStart,
    },
    {
      scaleX: endRatio,
      scaleY: endRatio,
      opacity: opacityEnd,
      duration: 1,
      ease: `elastic.out(1,${easeRatio})`,
    }
  );
};


/**
 * @property {Function} animateElRotation - animate element by rotating
 * @param {Element} el - DOM element to animate
 * @param {number} startPos
 * @param {number} endPos
 * @param {number} easeRatio
 */
const animateElRotation: AnimationCallback = (
  el: Element,
  startPos: number,
  endPos: number,
  easeRatio: number = 0.4
): void => {
  gsap.fromTo(
    el,
    { rotation: startPos },
    {
      rotation: endPos,
      duration: 1,
      ease: `elastic.out(1,${easeRatio})`,
    }
  );
};


/**
 * @property {Function} animateElFade - animate simple fade
 * @param {Element} el - DOM element to animate
 * @param {number} startPos
 * @param {number} endPos
 */
const animateElFade: AnimationCallback = (
  el: Element,
  startPos: number,
  endPos: number
): void => {
  gsap.fromTo(
    el,
    { opacity: startPos },
    {
      opacity: endPos,
      duration: 0.5,
      ease: `Expo.easeOut`,
    }
  );
};

export {
  animateElTopBottom,
  animateElLeftRight,
  animateElZoom,
  animateElRotation,
  animateElFade,
};

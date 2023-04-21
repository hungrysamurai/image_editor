import { gsap } from "gsap";

/**
 * @property {Function} animateElTopBottom - animate element by moving on Y axis
 * @param {HTMLElement} el - DOM element to animate
 * @param {number} startPos 
 * @param {number} endPos 
 * @returns {void}
 */
const animateElTopBottom = (el, startPos, endPos) => {
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
 * @param {HTMLElement} el - DOM element to animate
 * @param {number} startPos 
 * @param {number} endPos 
 * @returns {void}
 */
const animateElLeftRight = (el, startPos, endPos) => {
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
 * @param {HTMLElement} el - DOM element to animate
 * @param {number} startRatio 
 * @param {number} endRatio
 * @param {number} easeRatio
 * @param {number} opacityStart - initial opacity
 * @param {number} opacityEnd - target opacity
 * @returns {void}
 */
const animateElZoom = (
  el,
  startRatio,
  endRatio,
  easeRatio = 0.4,
  opacityStart = 1,
  opacityEnd = 1
) => {
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
 * @param {HTMLElement} el - DOM element to animate
 * @param {number} startPos
 * @param {number} endPos
 * @param {number} easeRatio
 * @returns {void}
 */
const animateElRotation = (el, startPos, endPos, easeRatio = 0.4) => {
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

const animateElFade = (el, start, end) => {
  gsap.fromTo(
    el,
    { opacity: start },
    {
      opacity: end,
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

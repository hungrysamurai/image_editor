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

// Drawing methods

/**
 * @property {Function} drawCircle - draw circle on canvas
 * @param {CanvasRenderingContex2d} ctx - context to draw on
 * @param {string} color - HEX value of current brush color
 * @param {number} size - size of circle to draw
 * @param {number} x - x-coordinates of circle
 * @param {number} y - y-coordinates of circle
 */
export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  color: string | undefined,
  size: number,
  x: number,
  y: number
): void => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  if (color) {
    ctx.fillStyle = color;
  }
  ctx.closePath();
  ctx.fill();
};

/**
 * @property {Function} drawLine - draw line between two positions on canvas
 * @param {CanvasRenderingContex2d} ctx - context to draw on
 * @param {string} color - HEX value of current brush color
 * @param {number} size - size of circle to draw
 * @param {number} x1 - x-coordinates of start
 * @param {number} y1 - y-coordinates of start
 * @param {number} x2 - x-coordinates of end
 * @param {number} y2 - y-coordinates of end
 */
export const drawLine = (
  ctx: CanvasRenderingContext2D,
  color: string | undefined,
  size: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (color) {
    ctx.strokeStyle = color;
  }
  ctx.lineWidth = size * 2;
  ctx.stroke();
};

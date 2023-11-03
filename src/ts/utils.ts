import {
  CreateDOMElementParams,
  BrushSizeAction,
  BrushMode,
  BrushDOMElementsObject,
} from "./types/imageEditor.types";

import ImageEditor from "./imageEditor";

/**
 * @property {Function} createDOMElement - create DOM HTML Elements with given params
 */
export const createDOMElement = <TagName extends keyof HTMLElementTagNameMap>(
  params: CreateDOMElementParams<TagName>
): HTMLElementTagNameMap[TagName] => {
  const element = document.createElement<TagName>(params.elementName);

  if (params.id) {
    element.id = params.id;
  }

  if (params.className) {
    element.className = params.className;
  }

  if (params.content) {
    element.innerHTML = params.content;
  }

  if (params.parentToAppend) {
    params.parentToAppend.appendChild(element);
  }

  if (params.attributes) {
    for (const [name, value] of Object.entries(params.attributes)) {
      element.setAttribute(name, value);
    }
  }

  return element;
};

/**
 * @property {Function} keyboardShortcuts - increase/decrease paint brush size by pressing '[' ']' buttons on keyboard
 * @param {KeyboardEvent} e - event object, that comes from listener that fires on keyboard input
 * @returns {void}
 */
export const addKeyboardShortcuts = (editor: ImageEditor): void => {
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (editor.paintingCanvas) {
      if (e.keyCode == 219) {
        editor.changeBrushSize(BrushSizeAction.Decrease);
      } else if (e.keyCode == 221) {
        editor.changeBrushSize(BrushSizeAction.Increase);
      }

      if (editor.brushCursor) {
        editor.brushCursor.style.width = `${editor.brushSize * 2}px`;
        editor.brushCursor.style.height = `${editor.brushSize * 2}px`;
      }
    }
  });
};

/**
 *
 * @property {Function} removeToolActiveStates - remove class 'active' from all provided elements
 * @param {HTMLCollection} elements
 */
export const removeToolActiveStates = (
  elements: NodeListOf<HTMLButtonElement>
): void => {
  elements.forEach((btn) => btn.classList.remove("active"));
};

/**
 *
 * @property {Function} setActivePaintModeDOM - Highlight DOM elements of paint mode
 */
export const setActivePaintModeDOM = (
  brushElements: BrushDOMElementsObject,
  mode: BrushMode
): void => {
  for (const element of Object.values(brushElements)) {
    element.classList.remove("active");
  }

  switch (mode) {
    case BrushMode.Paint:
      brushElements[BrushMode.Paint].classList.add("active");
      break;
    case BrushMode.Eraser:
      brushElements[BrushMode.Eraser].classList.add("active");
      break;
    case BrushMode.Blur:
      brushElements[BrushMode.Blur].classList.add("active");
      break;
  }
};

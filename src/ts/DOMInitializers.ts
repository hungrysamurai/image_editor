import { createDOMElement } from "./utils";

import ImageEditor from "./imageEditor";

import icons from "../assets/icons";
import { EditorMode } from "./types/imageEditor.types";

/**
* @property {Function} initImageDOM - creates image element from provided Blob URL
* @param {string} blob - blob URL of image
* @returns {HTMLElement} - img element for Cropper
*/
export const initImageDOM = (editor: ImageEditor, blob: string): HTMLImageElement => {
  editor.mainContainer.innerHTML = "";
  const imageContainer = createDOMElement({
    elementName: 'div',
    className: 'image-container',
    parentToAppend:
      editor.mainContainer
  });

  const imageElement = createDOMElement({
    elementName: 'img',
    className: 'image-element',
    parentToAppend: imageContainer,
    attributes: { src: blob }
  });

  // Set aspect ratio of imageContainer and init aspectRatio
  imageElement.onload = () => {
    const aspectRatio =
      imageElement.naturalWidth / imageElement.naturalHeight;

    // Set asp-ratio of container
    imageContainer.style.aspectRatio = `${aspectRatio} / 1`;
  };

  return imageElement;
}

/**
 * @property {Function} initCPDOM - create and append control panet (top panel) elements in DOM
 */
export const initCPDOM = (editor: ImageEditor): void => {
  // Add inner container
  const inner = createDOMElement({
    elementName: 'div',
    className: 'inner-container',
    parentToAppend: editor.cpContainer
  });

  // Add tools buttons
  const toolbox = createDOMElement({
    elementName: 'div',
    className: 'cp-toolbox',
    parentToAppend: inner
  });

  toolbox.append(editor.cropModeBtn);
  toolbox.append(editor.paintModeBtn);
  toolbox.append(editor.filtersModeBtn);
  toolbox.append(editor.rotationModeBtn);

  // Add zoom buttons
  const zoomButtons = createDOMElement({
    elementName: 'div',
    className: 'cp-zoom-buttons',
    parentToAppend: inner
  });

  zoomButtons.append(editor.cropperZoomInBtn);
  zoomButtons.append(editor.cropperZoomOutBtn);

  // Add undo button
  const undoContainer = createDOMElement({
    elementName: 'div',
    className: 'cp-undo-container',
    parentToAppend: inner
  })

  undoContainer.append(editor.cropperUndoBtn);

  // Add upload/download buttons
  const uploadDownloadBtns = createDOMElement({
    elementName: 'div',
    className: 'upload-download-buttons',
    parentToAppend: inner
  });

  // Create new upload btn
  editor.uploadNewImgBtn = createDOMElement({
    elementName: 'label',
    className: 'upload-btn-top',
    content: icons.uploadNewImage,
    attributes: { for: 'upload-input' }
  });

  uploadDownloadBtns.append(editor.imageFormatBtn);
  uploadDownloadBtns.append(editor.cropperDownloadBtn);
  uploadDownloadBtns.append(editor.uploadNewImgBtn);
}




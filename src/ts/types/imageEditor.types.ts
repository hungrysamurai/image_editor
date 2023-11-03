import Cropper from "cropperjs";

declare global {
 interface Cropper {
  image: HTMLImageElement;
  viewBox: HTMLSpanElement;
  croppedBox: HTMLImageElement;
  zoomOutWidth: number;
  cropped: boolean;
  imageCenter: Cropper.CanvasData
  options: Cropper.Options
 }
}

export enum EditorMode {
 Crop = "crop",
 Paint = "paint",
 Filters = "filters",
 Rotation = "rotation"
}

export enum BrushMode {
 Paint = "paint",
 Blur = "blur",
 Eraser = "eraser"
}

export type BrushDOMElementsObject = {
 [key in BrushMode]: HTMLButtonElement
}

export enum ImageMimeType {
 JPEG = "image/jpeg",
 PNG = "image/png",
 WEBP = "image/webp"
}

type ImageFormat = [ImageMimeType, number, string];

export type ImageFormats = ImageFormat[];

export enum Filters {
 brightness = 'brightness',
 contrast = 'contrast',
 saturation = 'saturation',
 inversion = 'inversion',
 blur = 'blur',
 hue = 'hue'
}

export type FiltersState = {
 [key in Filters]: number;
}

export enum LoadingState {
 Hide = 'hide',
 Show = 'show'
}

export enum ZoomButtonsState {
 ZoomOut = 'full-out',
 Paint = 'paint',
 Active = 'both-active',
}

export enum BrushSizeAction {
 Increase = "increase",
 Decrease = 'decrease'
}

export interface CreateDOMElementParams<TagName> {
 elementName: TagName,
 id?: string,
 className?: string
 content?: string,
 parentToAppend?: HTMLElement,
 attributes?: {
  [key: string]: string;
 },
}

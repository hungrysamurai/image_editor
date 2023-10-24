import Cropper from "cropperjs";

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

export enum EditorMode {
 Crop = "crop",
 Paint = "paint",
 Filters = "filters",
 Rotation = "rotation"
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

export class CropperExtended extends Cropper {
 image!: HTMLImageElement;
 viewBox!: HTMLSpanElement;
 croppedBox!: HTMLImageElement;
 zoomOutWidth!: number;
 cropped!: boolean;
 imageCenter!: Cropper.CanvasData
 options!: Cropper.Options
}

export interface CreateDOMElementParams<tagName> {
 elementName: tagName,
 id?: string,
 className?: string
 content?: string,
 parentToAppend?: HTMLElement,
 attributes?: {
  [key: string]: string;
 },
}

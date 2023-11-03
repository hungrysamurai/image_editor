export interface IconsList {
 [key: string]: string
}

export type AnimationCallback = (
 element: Element,
 startPosition: number,
 endPosition: number,
 easeRatio?: number,
 opacityStart?: number,
 opacityEnd?: number
) => void;
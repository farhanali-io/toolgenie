declare module 'gifenc' {
  export function GIFEncoder(opts?: any): any;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, format?: any): any;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: any, format?: any): any;
  export const nearestColor: any;
  export const nearestColorIndex: any;
  export const snapColorsToPalette: any;
}

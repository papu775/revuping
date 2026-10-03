import 'react';
import { FC } from 'react';
import { SvgProps } from 'react-native-svg';

// Extend JSX namespace for SVG elements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.DetailedHTMLProps<React.SVGAttributes<SVGSVGElement>, SVGSVGElement>;
      circle: React.DetailedHTMLProps<React.SVGAttributes<SVGCircleElement>, SVGCircleElement>;
      polyline: React.DetailedHTMLProps<React.SVGAttributes<SVGPolylineElement>, SVGPolylineElement>;
      path: React.DetailedHTMLProps<React.SVGAttributes<SVGPathElement>, SVGPathElement>;
      g: React.DetailedHTMLProps<React.SVGAttributes<SVGGElement>, SVGGElement>;
      rect: React.DetailedHTMLProps<React.SVGAttributes<SVGRectElement>, SVGRectElement>;
      text: React.DetailedHTMLProps<React.SVGAttributes<SVGTextElement>, SVGTextElement>;
      tspan: React.DetailedHTMLProps<React.SVGAttributes<SVGTSpanElement>, SVGTSpanElement>;
      linearGradient: React.DetailedHTMLProps<React.SVGAttributes<SVGLinearGradientElement>, SVGLinearGradientElement>;
      stop: React.DetailedHTMLProps<React.SVGAttributes<SVGStopElement>, SVGStopElement>;
      defs: React.DetailedHTMLProps<React.SVGAttributes<SVGDefsElement>, SVGDefsElement>;
      image: React.DetailedHTMLProps<React.SVGAttributes<SVGImageElement>, SVGImageElement>;
      marker: React.DetailedHTMLProps<React.SVGAttributes<SVGMarkerElement>, SVGMarkerElement>;
      symbol: React.DetailedHTMLProps<React.SVGAttributes<SVGSymbolElement>, SVGSymbolElement>;
      use: React.DetailedHTMLProps<React.SVGAttributes<SVGUseElement>, SVGUseElement>;
      ellipse: React.DetailedHTMLProps<React.SVGAttributes<SVGEllipseElement>, SVGEllipseElement>;
      line: React.DetailedHTMLProps<React.SVGAttributes<SVGLineElement>, SVGLineElement>;
      polygon: React.DetailedHTMLProps<React.SVGAttributes<SVGPolygonElement>, SVGPolygonElement>;
      radialGradient: React.DetailedHTMLProps<React.SVGAttributes<SVGRadialGradientElement>, SVGRadialGradientElement>;
      mask: React.DetailedHTMLProps<React.SVGAttributes<SVGMaskElement>, SVGMaskElement>;
      clipPath: React.DetailedHTMLProps<React.SVGAttributes<SVGClipPathElement>, SVGClipPathElement>;
      foreignObject: React.DetailedHTMLProps<React.SVGAttributes<SVGForeignObjectElement>, SVGForeignObjectElement>;
      pattern: React.DetailedHTMLProps<React.SVGAttributes<SVGPatternElement>, SVGPatternElement>;
      textPath: React.DetailedHTMLProps<React.SVGAttributes<SVGTextPathElement>, SVGTextPathElement>;
    }
  }
}

// Declare the react-native-svg module with proper JSX component types
declare module 'react-native-svg' {
  import { FC, ComponentType } from 'react';
  
  // Export all components as FC
  export const Svg: FC<SvgProps>;
  export const Circle: FC<{ cx: number | string; cy: number | string; r: number | string; fill?: string; stroke?: string; strokeWidth?: number | string }>;
  export const Polyline: FC<{ points: string; fill?: string; stroke?: string; strokeWidth?: number | string; strokeLinecap?: string; strokeLinejoin?: string }>;
  export const Path: FC<{ d: string; fill?: string; stroke?: string; strokeWidth?: number | string }>;
  export const G: FC<{ children?: React.ReactNode }>;
  export const Rect: FC<{ x?: number | string; y?: number | string; width: number | string; height: number | string; fill?: string; stroke?: string; strokeWidth?: number | string }>;
  export const Text: FC<{ x?: number | string; y?: number | string; fill?: string; fontSize?: number | string; children?: React.ReactNode }>;
  export const TSpan: FC<{ x?: number | string; y?: number | string; fill?: string; fontSize?: number | string; children?: React.ReactNode }>;
  export const LinearGradient: FC<{ id: string; x1?: string; y1?: string; x2?: string; y2?: string; children?: React.ReactNode }>;
  export const Stop: FC<{ offset: string; stopColor: string; stopOpacity?: number }>;
  export const Defs: FC<{ children?: React.ReactNode }>;
  export const Image: FC<{ x?: number | string; y?: number | string; width: number | string; height: number | string; href?: string; preserveAspectRatio?: string }>;
  export const Marker: FC<{ id: string; viewBox?: string; markerWidth?: number; markerHeight?: number; orient?: string; children?: React.ReactNode }>;
  export const Symbol: FC<{ id: string; viewBox?: string; children?: React.ReactNode }>;
  export const Use: FC<{ href: string; x?: number | string; y?: number | string }>;
  export const Ellipse: FC<{ cx: number | string; cy: number | string; rx: number | string; ry: number | string; fill?: string; stroke?: string; strokeWidth?: number | string }>;
  export const Line: FC<{ x1: number | string; y1: number | string; x2: number | string; y2: number | string; stroke?: string; strokeWidth?: number | string }>;
  export const Polygon: FC<{ points: string; fill?: string; stroke?: string; strokeWidth?: number | string }>;
  export const RadialGradient: FC<{ id: string; cx?: string; cy?: string; r?: string; fx?: string; fy?: string; children?: React.ReactNode }>;
  export const Stop: FC<{ offset: string; stopColor: string; stopOpacity?: number }>;
  export const Mask: FC<{ id: string; children?: React.ReactNode }>;
  export const ClipPath: FC<{ id: string; children?: React.ReactNode }>;
  export const ForeignObject: FC<{ x?: number | string; y?: number | string; width: number | string; height: number | string; children?: React.ReactNode }>;
  export const Pattern: FC<{ id: string; x?: number | string; y?: number | string; width: number | string; height: number | string; patternUnits?: string; children?: React.ReactNode }>;
  export const TextPath: FC<{ href: string; startOffset?: string; children?: React.ReactNode }>;
  
  const Svg: FC<SvgProps>;
  export default Svg;
}

// Declare the react-native-qrcode-svg module
declare module 'react-native-qrcode-svg' {
  import { FC } from 'react';
  
  interface QRCodeSvgProps {
    value?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logoSVG?: FC<SvgProps> | string;
    logo?: { uri: string } | string;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    gradientDirection?: string[];
    linearGradient?: string[];
    getRef?: (c: any) => any;
    ecl?: 'L' | 'M' | 'Q' | 'H';
    onError?: Function;
    testID?: string;
  }
  
  const QRCodeSvg: FC<QRCodeSvgProps>;
  export default QRCodeSvg;
}

// Also declare the components as valid JSX element types
declare global {
  namespace JSX {
    interface ElementClass {
      Svg: FC<SvgProps>;
      QRCodeSvg: FC<{
        value?: string;
        size?: number;
        color?: string;
        backgroundColor?: string;
      }>;
    }
  }
}
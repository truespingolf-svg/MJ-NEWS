/**
 * Type definitions for MJ Newspaper Studio
 */

export type PageLayoutId =
  | 'front-cover'
  | 'layout-top-hero'
  | 'layout-vertical-trio'
  | 'layout-left-split'
  | 'layout-center-feature'
  | 'layout-horizontal-triptych'
  | 'layout-editorial-asymmetric'
  | 'layout-classic-dispatch'
  | 'layout-headline-spread';

export type FontChoice =
  | 'playfair'
  | 'cinzel'
  | 'bodoni'
  | 'source-serif'
  | 'merriweather'
  | 'oswald'
  | 'courier';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'vintage-contrast';

export interface TextElement {
  id: string;
  type: 'text';
  role:
    | 'masthead'
    | 'motto'
    | 'headline'
    | 'subhead'
    | 'kicker'
    | 'body'
    | 'caption'
    | 'dateline'
    | 'byline'
    | 'pullquote'
    | 'lead';
  content: string;
  fontFamily: FontChoice;
  fontSize: number; // in pt/px equivalent
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  italic: boolean;
  underline?: boolean;
  uppercase?: boolean;
  align: TextAlign;
  color: string;
  columns?: 1 | 2 | 3;
  dropCap?: boolean;
  lineHeight?: number;
  letterSpacing?: string;
}

export interface ImageElement {
  id: string;
  type: 'image';
  slotIndex: 1 | 2 | 3; // Every page has exactly 3 image placeholders!
  url: string | null;
  caption: string;
  credit?: string;
  fit: 'cover' | 'contain';
  zoom: number; // 1.0 to 2.5
  panX: number; // -50% to +50%
  panY: number; // -50% to +50%
  filter: ImageFilter;
  label?: string; // e.g. "Main Hero Photograph"
}

export interface NewspaperPage {
  id: string;
  pageNumber: number;
  isCover: boolean;
  layoutId: PageLayoutId;
  pageHeader: {
    editionName: string;
    dateText: string;
    issueNumber: string;
    priceText: string;
    sectionTitle?: string;
  };
  texts: Record<string, TextElement>;
  images: {
    image1: ImageElement;
    image2: ImageElement;
    image3: ImageElement;
  };
}

export interface NewspaperProject {
  id: string;
  title: string;
  subtitle?: string;
  createdAt: string;
  updatedAt: string;
  pages: NewspaperPage[];
}

export interface LayoutDescriptor {
  id: PageLayoutId;
  name: string;
  description: string;
  category: 'cover' | 'interior';
  thumbnailWireframe: string; // descriptive SVG or schematic
}

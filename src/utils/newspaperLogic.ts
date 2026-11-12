import {
  NewspaperProject,
  NewspaperPage,
  PageLayoutId,
  TextElement,
  ImageElement,
  LayoutDescriptor,
} from '../types/newspaper.ts';

/**
 * Creates default 3 image placeholders for any page.
 * Every page (cover or interior) strictly has 3 image placeholders.
 */
export function createDefaultImagePlaceholders(pageId: string): {
  image1: ImageElement;
  image2: ImageElement;
  image3: ImageElement;
} {
  return {
    image1: {
      id: `${pageId}-img-1`,
      type: 'image',
      slotIndex: 1,
      url: null,
      caption: 'Click to edit photograph caption and details.',
      credit: 'Press Wire / Studio Archive',
      fit: 'cover',
      zoom: 1,
      panX: 0,
      panY: 0,
      filter: 'none',
      label: 'Photograph 1',
    },
    image2: {
      id: `${pageId}-img-2`,
      type: 'image',
      slotIndex: 2,
      url: null,
      caption: 'Click to edit photograph caption and details.',
      credit: 'Press Wire / Studio Archive',
      fit: 'cover',
      zoom: 1,
      panX: 0,
      panY: 0,
      filter: 'none',
      label: 'Photograph 2',
    },
    image3: {
      id: `${pageId}-img-3`,
      type: 'image',
      slotIndex: 3,
      url: null,
      caption: 'Click to edit photograph caption and details.',
      credit: 'Press Wire / Studio Archive',
      fit: 'cover',
      zoom: 1,
      panX: 0,
      panY: 0,
      filter: 'none',
      label: 'Photograph 3',
    },
  };
}

/**
 * Generates initial Front Cover Page with authentic broadsheet sections
 */
export function createFrontCoverPage(pageNumber: number = 1): NewspaperPage {
  const pageId = `page-${Date.now()}-cover`;
  const images = createDefaultImagePlaceholders(pageId);
  images.image1.label = 'Front Page Lead Photograph';
  images.image2.label = 'Special Feature Photograph';
  images.image3.label = 'Spotlight Archive Photograph';

  const texts: Record<string, TextElement> = {
    masthead: {
      id: `${pageId}-masthead`,
      type: 'text',
      role: 'masthead',
      content: 'THE KING OF POP CHRONICLE',
      fontFamily: 'cinzel',
      fontSize: 48,
      fontWeight: 'black',
      italic: false,
      align: 'center',
      color: '#111111',
      letterSpacing: '0.04em',
    },
    motto: {
      id: `${pageId}-motto`,
      type: 'text',
      role: 'motto',
      content: 'THE OFFICIAL RECORD OF THE GREATEST ENTERTAINER OF ALL TIME',
      fontFamily: 'oswald',
      fontSize: 10,
      fontWeight: 'semibold',
      italic: false,
      align: 'center',
      color: '#444444',
      letterSpacing: '0.15em',
      uppercase: true,
    },
    topKicker: {
      id: `${pageId}-topKicker`,
      type: 'text',
      role: 'kicker',
      content: 'SPECIAL WORLD TOUR COMMEMORATIVE EDITION',
      fontFamily: 'oswald',
      fontSize: 12,
      fontWeight: 'bold',
      italic: false,
      align: 'center',
      color: '#8b0000',
      letterSpacing: '0.12em',
      uppercase: true,
    },
    mainHeadline: {
      id: `${pageId}-mainHeadline`,
      type: 'text',
      role: 'headline',
      content: 'MAIN HEADLINE: ENTERPRISE OF LEGENDARY MUSIC HISTORY',
      fontFamily: 'playfair',
      fontSize: 40,
      fontWeight: 'bold',
      italic: false,
      align: 'center',
      color: '#111111',
      lineHeight: 1.1,
    },
    subhead: {
      id: `${pageId}-subhead`,
      type: 'text',
      role: 'subhead',
      content: 'Secondary Headline Detailing Historic Musical Innovations And Record-Breaking Triumphs',
      fontFamily: 'merriweather',
      fontSize: 16,
      fontWeight: 'normal',
      italic: true,
      align: 'center',
      color: '#333333',
    },
    leadArticleHeadline: {
      id: `${pageId}-leadArticleHeadline`,
      type: 'text',
      role: 'headline',
      content: 'A Monumental Journey Through The Golden Eras Of Sound',
      fontFamily: 'playfair',
      fontSize: 22,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#111111',
    },
    leadArticleBody: {
      id: `${pageId}-leadArticleBody`,
      type: 'text',
      role: 'body',
      content:
        'Article Text: Enter your primary news story here. Detail the monumental performances, electrifying choreography, and cultural phenomenon that captivated millions across stadiums worldwide.\n\nFrom groundbreaking short films to pioneering vocal rhythms, this column documents the milestones of artistic mastery that forever redefined global entertainment standards.',
      fontFamily: 'source-serif',
      fontSize: 13,
      fontWeight: 'normal',
      italic: false,
      align: 'justify',
      color: '#1a1a1a',
      columns: 2,
      dropCap: true,
      lineHeight: 1.5,
    },
    secondaryHeadline: {
      id: `${pageId}-secondaryHeadline`,
      type: 'text',
      role: 'headline',
      content: 'Behind The Scenes: Studio Sessions That Revolutionized Modern Pop',
      fontFamily: 'playfair',
      fontSize: 18,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#111111',
    },
    secondaryBody: {
      id: `${pageId}-secondaryBody`,
      type: 'text',
      role: 'body',
      content:
        'Article Text: In-depth report covering the recording craftsmanship, analog engineering, and legendary basslines. Collaborators recount the dedication to sonic perfection that produced unmatched diamond-certified masterpieces.',
      fontFamily: 'source-serif',
      fontSize: 12,
      fontWeight: 'normal',
      italic: false,
      align: 'justify',
      color: '#222222',
      columns: 1,
      lineHeight: 1.45,
    },
    sidebarHeadline: {
      id: `${pageId}-sidebarHeadline`,
      type: 'text',
      role: 'headline',
      content: 'Global Dispatch: Milestone Tour Records',
      fontFamily: 'oswald',
      fontSize: 15,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#111111',
      uppercase: true,
    },
    sidebarBody: {
      id: `${pageId}-sidebarBody`,
      type: 'text',
      role: 'body',
      content:
        'Special dispatch highlighting stadium attendance records across London, Tokyo, Paris, and Los Angeles. Fans gathered in historic numbers to witness the iconic moonwalk in person.',
      fontFamily: 'source-serif',
      fontSize: 11,
      fontWeight: 'normal',
      italic: false,
      align: 'left',
      color: '#333333',
      columns: 1,
      lineHeight: 1.4,
    },
  };

  return {
    id: pageId,
    pageNumber,
    isCover: true,
    layoutId: 'front-cover',
    pageHeader: {
      editionName: 'FIRST EDITION / WORLDWIDE CIRCULATION',
      dateText: 'SATURDAY, NOVEMBER 7, 2026',
      issueNumber: 'NO. 1958',
      priceText: 'FIFTY CENTS',
    },
    texts,
    images,
  };
}

/**
 * Creates default texts for an interior page depending on selected layout
 */
export function createInteriorPageTexts(
  pageId: string,
  layoutId: PageLayoutId,
  pageNumber: number
): Record<string, TextElement> {
  const baseTexts: Record<string, TextElement> = {
    sectionKicker: {
      id: `${pageId}-sectionKicker`,
      type: 'text',
      role: 'kicker',
      content: `FEATURE REPORT • SECTION ${String.fromCharCode(64 + pageNumber)}`,
      fontFamily: 'oswald',
      fontSize: 11,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#8b0000',
      letterSpacing: '0.1em',
      uppercase: true,
    },
    pageHeadline: {
      id: `${pageId}-pageHeadline`,
      type: 'text',
      role: 'headline',
      content: 'Main Headline: Enter Your Primary Story Title Here',
      fontFamily: 'playfair',
      fontSize: 32,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#111111',
      lineHeight: 1.15,
    },
    subhead: {
      id: `${pageId}-subhead`,
      type: 'text',
      role: 'subhead',
      content: 'Supporting headline providing essential context, quotes, and timeline background for this page.',
      fontFamily: 'merriweather',
      fontSize: 14,
      fontWeight: 'normal',
      italic: true,
      align: 'left',
      color: '#444444',
    },
    mainArticleBody: {
      id: `${pageId}-mainArticleBody`,
      type: 'text',
      role: 'body',
      content:
        'Article Text: Enter your full news report or commentary here. Detailed descriptions of live concerts, legendary costumes, vocal precision, and global philanthropy can be seamlessly composed across traditional newspaper columns.\n\nEvery paragraph preserves authentic broadsheet leading and crisp justification, allowing your stories to read like genuine vintage press dispatches.',
      fontFamily: 'source-serif',
      fontSize: 12,
      fontWeight: 'normal',
      italic: false,
      align: 'justify',
      color: '#1a1a1a',
      columns: 2,
      dropCap: true,
      lineHeight: 1.5,
    },
    secondaryHeadline: {
      id: `${pageId}-secondaryHeadline`,
      type: 'text',
      role: 'headline',
      content: 'Secondary Article: Archival Notes & Reflections',
      fontFamily: 'playfair',
      fontSize: 20,
      fontWeight: 'bold',
      italic: false,
      align: 'left',
      color: '#111111',
    },
    secondaryArticleBody: {
      id: `${pageId}-secondaryArticleBody`,
      type: 'text',
      role: 'body',
      content:
        'Article Text: Secondary column providing additional details, eyewitness accounts, discography milestones, or critical reception notes. Edit this text freely in the side panel or directly on the canvas.',
      fontFamily: 'source-serif',
      fontSize: 11,
      fontWeight: 'normal',
      italic: false,
      align: 'justify',
      color: '#2b2b2b',
      columns: 1,
      lineHeight: 1.45,
    },
    pullQuote: {
      id: `${pageId}-pullQuote`,
      type: 'text',
      role: 'pullquote',
      content: '“To create something that touches the world, you have to pour your whole soul into every single beat.”',
      fontFamily: 'bodoni',
      fontSize: 18,
      fontWeight: 'bold',
      italic: true,
      align: 'center',
      color: '#111111',
    },
  };

  return baseTexts;
}

/**
 * Creates a brand new interior page with a chosen layout.
 * Enforces requirement: EVERY interior page MUST have exactly THREE image placeholders.
 */
export function createInteriorPage(
  layoutId: PageLayoutId,
  pageNumber: number
): NewspaperPage {
  const pageId = `page-${Date.now()}-${pageNumber}`;
  const images = createDefaultImagePlaceholders(pageId);
  const texts = createInteriorPageTexts(pageId, layoutId, pageNumber);

  return {
    id: pageId,
    pageNumber,
    isCover: false,
    layoutId,
    pageHeader: {
      editionName: 'THE KING OF POP CHRONICLE',
      dateText: 'SATURDAY, NOVEMBER 7, 2026',
      issueNumber: `PAGE ${pageNumber}`,
      priceText: 'FIFTY CENTS',
      sectionTitle: `HISTORIC ARCHIVES • PAGE ${pageNumber}`,
    },
    texts,
    images,
  };
}

/**
 * Creates a new project with initial Front Cover.
 */
export function createNewProject(title: string = 'Untitled MJJ Broadsheet'): NewspaperProject {
  const coverPage = createFrontCoverPage(1);
  const now = new Date().toISOString();

  return {
    id: `project-${Date.now()}`,
    title,
    subtitle: 'Commemorative Newspaper Edition',
    createdAt: now,
    updatedAt: now,
    pages: [coverPage],
  };
}

/**
 * Duplicates a page within the project and appends it right after
 */
export function duplicatePage(
  project: NewspaperProject,
  pageId: string
): NewspaperProject {
  const targetIndex = project.pages.findIndex((p) => p.id === pageId);
  if (targetIndex === -1) return project;

  const originalPage = project.pages[targetIndex];
  const newPageId = `page-${Date.now()}-dup`;

  // Deep clone texts with new IDs
  const clonedTexts: Record<string, TextElement> = {};
  for (const [key, text] of Object.entries(originalPage.texts)) {
    clonedTexts[key] = {
      ...text,
      id: `${newPageId}-${key}`,
    };
  }

  // Deep clone images with new IDs
  const clonedImages = {
    image1: { ...originalPage.images.image1, id: `${newPageId}-img-1` },
    image2: { ...originalPage.images.image2, id: `${newPageId}-img-2` },
    image3: { ...originalPage.images.image3, id: `${newPageId}-img-3` },
  };

  const newPage: NewspaperPage = {
    ...originalPage,
    id: newPageId,
    isCover: false, // Duplicated pages become interior pages
    pageNumber: targetIndex + 2,
    texts: clonedTexts,
    images: clonedImages,
  };

  const newPages = [...project.pages];
  newPages.splice(targetIndex + 1, 0, newPage);

  // Recalculate page numbers sequentially
  const renumberedPages = newPages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    pages: renumberedPages,
  };
}

/**
 * Deletes a page from the project.
 * Front cover cannot be deleted if it is the only page.
 */
export function deletePage(
  project: NewspaperProject,
  pageId: string
): NewspaperProject {
  if (project.pages.length <= 1) {
    return project; // Do not delete the only page
  }

  const newPages = project.pages.filter((p) => p.id !== pageId);
  const renumberedPages = newPages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    isCover: index === 0, // Ensure first page is marked cover
  }));

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    pages: renumberedPages,
  };
}

/**
 * Reorders pages within the project
 */
export function reorderPages(
  project: NewspaperProject,
  fromIndex: number,
  toIndex: number
): NewspaperProject {
  if (
    fromIndex < 0 ||
    fromIndex >= project.pages.length ||
    toIndex < 0 ||
    toIndex >= project.pages.length ||
    fromIndex === toIndex
  ) {
    return project;
  }

  const pages = [...project.pages];
  const [movedPage] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, movedPage);

  const renumberedPages = pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    isCover: index === 0,
  }));

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    pages: renumberedPages,
  };
}

/**
 * Changes layout of an existing page while preserving existing images and texts where possible
 */
export function changePageLayout(
  page: NewspaperPage,
  newLayoutId: PageLayoutId
): NewspaperPage {
  if (page.layoutId === newLayoutId) return page;

  return {
    ...page,
    layoutId: newLayoutId,
    // Note: All images (image1, image2, image3) are preserved!
  };
}

/**
 * Updates a specific text element on a page
 */
export function updateTextElement(
  page: NewspaperPage,
  textId: string,
  updates: Partial<TextElement>
): NewspaperPage {
  let updatedKey: string | null = null;
  for (const [key, text] of Object.entries(page.texts)) {
    if (text.id === textId) {
      updatedKey = key;
      break;
    }
  }

  if (!updatedKey) return page;

  return {
    ...page,
    texts: {
      ...page.texts,
      [updatedKey]: {
        ...page.texts[updatedKey],
        ...updates,
      },
    },
  };
}

/**
 * Updates a specific image element on a page
 */
export function updateImageElement(
  page: NewspaperPage,
  slot: 'image1' | 'image2' | 'image3',
  updates: Partial<ImageElement>
): NewspaperPage {
  return {
    ...page,
    images: {
      ...page.images,
      [slot]: {
        ...page.images[slot],
        ...updates,
      },
    },
  };
}

/**
 * Resets an image slot back to placeholder
 */
export function resetImageSlot(
  page: NewspaperPage,
  slot: 'image1' | 'image2' | 'image3'
): NewspaperPage {
  return updateImageElement(page, slot, {
    url: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    filter: 'none',
    caption: 'Click to edit photograph caption and details.',
    credit: 'Press Wire / Studio Archive',
  });
}

/**
 * Returns metadata descriptors for all available layouts (Front Cover + 8 Interior Layouts)
 */
export function getAvailableLayouts(): LayoutDescriptor[] {
  return [
    {
      id: 'front-cover',
      name: 'Front Cover Broadsheet',
      description: 'Iconic masthead, edition date banner, main headline, 3 photo slots & lead editorial column.',
      category: 'cover',
      thumbnailWireframe: 'cover',
    },
    {
      id: 'layout-top-hero',
      name: '1. Top Hero & Twin Sub-Photos',
      description: 'One large wide photograph at the top with two supporting photographs side-by-side underneath.',
      category: 'interior',
      thumbnailWireframe: 'top-hero',
    },
    {
      id: 'layout-vertical-trio',
      name: '2. Vertical Triple Column',
      description: 'Three equal-sized photographs arranged vertically in an elegant side column.',
      category: 'interior',
      thumbnailWireframe: 'vertical-trio',
    },
    {
      id: 'layout-left-split',
      name: '3. Left Dual Stack & Right Feature',
      description: 'Two photographs stacked on the left and one large feature photograph on the right.',
      category: 'interior',
      thumbnailWireframe: 'left-split',
    },
    {
      id: 'layout-center-feature',
      name: '4. Centered Showpiece & Flanks',
      description: 'One prominent centre photograph flanked by two smaller side photographs.',
      category: 'interior',
      thumbnailWireframe: 'center-feature',
    },
    {
      id: 'layout-horizontal-triptych',
      name: '5. Panoramic Triptych',
      description: 'Three photographs arranged in a balanced horizontal row across the page width.',
      category: 'interior',
      thumbnailWireframe: 'horizontal-triptych',
    },
    {
      id: 'layout-editorial-asymmetric',
      name: '6. Asymmetrical Modern Editorial',
      description: 'Dynamic editorial photo layout with varying photo sizes and modern newspaper styling.',
      category: 'interior',
      thumbnailWireframe: 'editorial-asymmetric',
    },
    {
      id: 'layout-classic-dispatch',
      name: '7. Classic Triple Dispatch',
      description: 'Traditional newspaper article layout with three separate image sections interspersed with news columns.',
      category: 'interior',
      thumbnailWireframe: 'classic-dispatch',
    },
    {
      id: 'layout-headline-spread',
      name: '8. Bold Headline & Dispersed Trio',
      description: 'Large headline layout with three photographs distributed across key sections of the page.',
      category: 'interior',
      thumbnailWireframe: 'headline-spread',
    },
  ];
}

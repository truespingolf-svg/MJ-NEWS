/**
 * Type definitions for NexPaper Studio - Ticket & Invitation Studio
 */

export type TicketDocumentType =
  | 'vip-invitation'
  | 'general-admission'
  | 'vip-access-pass'
  | 'concert-ticket'
  | 'birthday-invitation'
  | 'executive-summit-pass'
  | 'corporate-invitation'
  | 'gala-dinner'
  | 'award-ceremony'
  | 'exclusive-private'
  | 'launch-event'
  | 'conference-pass'
  | 'backstage-pass'
  | 'festival-ticket'
  | 'staff-access-pass'
  | 'digital-membership'
  | 'custom-invitation';

export type TicketStyleTheme =
  | 'luxury-gold'
  | 'modern-minimalist'
  | 'hollywood-premiere'
  | 'royal-elegance'
  | 'neon-futuristic'
  | 'corporate-professional'
  | 'concert-music'
  | 'classic-vintage'
  | 'black-tie'
  | 'exclusive-vip'
  | 'creative-artistic';

export type TicketOrientation = 'landscape' | 'portrait';

export interface TicketProject {
  id: string;
  title: string;
  type: TicketDocumentType;
  theme: TicketStyleTheme;
  orientation: TicketOrientation;
  createdAt: string;
  updatedAt: string;

  // Event Details
  eventTitle: string;
  eventSubtitle?: string;
  guestName: string;
  eventDescription: string;
  dateText: string;
  timeText: string;
  venueName: string;
  venueAddress: string;
  hostOrganization: string;

  // Ticketing Credentials
  ticketCategory: string; // e.g. "DIAMOND VIP", "ALL ACCESS"
  ticketNumber: string; // e.g. "NXP-773821"
  seatNumber?: string; // e.g. "Row AA • Seat 1"
  accessLevel: string; // e.g. "Backstage, Lounge & Main Arena"
  dressCode?: string; // e.g. "Black Tie Formal"
  rsvpDetails?: string; // e.g. "RSVP by Dec 1st to rsvp@event.com"
  instructions?: string; // e.g. "Photo ID required at entrance. Non-transferable."
  contactInfo?: string;
  footerText?: string;

  // Visual Customization
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  personalPhotoUrl?: string;
  fontFamily: 'playfair' | 'cinzel' | 'bodoni' | 'source-serif' | 'oswald' | 'courier' | 'sans';
  hasBarcode: boolean;
  hasQrCode: boolean;
  qrPayload?: string; // text or URL encoded in the QR code
  customQrImageUrl?: string; // uploaded custom QR code image URL or dataURL
  hasWatermark: boolean;
  watermarkText?: string;
  showBackSide: boolean; // toggle front vs back in editor

  // Back side content
  backTitle?: string;
  backSchedule?: string;
  backTerms?: string;
  backDisclaimer?: string;
  backContact?: string;
}

export interface TicketBatchOptions {
  quantity: number;
  prefix: string;
  startNumber: number;
  guestList: string[]; // names or guest identifiers
}

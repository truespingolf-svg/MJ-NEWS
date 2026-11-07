/**
 * Type definitions for Organisation Branding Kit in NexPaper Studio
 */

export interface OrganizationBranding {
  id: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string; // e.g. hex #d97706 or #0f172a
  secondaryColor: string; // e.g. hex #1e293b or #f59e0b
  preferredFont: 'playfair' | 'cinzel' | 'bodoni' | 'source-serif' | 'oswald' | 'courier' | 'sans';
  address: string;
  email: string;
  phone: string;
  website: string;
  officialFooter: string;
  registrationNumber?: string;
  updatedAt: string;
}

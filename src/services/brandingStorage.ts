import { OrganizationBranding } from '../types/branding.ts';

const BRANDING_STORAGE_KEY = 'nexpaper_org_branding_v1';

export const DEFAULT_BRANDING: OrganizationBranding = {
  id: 'org-default',
  name: 'NexPaper Global Enterprises',
  tagline: 'Excellence in Enterprise Governance & Creative Publishing',
  logoUrl: '',
  primaryColor: '#d97706', // amber gold
  secondaryColor: '#0f172a', // dark navy slate
  preferredFont: 'cinzel',
  address: '100 Avenue of the Americas, Suite 4000, New York, NY 10013',
  email: 'governance@nexpaperstudio.com',
  phone: '+1 (212) 555-0199',
  website: 'www.nexpaperstudio.com',
  officialFooter: 'NexPaper Studio Enterprise Publishing • Registered Corporate Instrument • All Rights Reserved',
  registrationNumber: 'CORP-NY-849204-B',
  updatedAt: new Date().toISOString(),
};

export function loadOrganizationBranding(): OrganizationBranding {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) {
      saveOrganizationBranding(DEFAULT_BRANDING);
      return DEFAULT_BRANDING;
    }
    return JSON.parse(raw) as OrganizationBranding;
  } catch (e) {
    console.error('Failed to load organization branding:', e);
    return DEFAULT_BRANDING;
  }
}

export function saveOrganizationBranding(branding: OrganizationBranding): void {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
  } catch (e) {
    console.error('Failed to save organization branding:', e);
  }
}

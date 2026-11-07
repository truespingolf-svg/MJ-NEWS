import { TicketProject, TicketDocumentType, TicketStyleTheme } from '../types/ticket.ts';

const TICKETS_STORAGE_KEY = 'nexpaper_tickets_projects_v1';

export const STARTER_TICKETS: TicketProject[] = [
  {
    id: 'ticket-starter-vip-gold',
    title: 'Grand Royal Gala VIP Pass',
    type: 'vip-event-invitations' as unknown as TicketDocumentType,
    theme: 'luxury-gold',
    orientation: 'landscape',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventTitle: 'THE CORONATION GALA & PHILANTHROPY BANQUET',
    eventSubtitle: 'An Exclusive Evening of Sovereign Elegance & Distinction',
    guestName: 'Hon. Alexandra Vance & Guest',
    eventDescription:
      'You are cordially summoned to an unparalleled night of high society, symphony, and fine gastronomy honoring global humanitarian ambassadors.',
    dateText: 'Saturday, November 28, 2026',
    timeText: 'Reception: 7:00 PM • Banquet: 8:30 PM',
    venueName: 'The St. Regis Grand Imperial Ballroom',
    venueAddress: 'Two East 55th Street, New York, NY 10022',
    hostOrganization: 'NexPaper Heritage Foundation',
    ticketCategory: 'ROYAL DIAMOND VIP',
    ticketNumber: 'NXP-GLD-882910',
    seatNumber: 'Table 04 • Tier A',
    accessLevel: 'All-Access Pass • Sovereign Lounge • Private Balcony',
    dressCode: 'Black Tie Formal & Royal Accents',
    rsvpDetails: 'RSVP strictly required by November 15 to protocol@nexpaperheritage.org',
    instructions: 'Present this credential with government photographic ID. Valet parking on 55th St.',
    contactInfo: 'Concierge: +1 (212) 555-8900 • concierge@nexpaperheritage.org',
    footerText: 'NexPaper Studio Master Pass • Non-Transferable • Sovereign Access Mandate',
    primaryColor: '#d4af37',
    accentColor: '#fef08a',
    backgroundColor: '#0a0a0c',
    fontFamily: 'cinzel',
    hasBarcode: true,
    hasQrCode: true,
    qrPayload: 'NXP-GLD-882910|ALEXANDRA-VANCE|ROYAL-DIAMOND-VIP|ST-REGIS-2026',
    hasWatermark: true,
    watermarkText: 'VIP SOVEREIGN ACCESS',
    showBackSide: false,
    backTitle: 'GALA ITINERARY & ADMISSION CONDITIONS',
    backSchedule: '19:00 Champagne Welcome • 20:00 Welcome Address • 20:30 Gala Dinner • 22:00 Live Orchestra & Philanthropic Auction',
    backTerms: 'Admission strictly contingent upon adherence to Black Tie dress protocol. Re-entry permitted only upon digital biometric scan verification.',
    backDisclaimer: 'The management reserves the right to refuse admission. Filming and commercial photography strictly restricted to authorized press credential holders.',
    backContact: 'Executive Protocol Office • concierge@nexpaperheritage.org',
  },
  {
    id: 'ticket-starter-concert-neon',
    title: 'World Stadium Arena Concert Ticket',
    type: 'concert-tickets' as unknown as TicketDocumentType,
    theme: 'concert-music',
    orientation: 'landscape',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventTitle: 'KING OF POP: THE IMMORTAL SYMPHONY WORLD TOUR',
    eventSubtitle: 'Live Stadium Spectacular With 80-Piece Philharmonic Orchestra',
    guestName: 'Marcus Sterling',
    eventDescription: 'Experience the electric, bass-shattering live tribute spectacle celebrating four decades of chart-topping legendary musical history.',
    dateText: 'Friday, December 18, 2026',
    timeText: 'Gates Open: 5:30 PM • Show: 7:30 PM Sharp',
    venueName: 'Wembley National Stadium',
    venueAddress: 'London HA9 0WS, United Kingdom',
    hostOrganization: 'World Live Entertainment & Archival Press Wire',
    ticketCategory: 'FRONT ROW GOLDEN CIRCLE',
    ticketNumber: 'WMB-KOP-940218',
    seatNumber: 'Sec A1 • Row 1 • Seat 14',
    accessLevel: 'Golden Circle • Soundcheck Access • Backstage Lounge',
    dressCode: 'Concert Glam & Tour Merchandise',
    rsvpDetails: 'Early entry wristbands distributed at Gate D between 3:00 PM and 5:00 PM',
    instructions: 'Digital ticket or printed broadsheet pass must be scanned upon entry. Strict bag policy applies.',
    contactInfo: 'Box Office Support: support@worldlivearena.co.uk',
    footerText: 'Official Stadium Credential • Holographic Seal Authenticated • World Live Wire',
    primaryColor: '#f97316',
    accentColor: '#fbbf24',
    backgroundColor: '#0f0f12',
    fontFamily: 'oswald',
    hasBarcode: true,
    hasQrCode: true,
    qrPayload: 'WMB-KOP-940218|MARCUS-STERLING|GOLDEN-CIRCLE|ROW-1-SEAT-14',
    hasWatermark: true,
    watermarkText: 'LIVE STADIUM PASS',
    showBackSide: false,
    backTitle: 'VENUE SAFETY & STADIUM REGULATIONS',
    backSchedule: '17:30 Public Turnstiles Open • 18:30 Support Act • 19:30 Main Phenomenon Event • 22:30 Concluding Fireworks',
    backTerms: 'Ticket holders assume all risks associated with live entertainment, pyrotechnics, strobe lighting, and high-decibel audio.',
    backDisclaimer: 'No professional recording devices, bottles, or unauthorized promotional materials permitted.',
    backContact: 'Stadium Inquiries: info@wembleystadium.co.uk',
  },
  {
    id: 'ticket-starter-summit',
    title: 'Global Leadership Summit Delegate Pass',
    type: 'executive-summit-pass',
    theme: 'modern-minimalist',
    orientation: 'portrait',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventTitle: 'GLOBAL LEADERSHIP & INNOVATION SUMMIT',
    eventSubtitle: 'Annual Executive Conclave on Technology, Enterprise & Global Policy',
    guestName: 'Dr. Edward Montgomery',
    eventDescription: 'Join international business leaders, policy architects, and industry innovators for high-level keynote addresses, executive roundtables, and private bilateral networking sessions.',
    dateText: 'Saturday, June 19, 2027',
    timeText: 'Symposium: 9:00 AM • Keynote: 10:30 AM • Executive Dinner: 7:00 PM',
    venueName: 'Palais des Congrès & Sovereign Atrium',
    venueAddress: '1 Avenue des Nations, Geneva, Switzerland',
    hostOrganization: 'World Enterprise Leadership Council',
    ticketCategory: 'HONORED DELEGATE PASS',
    ticketNumber: 'GLS-2027-0619',
    seatNumber: 'Executive Hall • Row A • Seat 04',
    accessLevel: 'Plenary Sessions • Bilateral Lounge • Private Banquet',
    dressCode: 'Business Formal / Executive Black Tie',
    rsvpDetails: 'Delegate credentials must be confirmed by April 30th at www.leadershipsummit.org',
    instructions: 'Diplomatic or government photographic credentials required at executive security turnstiles.',
    contactInfo: 'Delegate Secretariat: secretariat@leadershipsummit.org',
    footerText: 'Global Leadership Summit Official Credential • Sovereign Security Encrypted',
    primaryColor: '#0f172a',
    accentColor: '#334155',
    backgroundColor: '#faf8f5',
    fontFamily: 'cinzel',
    hasBarcode: true,
    hasQrCode: true,
    qrPayload: 'https://leadershipsummit.org/verify?code=MONTGOMERY-DELEGATE',
    hasWatermark: true,
    watermarkText: 'SUMMIT DELEGATE',
    showBackSide: false,
    backTitle: 'SYMPOSIUM PROTOCOL & SECURITY MANDATE',
    backSchedule: '08:30 Registration & Delegate Coffee • 09:30 Opening Plenary • 12:30 Diplomatic Luncheon • 19:00 Gala Banquet',
    backTerms: 'This credential remains the property of the World Enterprise Leadership Council and is strictly non-transferable.',
    backDisclaimer: 'Commercial recording and broadcasting require official accreditation from the Summit Press Bureau.',
    backContact: 'Secretariat Office: protocol@leadershipsummit.org',
  },
];

export function loadAllTickets(): TicketProject[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(STARTER_TICKETS));
      return STARTER_TICKETS;
    }
    const parsed = JSON.parse(raw) as TicketProject[];
    // Filter out any legacy wedding tickets
    const cleaned = parsed
      .filter((t) => t.id !== 'ticket-starter-minimalist-wedding' && !t.title.toLowerCase().includes('wedding') && t.type !== ('wedding-invitation' as any))
      .map((t) => (t.type === ('wedding-invitation' as any) ? { ...t, type: 'vip-invitation' as TicketDocumentType } : t));

    if (cleaned.length === 0) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(STARTER_TICKETS));
      return STARTER_TICKETS;
    }
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to load tickets from storage:', e);
    return STARTER_TICKETS;
  }
}

export function saveTicket(ticket: TicketProject): void {
  try {
    const all = loadAllTickets();
    const existingIndex = all.findIndex((t) => t.id === ticket.id);
    let updated: TicketProject[];
    if (existingIndex >= 0) {
      updated = all.map((t) =>
        t.id === ticket.id ? { ...ticket, updatedAt: new Date().toISOString() } : t
      );
    } else {
      updated = [{ ...ticket, updatedAt: new Date().toISOString() }, ...all];
    }
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save ticket:', e);
  }
}

export function createNewTicket(
  type: TicketDocumentType = 'vip-invitation',
  theme: TicketStyleTheme = 'luxury-gold'
): TicketProject {
  const uniqueNum = `NXP-${Math.floor(100000 + Math.random() * 900000)}`;
  const fresh: TicketProject = {
    id: `ticket-${Date.now()}`,
    title: 'New VIP Invitation & Pass',
    type,
    theme,
    orientation: 'landscape',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventTitle: 'EXCLUSIVE GALA PREMIERE & RECEPTION',
    eventSubtitle: 'An Official Evening of Artistic Distinction & Global Presentation',
    guestName: 'Distinguished Guest Name',
    eventDescription: 'Enter your event summary, honorary agenda, and invitation remarks here.',
    dateText: 'Saturday, December 12, 2026',
    timeText: 'Doors: 6:30 PM • Event: 7:30 PM',
    venueName: 'The Metropolitan Grand Atrium',
    venueAddress: '1000 Fifth Avenue, New York, NY 10028',
    hostOrganization: 'NexPaper Studio Productions',
    ticketCategory: 'VIP ALL ACCESS',
    ticketNumber: uniqueNum,
    seatNumber: 'Row A • Seat 01',
    accessLevel: 'VIP Lounge • Main Stage • Private Reception',
    dressCode: 'Black Tie Optional',
    rsvpDetails: 'Kindly confirm attendance via rsvp@nexpaperstudio.com',
    instructions: 'Photo identification required for credential collection.',
    contactInfo: 'Event Support: events@nexpaperstudio.com',
    footerText: 'Official NexPaper Studio Pass • Non-Transferable • Admittance Subject to Venue Terms',
    primaryColor: theme === 'luxury-gold' ? '#d4af37' : theme === 'neon-futuristic' ? '#06b6d4' : '#1e293b',
    accentColor: theme === 'luxury-gold' ? '#fef08a' : theme === 'neon-futuristic' ? '#8b5cf6' : '#d97706',
    backgroundColor: theme === 'modern-minimalist' || theme === 'classic-vintage' ? '#faf8f5' : '#0c0c0e',
    fontFamily: theme === 'luxury-gold' || theme === 'royal-elegance' ? 'cinzel' : theme === 'concert-music' ? 'oswald' : 'playfair',
    hasBarcode: true,
    hasQrCode: true,
    qrPayload: `${uniqueNum}|GUEST-PASS|VERIFIED|NEXPAPER-STUDIO`,
    hasWatermark: true,
    watermarkText: 'VIP CREDENTIAL',
    showBackSide: false,
    backTitle: 'ADMISSION PROTOCOL & SCHEDULE',
    backSchedule: '18:30 Check-in & Welcome Cocktails • 19:30 Keynote Presentation • 21:00 Executive Networking',
    backTerms: 'This credential remains the property of the host organization and must be surrendered upon request.',
    backDisclaimer: 'Management reserves the right to deny admission in the event of non-compliance with venue standards.',
    backContact: 'Concierge Desk: support@nexpaperstudio.com',
  };

  saveTicket(fresh);
  return fresh;
}

export function duplicateTicket(ticketId: string): TicketProject | null {
  const all = loadAllTickets();
  const target = all.find((t) => t.id === ticketId);
  if (!target) return null;

  const uniqueNum = `NXP-${Math.floor(100000 + Math.random() * 900000)}`;
  const dup: TicketProject = {
    ...target,
    id: `ticket-${Date.now()}`,
    title: `${target.title} (Copy)`,
    ticketNumber: uniqueNum,
    qrPayload: `${uniqueNum}|${target.guestName}|COPY`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveTicket(dup);
  return dup;
}

export function deleteTicket(ticketId: string): TicketProject[] {
  const all = loadAllTickets();
  const filtered = all.filter((t) => t.id !== ticketId);
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

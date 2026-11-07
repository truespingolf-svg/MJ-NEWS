/**
 * Type definitions for NexPaper Studio - Authorisation & Personnel Documents
 */

export type AuthorisationDocType =
  | 'employment-acceptance'
  | 'employment-termination'
  | 'appointment-confirmation'
  | 'role-acceptance'
  | 'authorisation-certificate'
  | 'resignation-acknowledgement'
  | 'suspension-notice'
  | 'custom-personnel';

export type DocumentLayoutTheme =
  | 'executive-corporate'
  | 'luxury-black-gold'
  | 'modern-minimalist'
  | 'traditional-formal'
  | 'government-inspired'
  | 'professional-hr'
  | 'elegant-blue-silver'
  | 'official-letterhead';

export interface AuthorisationDocument {
  id: string;
  title: string;
  docType: AuthorisationDocType;
  theme: DocumentLayoutTheme;
  referenceNumber: string; // e.g. "NXP-HR-2026-0492"
  issueDate: string;
  createdAt: string;
  updatedAt: string;

  // Organization & Issuer
  organizationName: string;
  organizationAddress: string;
  organizationContact: string;
  logoUrl?: string;
  department: string;

  // Recipient / Employee Information
  recipientName: string;
  recipientTitle: string; // Current or offered role
  recipientAddress?: string;
  recipientEmail?: string;
  recipientEmployeeId?: string;

  // Specific Role / Terms Details
  commencementDate?: string; // start date
  effectiveDate?: string;
  terminationDate?: string;
  lastWorkingDay?: string;
  reportingManager?: string;
  scopeOfAuthority?: string; // for certificates / appointment
  compensationDetails?: string; // for employment letters
  terminationReason?: string; // optional
  noticePeriod?: string;
  handoverInstructions?: string;
  propertyReturnTerms?: string;
  suspensionType?: 'with-pay' | 'administrative' | 'pending-review';
  reviewDate?: string;

  // Document Core Content (Editable Generated Paragraphs)
  subjectLine: string;
  openingSalutation: string;
  mainBodyParagraph1: string;
  mainBodyParagraph2: string;
  mainBodyParagraph3?: string;
  termsAndConditionsList?: string[];
  closingText: string;

  // Signatory & Authentication
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
  signatureDate: string;
  signatureImageUrl?: string; // drawn signature or uploaded graphic
  hasOfficialSeal: boolean;
  sealText?: string;
  hasWatermark: boolean;
  watermarkText?: string;

  // Secondary Signatory (optional, e.g. employee countersign or board chair)
  requiresCounterSignature: boolean;
  counterSignatoryName?: string;
  counterSignatoryTitle?: string;
  counterSignatureDate?: string;
}

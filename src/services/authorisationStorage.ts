import {
  AuthorisationDocument,
  AuthorisationDocType,
  DocumentLayoutTheme,
} from '../types/authorisation.ts';

const AUTHORISATION_STORAGE_KEY = 'nexpaper_authorisation_docs_v1';

export function generateDefaultDocContent(
  docType: AuthorisationDocType,
  recipientName: string = 'Johnathan Vance',
  recipientTitle: string = 'Senior Director of Creative Operations',
  organizationName: string = 'NexPaper Global Enterprises'
): Partial<AuthorisationDocument> {
  const refNum = `NXP-${docType.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  switch (docType) {
    case 'employment-acceptance':
      return {
        title: 'Employment Acceptance & Offer Letter',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Human Resources & Executive Talent',
        subjectLine: `Formal Offer of Employment & Role Acceptance: ${recipientTitle}`,
        openingSalutation: `Dear ${recipientName}`,
        mainBodyParagraph1: `On behalf of ${organizationName}, we are delighted to formally offer you the position of ${recipientTitle} within our organization. Following extensive review of your exceptional background and achievements, our executive leadership is confident that your vision and technical acumen will contribute immensely to our enterprise growth and standards of excellence.`,
        mainBodyParagraph2: `Your employment in this capacity will commence on the designated start date. In this role, you will report directly to the Chief Operating Officer and be tasked with steering multi-disciplinary initiatives, overseeing creative governance, and upholding the operational integrity of our publishing infrastructure.`,
        mainBodyParagraph3: `This appointment is contingent upon standard executive credential verification and adherence to our corporate code of professional conduct. Please review the terms outlined below, sign this instrument of acceptance, and return the executed copy to the Department of Human Resources.`,
        commencementDate: 'January 15, 2027',
        reportingManager: 'Eleanor Sterling, Executive Vice President',
        compensationDetails: 'Base executive salary of $185,000 per annum, paid bi-weekly, plus executive performance bonus and comprehensive health coverage.',
        termsAndConditionsList: [
          'Full-time executive status with core operating schedule at headquarters.',
          'Annual discretionary performance incentive target of 20% subject to Board review.',
          'Comprehensive executive healthcare, life insurance, and 401(k) matching up to 6%.',
          'Standard 30-day notice requirement for executive position transitions.',
          'Confidentiality and intellectual property covenants as specified in Appendix A.',
        ],
        closingText: `We eagerly anticipate welcoming you to the executive leadership cohort at ${organizationName} and look forward to forging a long and prosperous partnership.`,
        authorizedSignatoryName: 'Victoria Hastings',
        authorizedSignatoryTitle: 'Chief People & Talent Officer',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'OFFICIAL CORPORATE SEAL • HUMAN RESOURCES DIVISION',
        hasWatermark: true,
        watermarkText: 'OFFICIAL APPOINTMENT',
        requiresCounterSignature: true,
        counterSignatoryName: recipientName,
        counterSignatoryTitle: recipientTitle,
        counterSignatureDate: today,
      };

    case 'employment-termination':
      return {
        title: 'Formal Notice of Employment Termination',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Corporate Governance & Employee Relations',
        subjectLine: `Notice of Conclusion of Employment Relationship`,
        openingSalutation: `Dear ${recipientName}`,
        mainBodyParagraph1: `This correspondence serves as formal confirmation that your employment as ${recipientTitle} with ${organizationName} is being concluded, effective as of the official date specified herein. This determination follows comprehensive administrative review and has been executed in full compliance with corporate governance bylaws and applicable contractual stipulations.`,
        mainBodyParagraph2: `Your final active working day will be the specified termination date. You will be compensated for all accrued work, statutory entitlements, and earned vacation hours in accordance with standard payroll cycles. Any continuation of medical benefits under applicable enterprise transitional programs will be communicated separately by the Human Resources Benefits Bureau.`,
        mainBodyParagraph3: `You are formally requested to surrender all organizational property, access credentials, proprietary hardware, digital tokens, and intellectual assets to the Department of Security prior to departing the facility. All continuing obligations regarding corporate confidentiality and proprietary trade covenants remain in full legal force.`,
        terminationDate: 'November 30, 2026',
        lastWorkingDay: 'November 30, 2026',
        terminationReason: 'Organizational Restructuring & Operational Re-alignment',
        noticePeriod: 'Two (2) Weeks Formal Notice Paid in Accordance with Contract',
        propertyReturnTerms: 'All company laptops, security passes, vehicle transponders, and confidential dossiers must be returned to HR Suite 400 by 5:00 PM on the final working day.',
        termsAndConditionsList: [
          'Immediate cessation of corporate network privileges and cloud administrative rights.',
          'Severance consideration subject to execution of standard transitional release agreements.',
          'Post-employment non-disclosure covenants affirmed for a period of 24 calendar months.',
          'Forwarding address verification required for tax documentation and final settlement statements.',
        ],
        closingText: `We acknowledge your contributions during your tenure with ${organizationName} and extend our best wishes in your future career endeavors.`,
        authorizedSignatoryName: 'Marcus Vance, Esq.',
        authorizedSignatoryTitle: 'General Counsel & VP of Governance',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'AUTHORIZED CORPORATE INSTRUMENT • OFFICE OF GENERAL COUNSEL',
        hasWatermark: true,
        watermarkText: 'FORMAL NOTICE',
        requiresCounterSignature: true,
        counterSignatoryName: recipientName,
        counterSignatoryTitle: recipientTitle,
        counterSignatureDate: today,
      };

    case 'appointment-confirmation':
      return {
        title: 'Executive Appointment Confirmation',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Office of the Board of Directors',
        subjectLine: `Confirmation of Executive Appointment: ${recipientTitle}`,
        openingSalutation: `To Whom It May Concern`,
        mainBodyParagraph1: `The Board of Directors of ${organizationName} hereby confirms the formal appointment of ${recipientName} to the distinguished executive office of ${recipientTitle}, effective immediately. This appointment has been ratified by unanimous resolution of the Executive Committee pursuant to Article IV of the Corporate Constitution.`,
        mainBodyParagraph2: `In this capacity, ${recipientName} is vested with full executive stewardship over the division's strategic mandate, capital budget allocations, talent acquisition, and contractual authority up to the statutory maximum authorized under current governance thresholds.`,
        mainBodyParagraph3: `All stakeholders, partner organizations, and institutional representatives are instructed to recognize the authority and responsibilities vested in ${recipientName} throughout the duration of this appointment.`,
        effectiveDate: today,
        scopeOfAuthority: 'Full administrative, financial, and operational authority within the Global Creative Division up to $250,000 discretionary threshold.',
        termsAndConditionsList: [
          'Direct reporting accountability to the Chief Executive Officer and Executive Committee.',
          'Authorization to bind the organization in commercial agreements within prescribed limits.',
          'Representation of the enterprise across global media forums and regulatory proceedings.',
        ],
        closingText: `By order of the Board of Directors, signed and sealed on this day.`,
        authorizedSignatoryName: 'Arthur Kensington III',
        authorizedSignatoryTitle: 'Chairman of the Board of Directors',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'OFFICIAL SEAL • BOARD OF DIRECTORS • RATIFIED',
        hasWatermark: true,
        watermarkText: 'EXECUTIVE APPOINTMENT',
        requiresCounterSignature: false,
      };

    case 'role-acceptance':
      return {
        title: 'Formal Role Acceptance Statement',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Executive Administration',
        subjectLine: `Formal Statement of Role Acceptance & Operational Commitment`,
        openingSalutation: `To the Executive Committee of ${organizationName}`,
        mainBodyParagraph1: `I, ${recipientName}, do hereby formally and unequivocally accept the appointment and responsibilities associated with the role of ${recipientTitle} at ${organizationName}, effective as of the designated commencement date.`,
        mainBodyParagraph2: `I affirm my complete dedication to the mission, fiduciary duties, and ethical governance standards of the organization. I pledge to execute my duties with diligence, transparency, and a relentless focus on institutional excellence and sustainable creative growth.`,
        mainBodyParagraph3: `I acknowledge receipt of all pertinent operating charters, confidentiality mandates, and fiduciary guidelines, and agree to conduct all divisional affairs in strict adherence thereto.`,
        commencementDate: today,
        closingText: `Respectfully submitted and affirmed on this day.`,
        authorizedSignatoryName: recipientName,
        authorizedSignatoryTitle: recipientTitle,
        signatureDate: today,
        hasOfficialSeal: false,
        hasWatermark: true,
        watermarkText: 'ACCEPTED & RATIFIED',
        requiresCounterSignature: true,
        counterSignatoryName: 'Harrison Sterling',
        counterSignatoryTitle: 'Chief Operating Officer',
        counterSignatureDate: today,
      };

    case 'authorisation-certificate':
      return {
        title: 'Official Certificate of Corporate Authority',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Office of General Counsel & Executive Registry',
        subjectLine: `Certificate of Delegated Power & Formal Mandate`,
        openingSalutation: `To All Whom These Presents Shall Come, Greetings`,
        mainBodyParagraph1: `BE IT KNOWN that ${recipientName}, having demonstrated exemplary character and professional standing as ${recipientTitle}, is hereby duly appointed, certified, and proclaimed as an AUTHORIZED REPRESENTATIVE of ${organizationName}.`,
        mainBodyParagraph2: `The said representative is officially endowed with full power and authority to act on behalf of the corporation in all lawful proceedings, banking executions, legal instruments, and contractual treaties falling strictly within the delegated operational mandate specified below.`,
        mainBodyParagraph3: `This certificate shall remain in full legal validity until revoked in writing by the Board of Directors or upon the natural expiration date recorded in the official enterprise registry.`,
        effectiveDate: today,
        scopeOfAuthority: 'Statutory Delegation of Commercial Signing Authority & Administrative Representation across Domestic and International jurisdictions.',
        closingText: `IN WITNESS WHEREOF, the corporate seal and executive signature have been affixed hereto.`,
        authorizedSignatoryName: 'Evangeline Cross',
        authorizedSignatoryTitle: 'Corporate Secretary & Commissioner of Governance',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'SUPREME CORPORATE REGISTRY SEAL • JURISDICTION OF COMMERCE',
        hasWatermark: true,
        watermarkText: 'CERTIFIED AUTHORIZED',
        requiresCounterSignature: false,
      };

    case 'resignation-acknowledgement':
      return {
        title: 'Acknowledgement of Resignation',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Human Resources & Personnel Operations',
        subjectLine: `Formal Acknowledgement of Voluntary Resignation`,
        openingSalutation: `Dear ${recipientName}`,
        mainBodyParagraph1: `We hereby acknowledge receipt of your formal letter of resignation from your position as ${recipientTitle} with ${organizationName}, tendered on the date recorded in our personnel archives.`,
        mainBodyParagraph2: `In accordance with mutual agreement and organizational notice requirements, your final working day will be formally recognized as indicated below. We appreciate your collaborative approach in facilitating a seamless transition of operational responsibilities to your team colleagues.`,
        mainBodyParagraph3: `The Human Resources department will schedule your exit interview to finalize all administrative details, including the return of company property, review of post-employment benefits, and issuance of reference documentation.`,
        lastWorkingDay: 'December 15, 2026',
        handoverInstructions: 'Completion of project status dossiers and handover meetings with designated senior management.',
        closingText: `We thank you for your dedicated service to ${organizationName} and wish you every success in your forthcoming professional endeavors.`,
        authorizedSignatoryName: 'Damian Vance',
        authorizedSignatoryTitle: 'Senior Vice President of Human Resources',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'HUMAN RESOURCES PERSONNEL REGISTRY • ACKNOWLEDGED',
        hasWatermark: true,
        watermarkText: 'FORMAL ACKNOWLEDGEMENT',
        requiresCounterSignature: true,
        counterSignatoryName: recipientName,
        counterSignatoryTitle: recipientTitle,
        counterSignatureDate: today,
      };

    case 'suspension-notice':
      return {
        title: 'Notice of Administrative Suspension',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Internal Standards & Compliance Bureau',
        subjectLine: `CONFIDENTIAL: Formal Notice of Administrative Suspension`,
        openingSalutation: `Dear ${recipientName}`,
        mainBodyParagraph1: `Please be advised that effective immediately upon receipt of this notice, you are placed on formal ADMINISTRATIVE SUSPENSION from your duties as ${recipientTitle} with ${organizationName}. This precautionary measure has been instituted pending the conclusion of an internal administrative inquiry regarding compliance protocols.`,
        mainBodyParagraph2: `During this suspension period, you will remain on full salary and benefit continuation. You are instructed to refrain from entering enterprise premises, accessing corporate computer servers or communications channels, or representing yourself on behalf of ${organizationName} without prior written authorization from the General Counsel.`,
        mainBodyParagraph3: `You are expected to make yourself accessible for formal investigative interviews upon 24 hours' notice. A formal review session has been scheduled as detailed below, at which time you will be provided full opportunity to present relevant documentation and testimony.`,
        suspensionType: 'with-pay',
        reviewDate: 'December 4, 2026 at 10:00 AM EST',
        closingText: `This matter is strictly confidential and must not be disclosed or discussed with colleagues or third parties. Failure to observe confidentiality may result in immediate disciplinary escalation.`,
        authorizedSignatoryName: 'Charles Montgomery, Esq.',
        authorizedSignatoryTitle: 'Director of Internal Standards & Compliance',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'COMPLIANCE & ETHICS TRIBUNAL • CONFIDENTIAL INSTRUMENT',
        hasWatermark: true,
        watermarkText: 'STRICTLY CONFIDENTIAL',
        requiresCounterSignature: true,
        counterSignatoryName: recipientName,
        counterSignatoryTitle: recipientTitle,
        counterSignatureDate: today,
      };

    case 'custom-personnel':
    default:
      return {
        title: 'Formal Organizational Personnel Instrument',
        referenceNumber: refNum,
        issueDate: today,
        department: 'Executive Administration & Governance',
        subjectLine: `Official Determination & Policy Instrument: ${recipientName}`,
        openingSalutation: `To All Concerned Parties`,
        mainBodyParagraph1: `This formal administrative instrument is issued by ${organizationName} to record and establish the official terms, mandates, and determinations governing the engagement of ${recipientName} in the capacity of ${recipientTitle}.`,
        mainBodyParagraph2: `All provisions set forth herein have been drafted in compliance with the operating bylaws and governance charters of the organization. Each party affirms that the stipulations, responsibilities, and covenants recorded in this document reflect the full and complete agreement between the parties.`,
        mainBodyParagraph3: `This document shall stand as an official record within the enterprise archives and may be produced before judicial, regulatory, or corporate bodies as proof of the determinations established herein.`,
        closingText: `Executed in solemn affirmation on this date.`,
        authorizedSignatoryName: 'Victoria Hastings',
        authorizedSignatoryTitle: 'Executive Director of Corporate Governance',
        signatureDate: today,
        hasOfficialSeal: true,
        sealText: 'OFFICIAL CORPORATE GOVERNANCE SEAL',
        hasWatermark: true,
        watermarkText: 'OFFICIAL INSTRUMENT',
        requiresCounterSignature: true,
        counterSignatoryName: recipientName,
        counterSignatoryTitle: recipientTitle,
        counterSignatureDate: today,
      };
  }
}

export function buildAuthorisationDocObject(
  docType: AuthorisationDocType = 'employment-acceptance',
  theme: DocumentLayoutTheme = 'executive-corporate',
  customId?: string
): AuthorisationDocument {
  const generated = generateDefaultDocContent(docType);

  return {
    id: customId || `auth-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: generated.title || 'Official Personnel Document',
    docType,
    theme,
    referenceNumber: generated.referenceNumber || `NXP-GOV-${Date.now().toString().slice(-6)}`,
    issueDate: generated.issueDate || 'November 7, 2026',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organizationName: 'NexPaper Global Enterprises',
    organizationAddress: '100 Avenue of the Americas, Suite 4000, New York, NY 10013',
    organizationContact: '+1 (212) 555-0199 • governance@nexpaperstudio.com',
    department: generated.department || 'Corporate Governance Division',
    recipientName: 'Johnathan Vance',
    recipientTitle: 'Senior Director of Creative Operations',
    recipientEmployeeId: 'EMP-9021-V',
    recipientEmail: 'j.vance@nexpaperstudio.com',
    recipientAddress: '742 Evergreen Promenade, New York, NY 10024',
    subjectLine: generated.subjectLine || 'Formal Organizational Notice',
    openingSalutation: generated.openingSalutation || 'Dear Recipient',
    mainBodyParagraph1: generated.mainBodyParagraph1 || '',
    mainBodyParagraph2: generated.mainBodyParagraph2 || '',
    mainBodyParagraph3: generated.mainBodyParagraph3 || '',
    commencementDate: generated.commencementDate,
    effectiveDate: generated.effectiveDate,
    terminationDate: generated.terminationDate,
    lastWorkingDay: generated.lastWorkingDay,
    reportingManager: generated.reportingManager,
    scopeOfAuthority: generated.scopeOfAuthority,
    compensationDetails: generated.compensationDetails,
    terminationReason: generated.terminationReason,
    noticePeriod: generated.noticePeriod,
    handoverInstructions: generated.handoverInstructions,
    propertyReturnTerms: generated.propertyReturnTerms,
    suspensionType: generated.suspensionType,
    reviewDate: generated.reviewDate,
    termsAndConditionsList: generated.termsAndConditionsList,
    closingText: generated.closingText || 'Sincerely,',
    authorizedSignatoryName: generated.authorizedSignatoryName || 'Executive Authority',
    authorizedSignatoryTitle: generated.authorizedSignatoryTitle || 'Director of Governance',
    signatureDate: generated.signatureDate || 'November 7, 2026',
    hasOfficialSeal: generated.hasOfficialSeal ?? true,
    sealText: generated.sealText || 'OFFICIAL CORPORATE SEAL',
    hasWatermark: generated.hasWatermark ?? true,
    watermarkText: generated.watermarkText || 'OFFICIAL RECORD',
    requiresCounterSignature: generated.requiresCounterSignature ?? false,
    counterSignatoryName: generated.counterSignatoryName,
    counterSignatoryTitle: generated.counterSignatoryTitle,
    counterSignatureDate: generated.counterSignatureDate,
  };
}

export function createNewAuthorisationDoc(
  docType: AuthorisationDocType = 'employment-acceptance',
  theme: DocumentLayoutTheme = 'executive-corporate'
): AuthorisationDocument {
  const doc = buildAuthorisationDocObject(docType, theme);
  saveAuthorisationDoc(doc);
  return doc;
}

function readDocsFromStorage(): AuthorisationDocument[] {
  try {
    const raw = localStorage.getItem(AUTHORISATION_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuthorisationDocument[];
  } catch {
    return [];
  }
}

export function loadAllAuthorisationDocs(): AuthorisationDocument[] {
  try {
    const docs = readDocsFromStorage();
    if (!docs || docs.length === 0) {
      const initial = [
        buildAuthorisationDocObject('employment-acceptance', 'executive-corporate', 'auth-doc-init-1'),
        buildAuthorisationDocObject('authorisation-certificate', 'luxury-black-gold', 'auth-doc-init-2'),
        buildAuthorisationDocObject('appointment-confirmation', 'traditional-formal', 'auth-doc-init-3'),
      ];
      localStorage.setItem(AUTHORISATION_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return docs;
  } catch (e) {
    console.error('Failed to load authorisation docs:', e);
    return [];
  }
}

export function saveAuthorisationDoc(doc: AuthorisationDocument): void {
  try {
    const all = readDocsFromStorage();
    const existingIndex = all.findIndex((d) => d.id === doc.id);
    let updated: AuthorisationDocument[];
    if (existingIndex >= 0) {
      updated = all.map((d) =>
        d.id === doc.id ? { ...doc, updatedAt: new Date().toISOString() } : d
      );
    } else {
      updated = [{ ...doc, updatedAt: new Date().toISOString() }, ...all];
    }
    localStorage.setItem(AUTHORISATION_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save authorisation doc:', e);
  }
}

export function duplicateAuthorisationDoc(docId: string): AuthorisationDocument | null {
  const all = loadAllAuthorisationDocs();
  const target = all.find((d) => d.id === docId);
  if (!target) return null;

  const dup: AuthorisationDocument = {
    ...target,
    id: `auth-doc-${Date.now()}`,
    title: `${target.title} (Copy)`,
    referenceNumber: `NXP-${target.docType.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveAuthorisationDoc(dup);
  return dup;
}

export function deleteAuthorisationDoc(docId: string): AuthorisationDocument[] {
  const all = loadAllAuthorisationDocs();
  const filtered = all.filter((d) => d.id !== docId);
  localStorage.setItem(AUTHORISATION_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

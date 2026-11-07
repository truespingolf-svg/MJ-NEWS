import { AuthorisationDocument } from '../types/authorisation.ts';

/**
 * Exports an Authorisation Document as a fully formatted Microsoft Word (.doc/.docx compliant) file
 */
export function exportAuthorisationToDocx(doc: AuthorisationDocument): void {
  const sanitize = (text: string = '') =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const contentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${sanitize(doc.title)}</title>
      <style>
        body {
          font-family: 'Calibri', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a1a1a;
          margin: 1in;
        }
        .header-table {
          width: 100%;
          border-bottom: 2pt solid #222222;
          padding-bottom: 12pt;
          margin-bottom: 18pt;
        }
        .org-name {
          font-size: 18pt;
          font-weight: bold;
          color: #111111;
          text-transform: uppercase;
          letter-spacing: 1pt;
        }
        .org-meta {
          font-size: 9pt;
          color: #555555;
        }
        .ref-bar {
          background-color: #f3f4f6;
          padding: 6pt 10pt;
          font-size: 9.5pt;
          font-weight: bold;
          margin-bottom: 20pt;
          border: 1pt solid #d1d5db;
        }
        .recipient-box {
          margin-bottom: 18pt;
          font-size: 10.5pt;
        }
        .subject-line {
          font-size: 12pt;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 14pt;
          color: #111827;
        }
        p {
          margin-bottom: 12pt;
          text-align: justify;
        }
        .terms-table {
          width: 100%;
          border-collapse: collapse;
          margin: 14pt 0;
        }
        .terms-table td {
          border: 1pt solid #e5e7eb;
          padding: 6pt 8pt;
          font-size: 10pt;
        }
        .signature-section {
          margin-top: 36pt;
          width: 100%;
        }
        .signature-line {
          border-top: 1pt solid #4b5563;
          width: 200pt;
          padding-top: 4pt;
          font-size: 10pt;
        }
        .disclaimer {
          margin-top: 40pt;
          font-size: 8pt;
          color: #6b7280;
          border-top: 1pt dashed #d1d5db;
          padding-top: 8pt;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td>
            <div class="org-name">${sanitize(doc.organizationName)}</div>
            <div class="org-meta">${sanitize(doc.department)} | ${sanitize(doc.organizationAddress)}</div>
            <div class="org-meta">Contact: ${sanitize(doc.organizationContact)}</div>
          </td>
          <td align="right" valign="top">
            <div style="font-size: 12pt; font-weight: bold; color: #4b5563;">OFFICIAL INSTRUMENT</div>
            <div style="font-size: 9pt; color: #6b7280;">Date: ${sanitize(doc.issueDate)}</div>
          </td>
        </tr>
      </table>

      <div class="ref-bar">
        REF NO: ${sanitize(doc.referenceNumber)} &nbsp;&nbsp;|&nbsp;&nbsp; CLASSIFICATION: FORMAL GOVERNANCE RECORD
      </div>

      <div class="recipient-box">
        <strong>TO:</strong><br/>
        <strong>${sanitize(doc.recipientName)}</strong><br/>
        ${doc.recipientTitle ? `<span>${sanitize(doc.recipientTitle)}</span><br/>` : ''}
        ${doc.recipientEmployeeId ? `<span>Employee ID: ${sanitize(doc.recipientEmployeeId)}</span><br/>` : ''}
        ${doc.recipientEmail ? `<span>Email: ${sanitize(doc.recipientEmail)}</span><br/>` : ''}
        ${doc.recipientAddress ? `<span>Address: ${sanitize(doc.recipientAddress)}</span><br/>` : ''}
      </div>

      <div class="subject-line">
        SUBJECT: ${sanitize(doc.subjectLine.toUpperCase())}
      </div>

      <p>${sanitize(doc.openingSalutation)},</p>

      <p>${sanitize(doc.mainBodyParagraph1)}</p>

      <p>${sanitize(doc.mainBodyParagraph2)}</p>

      ${doc.mainBodyParagraph3 ? `<p>${sanitize(doc.mainBodyParagraph3)}</p>` : ''}

      ${
        doc.termsAndConditionsList && doc.termsAndConditionsList.length > 0
          ? `
          <div style="margin: 12pt 0; font-weight: bold; font-size: 10.5pt;">Key Terms &amp; Provisions:</div>
          <ul>
            ${doc.termsAndConditionsList.map((t) => `<li>${sanitize(t)}</li>`).join('')}
          </ul>
        `
          : ''
      }

      <p>${sanitize(doc.closingText)}</p>

      <table class="signature-section">
        <tr>
          <td width="50%" valign="bottom">
            <div style="margin-bottom: 30pt; font-style: italic; color: #4b5563;">
              Authorized by and on behalf of ${sanitize(doc.organizationName)}:
            </div>
            <div class="signature-line">
              <strong>${sanitize(doc.authorizedSignatoryName)}</strong><br/>
              ${sanitize(doc.authorizedSignatoryTitle)}<br/>
              Date: ${sanitize(doc.signatureDate)}
            </div>
          </td>
          ${
            doc.requiresCounterSignature
              ? `
          <td width="50%" valign="bottom" align="right">
            <div style="margin-bottom: 30pt; font-style: italic; color: #4b5563; text-align: left;">
              Acknowledged &amp; Agreed:
            </div>
            <div class="signature-line" style="text-align: left;">
              <strong>${sanitize(doc.counterSignatoryName || doc.recipientName)}</strong><br/>
              ${sanitize(doc.counterSignatoryTitle || 'Recipient')}<br/>
              Date: ${sanitize(doc.counterSignatureDate || doc.issueDate)}
            </div>
          </td>
          `
              : `
          <td width="50%" align="right" valign="bottom">
            ${
              doc.hasOfficialSeal
                ? `<div style="border: 2pt solid #9ca3af; border-radius: 50%; width: 90pt; height: 90pt; display: inline-block; text-align: center; line-height: 90pt; font-size: 8pt; font-weight: bold; color: #4b5563; text-transform: uppercase;">OFFICIAL SEAL</div>`
                : ''
            }
          </td>
          `
          }
        </tr>
      </table>

      <div class="disclaimer">
        Disclaimer: This instrument has been generated through NexPaper Studio for organizational record-keeping. The issuing entity affirms that this document has been prepared in accordance with applicable governance standards and internal operating mandates.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', contentHtml], {
    type: 'application/msword',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${doc.referenceNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}.doc`;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

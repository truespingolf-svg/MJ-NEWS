import test from 'node:test';
import assert from 'node:assert/strict';

import { generateBarcodeSvg } from '../services/qrBarcodeService.ts';
import { enhanceTextLocally } from './textAssistant.ts';
import { generateDefaultDocContent } from '../services/authorisationStorage.ts';

test('generateBarcodeSvg produces valid SVG string with bars', () => {
  const svg = generateBarcodeSvg('NXP-VIP-1001', '#000000');
  assert.ok(svg.includes('<svg'), 'Should contain svg tag');
  assert.ok(svg.includes('<rect'), 'Should contain rect elements for barcode bars');
});

test('enhanceTextLocally enhances text for make-exclusive mode', () => {
  const input = 'Please come to our party';
  const output = enhanceTextLocally(input, 'make-exclusive');
  assert.ok(output.toLowerCase().includes('cordially') || output.toLowerCase().includes('gala'));
});

test('enhanceTextLocally enhances text for formal-executive mode', () => {
  const input = 'We are happy to confirm your appointment.';
  const output = enhanceTextLocally(input, 'formal-executive');
  assert.ok(output.toLowerCase().includes('pleased to formally confirm'));
});

test('enhanceTextLocally tightens text for concise-impact mode', () => {
  const input = 'In order to attend, please register due to the fact that space is limited.';
  const output = enhanceTextLocally(input, 'concise-impact');
  assert.ok(!output.includes('In order to'));
  assert.ok(!output.includes('due to the fact that'));
});

test('generateDefaultDocContent creates comprehensive content for employment-acceptance', () => {
  const content = generateDefaultDocContent('employment-acceptance', 'Jane Doe', 'VP Operations', 'NexPaper Studio');
  assert.ok(content.subjectLine?.includes('VP Operations'));
  assert.ok(content.mainBodyParagraph1?.includes('Jane Doe') || content.openingSalutation?.includes('Jane Doe'));
  assert.ok(content.termsAndConditionsList && content.termsAndConditionsList.length > 0);
  assert.equal(content.hasOfficialSeal, true);
});

test('generateDefaultDocContent creates termination specifics for employment-termination', () => {
  const content = generateDefaultDocContent('employment-termination', 'John Smith', 'Analyst', 'NexPaper Studio');
  assert.ok(content.subjectLine?.includes('Termination') || content.subjectLine?.includes('Conclusion'));
  assert.ok(content.propertyReturnTerms);
  assert.ok(content.lastWorkingDay);
});

test('generateDefaultDocContent creates authorization certificate terms', () => {
  const content = generateDefaultDocContent('authorisation-certificate', 'Marcus Sterling', 'Chief Envoy', 'NexPaper Studio');
  assert.ok(content.title?.includes('Certificate'));
  assert.ok(content.scopeOfAuthority);
  assert.equal(content.hasOfficialSeal, true);
});

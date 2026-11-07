import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewProject,
  createFrontCoverPage,
  createInteriorPage,
  duplicatePage,
  deletePage,
  reorderPages,
  changePageLayout,
  updateTextElement,
  updateImageElement,
  resetImageSlot,
  getAvailableLayouts,
} from './newspaperLogic.ts';
import { PageLayoutId } from '../types/newspaper.ts';

test('createNewProject creates project with initial Front Cover having exactly 3 image placeholders', () => {
  const project = createNewProject('Test MJ Chronicle');
  assert.equal(project.title, 'Test MJ Chronicle');
  assert.equal(project.pages.length, 1);

  const cover = project.pages[0];
  assert.equal(cover.isCover, true);
  assert.equal(cover.layoutId, 'front-cover');
  assert.ok(cover.images.image1);
  assert.ok(cover.images.image2);
  assert.ok(cover.images.image3);
  assert.equal(cover.images.image1.slotIndex, 1);
  assert.equal(cover.images.image2.slotIndex, 2);
  assert.equal(cover.images.image3.slotIndex, 3);
});

test('ALL 8 interior layouts have exactly 3 image placeholders', () => {
  const layouts = getAvailableLayouts().filter((l) => l.category === 'interior');
  assert.equal(layouts.length >= 8, true, 'Must have at least 8 interior layouts');

  for (const layout of layouts) {
    const page = createInteriorPage(layout.id, 2);
    assert.equal(page.isCover, false);
    assert.equal(page.layoutId, layout.id);
    assert.ok(page.images.image1, `Layout ${layout.id} missing image1`);
    assert.ok(page.images.image2, `Layout ${layout.id} missing image2`);
    assert.ok(page.images.image3, `Layout ${layout.id} missing image3`);
    assert.equal(page.images.image1.slotIndex, 1);
    assert.equal(page.images.image2.slotIndex, 2);
    assert.equal(page.images.image3.slotIndex, 3);
  }
});

test('duplicatePage clones page and recalculates page numbering sequentially', () => {
  const project = createNewProject('Duplication Test');
  const coverId = project.pages[0].id;
  const projectAfterDup = duplicatePage(project, coverId);

  assert.equal(projectAfterDup.pages.length, 2);
  assert.equal(projectAfterDup.pages[0].pageNumber, 1);
  assert.equal(projectAfterDup.pages[1].pageNumber, 2);
  assert.notEqual(projectAfterDup.pages[0].id, projectAfterDup.pages[1].id);
  assert.equal(projectAfterDup.pages[1].isCover, false);
});

test('deletePage removes page and maintains sequential numbers, preventing zero pages', () => {
  let project = createNewProject('Delete Test');
  const coverId = project.pages[0].id;

  // Cannot delete only page
  project = deletePage(project, coverId);
  assert.equal(project.pages.length, 1);

  // Add duplicate then delete first
  project = duplicatePage(project, coverId);
  assert.equal(project.pages.length, 2);

  const firstId = project.pages[0].id;
  project = deletePage(project, firstId);
  assert.equal(project.pages.length, 1);
  assert.equal(project.pages[0].pageNumber, 1);
  assert.equal(project.pages[0].isCover, true);
});

test('reorderPages moves pages accurately', () => {
  let project = createNewProject('Reorder Test');
  project = duplicatePage(project, project.pages[0].id); // now 2 pages
  project = duplicatePage(project, project.pages[1].id); // now 3 pages

  const originalPageIds = project.pages.map((p) => p.id);
  // move page 0 to index 2
  project = reorderPages(project, 0, 2);

  assert.equal(project.pages[2].id, originalPageIds[0]);
  assert.equal(project.pages[0].pageNumber, 1);
  assert.equal(project.pages[1].pageNumber, 2);
  assert.equal(project.pages[2].pageNumber, 3);
});

test('updateTextElement and updateImageElement modify page properties reliably', () => {
  const page = createFrontCoverPage(1);
  const headlineId = page.texts.mainHeadline.id;

  const updatedPage = updateTextElement(page, headlineId, {
    content: 'MICHAEL JACKSON SETS WORLD RECORD',
    fontSize: 52,
    align: 'center',
  });

  assert.equal(updatedPage.texts.mainHeadline.content, 'MICHAEL JACKSON SETS WORLD RECORD');
  assert.equal(updatedPage.texts.mainHeadline.fontSize, 52);

  const withImage = updateImageElement(updatedPage, 'image1', {
    url: 'data:image/jpeg;base64,sample',
    caption: 'Historic stadium performance 1988',
    zoom: 1.5,
  });

  assert.equal(withImage.images.image1.url, 'data:image/jpeg;base64,sample');
  assert.equal(withImage.images.image1.zoom, 1.5);
  assert.equal(withImage.images.image1.caption, 'Historic stadium performance 1988');

  const resetPage = resetImageSlot(withImage, 'image1');
  assert.equal(resetPage.images.image1.url, null);
  assert.equal(resetPage.images.image1.zoom, 1);
});

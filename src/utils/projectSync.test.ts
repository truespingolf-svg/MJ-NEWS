import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProjectSyncState,
  markLocalSaveStarted,
  markLocalSaveSettled,
  markLocalDeleteStarted,
  markLocalDeleteSettled,
  markDeleteAllStarted,
  shouldAbortPendingWrite,
  reconcileProjectsSnapshot,
} from './projectSync.ts';
import { NewspaperProject } from '../types/newspaper.ts';

function makeProj(id: string, title: string, updatedAt: string): NewspaperProject {
  return {
    id,
    title,
    subtitle: 'Test Edition',
    createdAt: updatedAt,
    updatedAt,
    pages: [],
  };
}

describe('projectSync reconciliation', () => {
  it('preserves a newly created in-flight project when an empty remote snapshot arrives', () => {
    const state = createProjectSyncState();
    const fresh = makeProj('p-1', 'My First Edition', '2026-11-15T10:00:00.000Z');
    markLocalSaveStarted(state, fresh, Date.parse('2026-11-15T10:00:00.000Z'));

    // Firestore snapshot fires empty before setDoc finishes
    const result = reconcileProjectsSnapshot([], state, Date.parse('2026-11-15T10:00:00.200Z'));
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'p-1');
    assert.equal(result[0].title, 'My First Edition');
  });

  it('keeps a project saved locally even if Firestore save failed (e.g. >1MB photo payload)', () => {
    const state = createProjectSyncState();
    const largeProj = makeProj('p-large', 'Photo Heavy Paper', '2026-11-15T10:00:00.000Z');
    const saved = markLocalSaveStarted(state, largeProj, Date.parse('2026-11-15T10:00:00.000Z'));
    markLocalSaveSettled(state, 'p-large', Date.parse(saved.updatedAt), false);

    assert.equal(state.localOnlyIds.has('p-large'), true);

    const result = reconcileProjectsSnapshot([], state, Date.parse('2026-11-15T10:05:00.000Z'));
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'p-large');
  });

  it('prefers newer local edits over stale remote snapshot and clears pending once remote catches up', () => {
    const state = createProjectSyncState();
    const localEdit = makeProj('p-2', 'Edited Title', '2026-11-15T10:01:00.000Z');
    const saved = markLocalSaveStarted(state, localEdit, Date.parse('2026-11-15T10:01:00.000Z'));
    markLocalSaveSettled(state, 'p-2', Date.parse(saved.updatedAt), true);

    const staleRemote = makeProj('p-2', 'Old Title', '2026-11-15T10:00:00.000Z');
    const step1 = reconcileProjectsSnapshot([staleRemote], state, Date.parse('2026-11-15T10:01:01.000Z'));
    assert.equal(step1[0].title, 'Edited Title');
    assert.equal(state.pendingSaves.has('p-2'), true);

    const caughtUpRemote = makeProj('p-2', 'Edited Title', '2026-11-15T10:01:00.000Z');
    const step2 = reconcileProjectsSnapshot([caughtUpRemote], state, Date.parse('2026-11-15T10:01:02.000Z'));
    assert.equal(step2[0].title, 'Edited Title');
    assert.equal(state.pendingSaves.has('p-2'), false);
  });

  it('never resurrects a deleted project during an in-flight delete or stale snapshot', () => {
    const state = createProjectSyncState();
    const doomed = makeProj('p-del', 'Doomed Edition', '2026-11-15T10:00:00.000Z');
    markLocalDeleteStarted(state, 'p-del', Date.parse('2026-11-15T10:02:00.000Z'));

    const duringDelete = reconcileProjectsSnapshot([doomed], state, Date.parse('2026-11-15T10:02:01.000Z'));
    assert.equal(duringDelete.length, 0);

    markLocalDeleteSettled(state, 'p-del', true);
    const afterRemoteGone = reconcileProjectsSnapshot([], state, Date.parse('2026-11-15T10:02:02.000Z'));
    assert.equal(afterRemoteGone.length, 0);
    assert.equal(state.pendingDeletes.has('p-del'), false);
  });

  it('aborts an in-flight write if the project was deleted or wiped before write executed', () => {
    const state = createProjectSyncState();
    const proj = makeProj('p-race', 'Race Paper', '2026-11-15T10:00:00.000Z');
    const saved = markLocalSaveStarted(state, proj, Date.parse('2026-11-15T10:00:00.000Z'));
    const writeMs = Date.parse(saved.updatedAt);

    assert.equal(shouldAbortPendingWrite(state, 'p-race', writeMs), false);

    markLocalDeleteStarted(state, 'p-race', Date.parse('2026-11-15T10:00:01.000Z'));
    assert.equal(shouldAbortPendingWrite(state, 'p-race', writeMs), true);
  });

  it('blocks pre-delete docs during Delete All and still allows brand new creations right after', () => {
    const state = createProjectSyncState();
    const oldDoc = makeProj('p-old', 'Old Paper', '2026-11-15T09:59:00.000Z');
    markDeleteAllStarted(state, ['p-old'], Date.parse('2026-11-15T10:00:00.000Z'));

    const freshAfter = makeProj('p-new', 'Fresh After Wipe', '2026-11-15T10:00:05.000Z');
    markLocalSaveStarted(state, freshAfter, Date.parse('2026-11-15T10:00:05.000Z'));

    const result = reconcileProjectsSnapshot([oldDoc], state, Date.parse('2026-11-15T10:00:06.000Z'));
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'p-new');
  });
});

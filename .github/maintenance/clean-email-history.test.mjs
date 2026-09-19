import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRequest, selectBranches, buildPushArguments, REPOSITORY, OWNER, CONFIRMATION } from './clean-email-history.mjs';
const sha = 'a'.repeat(40);
const rewritten = 'b'.repeat(40);
const base = { GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: REPOSITORY, GITHUB_ACTOR: OWNER, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: sha };

test('preview is the read-only default', () => assert.equal(validateRequest(base), 'preview'));
test('rewrite requires all independent confirmations', () => {
  const approved = { ...base, CSB_MODE: 'rewrite', CSB_CONFIRMATION: CONFIRMATION, CSB_BACKUP_CONFIRMED: 'true', CSB_EXPECTED_SNAPSHOT: 'c'.repeat(64), GH_TOKEN: 'test-only-token' };
  assert.equal(validateRequest(approved), 'rewrite');
  for (const key of ['CSB_CONFIRMATION', 'CSB_BACKUP_CONFIRMED', 'CSB_EXPECTED_SNAPSHOT', 'GH_TOKEN']) {
    const copy = { ...approved }; delete copy[key];
    assert.throws(() => validateRequest(copy));
  }
});
test('wrong event, repository, actor, branch, commit, or mode stops', () => {
  for (const [key, value] of Object.entries({ GITHUB_EVENT_NAME: 'push', GITHUB_REPOSITORY: 'someone/else', GITHUB_ACTOR: 'someone-else', GITHUB_REF: 'refs/heads/other', GITHUB_SHA: 'bad', CSB_MODE: 'delete' })) {
    assert.throws(() => validateRequest({ ...base, [key]: value }));
  }
});
test('local tests can never request publication', () => {
  assert.equal(validateRequest({}, true), 'preview');
  assert.throws(() => validateRequest({ CSB_MODE: 'rewrite' }, true));
});
test('PR refs are not selected for publication', () => {
  assert.deepEqual(selectBranches([{ ref: 'refs/heads/main', sha }, { ref: 'refs/pull/2/head', sha }]), [{ ref: 'refs/heads/main', sha }]);
});
test('unknown branches, tags, and refs require fresh review', () => {
  for (const ref of ['refs/heads/unreviewed', 'refs/tags/v1', 'refs/replace/' + sha]) {
    assert.throws(() => selectBranches([{ ref: 'refs/heads/main', sha }, { ref, sha }]));
  }
  assert.throws(() => selectBranches([]));
});
test('push is atomic, has an exact lease, and does not delete refs or mirror', () => {
  const args = buildPushArguments([{ ref: 'refs/heads/main', sha }], new Map([[sha, rewritten]]));
  assert(args.includes('--atomic'));
  assert(args.includes('--force-with-lease=refs/heads/main:' + sha));
  assert(args.includes(rewritten + ':refs/heads/main'));
  for (const disallowed of ['--mirror', '--force', '--delete', '--prune']) assert(!args.includes(disallowed));
  assert.throws(() => buildPushArguments([{ ref: 'refs/pull/2/head', sha }], new Map([[sha, rewritten]])));
  assert.throws(() => buildPushArguments([{ ref: 'refs/heads/main', sha }], new Map()));
});
test('workflow is manually triggered, with read-only preview and pinned checkout', () => {
  const workflow = fs.readFileSync(new URL('../workflows/manual-email-history-cleanup.yml', import.meta.url), 'utf8');
  assert.match(workflow, /on:\n  workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^  (push|pull_request|schedule|workflow_run):/m);
  assert.match(workflow, /default: preview/);
  assert.match(workflow, /preview:[\s\S]*?permissions:\n      contents: read/);
  assert.match(workflow, /rewrite:[\s\S]*?permissions:\n      contents: write/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /CSB_EXPECTED_SNAPSHOT: \$\{\{ needs\.preview\.outputs\.snapshot \}\}/);
  assert.doesNotMatch(workflow, /gmail\.com|upload-artifact|secrets\.[A-Z_]+/);
});

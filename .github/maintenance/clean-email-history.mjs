// One-time, owner-started maintenance. No automatic trigger or protection edits.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const REPOSITORY = 'ColoradoStreetBridgeBarrierProject/ColoradoStreetBridge';
export const OWNER = 'ColoradoStreetBridgeBarrierProject';
export const CONFIRMATION = 'REWRITE CSB HISTORY';
const REMOTE = 'https://github.com/' + REPOSITORY + '.git';
const EMAIL_FINGERPRINT = 'caecd0799d555ba9009e128d6be23d8a07aa78b04ba823a312fe9afb8aeae8cc';
const NOREPLY = '328242500+ColoradoStreetBridgeBarrierProject@users.noreply.github.com';
const APPROVED_BRANCHES = new Set([
  'main',
  'copilot/improve-mobile-usability-guide',
  'fix/filter-labels-and-editorial-polish',
  'fix/historical-roles-and-plain-language',
  'security/browser-protections-2026-09-17',
  'usability-search-images-print',
  'maintenance/manual-email-history-cleanup',
]);
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

export function validateRequest(env, localTest = false) {
  const mode = env.CSB_MODE || 'preview';
  requireCondition(['preview', 'rewrite'].includes(mode), 'Unknown mode.');
  if (localTest) {
    requireCondition(mode === 'preview', 'Local tests cannot publish.');
    return mode;
  }
  requireCondition(env.GITHUB_EVENT_NAME === 'workflow_dispatch', 'Manual dispatch required.');
  requireCondition(env.GITHUB_REPOSITORY === REPOSITORY, 'Unexpected repository.');
  requireCondition(env.GITHUB_REF === 'refs/heads/main', 'Run only from main.');
  requireCondition(env.GITHUB_ACTOR === OWNER, 'Only the repository owner may run this maintenance.');
  requireCondition(/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || ''), 'Expected main commit missing.');
  if (mode === 'rewrite') {
    requireCondition(env.CSB_CONFIRMATION === CONFIRMATION, 'Explicit rewrite confirmation required.');
    requireCondition(env.CSB_BACKUP_CONFIRMED === 'true', 'Verified private backup must be confirmed.');
    requireCondition(/^[a-f0-9]{64}$/.test(env.CSB_EXPECTED_SNAPSHOT || ''), 'The read-only preview snapshot is required.');
    requireCondition(Boolean(env.GH_TOKEN), 'Repository write token missing.');
  }
  return mode;
}

export function selectBranches(refs) {
  requireCondition(refs.some(item => item.ref === 'refs/heads/main'), 'Main is missing.');
  for (const { ref, sha } of refs) {
    requireCondition(/^[a-f0-9]{40}$/.test(sha), 'Unexpected object ID.');
    if (ref.startsWith('refs/heads/')) {
      requireCondition(APPROVED_BRANCHES.has(ref.slice(11)), 'Unreviewed branch found. Stop for review.');
    } else {
      requireCondition(/^refs\/pull\/[0-9]+\/(head|merge)$/.test(ref), 'Tags or unreviewed refs found. Stop for review.');
    }
  }
  return refs.filter(item => item.ref.startsWith('refs/heads/'));
}

export function buildPushArguments(branches, commitMap) {
  requireCondition(branches.length > 0, 'No branches to publish.');
  for (const { ref, sha } of branches) {
    requireCondition(ref.startsWith('refs/heads/') && APPROVED_BRANCHES.has(ref.slice(11)), 'Only reviewed branches may be pushed.');
    requireCondition(/^[a-f0-9]{40}$/.test(sha) && /^[a-f0-9]{40}$/.test(commitMap.get(sha) || '') && !/^0+$/.test(commitMap.get(sha)), 'Missing rewritten commit.');
  }
  return ['push', '--atomic',
    ...branches.map(item => '--force-with-lease=' + item.ref + ':' + item.sha),
    REMOTE,
    ...branches.map(item => commitMap.get(item.sha) + ':' + item.ref)];
}

const fingerprint = text => crypto.createHash('sha256').update(text).digest('hex');
function parseRefs(text, remote = false) {
  return text.trim().split('\n').filter(Boolean).map(line => {
    const [first, second] = line.split(/\s+/);
    return remote ? { ref: second, sha: first } : { ref: first, sha: second };
  }).sort((a, b) => a.ref.localeCompare(b.ref));
}
function parseCommit(bytes) {
  const boundary = bytes.indexOf(Buffer.from('\n\n'));
  requireCondition(boundary >= 0, 'Invalid commit.');
  const lines = bytes.subarray(0, boundary).toString('utf8').split('\n');
  const get = name => lines.find(line => line.startsWith(name + ' '))?.slice(name.length + 1);
  return {
    tree: get('tree'), author: get('author'), committer: get('committer'), encoding: get('encoding'),
    parents: lines.filter(line => line.startsWith('parent ')).map(line => line.slice(7)),
    signed: lines.some(line => line.startsWith('gpgsig ')),
    message: bytes.subarray(boundary + 2),
  };
}

export async function runCleanup(env = process.env, localBundle) {
  const mode = validateRequest(env, Boolean(localBundle));
  if (localBundle) requireCondition(path.isAbsolute(localBundle) && fs.statSync(localBundle).isFile(), 'Use an absolute local bundle path.');
  const work = fs.mkdtempSync(path.join(env.RUNNER_TEMP || os.tmpdir(), 'csb-email-cleanup-'));
  const original = path.join(work, 'original.git');
  const cleaned = path.join(work, 'cleaned.git');
  // Do not give subprocesses a write credential until the final guarded push.
  const cleanEnv = { ...env, GIT_TERMINAL_PROMPT: '0', GIT_TRACE: '0', GIT_TRACE_CURL: '0' };
  delete cleanEnv.GH_TOKEN;
  delete cleanEnv.GITHUB_TOKEN;
  let oldEmail = '';
  const redact = text => {
    let result = String(text);
    for (const secret of [oldEmail, env.GH_TOKEN, env.GH_TOKEN && Buffer.from('x-access-token:' + env.GH_TOKEN).toString('base64')]) {
      if (secret) result = result.split(secret).join('[redacted]');
    }
    return result;
  };
  const run = (command, args, options = {}) => {
    try {
      return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 90000, env: cleanEnv, stdio: ['pipe', 'pipe', 'pipe'], ...options });
    } catch (error) {
      throw new Error(command + ' failed. No bypass or retry was attempted. ' + redact(error.stderr || error.message));
    }
  };
  const git = (repository, args, options = {}) => run('git', ['--git-dir=' + repository, ...args], options);
  const remoteRefs = () => parseRefs(run('git', ['-c', 'credential.helper=', 'ls-remote', '--refs', REMOTE, 'refs/heads/*', 'refs/tags/*']), true);
  run('git', ['-c', 'credential.helper=', 'clone', '--mirror', localBundle || REMOTE, original]);
  const refs = parseRefs(git(original, ['for-each-ref', '--format=%(refname) %(objectname)']));
  const branches = selectBranches(refs);
  const snapshot = fingerprint(JSON.stringify(branches));
  if (mode === 'rewrite') requireCondition(snapshot === env.CSB_EXPECTED_SNAPSHOT, 'Branches changed since the read-only preview. Stop for review.');
  const main = branches.find(item => item.ref === 'refs/heads/main').sha;
  if (!localBundle) requireCondition(main === env.GITHUB_SHA, 'Main changed after this run was requested. Start a fresh preview.');
  const commitIds = git(original, ['rev-list', '--all']).trim().split('\n');
  const before = new Map(commitIds.map(sha => [sha, parseCommit(git(original, ['cat-file', 'commit', sha], { encoding: null }))]));
  const matches = new Set();
  for (const commit of before.values()) {
    for (const identity of [commit.author, commit.committer]) {
      const email = identity.match(/<([^<>]+)> [0-9]+ [+-][0-9]{4}$/)?.[1];
      if (email && fingerprint(email) === EMAIL_FINGERPRINT) matches.add(email);
    }
  }
  requireCondition(matches.size === 1, 'Target email not uniquely found. This may already be cleaned. Stop for review.');
  oldEmail = [...matches][0];
  if (env.GITHUB_ACTIONS === 'true') console.log('::add-mask::' + oldEmail);
  const mailmap = path.join(work, 'private-mailmap.txt');
  fs.writeFileSync(mailmap, '<' + NOREPLY + '> <' + oldEmail + '>\n', { mode: 0o600, flag: 'wx' });
  const originalBundle = path.join(work, 'private-original.bundle');
  git(original, ['bundle', 'create', originalBundle, '--all']);
  run('git', ['clone', '--mirror', originalBundle, cleaned]);
  run('python3', ['-m', 'git_filter_repo', '--mailmap', mailmap, '--preserve-commit-hashes', '--preserve-commit-encoding', '--prune-empty', 'never', '--prune-degenerate', 'never', '--replace-refs', 'delete-no-add'], { cwd: cleaned });
  const commitMap = new Map(fs.readFileSync(path.join(cleaned, 'filter-repo/commit-map'), 'utf8').trim().split('\n').slice(1).map(line => line.trim().split(/\s+/)));
  requireCondition(commitMap.size === before.size, 'Commit mapping is incomplete.');
  requireCondition(Number(git(cleaned, ['rev-list', '--all', '--count']).trim()) === before.size, 'Commit count changed.');
  let authors = 0, committers = 0, signatures = 0;
  for (const [sha, previous] of before) {
    const nextSha = commitMap.get(sha);
    requireCondition(nextSha && !/^0+$/.test(nextSha), 'A commit was removed.');
    const next = parseCommit(git(cleaned, ['cat-file', 'commit', nextSha], { encoding: null }));
    requireCondition(previous.tree === next.tree, 'A historical file tree changed.');
    requireCondition(previous.message.equals(next.message) && previous.encoding === next.encoding, 'A commit message changed.');
    requireCondition(JSON.stringify(previous.parents.map(parent => commitMap.get(parent))) === JSON.stringify(next.parents), 'Commit ancestry changed.');
    for (const key of ['author', 'committer']) requireCondition(next[key] === previous[key].replace('<' + oldEmail + '>', '<' + NOREPLY + '>'), 'An unexpected name, email, or date changed.');
    if (previous.author.includes('<' + oldEmail + '>')) authors++;
    if (previous.committer.includes('<' + oldEmail + '>')) committers++;
    if (previous.signed) signatures++;
  }
  const cleanedRefs = parseRefs(git(cleaned, ['for-each-ref', '--format=%(refname) %(objectname)']));
  requireCondition(JSON.stringify(cleanedRefs) === JSON.stringify(refs.map(item => ({ ref: item.ref, sha: commitMap.get(item.sha) }))), 'A ref changed unexpectedly.');
  const objects = git(cleaned, ['rev-list', '--objects', '--all']).trim().split('\n').map(line => line.split(' ')[0]);
  const batch = git(cleaned, ['cat-file', '--batch'], { input: objects.join('\n') + '\n', encoding: null });
  let offset = 0, objectsScanned = 0;
  while (offset < batch.length) {
    const end = batch.indexOf(10, offset);
    const size = Number(batch.subarray(offset, end).toString('utf8').split(' ')[2]);
    requireCondition(Number.isFinite(size), 'Invalid Git object response.');
    const contents = batch.subarray(end + 1, end + 1 + size);
    requireCondition(!contents.toString('latin1').toLowerCase().includes(oldEmail.toLowerCase()), 'Target email remains in reachable objects. Stop for review.');
    offset = end + 1 + size + 1;
    objectsScanned++;
  }
  git(cleaned, ['fsck', '--full', '--strict']);
  requireCondition(git(cleaned, ['remote']).trim() === '', 'Unexpected remote in the rewritten copy.');
  if (!localBundle) requireCondition(JSON.stringify(remoteRefs()) === JSON.stringify(branches), 'Branches or tags changed during the run. Stop for review.');
  const report = { mode, snapshot, commitsVerified: before.size, branchesVerified: branches.length, refsVerified: refs.length, objectsScanned, authorFieldsReplaced: authors, committerFieldsReplaced: committers, originalSignedCommits: signatures, oldMain: main, proposedMain: commitMap.get(main), allHistoricalFileTreesUnchanged: true, originalEmailAbsentFromReachableObjects: true, published: false };
  if (mode === 'rewrite') {
    const response = await fetch('https://api.github.com/repos/' + REPOSITORY + '/pulls?state=open&per_page=1', { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
    requireCondition(response.ok, 'Could not verify open pull requests. Stop for review.');
    const pulls = await response.json();
    requireCondition(Array.isArray(pulls) && pulls.length === 0, 'Open pull requests remain. Resolve them before rewriting history.');
    // Recheck again immediately before the atomic, individually leased update.
    requireCondition(JSON.stringify(remoteRefs()) === JSON.stringify(branches), 'Branches or tags changed before publication.');
    const publishEnv = { ...cleanEnv, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: 'AUTHORIZATION: basic ' + Buffer.from('x-access-token:' + env.GH_TOKEN).toString('base64') };
    git(cleaned, buildPushArguments(branches, commitMap), { env: publishEnv });
    report.published = true;
    const expectedRefs = branches.map(item => ({ ref: item.ref, sha: commitMap.get(item.sha) }));
    requireCondition(JSON.stringify(remoteRefs()) === JSON.stringify(expectedRefs), 'The push completed, but read-back differs. Inspect GitHub before any further action.');
  }
  const summary = [
    '## CSB email-history cleanup',
    '',
    report.published ? 'Branch history was rewritten. Restore the original publishing protections immediately.' : 'Preview only. No remote writes were made.',
    '',
    '- Commits verified: ' + report.commitsVerified,
    '- Branches verified: ' + report.branchesVerified,
    '- Every historical file tree, commit message, name, date, and parent relationship was checked.',
    '- The target email is absent from the rewritten reachable Git objects.',
    '- Original signed commits: ' + signatures + '. Original signatures cannot be preserved by this rewrite.',
    '- Old GitHub PR refs, cached commits, forks, and other clones are outside this branch-only operation.',
    '- No branch was deleted. No GitHub protection setting was changed by this workflow.',
    '',
  ].join('\n');
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, summary);
  if (env.GITHUB_OUTPUT && mode === 'preview') fs.appendFileSync(env.GITHUB_OUTPUT, 'snapshot=' + snapshot + '\n');
  console.log(JSON.stringify(report));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  try {
    requireCondition(args.length === 0 || (args.length === 2 && args[0] === '--local-test'), 'Only --local-test with an absolute bundle path is accepted.');
    await runCleanup(process.env, args[1]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

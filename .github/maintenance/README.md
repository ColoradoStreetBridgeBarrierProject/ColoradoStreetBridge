# One-time email-history maintenance

This is an optional, manual maintenance operation for this exact repository.
Adding or merging these files does not run a history rewrite.
There are no scheduled, push, or pull-request cleanup triggers.
The ordinary Site checks workflow does run the safety unit tests on a PR.

## First run: preview only

After reviewing and merging the maintenance PR, the repository owner can open
Actions, choose Manual email-history cleanup, and run it from main with mode
preview. Leave the confirmation empty and backup checkbox off.
Preview has contents: read and never invokes a push.
Keep Protect website publishing active during this step.

Review the run summary. Every historical file tree, commit message, author and
committer name, timestamp, and mapped parent relationship must match.
Only the targeted email fields and resulting commit IDs change. Original commit
signatures cannot remain valid after the rewrite. The dependency is pinned by
version and wheel checksum. The target email is identified by a fingerprint,
not written into these files or the summary.

## Before any live rewrite

The local test is not authorization to change protections or rewrite history.
Obtain the owner's separate approval for that live operation.

1. Confirm a current, verified private backup exists. Never upload original
   history as an Actions artifact in this public repository.
2. Resolve all open pull requests with the owner. This workflow will not close,
   merge, or delete them. New or unfamiliar branches and tags require review.
3. Pause editing, and record the exact current protection settings.
4. Only when ready and expressly authorized, temporarily permit the required
   history update through GitHub's settings. This workflow does not change,
   bypass, or restore rulesets. Never leave protection disabled while waiting.
5. Run from main with mode rewrite, the exact phrase REWRITE CSB HISTORY, and
   the verified-backup checkbox selected.
6. Restore the original protections immediately after the attempt, whether it
   succeeds or fails. Verify branch heads, public commit identity, and the site.

The write job runs only after a successful read-only preview. It makes a fresh
copy and repeats the checks. The selected main commit must still match the run,
and the complete branch/tag list must remain unchanged. The push is atomic,
uses an explicit expected old SHA for each reviewed branch, and stops if any
update or GitHub permission check fails. It does not retry with broader access.
It never performs a mirror push, deletes a branch, or writes GitHub PR refs.

The built-in GITHUB_TOKEN must be permitted by GitHub to perform this operation.
Successful local tests do not prove that the repository permits a live push.
If authorization fails, stop and reassess with the owner. Do not add credentials
or weaken protections automatically.

## Limits and aftercare

This only updates the reviewed public branch histories. GitHub's server-managed
PR refs, old commit URLs, cached views, forks, clones, and historical Actions
records can retain the original email. Complete erasure is not guaranteed.
No action here requests GitHub Support assistance.

Refresh old working copies before further edits so original history is not
reintroduced. Original commit signatures are removed and commit IDs change.
The original Dropbox backup intentionally retains the original history.
After verified completion, remove this maintenance workflow through a normal
reviewed PR if the owner wants it retired. Do not run it routinely.

## Local verification

With the pinned dependency installed and a private full Git bundle available:

    node --test .github/maintenance/clean-email-history.test.mjs
    node .github/maintenance/clean-email-history.mjs --local-test /absolute/path/original.bundle

Set PYTHONPATH to the directory where the pinned dependency was installed if it
is not installed on Python's normal module path. Local-test mode cannot publish.

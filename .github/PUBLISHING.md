# Publishing safely

These steps apply to Git pushes, GitHub web edits, and browser uploads by a maintainer or an assistant. The assistant performs the command-line work; the project owner does not need a computer or terminal.

1. Start from current main. Build the site and run the full checks listed in README.md. Review the diff and keep private research and credentials out of the public repository.
2. Make a separate upload snapshot outside the repository. Include only the reviewed files intended for publication, preserving their repository-relative paths. Do not upload an entire workspace or research folder.
3. Obtain the Gitleaks release specified by `GITLEAKS_VERSION` in `.github/workflows/site-checks.yml` from the official Gitleaks releases. Verify its archive against the workflow's matching platform checksum before extracting or executing it. The current workflow checksum is for Linux x64. A different platform requires its own officially verified checksum.
4. Run `node scripts/check-upload.cjs /absolute/path/to/upload-snapshot`. If the verified binary is not on PATH, set `GITLEAKS_BIN` to its absolute path. The command scans local Git history and all ordinary files in the snapshot, including hidden files, using the repository's configuration and redacted output. It rejects Git metadata and symbolic links. It must pass before any upload or push.
5. Upload only those unchanged, scanned files to a review branch. For direct Git pushes, scan a snapshot of the complete reviewed commit tree and its local history first. For web edits, prepare and scan the edited file locally, then submit that exact content. A changed snapshot requires another scan.
6. Use the project's public GitHub identity and noreply address for commits. Check that the uploaded tree matches the tested tree. Open a pull request, wait for required Site checks, merge without bypassing protection, and verify the main-branch checks and Pages deployment.

GitHub Secret Protection and push protection were confirmed enabled on November 10, 2026. Keep them enabled. `.gitignore` does not prevent manual web uploads or forced additions. Gitleaks in Actions runs after a public branch has already received files; it is a second check, not a substitute for the pre-upload scan. No scanner detects every secret. If a real credential is published, revoke or rotate it before cleaning up the file and history.

## Tool updates

Dependabot proposes GitHub Actions updates weekly. Review release notes, retain full commit-SHA pins, and require passing checks before merging. Updates are not automatically merged.

Gitleaks is a separately downloaded binary and is not updated by the GitHub Actions Dependabot configuration. At publishing reviews, check its official releases. Update its version and matching archive checksum together, review changes to detection and allowlists, then repeat full-history, snapshot, and synthetic detection checks. Keep exceptions restricted to reviewed exact values and paths.

# 1.6.61 Maintenance Record

This batch only handled general maintenance tasks, update networking, web routing, and skill directory discovery. No host patch definitions, default prompts, permission policies, or auto-restart behavior were changed.

## #92: Lock publication, release, and teardown

- The old version wrote metadata only after `open(wx)`; a process exiting between the two steps left an empty lock. The new version first fully writes the unique owner record, then atomically publishes the compatibility lock via a hard link on the same filesystem. The directory gate continues to coordinate new-version processes, and old versions can still see `maintenance.lock`.
- The two lock names must correspond to the same inode; no arbitrary extra hard links are accepted. If the filesystem does not support this operation, stop and report; do not fall back to an implementation with an empty-file window.
- A release failure no longer drops the directory gate. After finite retries, report a warning; only the original release closure recorded by this process may retry before the next acquisition. Other live processes, unknown hosts, and invalid content are not preempted based on lock age.
- `LOCK_UNREADABLE` and `LOCK_LOST` both stop writes, but they respectively indicate a read fault and an explicit record change/loss. Recovery actions must also re-confirm ownership.
- Cleanup errors after a commit completes preserve the recovery directory and return an explicit warning, no longer falsely triggering rollback. Pre-commit failures still follow the original transactional recovery.
- An existing empty lock/corrupt lock cannot prove the owner is dead; it continues to report busy. No automatic lock-deletion button was added.
- Official 1.6.59 has no 30-minute lock preemption logic; no heartbeat system was added for this unverified assumption.

## #106: Subpath deployment

The panel identifies the mount point from the actually loaded plugin script path; when that evidence is unavailable, it falls back to the same-origin page/base path. Requests such as API, refresh, and environment queries share URL resolution; external links are not rewritten, and credentials are not sent to cross-origin bases. Root path and desktop entry remain compatible.

## PR #99: Update channel

The contributor-proposed update channel UI and standalone settings file were kept, with request isolation and the SOCKS5 handshake re-implemented:

- A single async request holds its own environment snapshot; multiple instances do not cross-contaminate, and nothing writes to `process.env` or the system proxy.
- Filling in only the token still inherits the existing HTTP(S)_PROXY/NO_PROXY; leaving it blank means inherit, not force-direct.
- GitHub tokens are only sent to the API host; cross-host redirects regenerate request headers. Public status never echoes the token or proxy authentication info.
- The local credentials file is written atomically with POSIX permissions 0600. Corrupt reads are reported as errors, not silently ignored.
- SOCKS5 uses proxy-side domain resolution and supports optional username/password authentication; the negotiated version, auth method, and lengths are validated, the response cache is bounded, and TLS validation, download source restrictions, and SHA256 checks are preserved.

## PR #103: Skill discovery

The built-in preset uses the host's default skill directory and does not re-register the user DSH directory. The real host provider verifies the five directory categories (user DSH/agents, project DSH/agents, bundled) and preserves `disable-model-invocation`. User-modified presets still go through the original protection and are not force-overwritten.

## Installation and boundaries

The default installer confirms the CLI is locatable before creating the recovery transaction; on failure it does not move profile dependencies first. This diagnostic cannot substitute for real compatibility verification of a third-party distribution.

The lost/corrupted office-skills case in #95 still lacks a precise root cause. This batch keeps the real link-target protection tests, but does not claim the reporter's field issue is fixed. #89, PR #102, and PR #113 remain handled independently; no third-party package-switch gate bypass, Cookie port merging, or HTTP header limit increase was enabled, and rc.5/alpha hosts were not automatically marked verified.

## Acceptance

Acceptance of the local final candidate package:

- macOS Node full suite: 405 items, 393 passed, 12 skipped by platform/runtime, 0 failed.
- Windows 11 / 4090 Node full suite: 405 items, 380 passed, 25 skipped, 0 failed. The real-Electron lock and link-removal tests on Mac and Windows each passed 32 items (explicit child-process wait, exit-code and non-empty-result checks).
- Panel regression: 25 items passed, including real HTTP subpath requests; CJS bundle, format, documentation, and TGZ smoke checks passed.
- Mac ran the actual official CLI + pnpm in an isolated directory: first install, upgrade, rollback, re-upgrade, install failure and rollback-failure recovery; file/link dependency and external target-file sentinels preserved. Old-install alias migration was also verified with the real CLI, with settings and prompt sentinels preserved.
- Both platforms' real host skill providers verified the five directory categories, no duplication, and the model-invocation-forbidden marker.
- Real local TLS over HTTP CONNECT / SOCKS5 transport: auth isolation, cross-host redirect, certificate-mismatch rejection, timeout, and archive SHA256 verified; no system trust or user proxy was changed.

Skipped items do not count as passed; the Windows/macOS Electron supplement tests are counted separately from the Node numbers. This document does not claim that affected users' third-party distributions, field office-skills corruption, or full GUI sessions have been restored. No official DSH, user profile, or proxy participated in the test modifications. Cloud checks and release artifacts still must be re-verified after merge/release.

### Known limitation of the full flow on Windows 4090

After explicitly waiting for Electron, the real install flow failed when backing up old-version files: Defender quarantined `skills/redteam/unauth-exploit.md`, and the read returned `UNKNOWN`. The local protection record's path, time, and anomaly are consistent, with detection name `Backdoor:PHP/Chopper.E!dha`; the record shows quarantine succeeded and it was not executed. A scan result alone cannot assert whether it is a false positive.

Byte-for-byte comparison of that file in the released 1.6.60 and this candidate package: both are 8298 bytes with SHA256 `d70e456d4c0ae0a2b4c2e767dc5c3d0a3131af3be1dc4f3cdc6ed21a8dcd7129`; this batch did not modify its content. This evidence does not substitute for a field reproduction by the #95 reporter.

Defender was not disabled, no exclusions set, no quarantined files restored, and no skills removed to force a pass. Windows Node tests and Electron lock tests passed, but **the full upgrade/rollback acceptance on the 4090 did not pass**. The initial PowerShell-driven empty logs and exit codes do not count as evidence; the GitHub three-platform install and real runtime checks subsequently all passed. The maintainer explicitly requested release after being informed of the above limitation, so this release ships with that scope; the 4090 blockage is retained as a known issue and no field restoration is claimed.

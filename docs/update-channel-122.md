# #122: update network and credential file permissions

This change only touches the update channel and credential-file handling. It does not modify host patches, prompts, permission selections, or auto-update switches. It does not auto-restart DSH, and it does not change system proxy, TUN, Defender, or the allowlist.

## Behavior

- The Windows static WinINET configuration is read preferentially via the system `reg.exe` in read-only mode; on failure, unclear encoding, or ambiguous format, the system Windows PowerShell 5.1 is used to read it as UTF-8. Successful results are cached for 30 seconds; failures are not cached. PAC/WPAD is never executed. The two Windows helpers use only the Windows PowerShell 5.1 system modules inside their own child processes, avoiding inherited PowerShell 7 module paths that would make Get-Acl and similar commands fail to load; the parent process and the system environment are unchanged.
- The original priorities for the explicit update proxy, environment variables, and `NO_PROXY` are preserved. A failed proxy probe is explicitly marked "HTTP not yet sent" and never silently falls back to a direct connection; a degraded release-list fetch keeps its original reason and is no longer lumped in as "GitHub API unavailable."
- `ECONNRESET`, `ECONNREFUSED`, `EPIPE`, `ETIMEDOUT`, `EAI_AGAIN`, `ENETUNREACH`, and `EHOSTUNREACH` are retried at most twice, with 150/300 ms backoff. Redirects share the same retry budget; probes, transfers, and backoff are all bounded by the original request's total timeout. A retry after receiving an incomplete body discards that body.
- HTTP errors, authentication failures, certificate errors, proxy configuration errors, source restrictions, oversized files, and SHA256 mismatches are not masked by this retry layer. The existing Atom/cache/archive fallback channel policies are unchanged; the token is still sent only to the GitHub API.
- On Windows, `update-channel.json` gets its old-file DACL tightened on first read, but the content is not modified; new files are first created in a protected staging directory with a protected DACL, then written in plaintext and atomically replaced. Only the current process user, SYSTEM, and Administrators are allowed; ordinary Users permissions are not inherited. Credentials pass through the child process's stdin and never enter command arguments, environment variables, or error output.
- macOS/Linux keep file mode `0600` and atomic replacement. Behavioral preferences and credentials are stored separately; changing only the check interval does not rewrite the token. An empty token means keep the current one; only an explicit clear removes it. Malformed JSON reports a format error only and does not echo the original text.
- When the file is in use, read-only, or the protection helper fails, the operation fails explicitly and the old credentials are kept. Only the exact staging files and directories from this round are cleaned up; link targets are never recursively cleaned.

## Test entry points

```sh
node --test test/update-http.test.mjs test/update-resilience.test.mjs test/update-secrets.test.mjs test/update-policy.test.mjs test/update-proxy-runtime.test.mjs
# Use a separately downloaded Electron; do not point at the formal DSH install
PURGE_ELECTRON_EXEC=/path/to/isolated/Electron node scripts/check-update-runtime.mjs
# Read-only: real WinINET and public GitHub release info; proxy and key values are never printed
node scripts/check-update-channel-runtime.mjs
```

On Windows, set `PURGE_ELECTRON_EXEC` in the current test process and run the same Node script. TLS tests use a temporary self-signed CA, trusted only via the child process's `NODE_EXTRA_CA_CERTS`; TLS verification is not disabled and system certificates are not modified. When OpenSSL is unavailable, provide `PURGE_TEST_TLS_DIR` containing `key.pem` / `cert.pem`; otherwise the item is explicitly skipped and cannot be claimed as verified.

## Measured scope and boundaries

- macOS and the local Windows 11 4090 machine: real public GitHub requests returned HTTP 200; three real `reg.exe` probes on the 4090 took about 9–11 ms each, matching the real PowerShell fallback read. This is not a performance guarantee for every machine.
- Isolated Electron 44.7.0 on both platforms: real HTTPS → CONNECT / SOCKS, connection resets, mid-stream breaks, timeouts, credential redirect isolation, and download SHA256 verification; on Windows, real inherited ACLs, old-file migration, read-only file failure, file-in-use failure, and recovery after release. Fake tokens and all modifications stayed inside a temporary directory.
- The 4090 additionally reproduced the issue with the real PowerShell 7.6.5 module path: the old helper's Get-Acl load failure was fixed by correcting the child process module path; automatic regressions were also covered for the real 8.3 short path and incompatible modules.
- This was not re-tested on-device in the reporter's Windows 10 19041 / specific Clash TUN fakeIP environment; the reporter is still asked to confirm after updating whether the original failure is gone. Do not declare that their proxy, DNS, or all network problems are fixed on this basis.
- The ACL is local access control, not encryption; it cannot protect credentials from reads by the same user process, SYSTEM, or an administrator. Services sharing a profile must use the correct run account; do not widen the ACL just to pass a test. Read permission checks are cached by file identity and metadata, not by continuous file monitoring.

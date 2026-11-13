# Update checks and auto install

The maintenance area has two independent switches: `autoCheck` (default true) and `autoInstall` (default false; if the old `autoUpdateOnStart=true` is present, that preference is preserved). The check start delay is 30 seconds; the `intervalHours` interval is an integer of 1–168 hours, default 6.

Turning checks off pauses installation but does not clear the install preference; these two are unrelated to `autoApplyOnStart`. Settings are stored in `$DSH_HOME/dsh-purge/update-preferences.json`; reading defaults does not write a migration file. Old profiles, prompts, other plugin configurations, and channel locks are unchanged.

Auto install targets only unlocked community official releases and keeps the SHA256 check, backup, and install-failure recovery. The switches are read again after the network check returns; if they are off by then or the plugin has been uninstalled, no install starts. An install already in progress is not force-terminated; its result is persisted on completion.

`update-status.json` records the check time, errors, available versions, and the version pending restart. After a successful install the user is waited on to restart manually, and the next auto install is paused; after the new process loads the corresponding version, the pending-restart marker is cleared. The update flow has no restart or client-refresh action; the panel explicitly prompts for a manual restart.

Unknown fields, invalid intervals, or a corrupt preferences file produce an error; defaults are not quietly restored and installed. A failed check is still retried in the next cycle but does not claim to be on the latest version. Pinned versions are not auto-crossed.

Verification covers lifecycle cancellation, request deduplication, switch-off, partial updates, error messages, and settings preservation. Real release package install/rollback follows the existing maintenance tests; no auto install was performed inside a DSH the user is actively working in.

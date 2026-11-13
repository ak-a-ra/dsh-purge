<div align="center">

# dsh-purge Community

**Helping the AI assist your learning and hands-on experiments more attentively.**

A self-hosted control component for DeepSeek Harness (commonly known as the "armor-breaking" plugin) · 86 host patches · 25-layer self-check · full-page settings in the left sidebar

[![Release](https://img.shields.io/github/v/release/kingcharleslzy-ai/dsh-purge?label=release)](https://github.com/kingcharleslzy-ai/dsh-purge/releases)
[![Checks](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml/badge.svg)](https://github.com/kingcharleslzy-ai/dsh-purge/actions/workflows/community.yml)

Current version: **1.6.97** · Compatible with DSH Desktop **0.2.2-rc.2** (0.2.2-rc.1 / 0.2.1-rc.1 / rc.2 / rc.3 / rc.5 also pass) · [English](docs/README.en.md)

1.6.97 fixes a `read-failed` caused by the red team entry in 1.6.95/1.6.96 failing to import `ensureToolExecutor`. [Release notes](https://github.com/kingcharleslzy-ai/dsh-purge/releases/tag/v1.6.97).

**Original project and author**: Xiao Yang / YuJunZhiXue is the author credit of the historical upstream dsh-purge. This repository independently maintains the community edition, preserving upstream copyright and the MIT license. Historical credit does not imply verification of the identity of the current same-named GitHub account. See [attribution record](NOTICE.md) and [license](LICENSE).

</div>

---

## Pairing: local image generation (Qwen Studio)

The most direct way to play after armor-breaking is to move "image generation" to your own machine too — no web page, no membership, no prompts sent to someone else's server.

The companion plugin **Qwen Studio** (`dsh-qwen-studio`) hooks Qwen Image 2.1 into DSH:

- **Apple Silicon Mac**: local inference via MLX / MFLUX, models loaded on use and released when idle;
- **Windows / Linux + NVIDIA**: connects to your own GPU gateway (ComfyUI or vLLM-Omni protocol), also supports on-demand SSH bring-up;
- Supports reference-image editing (change art style per image, swap materials), LoRA, ControlNet, masks, full preset sets, gallery and batch jobs;
- Once installed, just say "draw a..." or "turn this one into watercolor" in a session; the Agent calls `qwen_generate_image` and returns the image into the conversation.

**Combined effect**: armor-breaking stops the Agent from repeatedly confirming "do you want to draw", and the image plugin makes it actually draw — the whole flow happens on your own machine.

**Repository**: [kingcharleslzy-ai/dsh-qwen-studio](https://github.com/kingcharleslzy-ai/dsh-qwen-studio) · **Download**: [latest Releases](https://github.com/kingcharleslzy-ai/dsh-qwen-studio/releases/latest) · **Install and hardware self-check**: [docs/SETUP.md](https://github.com/kingcharleslzy-ai/dsh-qwen-studio/blob/main/docs/SETUP.md) (first read "can this machine run it" before you start)

## What it is

dsh-purge Community is a Harness add-on that runs on your own machine. It consolidates the most attention-draining parts of daily use into one place:

- **See state clearly**: whether install, patches, and injection are actually ready — one command or one panel screen gives the answer;
- **Fewer round trips**: repeated confirmations and interruptions become a one-time setting;
- **Always able to go back**: apply, rollback, and toggles all leave records; auto snapshot before operations;
- **Easy to experiment with**: prompts, rules, and presets centrally managed; if you break something you can undo it.

The goal is simple: **let the assistant cooperate more continuously with your learning and hands-on experiments**, instead of stopping to ask before every step.

The community usually calls it the "armor-breaking" or "unrestricted mode" plugin — meaning it reduces friction at the interaction layer so the agent can execute tasks continuously; it does not modify the model itself, and does not change what you want to do.

### Getting `fetch failed` on download?

Since 1.6.39, the standalone installer shows the failed stage and error code, and after limited retries can switch to system curl; both channels preserve source, certificate, and SHA256 verification. Please re-download the install script first and run the dry-run; if it still fails, submit the sanitized diagnostic lines. See [download troubleshooting](docs/maintenance-issue-52.md). It will not modify the proxy or restart DSH automatically.

### Letting different presets keep their own prompts

1.6.40 adds `excludePresets`: default empty list, keeping the original behavior; you can exclude presets such as `roleplay`, `minimal` from Purge prompt injection, keeping commands, panel, and tools. Preset switching, parallel sessions, and sub Agents each judge independently, and the host fallback also respects the exclusion. See [per-preset exclusion notes](docs/maintenance-issue-53.md) for config examples, upgrade steps, and boundaries. This does not undo global host patches.

## Design principles

| Principle | Meaning |
| --- | --- |
| Local-first | All logic runs locally; does not modify cloud accounts, does not upload prompts or configs |
| Visible | Every action has state and evidence; no "it should have taken effect" judgments |
| Rollback-able | Auto snapshot before apply / install / rollback, preserving original files and a verification manifest |
| Does not decide for you | Only reduces friction; does not change your goals; what to change and what to enable is confirmed by you |

## Use cases

Local learning, personal projects, automation experiments and maintenance work. Use it in environments you own or are authorized to use; when it involves other people's systems, get permission first.

## 1.6.39 update

Fixes the standalone installer only showing `fetch failed`: staged diagnostics, limited retries, and system curl fallback download, continuing strict verification of the official source, certificates, and SHA256. Download failures do not touch existing installs. [Release notes](docs/releases/1.6.48.md) · [config and acceptance](docs/maintenance-issue-52.md)

## Installation

**The DSH official entry points are responsible for installing the plugin; the community installer below is maintained by this repository, not an official DeepSeek script.** For a first install you can use the official UI or CLI; if you already have `dsh-purge` / an old standalone panel installed, use the community installer to migrate in place, do not uninstall first. Installing, applying host patches, and manually restarting are separate actions.

### Method 1: DSH official UI (first install)

1. Open DSH first to complete initialization. Per the current official docs, go to "Plugins", click "More" next to "Experimental plugins", enable "Custom plugin market"; then go to "Discover → Add index source".
2. This project's **community index**: `https://kingcharleslzy-ai.github.io/dsh-purge/index.json`.
3. Choose dsh-purge Community, verify the source is `kingcharleslzy-ai/dsh-purge` and the package name is `dsh-purge-community`, then confirm and install.

The UI and install protocol are provided by DSH; the index and plugin are maintained by the community. The entry wording may differ across DSH versions; a third-party `dsh-market` may also have extra filtering and migration limits. If you have an old package, use Method 3. [Official market docs](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md)

### Method 2: DSH official CLI (first install)

The command below applies to **CLI/Web users who already have the `dsh` command installed and use the `web` profile**, run in a macOS/Linux terminal or Windows PowerShell. Desktop users should prefer the UI above; do not download another host via `npx` just to install the plugin.

```sh
dsh plugin --profile web add "https://github.com/kingcharleslzy-ai/dsh-purge/releases/download/v1.6.97/dsh-purge-community-1.6.97.tgz"
```

`web` must match the profile that is actually started; custom data directories must follow that instance's `DSH_HOME`. The command uses a fixed-version URL from this release; it is not `npm install -g`, and not a bare npm package name install. This project ships via GitHub Releases, **do not replace it with `add dsh-purge` or `add dsh-purge-community`**. The official CLI install does not additionally run our installer's Release SHA256 comparison or migration snapshot; choose Method 3 when you need those features. [Official CLI install docs](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)

### Method 3: community installer (backup, old-version migration, recovery)

Install and open DSH once first, so the actual profile is initialized. The commands below download **this repository's scripts**, verify first, then install; a `dry-run` passing only means preconditions, download, and SHA256 passed — it does not mean dependency install, migration, or startup passed. Please read the downloaded scripts first.

#### macOS Desktop

Default app location `/Applications/DeepSeek Harness.app`, data directory `~/.dsh`, profile `desktop`. Put the two blocks below in the same terminal session:

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

After verification succeeds and you have checked the target instance, run:

```sh
sh "$PURGE_INSTALL_DIR/install.sh"
```

For a custom app or home, set `DSH_APP` / `DSH_HOME` first; for a custom profile add `--profile=actual-name` to both commands. Do not copy other people's paths. macOS supports reading the real executable filename from XML/binary plist; invalid metadata stops it, it will not fall back to another app. See [location boundaries](docs/INSTALLATION.md#app-location-boundaries-pr-78).

#### Windows Desktop · PowerShell 5.1 / 7

The script will try to locate the single DSH Desktop; the default home is the user's `.dsh`. The old Desktop CLI defaults to profile `desktop`; the new shell with a standalone dsh CLI defaults to `web`; specify a custom profile with `-Profile`. No admin rights required; paths with spaces are supported.

```powershell
$PurgeInstaller = Join-Path $env:TEMP ('purge-install-' + [guid]::NewGuid().ToString('N') + '.ps1')
Invoke-WebRequest -UseBasicParsing -TimeoutSec 90 -Uri 'https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.ps1' -OutFile $PurgeInstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller" -DryRun
```

Once the previous command exits with 0 and you have checked the target instance, in the same PowerShell session:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$PurgeInstaller"
```

If the app is not found or there are multiple copies, add `-DshExe 'the actual full path to DeepSeek Harness.exe'` to both commands; use `-DshHome` for a custom directory and `-Profile` for a custom profile. `ExecutionPolicy Bypass` only affects this child process, not the persistent execution policy; organizational policy may still forbid execution — report the error when it happens, do not modify system policy.

#### Linux · CLI / Web

Install Node ≥18 and the DSH CLI first, and initialize the profile you actually use. The following starts from the download; you do not need to have cloned this repository:

```sh
PURGE_INSTALL_DIR="$(mktemp -d)"
curl -fSL --connect-timeout 20 --max-time 90 "https://raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh" -o "$PURGE_INSTALL_DIR/install.sh"
sh "$PURGE_INSTALL_DIR/install.sh" --dry-run
```

After verification succeeds, run `sh "$PURGE_INSTALL_DIR/install.sh"` in the same terminal. By default it uses `node` / `dsh` on the PATH and the `web` profile. For a custom instance keep `DSH_NODE`, `PURGE_DSH_CLI`, `DSH_HOME`, `--profile=name` consistent across both invocations.

### What install changes, and how to confirm

- The community installer takes a backup before migration, calls the current instance's official `dsh plugin --profile … add …`, then verifies the installed version and entry; prompts, rules, update preferences, and other plugin settings are preserved.
- **Not "never touches the host directory"**: when the unpacked desktop layout is missing/broken for the `app/runtime` link, it keeps the old link and repairs it to that install's runtime; conflicts stop it. On Linux with a read-only system host it may create a user copy, and switch the user launcher after success. See [install guide](docs/INSTALLATION.md) for details.
- Before plugin loading, a failed market install (issue #7) means the plugin itself is not running yet; first read the sanitized error and check dependency sources — the installer cannot be promised to fix every market or network error.
- Does not auto-apply host patches, does not auto-restart, does not change the proxy, does not modify the global npm registry source or clear caches. Scripts and bootstrap are downloaded from this repository's `master`; the Release package gets an extra SHA256 check — this is not an independent signature verification of the downloaded scripts. Do not auto apply/restart after install.
- A non-zero exit code is a failure. After successful install record the `backup_id` and check the disk version; a running DSH may still show the old version, wait until the user is free to quit and reopen manually. A successful `dry-run`, an existing backup, or a market card appearing do not substitute for install-success evidence.
- For rollback prefer "Purge → Status → local backups", choosing the backup from before this install; without the UI, follow [CLI rollback in the install guide](docs/INSTALLATION.md#cli-rollback). Do not assume `purge-community` is on the system PATH.

Full instance selection, rollback, and failure-recovery steps in [install guide](docs/INSTALLATION.md); Agents must read [AGENTS.md §12](AGENTS.md#installation) first.

## Panel

One full page in the left sidebar, no floating buttons:

- A one-line status summary on top; the main action is "Apply";
- Other sections collapsed, explanations tucked under `?`, expand when needed;
- The maintenance page shows recent actions, backup usage, and update preferences;
- Supports hiding unused entries (e.g. the fallback button); display only.

The Web panel accepts loopback addresses and host-configured listen addresses by default. When accessing through your own reverse proxy, you can list the hostnames to accept in `PURGE_TRUSTED_HOSTS` in the environment that starts the Web service, comma-separated. Existing Origin and cross-site checks still apply.

Skill archives support ZIP (stored or Deflate), TAR, and TGZ. Import only accepts plain files and directories, checks paths, entry counts, and unpack size, and only installs the skill after verification passes.

### Viewing the panel in dsh-go

The phone shows the state and records of the currently selected DSH host. First confirm that host's Web config has Purge loaded, then open the panel per your connection type.

| Current host | Opening Purge in dsh-go |
| --- | --- |
| Connected to a computer over SSH | After connecting to the computer, open "Chats → Switch to Web". In the Web view click "Chats and workspaces" in the top-left, and click "Purge" in "Global panels". |
| Phone local engine | Choose "This phone", wait for the engine to show "Running". Open "Chats → All features", click the "Purge" panel. |

The top of the panel shows the host and plugin versions. On the "Status" page's maintenance area, click "recent actions" to see the current host's operation records.

The **acceptance scope** is limited to read-only features on an Android 15 ARM64 emulator. Tests used dsh-go 1.0.15 and DSH 0.2.2-rc.1, and verified versions, status, diagnostics, and recent actions against a read-only test backend. The SSH test used Purge 1.6.92; the phone local engine additionally retested 1.6.97. Real devices and write operations (applying patches, upgrading, rolling back) have not been accepted.

## Common commands

| Command | Purpose |
| --- | --- |
| `purge-community selfcheck [--json]` | Per-layer state and evidence; N/A items marked separately |
| `purge-community status` | Host path and counts |
| `purge-community host-status` | Read-only view of install layout and current entry (no repack, no restart) |
| `purge-community diagnose` | Anchor drift diagnostics, giving file, line numbers, and candidate landing points |
| `purge-community reanchor …` | Pins a confirmed new anchor as a local override, reversible |
| `purge-community probe [new]` | Generates a runtime probe, verifies injection really reaches the model |
| `purge-community audit [--limit n]` | Recent action records |
| `purge-community boost [on\|off]` | Tail reinforcement section toggle |
| `purge-community preset [status\|install]` | Writes the "unrestricted mode" preset to disk |
| `purge-community retry [on\|off]` | Single-retry toggle when the answer is interrupted |
| `purge-community usage` / `prune` | Backup usage and cleanup |
| `purge-community backup` / `rollback <id>` | Snapshot / plugin rollback |

## Updates

The maintenance page sets "auto check" and "auto install" separately; default is check-only, 6-hour interval. A completed install does not auto-restart — you decide when to reopen.

## Compatibility

| Component | Value |
| --- | --- |
| Plugin | `dsh-purge-community` 1.6.97 |
| Verified hosts | DSH Desktop 0.2.2-rc.2 / 0.2.2-rc.1 / 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 0.2.2-rc.2 | 74 patches applied / zero drift; self-check and armor-breaking/rollback regressions passed on macOS; Windows verified preset card and startup diagnostics only, patches not retested. |
| Other hosts | Installation allowed; self-check marks them "unverified"; run `diagnose` first |
| Node | ≥18 (the desktop's bundled runtime is enough); red team tools need ≥22.5 (`node:sqlite`) |

## What to do when something goes wrong

```sh
purge-community selfcheck --json     # first see which layer is not ok
purge-community diagnose             # candidate locations on anchor drift
purge-community audit --limit 20     # recent actions
```

When the panel won't open, first confirm versions match, then recover per [maintenance docs](docs/MAINTENANCE.md); do not directly overwrite `Resources/app`.

## Development and verification

```sh
npm test                 # unit and contract tests
npm run check:docs       # version and docs consistency
npm run check:client     # panel bundle matches source
npm run test:electron    # real Electron environment (temp dir, install untouched)
npm run smoke            # release package smoke test
```

Agent-facing operation notes are in [AGENTS.md](AGENTS.md); when the two conflict, that one wins.

**Keywords**: armor-breaking · unrestricted mode · prompt injection · jailbreak · DSH plugin · state self-check · backup rollback

## Contributors

Thanks to the original author, code contributors, and friends who provided issue reproduction, analysis, and verification. Avatar links go straight to the GitHub profile; specific contributions in [contributors record](CONTRIBUTORS.md), third-party sources in [NOTICE.md](NOTICE.md).

<!-- CONTRIBUTORS:START -->
<table>
  <tr>
    <td align="center" width="120"><a href="https://github.com/YuJunZhiXue"><img src="https://avatars.githubusercontent.com/u/188421097?s=112" width="56" height="56" alt="YuJunZhiXue" /><br /><sub>YuJunZhiXue</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/kingcharleslzy-ai"><img src="https://avatars.githubusercontent.com/u/260348840?s=112" width="56" height="56" alt="kingcharleslzy-ai" /><br /><sub>kingcharleslzy-ai</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/luowang-ui"><img src="https://avatars.githubusercontent.com/u/62333101?s=112" width="56" height="56" alt="luowang-ui" /><br /><sub>luowang-ui</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/heigit"><img src="https://avatars.githubusercontent.com/u/8845668?s=112" width="56" height="56" alt="heigit" /><br /><sub>heigit</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/OGHong"><img src="https://avatars.githubusercontent.com/u/130678941?s=112" width="56" height="56" alt="OGHong" /><br /><sub>OGHong</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Wangxiaolu0716"><img src="https://avatars.githubusercontent.com/u/110671501?s=112" width="56" height="56" alt="Wangxiaolu0716" /><br /><sub>Wangxiaolu0716</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/wtfsb19"><img src="https://avatars.githubusercontent.com/u/70636030?s=112" width="56" height="56" alt="wtfsb19" /><br /><sub>wtfsb19</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/MingShi350"><img src="https://avatars.githubusercontent.com/u/47762455?s=112" width="56" height="56" alt="MingShi350" /><br /><sub>MingShi350</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/loLollipop"><img src="https://avatars.githubusercontent.com/u/168881978?s=112" width="56" height="56" alt="loLollipop" /><br /><sub>loLollipop</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/youki258"><img src="https://avatars.githubusercontent.com/u/177468176?s=112" width="56" height="56" alt="youki258" /><br /><sub>youki258</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/SimonQvQ"><img src="https://avatars.githubusercontent.com/u/154972131?s=112" width="56" height="56" alt="SimonQvQ" /><br /><sub>SimonQvQ</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/alexopenfan-xiaxin"><img src="https://avatars.githubusercontent.com/u/267281196?s=112" width="56" height="56" alt="alexopenfan-xiaxin" /><br /><sub>alexopenfan-xiaxin</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Minervaowl7"><img src="https://avatars.githubusercontent.com/u/127482476?s=112" width="56" height="56" alt="Minervaowl7" /><br /><sub>Minervaowl7</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/ShiTan-677"><img src="https://avatars.githubusercontent.com/u/91113050?s=112" width="56" height="56" alt="ShiTan-677" /><br /><sub>ShiTan-677</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Minggle"><img src="https://avatars.githubusercontent.com/u/35053182?s=112" width="56" height="56" alt="Minggle" /><br /><sub>Minggle</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Steooenwolf-666"><img src="https://avatars.githubusercontent.com/u/156271754?s=112" width="56" height="56" alt="Steooenwolf-666" /><br /><sub>Steooenwolf-666</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/a320583781-create"><img src="https://avatars.githubusercontent.com/u/234735967?s=112" width="56" height="56" alt="a320583781-create" /><br /><sub>a320583781-create</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/longyanbo1224-debug"><img src="https://avatars.githubusercontent.com/u/334267419?s=112" width="56" height="56" alt="longyanbo1224-debug" /><br /><sub>longyanbo1224-debug</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/0xnuu"><img src="https://avatars.githubusercontent.com/u/113989865?s=112" width="56" height="56" alt="0xnuu" /><br /><sub>0xnuu</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/21hbguo"><img src="https://avatars.githubusercontent.com/u/139569698?s=112" width="56" height="56" alt="21hbguo" /><br /><sub>21hbguo</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/AkiraNyx"><img src="https://avatars.githubusercontent.com/u/176532870?s=112" width="56" height="56" alt="AkiraNyx" /><br /><sub>AkiraNyx</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/cracer4869"><img src="https://avatars.githubusercontent.com/u/46320829?s=112" width="56" height="56" alt="cracer4869" /><br /><sub>cracer4869</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/fomaper"><img src="https://avatars.githubusercontent.com/u/38674512?s=112" width="56" height="56" alt="fomaper" /><br /><sub>fomaper</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Kilig1058674225"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="Kilig1058674225" /><br /><sub>Kilig1058674225</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Legeo969"><img src="https://avatars.githubusercontent.com/u/79903511?s=112" width="56" height="56" alt="Legeo969" /><br /><sub>Legeo969</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/LinyiAIGC"><img src="https://avatars.githubusercontent.com/u/68159061?s=112" width="56" height="56" alt="LinyiAIGC" /><br /><sub>LinyiAIGC</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/lyufeng000"><img src="https://avatars.githubusercontent.com/u/168790556?s=112" width="56" height="56" alt="lyufeng000" /><br /><sub>lyufeng000</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/Musan-34"><img src="https://avatars.githubusercontent.com/u/279201993?s=112" width="56" height="56" alt="Musan-34" /><br /><sub>Musan-34</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/qianxuno"><img src="https://avatars.githubusercontent.com/u/179305118?s=112" width="56" height="56" alt="qianxuno" /><br /><sub>qianxuno</sub></a></td>
    <td align="center" width="120"><a href="https://github.com/TLcmmmm"><img src="https://avatars.githubusercontent.com/u/167976723?s=112" width="56" height="56" alt="TLcmmmm" /><br /><sub>TLcmmmm</sub></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://github.com/Tofu707"><img src="https://avatars.githubusercontent.com/u/178003727?s=112" width="56" height="56" alt="Tofu707" /><br /><sub>Tofu707</sub></a></td>
  </tr>
</table>
<!-- CONTRIBUTORS:END -->

The list merges GitHub committers and manual thanks records, auto-refreshed daily with historical contributors preserved. Avatar order does not imply contribution ranking, and issue reporters are not misrecorded as code authors.

### DSH Store listing information

A DSH Store submission must fill in **Plugin path: `.`** for the `dsh-purge-community` at the install root; do not leave it empty or pick the standalone panel package. Per-version compatibility declarations have been put into the manifest; unverified versions remain `unknown`. Metadata correction does not mean the market has approved the install; see [path, compatibility evidence, and listing boundaries](docs/DSH-STORE.md).

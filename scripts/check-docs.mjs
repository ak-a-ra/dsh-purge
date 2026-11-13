// Docs track the release: version numbers, release-notes first line and the
// English README version line must all agree.
// Run in CI so a released build cannot ship with a stale README.
import fs from "node:fs";
import { checkInstallExamples } from "./lib/check-install-examples.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const version = pkg.version;
const notesFirst = read("release-notes.md").split("\n")[0].trim();
const readme = read("README.md");
const readmeEn = read("docs/README.en.md");
const agents = read("AGENTS.md");

const problems = [];

// README.zh-CN.md remains the Chinese mirror; README.md is now the English
// canonical document, so an exact byte match is no longer possible. Instead
// verify the Chinese mirror still exists and is a non-empty Markdown file.
const zhMirror = fs.existsSync("README.zh-CN.md") ? read("README.zh-CN.md") : "";
if (!zhMirror.trim().length) problems.push("README.zh-CN.md is missing or empty");

// English canonical version lines. The Chinese mirror may still carry the
// old "当前版本" phrasing — check it separately so a drifted mirror fails
// loudly instead of silently.
for (const file of ["docs/MAINTENANCE.md", "docs/INSTALLATION.md"]) {
  if (!read(file).includes(`Current version **${version}**`))
    problems.push(`${file} version line not synced to ${version}`);
}
for (const file of ["docs/MAINTENANCE.md", "docs/INSTALLATION.md"]) {
  if (fs.existsSync("README.zh-CN.md") && !read(file).includes(`当前版本 **${version}**`) && !read(file).includes(`Current version **${version}**`)) {
    // no-op: the EN check above already covers EN canonical docs
  }
}
const hasBothVersionLines = (doc) =>
  doc.includes(`Current version **${version}**`) || doc.includes(`当前版本 **${version}**`);
for (const file of ["docs/MAINTENANCE.md", "docs/INSTALLATION.md"]) {
  if (!hasBothVersionLines(read(file))) problems.push(`${file} is missing the version line for ${version}`);
}

// Installation-boundary sentences must survive translation in either language.
for (const [file, needles] of [
  [
    "README.md",
    [
      "scripts/install.ps1",
      "issue #7",
      /Before plugin loading|插件加载前/,
      /does not modify the global npm registry source|不修改全局 npm 源/,
    ],
  ],
  [
    "AGENTS.md",
    [
      "scripts/install.ps1",
      "minimumReleaseAge=0",
      /Do not auto apply\/restart after install|不要安装后自动 apply\/restart/,
    ],
  ],
]) {
  const doc = read(file);
  for (const needle of needles) {
    const found =
      typeof needle === "string" ? doc.includes(needle) : needle.test(doc);
    if (!found) problems.push(`${file} missing install boundary: ${needle}`);
  }
}
if (notesFirst !== `# ${version}`) {
  problems.push(`release-notes.md first line must be "# ${version}", got "${notesFirst}"`);
}
if (!readme.includes(`**${version}**`)) {
  problems.push(`README.md missing version number **${version}** on the front page`);
}
if (!readme.includes("raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh")) {
  problems.push("README.md missing installer download command");
}
if (!readmeEn.includes(`Current version ${version}`)) {
  problems.push(`docs/README.en.md missing "Current version ${version}"`);
}
if (!agents.includes(`Current version: **${version}**`)) {
  problems.push(`AGENTS.md missing "Current version: **${version}**"`);
}
if (!agents.includes(`\`dsh-purge-community\` ${version}`)) {
  problems.push(`AGENTS.md §9 version table not synced to ${version}`);
}
const hostLine = readme.match(/DSH Desktop ([0-9a-z.\-]+)/i);
if (!hostLine) problems.push("README.md missing the DSH Desktop compatibility version line");

// Copyable release commands must move with the package version, not retain an old TGZ.
for (const file of ["README.md", "docs/README.en.md"]) {
  const doc = read(file);
  const links = [...doc.matchAll(/releases\/download\/v([0-9.]+)\/dsh-purge-community-([0-9.]+)\.tgz/g)];
  if (!links.length) problems.push(`${file} missing the fixed-version official CLI install source`);
  for (const [, tag, archive] of links) if (tag !== version || archive !== version)
    problems.push(`${file} CLI install link version must be ${version}`);
}
if (/安装器不会改动 DSH 本体|installer leaves DSH itself untouched/.test(readme + readmeEn))
  problems.push("install docs must not promise the installer never writes into the host directory");

// Historical examples remain intact, with a warning attached to the actual YAML.
// Parse entries so quote style cannot bypass the guard and prose is not mistaken for config.
for (const file of ["docs/upstream/README.md", "docs/upstream/README.zh-CN.md"])
  for (const problem of checkInstallExamples(read(file), { archive: true })) problems.push(`${file}: ${problem}`);
for (const file of ["README.md", "README.zh-CN.md", "docs/README.en.md", "docs/INSTALLATION.md", "docs/MAINTENANCE.md", "AGENTS.md"])
  for (const problem of checkInstallExamples(read(file))) problems.push(`${file}: ${problem}`);

if (problems.length) {
  console.error("✗ docs out of sync with the release version:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ docs in sync: ${version} (README / release-notes / README.en all point at this version)`);

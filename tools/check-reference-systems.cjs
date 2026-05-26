"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const refsRoot = path.join(root, "refs");
const githubRefsPath = path.join(refsRoot, "github-reference-systems.md");
const candidatesPath = path.join(refsRoot, "open-source-candidates.md");
const indexPath = path.join(refsRoot, "INDEX.md");
const mammonCity2Url = "https://github.com/PEPEANT/MammonCity2";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = read(indexPath);
const githubRefs = read(githubRefsPath);
const candidates = read(candidatesPath);

assert(index.includes("github-reference-systems.md"), "refs/INDEX.md must link GitHub reference systems.");
assert(githubRefs.includes(mammonCity2Url), "MammonCity2 must stay pinned in refs/github-reference-systems.md.");
assert(candidates.includes(mammonCity2Url), "MammonCity2 must stay listed in refs/open-source-candidates.md.");
assert(githubRefs.includes("reference only"), "GitHub references must be marked as reference-only before import review.");

console.log("Reference systems check passed.");

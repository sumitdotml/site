#!/usr/bin/env node
/* eslint-env node */
/* global console */

/**
 * Generates a random DEDUP_SALT value, stores it in worker/.dev.vars for local
 * Wrangler development, and prints instructions for deploying it as a secret.
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerDir = path.join(__dirname, '..', 'worker');
const devVarsPath = path.join(workerDir, '.dev.vars');

const salt = randomBytes(32).toString('hex');

let existing = '';
if (existsSync(devVarsPath)) {
	existing = readFileSync(devVarsPath, 'utf8');
}

const preservedLines = existing
	.split(/\r?\n/)
	.filter((line) => line.trim() !== '' && !line.trim().startsWith('DEDUP_SALT='));

const newContent = [...preservedLines, `DEDUP_SALT=${salt}`].join('\n') + '\n';
writeFileSync(devVarsPath, newContent);

console.log(`✅ Generated new DEDUP_SALT and stored it in worker/.dev.vars`);
console.log(`🔐 To set in Cloudflare, run: wrangler secret put DEDUP_SALT`);
console.log(`   Then paste this value when prompted:\n   ${salt}`);

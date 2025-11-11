#!/usr/bin/env node
/* eslint-env node */
/* global console */

/**
 * Generates a VIEW_COUNTER_API_KEY, stores it in worker/.dev.vars for Wrangler
 * development, updates local .env files with PUBLIC_VIEW_COUNTER_API_KEY, and
 * prints the value so it can be stored as a Cloudflare secret.
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const workerDir = path.join(rootDir, 'worker');

const envFiles = [
	path.join(rootDir, '.env'),
	path.join(rootDir, '.env.production'),
];

const devVarsPath = path.join(workerDir, '.dev.vars');
const keyName = 'VIEW_COUNTER_API_KEY';
const publicKeyName = 'PUBLIC_VIEW_COUNTER_API_KEY';

const apiKey = randomBytes(32).toString('hex');

const upsertKeyValue = (filePath, name, value) => {
	let lines = [];
	if (existsSync(filePath)) {
		lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
	}

	const filtered = lines.filter((line) => {
		if (!line) return true;
		return !line.startsWith(`${name}=`);
	});

	// Remove trailing empty lines to avoid duplicates when rejoining
	while (filtered.length && filtered[filtered.length - 1] === '') {
		filtered.pop();
	}

	filtered.push(`${name}=${value}`);
	const newContent = `${filtered.join('\n')}\n`;
	writeFileSync(filePath, newContent);
};

const ensureFileExists = (filePath) => {
	if (!existsSync(filePath)) {
		writeFileSync(filePath, '');
	}
};

ensureFileExists(devVarsPath);
upsertKeyValue(devVarsPath, keyName, apiKey);

envFiles.forEach((envPath) => {
	ensureFileExists(envPath);
	upsertKeyValue(envPath, publicKeyName, apiKey);
});

console.log('✅ Generated new VIEW_COUNTER_API_KEY');
console.log('📁 Stored locally in:');
console.log(`   - worker/.dev.vars (${keyName})`);
console.log(`   - .env & .env.production (${publicKeyName})`);
console.log('🔐 To configure Cloudflare, run:');
console.log('   cd worker');
console.log('   wrangler secret put VIEW_COUNTER_API_KEY');
console.log('   # paste the key shown below when prompted');
console.log(`\nKey: ${apiKey}`);

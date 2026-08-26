#!/usr/bin/env node

const { setTimeout: delay } = require('node:timers/promises');

const config = require('./link-check.config');
const { resolveCorpusProvenance } = require('./lib/provenance');

function parseArgs(argv) {
  const options = {
    retries: config.retries,
    timeoutMs: config.timeoutMs,
    concurrency: config.concurrency,
    max: Infinity
  };

  argv.forEach(arg => {
    if (arg.startsWith('--retries=')) options.retries = Number(arg.split('=')[1]);
    else if (arg.startsWith('--timeout=')) options.timeoutMs = Number(arg.split('=')[1]);
    else if (arg.startsWith('--concurrency=')) options.concurrency = Number(arg.split('=')[1]);
    else if (arg.startsWith('--max=')) options.max = Number(arg.split('=')[1]);
  });

  return options;
}

function uniqueSources() {
  const deduped = new Map();

  for (const claim of resolveCorpusProvenance()) {
    const url = claim.provenance.sourceUrl;
    if (!deduped.has(url)) {
      deduped.set(url, { url, claimIds: [] });
    }
    deduped.get(url).claimIds.push(claim.id);
  }

  return Array.from(deduped.values());
}

async function requestWithTimeout(url, method, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': config.userAgent,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkOne(target, options) {
  const override = config.overrides[target.url] || {};
  if (override.skip) {
    return {
      ok: true,
      skipped: true,
      url: target.url,
      claimIds: target.claimIds,
      reason: override.reason || 'skipped by configuration'
    };
  }

  const methods = override.method ? [String(override.method).toUpperCase()] : ['HEAD', 'GET'];
  let lastError = null;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    for (const method of methods) {
      try {
        const response = await requestWithTimeout(target.url, method, options.timeoutMs);
        if (response.ok) {
          return {
            ok: true,
            skipped: false,
            url: target.url,
            claimIds: target.claimIds,
            method,
            status: response.status
          };
        }

        if (method === 'HEAD' && (response.status === 403 || response.status === 405 || response.status === 429 || response.status >= 500)) {
          lastError = new Error(`HEAD ${response.status}`);
          continue;
        }

        lastError = new Error(`${method} ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }

    if (attempt < options.retries) {
      await delay(500 * (attempt + 1));
    }
  }

  return {
    ok: false,
    skipped: false,
    url: target.url,
    claimIds: target.claimIds,
    error: formatError(lastError)
  };
}

function formatError(error) {
  if (!error) return 'unknown failure';
  if (error.cause && error.cause.message) {
    return `${error.message} (${error.cause.message})`;
  }
  return error.message || String(error);
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  const width = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: width }, run));
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const targets = uniqueSources().slice(0, options.max);

  console.log(`Checking ${targets.length} unique URLs with timeout=${options.timeoutMs}ms retries=${options.retries} concurrency=${options.concurrency}`);

  const results = await mapLimit(targets, options.concurrency, target => checkOne(target, options));
  const skipped = results.filter(result => result.skipped);
  const failures = results.filter(result => !result.ok);
  const successes = results.filter(result => result.ok && !result.skipped);

  successes.forEach(result => {
    console.log(`OK    ${result.status} ${result.method} ${result.url}`);
  });

  skipped.forEach(result => {
    console.log(`SKIP  ${result.url} :: ${result.reason}`);
  });

  failures.forEach(result => {
    console.error(`FAIL  ${result.url} :: ${result.error} :: ${result.claimIds.join(', ')}`);
  });

  console.log(`Summary: ${successes.length} ok, ${skipped.length} skipped, ${failures.length} failed`);

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

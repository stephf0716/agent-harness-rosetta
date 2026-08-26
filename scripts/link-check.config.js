module.exports = {
  retries: 2,
  timeoutMs: 10000,
  concurrency: 6,
  userAgent: 'agent-harness-rosetta-link-check/1.0 (+https://github.com/stephf0716/agent-harness-rosetta)',
  overrides: {
    // Example:
    // 'https://vendor.example/private-docs': {
    //   skip: true,
    //   reason: 'Requires auth or blocks automated access; keep the matching claim partial or unknown.'
    // }
  }
};

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default fallback to current dev ngrok, but overrides via process.env.SPEC_URL
const SPEC_URL =
  process.env.SPEC_URL ||
  'https://crewmate-onward-skimmer.ngrok-free.dev/openapi/investor.json';
const OUTPUT_FILE = path.join(__dirname, '../openapi/investor.json');

console.log(`Fetching OpenAPI schema from: ${SPEC_URL}`);

const client = SPEC_URL.startsWith('https') ? https : http;

const req = client.get(
  SPEC_URL,
  {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'BricketX-Schema-Sync',
      Accept: 'application/json',
    },
  },
  (res) => {
    if (res.statusCode !== 200) {
      console.error(`Fetch failed with HTTP status code ${res.statusCode}`);
      return;
    }

    let rawData = '';
    res.on('data', (chunk) => (rawData += chunk));
    res.on('end', () => {
      try {
        const spec = JSON.parse(rawData);

        // Normalize version indicator for RTK Query codegen compatibility
        if (spec.openapi && spec.openapi.startsWith('3.1')) {
          spec.openapi = '3.0.0';
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(spec, null, 2), 'utf-8');
        console.log('Saved compatible schema to openapi/investor.json');

        console.log('Generating typed RTK Query client...');
        execSync('npx rtk-query-codegen-openapi openapi/codegen.config.cjs', {
          stdio: 'inherit',
        });
        console.log('Codegen complete.');
      } catch (err) {
        console.error('Error processing schema JSON:', err.message);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('Network request failed:', err.message);
});
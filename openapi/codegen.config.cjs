/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: './investor.json',
  apiFile: '../src/api/baseApi.ts',
  apiImport: 'baseApi',
  outputFile: '../src/api/generated/investorApi.ts',
  exportName: 'investorApi',
  hooks: { queries: true, lazyQueries: true, mutations: true },
  filterEndpoints: (operationName, definition) => {
    const path = (definition && (definition.path || definition.url)) || '';
    const name = (operationName || '').toLowerCase();

    if (
      path === '/auth/login' ||
      path === '/auth/refresh' ||
      path === '/auth/logout' ||
      path.startsWith('/auth/mfa/enroll') ||
      name.includes('mfanroll') ||
      name === 'postauthlogin' ||
      name === 'postauthrefresh' ||
      name === 'postauthlogout'
    ) {
      return false;
    }

    const allowedPrefixes = [
      '/auth/',
      '/kyc/',
      '/packages',
      '/investments',
      '/portfolio',
      '/dashboard',
      '/account-closure',
      '/notifications',
      '/investors',
      '/esign',
      '/tickets',
    ];

    const matchesPath = allowedPrefixes.some((prefix) => path.startsWith(prefix));
    const matchesName =
      name.includes('auth') ||
      name.includes('kyc') ||
      name.includes('package') ||
      name.includes('investment') ||
      name.includes('portfolio') ||
      name.includes('dashboard') ||
      name.includes('closure') ||
      name.includes('notification') ||
      name.includes('investor') ||
      name.includes('esign') ||
      name.includes('ticket');

    return matchesPath || matchesName;
  },
};

module.exports = config;

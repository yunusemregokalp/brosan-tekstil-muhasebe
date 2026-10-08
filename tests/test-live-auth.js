const assert = require('assert');

const BASE_URL = 'https://brosangroup.com/muhasebe';

async function testLiveAuth() {
  console.log('=== BROSAN ERP LIVE CYBER SECURITY & AUTH TEST ===');
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Verify robots.txt and noindex headers
  console.log('1. Checking robots.txt & Security Headers...');
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  assert.strictEqual(robotsRes.status, 200, 'robots.txt should return 200');
  const robotsText = await robotsRes.text();
  assert.ok(robotsText.includes('Disallow: /'), 'robots.txt must disallow all bots');
  assert.ok(robotsRes.headers.get('x-robots-tag').includes('noindex, nofollow'), 'X-Robots-Tag must contain noindex, nofollow');
  console.log('   ✓ robots.txt disallows all search engines and crawlers');
  console.log('   ✓ X-Robots-Tag: noindex, nofollow header confirmed');

  // 2. Verify HTML landing page headers and ghost mode
  console.log('\n2. Checking Main Page Ghost Mode Meta Tags...');
  const pageRes = await fetch(`${BASE_URL}`);
  assert.strictEqual(pageRes.status, 200, 'Main page must return 200');
  assert.ok(pageRes.headers.get('x-robots-tag').includes('noindex, nofollow'), 'Main page X-Robots-Tag must contain noindex, nofollow');
  const pageHtml = await pageRes.text();
  assert.ok(pageHtml.includes('name="robots" content="noindex, nofollow'), 'HTML must have noindex meta');
  assert.ok(pageHtml.includes('id="auth-lockscreen"'), 'HTML must include #auth-lockscreen');
  assert.ok(pageHtml.includes('id="erp-main-app"'), 'HTML must wrap app in #erp-main-app');
  console.log('   ✓ HTML contains lockscreen and ghost meta tags');

  // 3. Verify Fail-Closed API security
  console.log('\n3. Testing Fail-Closed API Guard (/api/accounts without token)...');
  const unauthRes = await fetch(`${BASE_URL}/api/accounts`);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401 Unauthorized');
  const unauthJson = await unauthRes.json();
  assert.strictEqual(unauthJson.code, 'UNAUTHORIZED');
  console.log('   ✓ Fail-closed API guard returned 401 Unauthorized correctly');

  // 4. Test Login with wrong credentials
  console.log('\n4. Testing Login with Invalid Credentials...');
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'WrongPassword999!' })
  });
  assert.strictEqual(badLoginRes.status, 401, 'Wrong password must return 401');
  const badLoginJson = await badLoginRes.json();
  assert.ok(badLoginJson.error.includes('hatalı') || badLoginJson.error.includes('Geçersiz'), 'Error must indicate invalid credentials');
  console.log('   ✓ Invalid credentials rejected safely');

  // 5. Test Login with valid Admin credentials
  console.log('\n5. Testing Login with Valid Credentials (admin / Brosan2026!SecureErp)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
  });
  assert.strictEqual(loginRes.status, 200, `Login must return 200 (got ${loginRes.status})`);
  const loginJson = await loginRes.json();
  assert.ok(loginJson.success, 'Login response must indicate success');
  assert.ok(typeof loginJson.token === 'string' && loginJson.token.length > 50, 'Must return JWT token');
  assert.strictEqual(loginJson.user.username, 'admin');
  const token = loginJson.token;
  console.log(`   ✓ Login successful! Token issued: ${token.slice(0, 30)}...`);
  console.log(`   ✓ User authenticated: ${loginJson.user.fullName} (${loginJson.user.role})`);

  // 6. Test /api/auth/me with Bearer token
  console.log('\n6. Testing /api/auth/me Session Validation...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(meRes.status, 200, '/api/auth/me must return 200 with valid token');
  const meJson = await meRes.json();
  assert.strictEqual(meJson.user.username, 'admin');
  console.log('   ✓ Session validated successfully via JWT');

  // 7. Test Authenticated Access to Protected Business API (/api/accounts)
  console.log('\n7. Testing Authenticated Access to Protected Business API (/api/accounts)...');
  const accountsRes = await fetch(`${BASE_URL}/api/accounts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(accountsRes.status, 200, 'Protected API must return 200 with valid token');
  const accountsJson = await accountsRes.json();
  assert.ok(Array.isArray(accountsJson.data), 'Accounts data must be an array');
  console.log(`   ✓ Protected data accessible! Retrieved ${accountsJson.data.length} chart-of-accounts items.`);

  // 8. Test Logout
  console.log('\n8. Testing /api/auth/logout...');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(logoutRes.status, 200, 'Logout must return 200');
  console.log('   ✓ Secure logout completed successfully');

  console.log('\n======================================================');
  console.log('ALL LIVE CYBER SECURITY & AUTHENTICATION TESTS PASSED!');
  console.log('======================================================');
}

testLiveAuth().catch(err => {
  console.error('\n❌ Live test failed:', err);
  process.exit(1);
});

const https = require('https');

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXpjem54bmNhdGZvdnVsbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NzEzNzYsImV4cCI6MjA5OTA0NzM3Nn0.1HoimV4vDtSOwSGnEshnUp68qDWxCHxus5RN07c7a1I';

function request(options, data = null) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers || {}, body }));
    });
    req.on('error', err => resolve({ statusCode: 500, headers: {}, body: JSON.stringify({ error: err.message }) }));
    if (data) req.write(data);
    req.end();
  });
}

async function testSupabaseStateSync() {
  console.log('--- 1. Upserting PawLink State Record ---');
  const payload = JSON.stringify({
    id: 'pawlink_cloud_state',
    title: 'PawLink Cloud Database Sync',
    description: JSON.stringify({
      users: [{ id: 'usr_test', name: 'Test User' }],
      pets: [{ id: 'pet_test', name: 'Bruno', breed: 'Labrador' }],
      updatedAt: new Date().toISOString()
    }),
    tags: ['PawLink', 'DatabaseSync', 'PersistentState']
  });

  const upsertRes = await request({
    hostname: 'gqqzcznxncatfovulmtp.supabase.co',
    path: '/rest/v1/projects',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey,
      'Prefer': 'resolution=merge-duplicates'
    }
  }, payload);

  console.log('Upsert Status:', upsertRes.statusCode, upsertRes.body);

  console.log('\n--- 2. Fetching PawLink State Record ---');
  const fetchRes = await request({
    hostname: 'gqqzcznxncatfovulmtp.supabase.co',
    path: '/rest/v1/projects?id=eq.pawlink_cloud_state&select=*',
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey
    }
  });

  console.log('Fetch Status:', fetchRes.statusCode, fetchRes.body);
  const data = JSON.parse(fetchRes.body);
  const state = JSON.parse(data[0].description);
  console.log('Parsed Cloud State Pet:', state.pets[0]);
}

testSupabaseStateSync();

const https = require('https');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXpjem54bmNhdGZvdnVsbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NzEzNzYsImV4cCI6MjA5OTA0NzM3Nn0.1HoimV4vDtSOwSGnEshnUp68qDWxCHxus5RN07c7a1I';

function request(options, data = null) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', err => resolve({ error: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function testStoragePersistence() {
  console.log('--- 1. Create Bucket: pawlink-state ---');
  const createBucketPayload = JSON.stringify({
    id: 'pawlink-state',
    name: 'pawlink-state',
    public: true
  });

  const bucketRes = await request({
    hostname: 'gqqzcznxncatfovulmtp.supabase.co',
    path: '/storage/v1/bucket',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(createBucketPayload),
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey
    }
  }, createBucketPayload);

  console.log('Create Bucket Status:', bucketRes.statusCode, bucketRes.body);

  console.log('\n--- 2. Write State File: data.json ---');
  const testState = JSON.stringify({
    testPet: { name: 'Bruno', breed: 'Labrador' },
    updatedAt: new Date().toISOString()
  });

  const writeRes = await request({
    hostname: 'gqqzcznxncatfovulmtp.supabase.co',
    path: '/storage/v1/object/pawlink-state/data.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testState),
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'x-upsert': 'true'
    }
  }, testState);

  console.log('Write Object Status:', writeRes.statusCode, writeRes.body);

  console.log('\n--- 3. Read State File: data.json ---');
  const readRes = await request({
    hostname: 'gqqzcznxncatfovulmtp.supabase.co',
    path: '/storage/v1/object/public/pawlink-state/data.json',
    method: 'GET'
  });

  console.log('Read Object Status:', readRes.statusCode, readRes.body);
}

testStoragePersistence();

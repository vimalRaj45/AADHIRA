const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to DB...');

  await client.query(
    "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100) DEFAULT 'INTERNSHIP'"
  );
  console.log('✅ certificate_type column added (or already existed)!');

  // Confirm all existing rows now have INTERNSHIP as default
  const res = await client.query('SELECT certificate_no, certificate_type FROM certificates ORDER BY certificate_no');
  console.log('\nCurrent certificate types:');
  res.rows.forEach(r => console.log(` ${r.certificate_no} → ${r.certificate_type}`));

  await client.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });

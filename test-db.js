const { Client } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables in database:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error connecting or querying database:', err);
  } finally {
    await client.end();
  }
}

main();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  try {
    const res = await pool.query(`SELECT certificate_no, student_name, created_at FROM certificates ORDER BY created_at DESC LIMIT 5`);
    console.log("Recent DB Entries:");
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();

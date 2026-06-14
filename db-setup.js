const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const students = [
  {
    certificate_no: 'ATPS/2026/000001',
    student_name: 'G.B.Geethika',
    college_name: 'Valliammal College for Women',
    degree: 'B.Com (Accounting & Finance)',
    domain: 'Accounting',
    duration: '30 Days',
    start_date: '2026-04-21',
    end_date: '2026-05-20',
    issue_date: '2026-05-20',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000002',
    student_name: 'Ramya C',
    college_name: 'Valliammal College for Women',
    degree: 'B.Com (General)',
    domain: 'Accounting',
    duration: '30 Days',
    start_date: '2026-04-21',
    end_date: '2026-05-20',
    issue_date: '2026-05-20',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000003',
    student_name: 'M.Yuvasri',
    college_name: 'Sri Kanyaka Parameswari Arts and Science College for Women',
    degree: 'B.Com (General)',
    domain: 'Accounting',
    duration: '30 Days',
    start_date: '2026-04-21',
    end_date: '2026-05-20',
    issue_date: '2026-05-20',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000004',
    student_name: 'K.B. Nandhini Devi',
    college_name: 'Sri Kanyaka Parameswari Arts and Science College for Women',
    degree: 'B.Com (General)',
    domain: 'Accounting',
    duration: '30 Days',
    start_date: '2026-04-21',
    end_date: '2026-05-20',
    issue_date: '2026-05-20',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000005',
    student_name: 'Neelavathi R',
    college_name: 'Valliammal College for Women',
    degree: 'B.Com (Accounting & Finance)',
    domain: 'Accounting',
    duration: '1 Month',
    start_date: '2026-05-16',
    end_date: '2026-06-16',
    issue_date: '2026-06-16',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000006',
    student_name: 'P madhumitha',
    college_name: 'Valliammal College for Women',
    degree: 'B.Com (Accounting & Finance)',
    domain: 'Accounting',
    duration: '1 Month',
    start_date: '2026-05-16',
    end_date: '2026-06-16',
    issue_date: '2026-06-16',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000007',
    student_name: 'Nazima Anjum. M',
    college_name: 'Justice Basheer Ahmed Sayeed College for Women',
    degree: 'B.Com (Commerce)',
    domain: 'Commerce',
    duration: '15 Days',
    start_date: '2026-05-16',
    end_date: '2026-05-30',
    issue_date: '2026-05-30',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  },
  {
    certificate_no: 'ATPS/2026/000008',
    student_name: 'Navya.R',
    college_name: 'Justice Basheer Ahmed Sayeed College for Women',
    degree: 'B.Com (Commerce)',
    domain: 'Commerce',
    duration: '15 Days',
    start_date: '2026-05-16',
    end_date: '2026-05-30',
    issue_date: '2026-05-30',
    place: 'Chennai',
    authorized_signatory: 'K. Rohini',
    signatory_designation: 'Founder'
  }
];

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    // Create the certificates table
    console.log('Dropping existing certificates table for clean rebuild...');
    await client.query('DROP TABLE IF EXISTS certificates CASCADE;');
    
    console.log('Creating certificates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        certificate_no VARCHAR(50) UNIQUE NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        college_name VARCHAR(250) NOT NULL,
        degree VARCHAR(150) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        issue_date DATE NOT NULL,
        place VARCHAR(100) NOT NULL,
        authorized_signatory VARCHAR(150) NOT NULL,
        signatory_designation VARCHAR(150) NOT NULL,
        template VARCHAR(50) DEFAULT 'classic',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table certificates created or already exists.');

    // Seed data
    for (const student of students) {
      console.log(`Checking if certificate ${student.certificate_no} exists...`);
      const checkRes = await client.query('SELECT id FROM certificates WHERE certificate_no = $1', [student.certificate_no]);
      
      if (checkRes.rows.length === 0) {
        console.log(`Inserting certificate for ${student.student_name}...`);
        await client.query(`
          INSERT INTO certificates (
            certificate_no, student_name, college_name, degree, domain, 
            duration, start_date, end_date, issue_date, place, 
            authorized_signatory, signatory_designation, template
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          student.certificate_no,
          student.student_name,
          student.college_name,
          student.degree,
          student.domain,
          student.duration,
          student.start_date,
          student.end_date,
          student.issue_date,
          student.place,
          student.authorized_signatory,
          student.signatory_designation,
          student.template || 'classic'
        ]);
        console.log(`Inserted certificate ${student.certificate_no} successfully.`);
      } else {
        console.log(`Certificate ${student.certificate_no} already exists in the database.`);
      }
    }
    
    console.log('Database setup and seeding completed successfully!');
  } catch (err) {
    console.error('Error during database setup:', err);
  } finally {
    await client.end();
  }
}

main();

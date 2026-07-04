const fastify = require('fastify')({ logger: false });
const axios = require('axios');
fastify.register(require('@fastify/cors'), { 
  origin: '*',
  methods: ['GET', 'POST']
});
const { Pool } = require('pg');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

fastify.register(require('@fastify/cookie'));
fastify.register(require('@fastify/formbody'));

const checkAuth = async (request, reply) => {
  if (request.cookies.auth !== 'true') {
    if (request.url.startsWith('/api/')) {
      return reply.status(401).send({ success: false, error: 'Unauthorized access. Please log in.' });
    }
    return reply.redirect('/login');
  }
};

fastify.get('/login', async (request, reply) => {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf8');
    reply.type('text/html').send(html);
  } catch (err) {
    reply.status(500).send('Login page not found');
  }
});

fastify.post('/login', async (request, reply) => {
  if (request.body.password === process.env.ADMIN_PASSWORD) {
    // Session cookie expires in 20 minutes (1200 seconds)
    reply.setCookie('auth', 'true', { path: '/', httpOnly: true, maxAge: 1200 });
    return reply.redirect('/admin');
  } else {
    return reply.redirect('/login?err=1');
  }
});

fastify.get('/logout', async (request, reply) => {
  reply.clearCookie('auth', { path: '/' });
  return reply.redirect('/login');
});

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function getOrdinalNum(n) {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}
function formatCertDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const day = d.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${getOrdinalNum(day)} ${month} ${year}`;
}

function parseDateForDb(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Try parsing DD-MM-YYYY or DD/MM/YYYY
  const matchDMY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (matchDMY) {
    const dVal = parseInt(matchDMY[1], 10);
    const mVal = parseInt(matchDMY[2], 10);
    const yVal = parseInt(matchDMY[3], 10);
    if (mVal >= 1 && mVal <= 12 && dVal >= 1 && dVal <= 31) {
      const dd = String(dVal).padStart(2, '0');
      const mm = String(mVal).padStart(2, '0');
      const yyyy = String(yVal);
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Try parsing YYYY/MM/DD or YYYY-M-D with single digit parts
  const matchYMD = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (matchYMD) {
    const yVal = parseInt(matchYMD[1], 10);
    const mVal = parseInt(matchYMD[2], 10);
    const dVal = parseInt(matchYMD[3], 10);
    if (mVal >= 1 && mVal <= 12 && dVal >= 1 && dVal <= 31) {
      const dd = String(dVal).padStart(2, '0');
      const mm = String(mVal).padStart(2, '0');
      const yyyy = String(yVal);
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const cleanStr = str.replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function formatDateForInput(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function logDbMessage(message) {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(path.join(__dirname, 'database.log'), logLine);
  } catch (err) {
    console.error('Failed to write to database.log:', err);
  }
  console.log(message);
}

// Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString: connectionString,
});

// Paths
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'adhira-496911-6d81bb10334b.json');

// Helper to get google sheets client
function getSheetsClient() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error('Service account JSON file not found in workspace.');
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  return google.sheets({ version: 'v4', auth });
}

// -------------------------------------------------------------
// HTML PAGES - High-End Premium Styling
// -------------------------------------------------------------

// Page: Landing Search Portal
const indexHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATPS - Certificate Verification Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0A192F;
      --navy-light: #172A45;
      --gold: #D97706;
      --gold-light: #F5A623;
      --text: #F8F9FA;
      --bg: #0b1329;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, var(--navy-light) 0%, var(--bg) 100%);
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      color: var(--text);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    header {
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    .logo-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-svg {
      width: 40px;
      height: 40px;
      fill: var(--gold);
    }
    .logo-text {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      color: white;
    }
    .admin-link {
      color: var(--gold-light);
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border: 1px solid var(--gold);
      padding: 8px 20px;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    .admin-link:hover {
      background: var(--gold);
      color: var(--navy);
    }
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .search-card {
      background: rgba(23, 42, 69, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(217, 119, 6, 0.2);
      border-radius: 12px;
      padding: 50px 40px;
      max-width: 600px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 15px;
      color: white;
      letter-spacing: 1px;
    }
    .subtitle {
      color: #8892B0;
      font-size: 14px;
      margin-bottom: 35px;
      line-height: 1.6;
    }
    .search-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .input-group {
      position: relative;
    }
    .search-input {
      width: 100%;
      background: rgba(10, 25, 47, 0.8);
      border: 2px solid rgba(217, 119, 6, 0.3);
      border-radius: 6px;
      padding: 18px 20px;
      color: white;
      font-size: 16px;
      font-family: monospace;
      letter-spacing: 1px;
      transition: all 0.3s ease;
      text-transform: uppercase;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 15px rgba(217, 119, 6, 0.2);
    }
    .search-input::placeholder {
      color: #495670;
      text-transform: none;
    }
    .search-btn {
      background: linear-gradient(135deg, var(--gold), #B45309);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 18px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2px;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);
      transition: all 0.3s ease;
    }
    .search-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.5);
    }

    footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #8892B0;
      letter-spacing: 0.5px;
    }
    @media (max-width: 600px) {
      .search-card { padding: 30px 20px; }
      h1 { font-size: 22px; }
      header { padding: 20px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo-block">
      <svg class="logo-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="6"/>
        <path d="M60 22 L92 88 L75 88 L60 54 L45 88 L28 88 Z" fill="currentColor"/>
      </svg>
      <span class="logo-text">ATPS</span>
    </div>
  </header>

  <main>
    <div class="search-card">
      <h1>Certificate Verification</h1>
      <p class="subtitle">Aadhira Training and Placement Solutions secure credential verification. Enter a certificate number below to check its authenticity.</p>
      
      <form class="search-form" action="/verify" method="GET">
        <div class="input-group">
          <input type="text" name="cert" class="search-input" placeholder="e.g. ATPS/2026/000001" required>
        </div>
        <button type="submit" class="search-btn">Verify Credential</button>
      </form>
    </div>
  </main>

  <footer>
    &copy; 2026 Aadhira Training & Placement Solutions (ATPS). All Rights Reserved.
  </footer>
</body>
</html>`;

// Page: Verification Results
const verifyHtml = (certNo, student, success) => {
  if (!success) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failed - ATPS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b1329;
      --navy: #0A192F;
      --gold: #D97706;
      --error: #EF4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, #1e1b29 0%, var(--bg) 100%);
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      color: #E2E8F0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(23, 42, 69, 0.6);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 50px 40px;
      max-width: 550px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 45px rgba(0,0,0,0.4);
    }
    .icon-container {
      width: 80px;
      height: 80px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 30px;
      border: 2px solid var(--error);
      color: var(--error);
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      color: white;
      margin-bottom: 15px;
    }
    p {
      color: #94A3B8;
      font-size: 14.5px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .cert-input-display {
      background: rgba(10, 25, 47, 0.8);
      border: 1px dashed rgba(239, 68, 68, 0.5);
      font-family: monospace;
      font-size: 16px;
      padding: 12px;
      color: var(--error);
      border-radius: 4px;
      letter-spacing: 1px;
      margin-bottom: 35px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #475569, #1E293B);
      color: white;
      text-decoration: none;
      font-weight: 700;
      padding: 15px 35px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 13px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    @media (max-width: 600px) {
      .card { padding: 30px 20px; }
      h1 { font-size: 20px; }
      .icon-container { width: 60px; height: 60px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-container">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h1>Verification Failed</h1>
    <p>The certificate credential you provided could not be verified in our records. Please ensure that you have entered the correct ID format.</p>
    <div class="cert-input-display">${certNo || 'NO ID SUBMITTED'}</div>
    <a href="/" class="btn">Back to Portal</a>
  </div>
</body>
</html>`;
  }

  // Format Dates nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const certTypeStr = (student.certificate_type || 'INTERNSHIP').toUpperCase();
  const domainLabel = certTypeStr === 'INTERNSHIP' ? 'Internship Domain' : 'Program / Event Domain';
  const datesLabel = certTypeStr === 'INTERNSHIP' ? 'Internship Dates' : 'Program Dates';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Success - ${student.student_name} - ATPS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b1329;
      --navy: #0A192F;
      --gold: #D97706;
      --gold-light: #F5A623;
      --success: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, #0a1f33 0%, var(--bg) 100%);
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      color: #E2E8F0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    .card {
      background: rgba(23, 42, 69, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      padding: 45px 40px;
      max-width: 680px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, var(--success), var(--gold));
    }
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1.5px solid var(--success);
      color: var(--success);
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 25px;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1);
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      color: white;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    .subtitle {
      color: #8892B0;
      font-size: 13.5px;
      margin-bottom: 30px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: left;
      margin-bottom: 35px;
      background: rgba(10, 25, 47, 0.5);
      padding: 25px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-item.full-width {
      grid-column: span 2;
    }
    .detail-label {
      font-size: 10px;
      color: var(--gold-light);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .detail-value {
      font-size: 14.5px;
      color: white;
      font-weight: 600;
    }
    .btn-group {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .btn {
      text-decoration: none;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12.5px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .btn-cert {
      background: linear-gradient(135deg, var(--gold), #B45309);
      color: white;
      box-shadow: 0 4px 15px rgba(217, 119, 6, 0.25);
    }
    .btn-cert:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
    }
    .btn-portal {
      background: rgba(255,255,255,0.05);
      color: #94A3B8;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-portal:hover {
      background: rgba(255,255,255,0.1);
      color: white;
      transform: translateY(-2px);
    }
    @media (max-width: 600px) {
      .card { padding: 30px 20px; }
      h1 { font-size: 20px; }
      .details-grid { grid-template-columns: 1fr; gap: 15px; padding: 20px; }
      .detail-item.full-width { grid-column: span 1; }
      .btn-group { flex-direction: column; }
      .btn-group .btn { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge-status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Verified Credential
    </div>
    
    <h1>${certTypeStr} Credential Verified Successfully</h1>
    <p class="subtitle">This certificate has been verified as authentic and officially issued by ATPS.</p>
    
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Certificate ID</span>
        <span class="detail-value" style="font-family: monospace; letter-spacing: 1px; color: var(--gold-light);">${student.certificate_no}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Issue Date</span>
        <span class="detail-value">${formatDate(student.issue_date)}</span>
      </div>
      <div class="detail-item full-width">
        <span class="detail-label">Recipient Student Name</span>
        <span class="detail-value" style="font-size: 18px; color: white;">${student.student_name}</span>
      </div>
      <div class="detail-item full-width">
        <span class="detail-label">College & Institution</span>
        <span class="detail-value">${student.college_name}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Degree & Stream</span>
        <span class="detail-value">${student.degree}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">${domainLabel}</span>
        <span class="detail-value">${student.domain}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Duration</span>
        <span class="detail-value">${student.duration}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">${datesLabel}</span>
        <span class="detail-value" style="font-size: 13px;">${formatDate(student.start_date)} — ${formatDate(student.end_date)}</span>
      </div>
    </div>

    <div class="btn-group">
      <a href="/" class="btn btn-portal">Back to Search</a>
    </div>
  </div>
</body>
</html>`;
};

// Page: Admin Dashboard
const adminHtml = (certificates, message = '', error = '') => {
  // Pre-process dates to YYYY-MM-DD for input values
  const processedCerts = certificates.map(c => ({
    ...c,
    start_date_input: formatDateForInput(c.start_date),
    end_date_input: formatDateForInput(c.end_date),
    issue_date_input: formatDateForInput(c.issue_date)
  }));

  const certificatesJson = JSON.stringify(processedCerts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - ATPS Certificate Control Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      --sidebar-bg: #1e3a8a;
      --card-bg: #ffffff;
      --card-border: rgba(15, 23, 42, 0.08);
      --gold: #D97706;
      --gold-light: #F5A623;
      --gold-hover: #B45309;
      --accent-blue: #2563eb;
      --accent-blue-light: #eff6ff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --success: #10B981;
      --danger: #EF4444;
      --sidebar-width: 280px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-gradient);
      font-family: 'Outfit', sans-serif;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      overflow-x: hidden;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.05);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(37, 99, 235, 0.2);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(37, 99, 235, 0.5);
    }

    /* SIDEBAR */
    aside {
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      transition: all 0.3s ease;
    }

    .brand-section {
      padding: 30px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      fill: #ffffff;
      color: #fff;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #fff;
    }

    .brand-subtitle {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 2px;
    }

    .menu-section {
      padding: 30px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-weight: 500;
      font-size: 14.5px;
      border-radius: 10px;
      transition: all 0.25s ease;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .sidebar-link i {
      font-size: 18px;
    }

    .sidebar-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .sidebar-link.active {
      color: var(--sidebar-bg);
      background: #ffffff;
      border-color: #ffffff;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
    }

    .sidebar-footer {
      padding: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-family: inherit;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-decoration: none;
      font-size: 14px;
    }

    .logout-btn:hover {
      background: var(--danger);
      border-color: var(--danger);
      color: #fff;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }

    /* MAIN CONTENT */
    main {
      margin-left: var(--sidebar-width);
      flex: 1;
      padding: 40px;
      min-width: 0;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 35px;
    }

    .page-info h1 {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--text-main);
    }

    .page-info p {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .live-time {
      font-size: 13px;
      background: #ffffff;
      border: 1px solid var(--card-border);
      padding: 8px 16px;
      border-radius: 30px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: monospace;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .live-time i {
      color: var(--accent-blue);
    }

    .public-portal-btn {
      text-decoration: none;
      background: #ffffff;
      border: 1px solid var(--card-border);
      color: var(--text-main);
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 8px 20px;
      border-radius: 30px;
      transition: all 0.25s;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .public-portal-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: #fff;
      transform: translateY(-1px);
    }

    /* ALERTS */
    .alert {
      padding: 15px 20px;
      border-radius: 10px;
      margin-bottom: 30px;
      font-weight: 600;
      font-size: 14.5px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--success);
      color: var(--success);
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--danger);
      color: var(--danger);
    }

    /* TAB CHANGER STUFF */
    .tab-panel {
      animation: fadeIn 0.4s ease;
    }

    .hidden {
      display: none !important;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* STATS CARDS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 35px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      border-color: rgba(37, 99, 235, 0.15);
    }

    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: all 0.3s ease;
    }

    .stat-card:hover .stat-icon-wrapper {
      transform: rotate(5deg) scale(1.05);
    }

    .stat-data {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stat-label {
      font-size: 11.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 1.5px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-main);
    }

    .stat-icon {
      font-size: 32px;
      color: rgba(15, 23, 42, 0.1);
      transition: all 0.3s;
    }

    .stat-card:hover .stat-icon {
      color: var(--accent-blue);
      transform: scale(1.1);
    }

    /* CARD STRUCTURES */
    .dashboard-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px 0 rgba(15, 23, 42, 0.03);
      max-width: 100%;
      min-width: 0;
      overflow-x: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 14px;
    }

    .card-title {
      font-family: 'Cinzel', serif;
      font-size: 19px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-title i {
      color: var(--accent-blue);
    }

    /* CONTROLS BAR */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-wrapper i {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 16px;
    }

    .search-input {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid var(--card-border);
      border-radius: 30px;
      padding: 12px 16px 12px 48px;
      color: var(--text-main);
      font-size: 14.5px;
      outline: none;
      transition: all 0.3s;
    }

    .search-input:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 12px rgba(37, 99, 235, 0.1);
    }

    .filter-options {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .select-input {
      background: #ffffff;
      border: 1.5px solid var(--card-border);
      border-radius: 8px;
      padding: 11px 16px;
      color: var(--text-main);
      font-size: 14px;
      outline: none;
      transition: all 0.3s;
      cursor: pointer;
    }

    .select-input:focus {
      border-color: var(--accent-blue);
    }

    /* TABLES */
    .table-container {
      overflow-x: auto;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
    }

    th {
      background: #f8fafc;
      padding: 16px 20px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 1.5px;
      border-bottom: 2px solid var(--card-border);
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--card-border);
      color: #334155;
      vertical-align: middle;
      transition: all 0.2s;
    }

    tr:hover td {
      background: #f8fafc;
      color: var(--text-main);
    }

    .domain-tag {
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      color: var(--accent-blue);
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 11.5px;
      font-weight: 600;
      display: inline-block;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid transparent;
      color: var(--text-muted);
      background: rgba(0, 0, 0, 0.02);
      cursor: pointer;
      transition: all 0.25s;
      text-decoration: none;
      font-size: 15px;
    }

    .action-btn:hover {
      transform: translateY(-1px);
    }

    .view-btn:hover {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: var(--success);
    }

    .edit-btn:hover {
      background: rgba(37, 99, 235, 0.1);
      border-color: rgba(37, 99, 235, 0.2);
      color: var(--accent-blue);
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
      color: var(--danger);
    }

    /* PAGINATION */
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      border-top: 1px solid var(--card-border);
      padding-top: 18px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .pagination-info {
      font-size: 13.5px;
      color: var(--text-muted);
    }

    .pagination-btns {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pag-btn {
      background: #ffffff;
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
    }

    .pag-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .pag-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* FORMS */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid var(--card-border);
      border-radius: 8px;
      padding: 12px 16px;
      color: var(--text-main);
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: all 0.3s;
    }

    .form-control:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.15);
    }

    .submit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      background: linear-gradient(135deg, var(--accent-blue), #1d4ed8);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 14.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
      transition: all 0.3s;
    }

    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
    }

    .instructions-box {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.7;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid var(--accent-blue);
      margin-top: 20px;
    }

    .instructions-box code {
      color: var(--accent-blue);
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    /* MODAL POPUPS */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-box {
      background: #ffffff;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
      animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }

    .modal-small {
      max-width: 480px;
    }

    @keyframes scaleIn {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 20px;
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: var(--text-main);
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      color: var(--text-main);
    }

    .modal-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      background: #ffffff;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      color: var(--text-main);
    }

    .btn-danger {
      background: var(--danger);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    .btn-danger:hover {
      background: #DC2626;
      transform: translateY(-1px);
    }

    /* DOMAIN LIST BREAKDOWN OVERVIEW */
    .domain-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .domain-list-item {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid var(--card-border);
      padding: 14px 18px;
      border-radius: 12px;
      transition: all 0.25s ease;
    }

    .domain-list-item:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    }

    .domain-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .domain-bullet {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-blue);
    }

    .domain-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-main);
    }

    .domain-count {
      font-weight: 700;
      font-size: 15px;
      color: var(--accent-blue);
      background: rgba(37, 99, 235, 0.08);
      padding: 2px 10px;
      border-radius: 30px;
      border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .dashboard-grid-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 30px;
      align-items: start;
    }
    .dashboard-grid-layout.layout-360 {
      grid-template-columns: minmax(0, 1fr) 360px;
    }

    @media (max-width: 1023px) {
      body { flex-direction: column; }
      aside { display: none !important; }
      main { margin-left: 0 !important; padding: 20px; padding-top: 84px !important; }
      header { flex-direction: column; align-items: stretch; gap: 15px; text-align: center; }
      .page-info { display: flex; flex-direction: column; align-items: center; }
      .header-actions { 
        width: 100%; 
        display: flex;
        flex-direction: column; 
        align-items: stretch; 
        gap: 12px; 
      }
      .live-time, .public-portal-btn {
        width: 100%;
        justify-content: center;
        text-align: center;
      }
      .dashboard-grid-layout, .dashboard-grid-layout.layout-360 {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid {
        gap: 16px;
        margin-bottom: 25px;
      }
      .stat-card {
        padding: 16px 20px;
      }
      .stat-value {
        font-size: 24px;
      }
      .dashboard-card {
        padding: 16px;
        border-radius: 12px;
      }
      .card-header {
        margin-bottom: 16px;
        padding-bottom: 10px;
      }
      th, td {
        padding: 12px 14px;
        font-size: 13px;
      }
      .domain-tag {
        padding: 3px 10px;
        font-size: 10.5px;
      }
    }
    
    /* Dynamic Loading Overlay styling */
    .loading-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(4px);
      z-index: 9999;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      gap: 15px;
      transition: all 0.3s ease;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top: 4px solid var(--gold-light);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 600px) {
      .modal-overlay {
        padding: 16px;
      }
      .modal-box {
        border-radius: 12px;
        max-height: 90vh;
        overflow-y: auto;
      }
    }
    
    @media (max-width: 1200px) {
      .dashboard-grid-layout, .dashboard-grid-layout.layout-360 {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }
  </style>
</head>
<body>

  <!-- Mobile Navbar (Tailwind CSS) -->
  <nav class="lg:hidden bg-[#1e3a8a] text-white fixed top-0 left-0 right-0 h-16 z-50 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand logo & title -->
        <div class="flex items-center gap-3">
          <svg class="w-8 h-8 fill-white" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="6"/>
            <path d="M60 22 L92 88 L75 88 L60 54 L45 88 L28 88 Z" fill="currentColor"/>
          </svg>
          <span class="font-['Cinzel'] font-extrabold text-lg tracking-wider">ATPS PANEL</span>
        </div>
        <!-- Hamburger menu button -->
        <button onclick="toggleMobileMenu()" class="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none transition">
          <i id="mobileMenuIcon" class="bi bi-list text-2xl"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Menu Drawer (hidden by default, fixed overlay) -->
  <div id="mobileMenuDrawer" class="fixed inset-0 z-50 lg:hidden hidden transition-all duration-300 pointer-events-none">
    <!-- Backdrop overlay -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-auto" id="mobileMenuBackdrop" onclick="toggleMobileMenu()"></div>
    
    <!-- Drawer panel (slides from right) -->
    <div class="fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-[#1e3a8a]/98 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col z-50 transform translate-x-full transition-transform duration-300 ease-out pointer-events-auto" id="mobileMenuPanel">
      <!-- Drawer header -->
      <div class="flex items-center justify-between px-6 h-16 border-b border-white/10">
        <div class="flex items-center gap-3">
          <svg class="w-8 h-8 fill-white" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="6"/>
            <path d="M60 22 L92 88 L75 88 L60 54 L45 88 L28 88 Z" fill="currentColor"/>
          </svg>
          <span class="font-['Cinzel'] font-extrabold text-lg tracking-wider text-white">ATPS PANEL</span>
        </div>
        <button onclick="toggleMobileMenu()" class="p-2 rounded-md hover:bg-white/10 text-white focus:outline-none transition">
          <i class="bi bi-x text-2xl"></i>
        </button>
      </div>
      
      <!-- Drawer links -->
      <div class="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
        <a onclick="switchTab('overview'); toggleMobileMenu();" id="mobile-link-overview" class="mobile-nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white font-medium transition-all duration-300 ease-out cursor-pointer transform translate-x-8 opacity-0">
          <i class="bi bi-grid-fill text-xl"></i> <span class="tracking-wide">Overview</span>
        </a>
        <a onclick="switchTab('certificates'); toggleMobileMenu();" id="mobile-link-certificates" class="mobile-nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white font-medium transition-all duration-300 ease-out cursor-pointer transform translate-x-8 opacity-0">
          <i class="bi bi-file-earmark-spreadsheet-fill text-xl"></i> <span class="tracking-wide">Certificates Database</span>
        </a>
        <a onclick="switchTab('issue'); toggleMobileMenu();" id="mobile-link-issue" class="mobile-nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white font-medium transition-all duration-300 ease-out cursor-pointer transform translate-x-8 opacity-0">
          <i class="bi bi-plus-circle-fill text-xl"></i> <span class="tracking-wide">Issue Credential</span>
        </a>
        <a onclick="switchTab('sync'); toggleMobileMenu();" id="mobile-link-sync" class="mobile-nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white font-medium transition-all duration-300 ease-out cursor-pointer transform translate-x-8 opacity-0">
          <i class="bi bi-file-earmark-arrow-up-fill text-xl"></i> <span class="tracking-wide">CSV / Excel Import</span>
        </a>
      </div>
      
      <!-- Drawer footer -->
      <div class="p-4 border-t border-white/10 bg-[#162e70]">
        <a href="/logout" class="flex items-center justify-center gap-2 py-3 bg-red-600/90 hover:bg-red-600 rounded-xl text-white font-semibold text-sm transition-all duration-300 ease-out shadow-lg transform translate-x-8 opacity-0" id="mobile-link-logout">
          <i class="bi bi-box-arrow-left"></i> Logout Admin
        </a>
      </div>
    </div>
  </div>

  <!-- SIDEBAR NAVIGATION -->
  <aside>
    <div class="brand-section">
      <svg class="brand-logo" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="6"/>
        <path d="M60 22 L92 88 L75 88 L60 54 L45 88 L28 88 Z" fill="currentColor"/>
      </svg>
      <div>
        <span class="brand-title">ATPS Panel</span>
        <div class="brand-subtitle">Control Room</div>
      </div>
    </div>
    
    <div class="menu-section">
      <div class="sidebar-link active" id="link-overview" onclick="switchTab('overview')">
        <i class="bi bi-grid-1x2-fill"></i>
        <span>Overview</span>
      </div>
      <div class="sidebar-link" id="link-certificates" onclick="switchTab('certificates')">
        <i class="bi bi-file-earmark-richtext-fill"></i>
        <span>Certificates Database</span>
      </div>
      <div class="sidebar-link" id="link-issue" onclick="switchTab('issue')">
        <i class="bi bi-plus-circle-fill"></i>
        <span>Issue Credential</span>
      </div>
      <div class="sidebar-link" id="link-sync" onclick="switchTab('sync')">
        <i class="bi bi-file-earmark-arrow-up-fill"></i>
        <span>CSV / Excel Import</span>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <a href="/logout" class="logout-btn">
        <i class="bi bi-box-arrow-left"></i>
        <span>Logout Admin</span>
      </a>
    </div>
  </aside>

  <!-- MAIN AREA -->
  <main>
    <header>
      <div class="page-info">
        <h1>ATPS Control Room</h1>
        <p>Manage and generate authentic secure credentials for Aadhira trainees.</p>
      </div>
      
      <div class="header-actions">
        <div class="live-time" id="clock-display">
          <i class="bi bi-clock-fill"></i>
          <span id="clock-time">16:25:00</span>
        </div>
        <a href="/" class="public-portal-btn" target="_blank">Public Search Portal</a>
      </div>
    </header>

    <!-- ALERTS -->
    ${message ? `<div class="alert alert-success" id="alert-banner"><i class="bi bi-check-circle-fill"></i> <span>${message}</span></div>` : ''}
    ${error ? `<div class="alert alert-danger" id="alert-banner"><i class="bi bi-exclamation-triangle-fill"></i> <span>${error}</span></div>` : ''}
    <!-- TAB: OVERVIEW -->
    <div class="tab-panel" id="panel-overview">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-data">
            <span class="stat-label">Total Issued</span>
            <span class="stat-value">${certificates.length}</span>
          </div>
          <div class="stat-icon-wrapper bg-[#eff6ff] text-[#2563eb]">
            <i class="bi bi-file-earmark-richtext"></i>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-data">
            <span class="stat-label">Active Domains</span>
            <span class="stat-value">${new Set(certificates.map(c => c.domain)).size}</span>
          </div>
          <div class="stat-icon-wrapper bg-[#ecfdf5] text-[#10b981]">
            <i class="bi bi-tags"></i>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-data">
            <span class="stat-label">Institutions</span>
            <span class="stat-value">${new Set(certificates.map(c => c.college_name)).size}</span>
          </div>
          <div class="stat-icon-wrapper bg-[#fffbeb] text-[#d97706]">
            <i class="bi bi-building"></i>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-data">
            <span class="stat-label">API Status</span>
            <span class="stat-value" style="font-size:16px; color:#10B981; font-weight: 700;">Active Ready</span>
          </div>
          <div class="stat-icon-wrapper bg-[#faf5ff] text-[#8b5cf6]">
            <i class="bi bi-cloud-check"></i>
          </div>
        </div>
      </div>

      <div class="dashboard-grid-layout layout-360">
        <!-- Recent Certificates Table -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-clock-history"></i> Recent Activity</div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>Institution</th>
                  <th>Domain</th>
                  <th>Issue Date</th>
                </tr>
              </thead>
              <tbody>
                ${certificates.slice(0, 5).map(c => `
                  <tr>
                    <td style="font-family: monospace; font-weight:700; color:var(--accent-blue);">${c.certificate_no}</td>
                    <td style="font-weight:600; color:var(--text-main);">${c.student_name}</td>
                    <td>${c.college_name}</td>
                    <td><span class="domain-tag">${c.domain}</span></td>
                    <td>${formatDateForInput(c.issue_date)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="5" style="text-align:center;">No records available.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Domains Breakdown sidebar -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-pie-chart-fill"></i> Domains Summary</div>
          </div>
          <div class="domain-list">
            ${[...new Set(certificates.map(c => c.domain))].map(d => {
              const count = certificates.filter(c => c.domain === d).length;
              const total = certificates.length || 1;
              const percentage = Math.round((count / total) * 100);
              return `
                <div class="domain-list-item">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div class="domain-info">
                      <div class="domain-bullet"></div>
                      <span class="domain-name" style="font-weight:600; color:var(--text-main);">${d}</span>
                    </div>
                    <span class="domain-count" style="font-weight:700; color:var(--accent-blue);">${count}</span>
                  </div>
                  <div class="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden mt-1">
                    <div class="bg-[#2563eb] h-full rounded-full" style="width: ${percentage}%;"></div>
                  </div>
                </div>
              `;
            }).join('') || '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No domains registered yet.</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: CERTIFICATES DATABASE -->
    <div class="tab-panel hidden" id="panel-certificates">
      <div class="dashboard-card" style="margin-bottom: 0;">
        <div class="card-header">
          <div class="card-title"><i class="bi bi-file-earmark-richtext-fill"></i> Issued Credentials Registry</div>
        </div>

        <!-- Search and filters -->
        <div class="filters-bar">
          <div class="search-wrapper">
            <i class="bi bi-search"></i>
            <input type="text" id="search-input" class="search-input" placeholder="Search by ID, student, college, domain...">
          </div>
          
          <div class="filter-options">
            <select id="domain-filter" class="select-input">
              <option value="all">All Domains</option>
              ${[...new Set(certificates.map(c => c.domain))].map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
            
            <select id="page-size-select" class="select-input">
              <option value="10">10 Rows</option>
              <option value="25">25 Rows</option>
              <option value="50">50 Rows</option>
              <option value="100">100 Rows</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Institution</th>
                <th>Domain</th>
                <th>Duration</th>
                <th>Issue Date</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="certificates-table-body">
              <!-- Rendered via client-side javascript pagination -->
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <div class="pagination-info" id="pagination-info">Showing 0 to 0 of 0 credentials</div>
          <div class="pagination-btns">
            <button class="pag-btn" id="btn-prev-page" onclick="prevPage()"><i class="bi bi-chevron-left"></i> Previous</button>
            <button class="pag-btn" id="btn-next-page" onclick="nextPage()">Next <i class="bi bi-chevron-right"></i></button>
          </div>
        </div>

      </div>
    </div>

    <!-- TAB: ISSUE CREDENTIAL -->
    <div class="tab-panel hidden" id="panel-issue">
      <div class="dashboard-grid-layout">
        
        <!-- Form card -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-plus-circle-fill"></i> Manually Issue Certificate</div>
          </div>
          
          <form id="manualIssueForm" onsubmit="submitManualIssueForm(event)">
            <div class="form-grid">
              <div class="form-group">
                <label>Certificate ID Sequence</label>
                <input type="text" name="certificate_no" id="issue-certificate-no" class="form-control" placeholder="e.g. ATPS/2026/000009" required>
              </div>
              
              <div class="form-group">
                <label>Student Full Name</label>
                <input type="text" name="student_name" class="form-control" placeholder="Enter student name" required>
              </div>
              
              <div class="form-group">
                <label>Email Address (Optional)</label>
                <input type="email" name="email" class="form-control" placeholder="e.g. student@example.com">
              </div>
              
              <div class="form-group full-width">
                <label>College / University Name</label>
                <input type="text" name="college_name" class="form-control" placeholder="Enter institution full name" required>
              </div>
              
              <div class="form-group">
                <label>Degree & Stream</label>
                <input type="text" name="degree" class="form-control" placeholder="e.g. B.Com (General)" required>
              </div>
              
              <div class="form-group">
                <label>Domain / Program</label>
                <input type="text" name="domain" class="form-control" placeholder="e.g. Accounting" required>
              </div>

              <div class="form-group">
                <label>Student Year of Study</label>
                <select name="year" class="form-control">
                  <option value="">-- Not Applicable --</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Duration</label>
                <input type="text" name="duration" class="form-control" placeholder="e.g. 30 Days" required>
              </div>

              <div class="form-group">
                <label>Start Date</label>
                <input type="date" name="start_date" class="form-control" required>
              </div>

              <div class="form-group">
                <label>End Date</label>
                <input type="date" name="end_date" class="form-control" required>
              </div>

              <div class="form-group">
                <label>Issue Date</label>
                <input type="date" name="issue_date" class="form-control" required>
              </div>

              <div class="form-group">
                <label>Place</label>
                <input type="text" name="place" class="form-control" value="Chennai" required>
              </div>

              <div class="form-group">
                <label>Authorized Signatory</label>
                <input type="text" name="authorized_signatory" class="form-control" value="K. Rohini" required>
              </div>

              <div class="form-group">
                <label>Signatory Designation</label>
                <input type="text" name="signatory_designation" class="form-control" value="Founder" required>
              </div>

              <div class="form-group full-width">
                <label><i class="bi bi-patch-check-fill" style="color:var(--gold-light);"></i> Certificate Type</label>
                <select name="certificate_type" class="form-control" required>
                  <option value="INTERNSHIP">Certificate of Internship</option>
                  <option value="COMPLETION">Certificate of Completion</option>
                  <option value="PARTICIPATION">Certificate of Participation</option>
                  <option value="TRAINING">Certificate of Training</option>
                  <option value="APPRECIATION">Certificate of Appreciation</option>
                  <option value="EXCELLENCE">Certificate of Excellence</option>
                </select>
              </div>
              
              <div class="form-group full-width">
                <label><i class="bi bi-palette-fill" style="color:var(--gold-light);"></i> Certificate Template / Theme <a href="/preview-templates" target="_blank" style="float: right; font-size: 12px; color: var(--accent-blue); text-decoration: none;"><i class="bi bi-eye"></i> Preview Themes</a></label>
                <select name="template" class="form-control" required>
                  <option value="classic">Classic Gold</option>
                  <option value="blue">Ocean Blue</option>
                  <option value="maroon">Royal Maroon</option>
                  <option value="forest">Forest Green</option>
                  <option value="purple">Purple Royal</option>
                </select>
              </div>
            </div>

            <button type="submit" class="submit-btn" style="margin-top: 15px;"><i class="bi bi-file-earmark-plus"></i> Generate and Issue</button>
          </form>
        </div>

        <!-- Guidelines sidebar -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-info-circle-fill"></i> Guidelines</div>
          </div>
          <div class="instructions-box">
            <strong>Certificate ID Structure:</strong><br>
            It is recommended to check the highest index in database before naming. Use format: <code>ATPS/[YEAR]/[INDEX]</code> where index is 6 digits: e.g., <code>ATPS/2026/000009</code>.
          </div>
          <div class="instructions-box" style="border-left-color: var(--success); margin-top: 15px;">
            <strong>Database Storage:</strong><br>
            Once you click "Generate and Issue", the certificate is permanently stored. You can search, edit details, or delete it from the main Database tab.
          </div>
        </div>

      </div>
    </div>

    <!-- TAB: CSV/EXCEL BATCH IMPORT -->
    <div class="tab-panel hidden" id="panel-sync">
      <div class="dashboard-grid-layout">
        
        <!-- Import Card -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-file-earmark-arrow-up-fill"></i> Excel / CSV Batch Uploader</div>
          </div>
          
          <!-- File Drop Zone -->
          <div class="drop-zone" id="importDropZone" style="border: 2px dashed rgba(217,119,6,0.3); border-radius: 12px; padding: 45px 24px; text-align: center; cursor: pointer; transition: all 0.3s; position: relative; background: rgba(10,25,47,0.2); margin-bottom: 25px;">
            <input type="file" id="importFileInput" accept=".csv,.xlsx,.xls" style="position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;">
            <div class="drop-icon" style="font-size: 44px; margin-bottom: 12px; color: var(--gold-light);"><i class="bi bi-cloud-arrow-up-fill"></i></div>
            <div class="drop-label" style="font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 6px;">Drag & drop spreadsheet here, or click to browse</div>
            <div class="drop-hint" style="font-size: 11.5px; color: var(--text-muted);">Supports Excel (.xlsx, .xls) and CSV (.csv) files</div>
          </div>

          <!-- Preview & Action Zone -->
          <div id="importPreviewSection" style="display: none;">
            <div class="card-title" style="font-size: 14px; margin-bottom: 12px; border-bottom: none; padding-bottom: 0;"><i class="bi bi-table"></i> Data Preview (<span id="importCount">0</span> rows detected)</div>
            <div class="table-container" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--card-border); border-radius: 8px; margin-bottom: 20px;">
              <table style="font-size: 12.5px;">
                <thead style="position: sticky; top: 0; z-index: 10;">
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>College Name</th>
                    <th>Degree</th>
                    <th>Domain</th>
                    <th>Duration</th>
                    <th>Dates</th>
                  </tr>
                </thead>
                <tbody id="importPreviewTableBody">
                  <!-- JS generated -->
                </tbody>
              </table>
            </div>
            <div style="margin-bottom: 18px; padding: 16px 20px; background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.3); border-radius: 10px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 10px;"><i class="bi bi-patch-check-fill" style="color:var(--gold-light);"></i> Certificate Type for this Batch</label>
              <select id="batchCertType" class="form-control" style="background: var(--card-bg); color: var(--text-main); border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; width: 100%;">
                <option value="INTERNSHIP">Certificate of Internship</option>
                <option value="COMPLETION">Certificate of Completion</option>
                <option value="PARTICIPATION">Certificate of Participation</option>
                <option value="TRAINING">Certificate of Training</option>
                <option value="APPRECIATION">Certificate of Appreciation</option>
                <option value="EXCELLENCE">Certificate of Excellence</option>
              </select>
            </div>
            
            <div style="margin-bottom: 18px; padding: 16px 20px; background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.3); border-radius: 10px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 10px;"><i class="bi bi-palette-fill" style="color:var(--gold-light);"></i> Certificate Template for this Batch <a href="/preview-templates" target="_blank" style="float: right; font-weight: normal; color: var(--accent-blue); text-decoration: none;"><i class="bi bi-eye"></i> Preview Themes</a></label>
              <select id="batchTemplate" class="form-control" style="background: var(--card-bg); color: var(--text-main); border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; width: 100%;">
                <option value="classic">Classic Gold</option>
                <option value="blue">Ocean Blue</option>
                <option value="maroon">Royal Maroon</option>
                <option value="forest">Forest Green</option>
                <option value="purple">Purple Royal</option>
              </select>
            </div>
            
            <div style="margin-bottom: 18px; padding: 16px 20px; background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.3); border-radius: 10px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 10px;"><i class="bi bi-envelope-fill" style="color:var(--gold-light);"></i> Send Certificate via Email?</label>
              <select id="batchSendEmail" class="form-control" style="background: var(--card-bg); color: var(--text-main); border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 14px; font-size: 13.5px; width: 100%;">
                <option value="yes">Yes, generate and send email</option>
                <option value="no">No, only generate and store (do not send email)</option>
              </select>
            </div>
            <button onclick="executeImport()" class="submit-btn" id="executeImportBtn" style="background: linear-gradient(135deg, var(--success), #047857); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);"><i class="bi bi-check-circle-fill"></i> Import & Save to Database</button>

            <!-- Progress Section -->
            <div id="importProgressSection" style="display:none; margin-top: 22px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <span style="font-size:13px; font-weight:700; color:var(--text-main);"><i class="bi bi-activity" style="color:var(--gold-light);"></i> Import Progress</span>
                <span id="importProgressLabel" style="font-size:12px; font-weight:600; color:var(--gold-light);">0 / 0</span>
              </div>
              <div style="background: rgba(255,255,255,0.07); border-radius: 99px; height: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 14px;">
                <div id="importProgressBar" style="height:100%; width:0%; background: linear-gradient(90deg, #059669, #10b981, #34d399); border-radius: 99px; transition: width 0.35s ease; box-shadow: 0 0 10px rgba(16,185,129,0.5);"></div>
              </div>
              <div id="importRowLog" style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; background: rgba(0,0,0,0.25); font-family: monospace; font-size: 11.5px; line-height: 1.8;">
                <!-- rows appended here -->
              </div>
              <div id="importSummaryBox" style="display:none; margin-top: 14px; padding: 14px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;"></div>
            </div>
          </div>
        </div>

        <!-- Instructions Sidebar -->
        <div class="dashboard-card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-info-circle-fill"></i> Setup & Sample</div>
          </div>
          
          <div class="instructions-box" style="margin-top:0;">
            <strong>Spreadsheet Formatting:</strong><br>
            The spreadsheet must contain the following columns in row 1 (header names matching exactly):<br>
            <code>Student Name</code> <code>Email Address</code> <code>College Name</code> <code>Degree</code> <code>Domain</code> <code>Duration</code> <code>Start Date</code> <code>End Date</code> <code>Place</code>
            <p style="margin-top: 10px;">Optional column: <code>Year</code> (e.g. <em>"III Year"</em>). If present, it will append to the degree.</p>
          </div>
          
          <button onclick="downloadSampleSpreadsheet()" class="btn-secondary" style="width:100%; margin-top: 15px; text-align: center; justify-content: center; display: flex; gap: 8px;"><i class="bi bi-download"></i> Download Sample CSV</button>
        </div>

      </div>
    </div>

  </main>

  <!-- EDIT MODAL OVERLAY -->
  <div class="modal-overlay" id="editModal" onclick="if(event.target === this) closeEditModal()">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title"><i class="bi bi-pencil-square" style="color:var(--gold-light);"></i> Modify Certificate Record</span>
        <button class="modal-close" onclick="closeEditModal()"><i class="bi bi-x-lg"></i></button>
      </div>
      <form id="editForm" onsubmit="submitEditForm(event)">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Certificate ID (ReadOnly)</label>
              <input type="text" name="certificate_no" id="edit-cert-no" class="form-control" style="opacity: 0.6; cursor: not-allowed; background: rgba(0,0,0,0.4);" readonly>
            </div>
            
            <div class="form-group">
              <label>Student Name</label>
              <input type="text" name="student_name" id="edit-student-name" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>Email Address (Optional)</label>
              <input type="email" name="email" id="edit-email" class="form-control">
            </div>
            
            <div class="form-group full-width">
              <label>College / Institution</label>
              <input type="text" name="college_name" id="edit-college-name" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>Degree & Stream</label>
              <input type="text" name="degree" id="edit-degree" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>Domain</label>
              <input type="text" name="domain" id="edit-domain" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>Duration</label>
              <input type="text" name="duration" id="edit-duration" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" id="edit-start-date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>End Date</label>
              <input type="date" name="end_date" id="edit-end-date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Issue Date</label>
              <input type="date" name="issue_date" id="edit-issue-date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Place</label>
              <input type="text" name="place" id="edit-place" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Authorized Signatory</label>
              <input type="text" name="authorized_signatory" id="edit-authorized-signatory" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Signatory Designation</label>
              <input type="text" name="signatory_designation" id="edit-signatory-designation" class="form-control" required>
            </div>
            
            <div class="form-group full-width">
              <label><i class="bi bi-palette-fill" style="color:var(--gold-light);"></i> Certificate Template / Theme <a href="/preview-templates" target="_blank" style="float: right; font-size: 12px; color: var(--accent-blue); text-decoration: none;"><i class="bi bi-eye"></i> Preview Themes</a></label>
              <select name="template" id="edit-template" class="form-control" required>
                <option value="classic">Classic Gold</option>
                <option value="blue">Ocean Blue</option>
                <option value="maroon">Royal Maroon</option>
                <option value="forest">Forest Green</option>
                <option value="purple">Purple Royal</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="closeEditModal()">Cancel</button>
          <button type="submit" class="submit-btn" style="width: auto; padding: 10px 24px;"><i class="bi bi-save"></i> Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <!-- DELETE CONFIRMATION MODAL -->
  <div class="modal-overlay" id="deleteModal" onclick="if(event.target === this) closeDeleteModal()">
    <div class="modal-box modal-small">
      <div class="modal-header" style="border-bottom-color: rgba(239, 68, 68, 0.2)">
        <span class="modal-title" style="color: var(--danger);"><i class="bi bi-exclamation-triangle-fill"></i> Delete Certificate</span>
        <button class="modal-close" onclick="closeDeleteModal()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size: 15px; line-height: 1.6;">Are you sure you want to permanently delete certificate <strong id="delete-cert-id-display" style="color:var(--gold-light); font-family: monospace;"></strong>?</p>
        <p style="font-size: 14px; color: var(--text-muted); margin-top: 8px; line-height: 1.5;">This will remove the credential record for <strong id="delete-student-name-display" style="color:var(--text-main);"></strong> from the system database. Verify portal search results will no longer resolve this ID.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick="closeDeleteModal()">Cancel</button>
        <button type="button" class="btn-danger" onclick="confirmDelete()">Confirm Delete</button>
      </div>
    </div>
  </div>

  <!-- CLIENT DATA EMBED -->
  <script>
    const certificatesData = ${certificatesJson};
  </script>

  <!-- CLIENT SCRIPTS -->
  <script>
    // Inactivity Auto-Logout (20 minutes)
    let inactivityTimer;
    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Clear auth cookie and redirect
        document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        alert("Session expired due to 20 minutes of inactivity. Please log in again.");
        window.location.href = "/logout";
      }, 1200000); // 1,200,000 ms = 20 minutes
    }
    
    // Listen to user activity events
    window.addEventListener('load', resetInactivityTimer);
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);

    // Tab switching controller
    function switchTab(tabId) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      
      // Clear active class from mobile nav links
      document.querySelectorAll('.mobile-nav-link').forEach(l => {
        l.classList.remove('bg-white', 'text-[#1e3a8a]', 'font-semibold');
        l.classList.add('text-white/80');
      });
      
      const panel = document.getElementById('panel-' + tabId);
      const link = document.getElementById('link-' + tabId);
      const mobileLink = document.getElementById('mobile-link-' + tabId);
      
      if (panel) {
        panel.classList.remove('hidden');
        if (link) link.classList.add('active');
        if (mobileLink) {
          mobileLink.classList.remove('text-white/80');
          mobileLink.classList.add('bg-white', 'text-[#1e3a8a]', 'font-semibold');
        }
        localStorage.setItem('activeDashboardTab', tabId);
      }
    }

    function toggleMobileMenu() {
      const drawer = document.getElementById('mobileMenuDrawer');
      const backdrop = document.getElementById('mobileMenuBackdrop');
      const panel = document.getElementById('mobileMenuPanel');
      const links = panel.querySelectorAll('.mobile-nav-link, #mobile-link-logout');
      const icon = document.getElementById('mobileMenuIcon');

      const isHidden = drawer.classList.contains('hidden');

      if (isHidden) {
        // Open Drawer
        drawer.classList.remove('hidden');
        // Force reflow
        void drawer.offsetWidth;
        
        drawer.classList.remove('pointer-events-none');
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('translate-x-full');
        panel.classList.add('translate-x-0');
        
        if (icon) {
          icon.classList.remove('bi-list');
          icon.classList.add('bi-x');
        }

        // Staggered smooth animation of links from right to left
        links.forEach((link, index) => {
          setTimeout(() => {
            link.classList.remove('translate-x-8', 'opacity-0');
            link.classList.add('translate-x-0', 'opacity-100');
          }, 100 + index * 50);
        });
      } else {
        // Close Drawer
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        panel.classList.remove('translate-x-0');
        panel.classList.add('translate-x-full');
        
        if (icon) {
          icon.classList.remove('bi-x');
          icon.classList.add('bi-list');
        }

        links.forEach((link) => {
          link.classList.remove('translate-x-0', 'opacity-100');
          link.classList.add('translate-x-8', 'opacity-0');
        });

        // Add hidden back after transitions finish (300ms)
        setTimeout(() => {
          drawer.classList.add('hidden', 'pointer-events-none');
        }, 300);
      }
    }

    // Auto load tab
    document.addEventListener('DOMContentLoaded', () => {
      const savedTab = localStorage.getItem('activeDashboardTab') || 'overview';
      switchTab(savedTab);
      
      // Auto fade alert banner after 5 seconds
      const banner = document.getElementById('alert-banner');
      if (banner) {
        setTimeout(() => {
          banner.style.transition = 'opacity 0.5s ease';
          banner.style.opacity = '0';
          setTimeout(() => banner.remove(), 500);
        }, 5000);
      }
      
      // Initialize active table rendering
      renderCertificatesTable();
      
      // Clock updater
      setInterval(updateClock, 1000);
      updateClock();

      // Auto pre-fill next certificate ID
      fetch('/api/last-cert-id')
        .then(res => res.json())
        .then(data => {
          const lastIndex = data.lastIndex || 0;
          const currentYear = new Date().getFullYear();
          const nextIndex = lastIndex + 1;
          const nextCertId = \`ATPS/\${currentYear}/\${String(nextIndex).padStart(6, '0')}\`;
          const input = document.getElementById('issue-certificate-no');
          if (input) {
            input.value = nextCertId;
          }
        })
        .catch(err => console.error('Error pre-filling certificate ID:', err));
    });

    function updateClock() {
      const clockTime = document.getElementById('clock-time');
      if (clockTime) {
        const d = new Date();
        clockTime.innerText = d.toLocaleTimeString();
      }
    }

    // Dynamic Database Operations
    let currentPage = 1;
    let pageSize = 10;
    let searchQuery = '';
    let selectedDomain = 'all';

    function renderCertificatesTable() {
      const tableBody = document.querySelector('#certificates-table-body');
      if (!tableBody) return;
      
      // Filter certificates array
      let filtered = certificatesData.filter(c => {
        const term = searchQuery.toLowerCase();
        const matchesSearch = 
          c.certificate_no.toLowerCase().includes(term) ||
          c.student_name.toLowerCase().includes(term) ||
          (c.email || '').toLowerCase().includes(term) ||
          c.college_name.toLowerCase().includes(term) ||
          c.domain.toLowerCase().includes(term);
          
        const matchesDomain = selectedDomain === 'all' || c.domain === selectedDomain;
        return matchesSearch && matchesDomain;
      });
      
      // Paginate
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pageSize) || 1;
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      
      const startIdx = (currentPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalItems);
      const pageItems = filtered.slice(startIdx, endIdx);
      
      // Generate row templates
      if (pageItems.length === 0) {
        tableBody.innerHTML = \`<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);"><i class="bi bi-search" style="font-size: 24px; display:block; margin-bottom:10px;"></i> No certificates found.</td></tr>\`;
      } else {
        tableBody.innerHTML = pageItems.map(c => \`
          <tr>
            <td style="font-family: monospace; font-weight: 700; color: var(--accent-blue);">\${escapeHtml(c.certificate_no)}</td>
            <td style="font-weight: 600; color: var(--text-main);">\${escapeHtml(c.student_name)}</td>
            <td>\${escapeHtml(c.email || '—')}</td>
            <td>\${escapeHtml(c.college_name)}</td>
            <td><span class="domain-tag">\${escapeHtml(c.domain)}</span></td>
            <td>\${escapeHtml(c.duration)}</td>
            <td>\${escapeHtml(c.issue_date_input)}</td>
            <td style="text-align: right; white-space: nowrap;">
              <a href="/certificate/\${c.certificate_no.replace(/\\//g, '_')}" target="_blank" class="action-btn view-btn" title="View & Print A4 PDF"><i class="bi bi-eye"></i></a>
              <button onclick="openEditModal('\${c.certificate_no}')" class="action-btn edit-btn" title="Edit Certificate"><i class="bi bi-pencil-square"></i></button>
              <button onclick="openDeleteModal('\${c.certificate_no}', '\${escapeJs(c.student_name)}')" class="action-btn delete-btn" title="Delete Permanent"><i class="bi bi-trash3"></i></button>
            </td>
          </tr>
        \`).join('');
      }
      
      // Update info labels
      document.getElementById('pagination-info').innerText = \`Showing \${totalItems === 0 ? 0 : startIdx + 1} to \${endIdx} of \${totalItems} credentials\`;
      document.getElementById('btn-prev-page').disabled = currentPage === 1;
      document.getElementById('btn-next-page').disabled = currentPage === totalPages;
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        renderCertificatesTable();
      }
    }

    function nextPage() {
      currentPage++;
      renderCertificatesTable();
    }

    // Input event listeners
    const searchEl = document.getElementById('search-input');
    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        currentPage = 1;
        renderCertificatesTable();
      });
    }

    const domainFilterEl = document.getElementById('domain-filter');
    if (domainFilterEl) {
      domainFilterEl.addEventListener('change', (e) => {
        selectedDomain = e.target.value;
        currentPage = 1;
        renderCertificatesTable();
      });
    }

    const pageSizeSelectEl = document.getElementById('page-size-select');
    if (pageSizeSelectEl) {
      pageSizeSelectEl.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value, 10);
        currentPage = 1;
        renderCertificatesTable();
      });
    }

    // Edit Modal popup controls
    function openEditModal(certNo) {
      const cert = certificatesData.find(c => c.certificate_no === certNo);
      if (!cert) return;
      
      document.getElementById('edit-cert-no').value = cert.certificate_no;
      document.getElementById('edit-student-name').value = cert.student_name;
      document.getElementById('edit-email').value = cert.email || '';
      document.getElementById('edit-college-name').value = cert.college_name;
      document.getElementById('edit-degree').value = cert.degree;
      document.getElementById('edit-domain').value = cert.domain;
      document.getElementById('edit-duration').value = cert.duration;
      document.getElementById('edit-start-date').value = cert.start_date_input;
      document.getElementById('edit-end-date').value = cert.end_date_input;
      document.getElementById('edit-issue-date').value = cert.issue_date_input;
      document.getElementById('edit-place').value = cert.place;
      document.getElementById('edit-authorized-signatory').value = cert.authorized_signatory;
      document.getElementById('edit-signatory-designation').value = cert.signatory_designation;
      document.getElementById('edit-template').value = cert.template || 'classic';
      
      document.getElementById('editModal').style.display = 'flex';
    }

    function closeEditModal() {
      document.getElementById('editModal').style.display = 'none';
    }

    async function submitManualIssueForm(event) {
      event.preventDefault();
      showLoading("Generating and issuing certificate... Please wait");
      const form = event.target;
      const data = {
        certificate_no: form.certificate_no.value,
        student_name: form.student_name.value,
        email: form.email.value,
        college_name: form.college_name.value,
        degree: form.degree.value,
        year: form.year.value,
        domain: form.domain.value,
        duration: form.duration.value,
        start_date: form.start_date.value,
        end_date: form.end_date.value,
        issue_date: form.issue_date.value,
        place: form.place.value,
        authorized_signatory: form.authorized_signatory.value,
        signatory_designation: form.signatory_designation.value,
        certificate_type: form.certificate_type.value,
        template: form.template.value
      };
      
      try {
        const res = await fetch('/admin/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.redirected) {
          window.location.href = res.url;
        } else if (res.ok) {
          window.location.href = '/admin?msg=' + encodeURIComponent('Certificate ' + data.certificate_no + ' generated and issued successfully!');
        } else {
          const errText = await res.text();
          alert('Error: ' + errText);
          hideLoading();
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to connect to the server: ' + err.message);
        hideLoading();
      }
    }

    async function submitEditForm(event) {
      event.preventDefault();
      showLoading("Saving certificate updates... Please wait");
      const form = event.target;
      const data = {
        certificate_no: form.certificate_no.value,
        student_name: form.student_name.value,
        email: form.email.value,
        college_name: form.college_name.value,
        degree: form.degree.value,
        domain: form.domain.value,
        duration: form.duration.value,
        start_date: form.start_date.value,
        end_date: form.end_date.value,
        issue_date: form.issue_date.value,
        place: form.place.value,
        authorized_signatory: form.authorized_signatory.value,
        signatory_designation: form.signatory_designation.value,
        template: form.template.value
      };
      
      try {
        const res = await fetch('/admin/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          closeEditModal();
          window.location.href = '/admin?msg=' + encodeURIComponent('Certificate ' + data.certificate_no + ' updated successfully!');
        } else {
          const errData = await res.json();
          alert('Error updating certificate: ' + (errData.error || 'Unknown error'));
          hideLoading();
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to connect to the server: ' + err.message);
        hideLoading();
      }
    }

    // Delete Modal popup controls
    let certNoToDelete = '';

    function openDeleteModal(certNo, studentName) {
      certNoToDelete = certNo;
      document.getElementById('delete-cert-id-display').innerText = certNo;
      document.getElementById('delete-student-name-display').innerText = studentName;
      document.getElementById('deleteModal').style.display = 'flex';
    }

    function closeDeleteModal() {
      document.getElementById('deleteModal').style.display = 'none';
    }

    async function confirmDelete() {
      if (!certNoToDelete) return;
      
      showLoading("Deleting certificate... Please wait");
      try {
        const res = await fetch('/admin/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificate_no: certNoToDelete })
        });
        
        if (res.ok) {
          closeDeleteModal();
          window.location.href = '/admin?msg=' + encodeURIComponent('Certificate ' + certNoToDelete + ' deleted permanently!');
        } else {
          const errData = await res.json();
          alert('Error deleting certificate: ' + (errData.error || 'Unknown error'));
          hideLoading();
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to connect to the server: ' + err.message);
        hideLoading();
      }
    }

    // Helper functions
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // JS string escaping
    function escapeJs(str) {
      if (!str) return '';
      return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    // CSV/Excel Import script logic
    let parsedRows = [];
    let generatedCertsForBulk = [];

    const fileInputEl = document.getElementById('importFileInput');
    if (fileInputEl) {
      fileInputEl.addEventListener('change', handleFileSelect);
    }

    // Add drag and drop listeners
    const dropZone = document.getElementById('importDropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--success)';
        dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
      });
      
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(217, 119, 6, 0.3)';
        dropZone.style.background = 'rgba(10, 25, 47, 0.2)';
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(217, 119, 6, 0.3)';
        dropZone.style.background = 'rgba(10, 25, 47, 0.2)';
        
        if (e.dataTransfer.files.length > 0) {
          if (fileInputEl) {
            fileInputEl.files = e.dataTransfer.files;
          }
          handleFileSelect({ target: { files: e.dataTransfer.files } });
        }
      });
    }

    function getVal(row, possibleNames) {
      for (const name of possibleNames) {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === name.toLowerCase());
        if (key !== undefined) return row[key];
      }
      return '';
    }

    function parseExcelDate(val) {
      if (!val) return '';
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split('T')[0];
      }
      return String(val);
    }

    function handleFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          if (json.length === 0) {
            alert('The uploaded spreadsheet is empty.');
            return;
          }
          

          parsedRows = json.map(row => {
            return {
              student_name: String(getVal(row, ['Student Name', 'Name', 'StudentName', 'Trainee Name'])).trim(),
              email: String(getVal(row, ['Email', 'Email Address', 'Mail', 'Student Email'])).trim(),
              college_name: String(getVal(row, ['College Name', 'College', 'Institution', 'University', 'College/University Name'])).trim(),
              degree: String(getVal(row, ['Degree', 'Stream', 'Department', 'Course'])).trim(),
              year: String(getVal(row, ['Year', 'Sem', 'Semester'])).trim(),
              domain: String(getVal(row, ['Domain', 'Internship Domain', 'Field', 'Topic'])).trim(),
              duration: String(getVal(row, ['Duration', 'Period'])).trim(),
              start_date: parseExcelDate(getVal(row, ['Start Date', 'StartDate', 'From Date', 'FromDate', 'Start_Date'])),
              end_date: parseExcelDate(getVal(row, ['End Date', 'EndDate', 'To Date', 'ToDate', 'End_Date'])),
              place: String(getVal(row, ['Place', 'Location', 'City']) || 'Chennai').trim()
            };
          }).filter(row => row.student_name !== '');
          
          if (parsedRows.length === 0) {
            alert('Could not find any valid rows with a "Student Name". Please verify headers.');
            return;
          }
          
          document.getElementById('importCount').innerText = parsedRows.length;
          
          const tbody = document.getElementById('importPreviewTableBody');
          tbody.innerHTML = parsedRows.slice(0, 10).map(row => \`
            <tr>
              <td style="font-weight:600; color:var(--text-main);">\${escapeHtml(row.student_name)}</td>
              <td>\${escapeHtml(row.email || '—')}</td>
              <td>\${escapeHtml(row.college_name)}</td>
              <td>\${escapeHtml(row.degree)}\${row.year ? ' - ' + escapeHtml(row.year) : ''}</td>
              <td><span class="domain-tag">\${escapeHtml(row.domain)}</span></td>
              <td>\${escapeHtml(row.duration)}</td>
              <td style="font-family:monospace; font-size:11px;">\${row.start_date} / \${row.end_date}</td>
            </tr>
          \`).join('');
          
          if (parsedRows.length > 10) {
            tbody.innerHTML += \`<tr><td colspan="7" style="text-align:center; color:var(--text-muted); font-style:italic;">Showing first 10 of \${parsedRows.length} rows...</td></tr>\`;
          }
          
          document.getElementById('importPreviewSection').style.display = 'block';
          
        } catch(err) {
          console.error(err);
          alert('Error parsing file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    async function executeImport() {
      if (parsedRows.length === 0) return;

      const btn = document.getElementById('executeImportBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';

      // Show progress UI
      const progressSection = document.getElementById('importProgressSection');
      const progressBar     = document.getElementById('importProgressBar');
      const progressLabel   = document.getElementById('importProgressLabel');
      const rowLog          = document.getElementById('importRowLog');
      const summaryBox      = document.getElementById('importSummaryBox');
      progressSection.style.display = 'block';
      rowLog.innerHTML = '';
      summaryBox.style.display = 'none';
      progressBar.style.width = '0%';

      const total = parsedRows.length;
      let added = 0, skipped = 0, failed = 0;
      generatedCertsForBulk = [];

      try {
        const seqRes  = await fetch('/api/last-cert-id');
        const seqData = await seqRes.json();
        const lastIndex = seqData.lastIndex || 0;
        const currentYear = new Date().getFullYear();
        const batchTemplate = document.getElementById('batchTemplate').value || 'classic';
        const batchType     = document.getElementById('batchCertType').value || 'INTERNSHIP';
        const batchSendEmail = document.getElementById('batchSendEmail').value === 'yes';

        for (let i = 0; i < parsedRows.length; i++) {
          const row = parsedRows[i];
          const certIndex    = String(lastIndex + 1 + i).padStart(6, '0');
          const certificate_no = "ATPS/" + currentYear + "/" + certIndex;

          const cert = {
            certificate_no,
            student_name:          row.student_name,
            email:                 row.email,
            college_name:          row.college_name,
            degree:                row.year ? row.degree + " - " + row.year : row.degree,
            domain:                row.domain,
            duration:              row.duration,
            start_date:            row.start_date,
            end_date:              row.end_date,
            issue_date:            new Date().toISOString().split('T')[0],
            place:                 row.place || 'Chennai',
            authorized_signatory:  'K. Rohini',
            signatory_designation: 'Founder',
            certificate_type:      batchType,
            template:              batchTemplate,
            send_email:            batchSendEmail
          };

          // Update progress bar & label
          const pct = Math.round(((i) / total) * 100);
          progressBar.style.width = pct + '%';
          progressLabel.textContent = (i + 1) + " / " + total;

          // Append live row log
          const logLine = document.createElement('div');
          logLine.id = 'logrow-' + i;
          logLine.style.cssText = 'color: rgba(255,255,255,0.5); padding: 2px 0;';
          logLine.innerHTML = '<span style="color:var(--gold-light);">[' + (i+1) + '/' + total + ']</span> ⏳ ' + escapeHtml(row.student_name) + ' — <em>' + escapeHtml(certificate_no) + '</em> ...';
          rowLog.appendChild(logLine);
          rowLog.scrollTop = rowLog.scrollHeight;

          try {
            const res = await fetch('/api/store-certificates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ certificates: [cert] })
            });
            const result = await res.json();

            if (res.ok && result.added > 0) {
              added++;
              generatedCertsForBulk.push({
                certificate_no: certificate_no,
                student_name: row.student_name,
                template: batchTemplate
              });
              logLine.style.color = '#34d399';
              logLine.innerHTML = '<span style="color:var(--gold-light);">[' + (i+1) + '/' + total + ']</span> ✅ ' + escapeHtml(row.student_name) + ' — <em>' + escapeHtml(certificate_no) + '</em> <span style="color:#6ee7b7;">Saved</span>';
            } else if (result.skipped > 0) {
              skipped++;
              generatedCertsForBulk.push({
                certificate_no: certificate_no,
                student_name: row.student_name,
                template: batchTemplate
              });
              logLine.style.color = '#fbbf24';
              logLine.innerHTML = '<span style="color:var(--gold-light);">[' + (i+1) + '/' + total + ']</span> ⚠️ ' + escapeHtml(row.student_name) + ' — <span style="color:#fde68a;">Skipped (duplicate)</span>';
            } else {
              failed++;
              logLine.style.color = '#f87171';
              logLine.innerHTML = '<span style="color:var(--gold-light);">[' + (i+1) + '/' + total + ']</span> ❌ ' + escapeHtml(row.student_name) + ' — <span style="color:#fca5a5;">Error: ' + escapeHtml((result.errors && result.errors[0]?.error) || 'Unknown') + '</span>';
            }
          } catch(rowErr) {
            failed++;
            logLine.style.color = '#f87171';
            logLine.innerHTML = '<span style="color:var(--gold-light);">[' + (i+1) + '/' + total + ']</span> ❌ ' + escapeHtml(row.student_name) + ' — <span style="color:#fca5a5;">Network error</span>';
          }

          rowLog.scrollTop = rowLog.scrollHeight;
        }

        // Final 100%
        progressBar.style.width = '100%';
        progressLabel.textContent = total + " / " + total + " — Done";

        // Summary
        summaryBox.style.display = 'block';
        let statusHtml = '';
        if (failed === 0) {
          summaryBox.style.cssText = 'display:block; margin-top:14px; padding:18px; border-radius:10px; font-size:13.5px; font-weight:600; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); color: #6ee7b7;';
          statusHtml = '<div style="margin-bottom: 12px;"><i class="bi bi-check-circle-fill"></i> Import complete! <strong>' + added + '</strong> saved, <strong>' + skipped + '</strong> skipped.</div>';
        } else {
          summaryBox.style.cssText = 'display:block; margin-top:14px; padding:18px; border-radius:10px; font-size:13.5px; font-weight:600; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5;';
          statusHtml = '<div style="margin-bottom: 12px;"><i class="bi bi-exclamation-triangle-fill"></i> Done with errors — <strong>' + added + '</strong> saved, <strong>' + skipped + '</strong> skipped, <strong>' + failed + '</strong> failed. Check the log above.</div>';
        }

        if (generatedCertsForBulk.length > 0) {
          statusHtml += 
            '<div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">' +
              '<div style="font-size: 12px; color: #94a3b8; font-weight: 500;">Batch Certificate Actions:</div>' +
              '<div style="display: flex; gap: 10px; flex-wrap: wrap;">' +
                '<button onclick="downloadBulkCertificates(\\'pdf\\')" class="btn" style="background: linear-gradient(135deg, #d97706, #b45309); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">' +
                  '<i class="bi bi-file-earmark-pdf-fill"></i> Download All (One PDF)' +
                '</button>' +
                '<button onclick="downloadBulkCertificates(\\'zip\\')" class="btn" style="background: linear-gradient(135deg, #2563eb, #1e3a8a); color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">' +
                  '<i class="bi bi-file-zip-fill"></i> Download All as ZIP' +
                '</button>' +
                '<button onclick="finishImport()" class="btn" style="background: #e2e8f0; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;">' +
                  'Finish & Close' +
                '</button>' +
              '</div>' +
            '</div>';
        } else {
          statusHtml += 
            '<div style="margin-top: 15px;">' +
              '<button onclick="goBackToAdmin()" class="btn" style="background: #e2e8f0; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;">' +
                'Go Back' +
              '</button>' +
            '</div>';
        }
        summaryBox.innerHTML = statusHtml;

      } catch(err) {
        console.error(err);
        summaryBox.style.display = 'block';
        summaryBox.style.cssText = 'display:block; margin-top:14px; padding:14px 18px; border-radius:10px; font-size:13px; font-weight:600; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #fca5a5;';
        summaryBox.innerHTML = '<i class="bi bi-x-circle-fill"></i> Import failed: ' + escapeHtml(err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Import & Save to Database';
      }
    }

    async function downloadBulkCertificates(type) {
      if (generatedCertsForBulk.length === 0) {
        alert('No certificates available to download.');
        return;
      }

      showLoading('Preparing bulk download... Please wait.');

      // Ensure JSZip is loaded if type is zip
      if (type === 'zip' && typeof JSZip === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(script);
        await new Promise(r => script.onload = r);
      }

      const totalCerts = generatedCertsForBulk.length;
      let pdf = null;
      let zip = null;
      if (type === 'zip') {
        zip = new JSZip();
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '900px';
      document.body.appendChild(iframe);

      for (let i = 0; i < totalCerts; i++) {
        const c = generatedCertsForBulk[i];
        const certNoEncoded = c.certificate_no.replace(/\\//g, '_');
        showLoading("Generating PDF " + (i + 1) + " of " + totalCerts + "<br><span style='font-size:13px;color:var(--gold-light);'>[" + escapeHtml(c.student_name) + "]</span>");

        iframe.src = "/certificate/" + certNoEncoded + "?previewTheme=" + c.template;

        await new Promise((resolve) => {
          const handler = () => {
            iframe.removeEventListener('load', handler);
            resolve();
          };
          iframe.addEventListener('load', handler);
        });

        // Small wait for rendering elements inside iframe
        await new Promise((resolve) => setTimeout(resolve, 800));

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const wrapper = iframeDoc.querySelector('.cert-wrapper');
        const container = iframeDoc.querySelector('.cert-container');

        if (!container) {
          console.error("Certificate container not found for " + c.certificate_no);
          continue;
        }

        const prevBodyStyle = iframeDoc.body.getAttribute('style') || '';
        const prevWrapperStyle = wrapper ? (wrapper.getAttribute('style') || '') : '';
        const prevContainerStyle = container.getAttribute('style') || '';

        iframeDoc.body.style.width = '1122px';
        iframeDoc.body.style.minWidth = '1122px';
        iframeDoc.body.style.overflow = 'visible';
        iframeDoc.body.style.position = 'relative';

        if (wrapper) {
          wrapper.setAttribute('style', 'display: block !important; width: 1122px !important; min-width: 1122px !important; margin: 0 !important; padding: 0 !important; overflow: visible !important;');
        }

        container.setAttribute('style', 'width: 1122px !important; height: 793px !important; transform: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; position: relative !important; left: 0 !important; top: 0 !important; float: left !important;');

        const canvas = await html2canvas(container, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          width: 1122,
          height: 793,
          windowWidth: 1122,
          windowHeight: 793
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        // Restore iframe styles
        if (wrapper) {
          wrapper.setAttribute('style', prevWrapperStyle);
        }
        container.setAttribute('style', prevContainerStyle);
        iframeDoc.body.setAttribute('style', prevBodyStyle);

        if (type === 'pdf') {
          if (!pdf) {
            const { jsPDF } = window.jspdf || window;
            pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'px',
              format: [1122, 793]
            });
          } else {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 1122, 793);
        } else if (type === 'zip') {
          const { jsPDF } = window.jspdf || window;
          const singlePdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1122, 793]
          });
          singlePdf.addImage(imgData, 'JPEG', 0, 0, 1122, 793);
          const pdfBlob = singlePdf.output('blob');
          const cleanName = c.student_name.replace(/[^a-zA-Z0-9]/g, '_');
          const cleanCertNo = c.certificate_no.replace(/[^a-zA-Z0-9]/g, '_');
          zip.file("Certificate_" + cleanName + "_" + cleanCertNo + ".pdf", pdfBlob);
        }
      }

      document.body.removeChild(iframe);

      if (type === 'pdf') {
        showLoading('Finalizing PDF compilation...');
        pdf.save("Bulk_Certificates_" + new Date().toISOString().split('T')[0] + ".pdf");
      } else if (type === 'zip') {
        showLoading('Zipping files... Please wait.');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = "Bulk_Certificates_" + new Date().toISOString().split('T')[0] + ".zip";
        link.click();
      }

      hideLoading();
    }

    function finishImport() {
      window.location.href = '/admin?msg=' + encodeURIComponent('Successfully processed ' + generatedCertsForBulk.length + ' certificate(s).');
    }

    function goBackToAdmin() {
      window.location.href = '/admin';
    }

    function downloadSampleSpreadsheet() {
      const headers = ['Student Name', 'Email Address', 'College Name', 'Degree', 'Year', 'Domain', 'Duration', 'Start Date', 'End Date', 'Place'];
      const sampleRow = ['John Doe', 'student@example.com', 'Aadhira College of Engineering', 'B.E (CSE)', 'III Year', 'Web Development', '30 Days', '2026-06-01', '2026-06-30', 'Chennai'];
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), sampleRow.join(',')].join('\\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "atps_certificates_sample.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>

  <!-- DYNAMIC LOADING OVERLAY -->
  <div id="loadingOverlay" class="loading-overlay" style="display: none;">
    <div class="loading-spinner"></div>
    <div id="loadingText" style="font-size: 16px; font-weight: 600; font-family: 'Outfit', sans-serif;">Processing... Please wait</div>
  </div>

  <script>
    function showLoading(text) {
      const overlay = document.getElementById('loadingOverlay');
      if (text) {
        document.getElementById('loadingText').innerHTML = text.replace(/\\n/g, '<br>');
      }
      overlay.style.display = 'flex';
    }
    function hideLoading() {
      const overlay = document.getElementById('loadingOverlay');
      overlay.style.display = 'none';
    }
  </script>
</body>
</html>`;
};

// -------------------------------------------------------------
// DYNAMIC FASTIFY ROUTES
// -------------------------------------------------------------

// Serve branding assets dynamically
fastify.get('/logos.png', async (request, reply) => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'logos.png'));
    reply.type('image/png').send(buffer);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

fastify.get('/signature.png', async (request, reply) => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'signature.png'));
    reply.type('image/png').send(buffer);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

fastify.get('/ministry-of-micro-small-and-medium-enterprises-logo-png.png', async (request, reply) => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'ministry-of-micro-small-and-medium-enterprises-logo-png.png'));
    reply.type('image/png').send(buffer);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

fastify.get('/login_bg.png', async (request, reply) => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'login_bg.png'));
    reply.type('image/png').send(buffer);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

// Route: Get static landing search portal
fastify.get('/', async (request, reply) => {
  reply.type('text/html').send(indexHtml());
});

// Route: Verify search endpoint
fastify.get('/verify', async (request, reply) => {
  const certNo = (request.query.cert || '').trim().toUpperCase();
  
  if (!certNo) {
    return reply.type('text/html').send(verifyHtml('', null, false));
  }

  try {
    const res = await pool.query('SELECT * FROM certificates WHERE UPPER(certificate_no) = $1', [certNo]);
    
    if (res.rows.length > 0) {
      return reply.type('text/html').send(verifyHtml(certNo, res.rows[0], true));
    } else {
      return reply.type('text/html').send(verifyHtml(certNo, null, false));
    }
  } catch (err) {
    console.error('Error verifying certificate:', err);
    return reply.type('text/html').status(500).send('Database Error');
  }
});

// Route: Secure Download Email Prompt
fastify.get('/secure-download/:certNoEncoded', async (request, reply) => {
  const certNoEncoded = request.params.certNoEncoded;
  const certNo = certNoEncoded.replace(/_/g, '/').trim();

  try {
    const res = await pool.query('SELECT student_name FROM certificates WHERE UPPER(certificate_no) = UPPER($1)', [certNo]);
    if (res.rows.length === 0) {
      return reply.status(404).send('Certificate not found');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Certificate Access</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Montserrat', sans-serif; background: #0A192F; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: rgba(255,255,255,0.05); padding: 40px; border-radius: 12px; border: 1px solid rgba(217,119,6,0.3); text-align: center; max-width: 400px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h2 { margin-top: 0; color: #D97706; }
    input { width: 100%; padding: 14px; margin: 20px 0; border-radius: 6px; border: 1px solid #1E3E62; background: #172A45; color: #fff; font-family: inherit; font-size: 15px; box-sizing: border-box; }
    input:focus { outline: none; border-color: #D97706; }
    button { background: #D97706; color: #fff; padding: 14px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 15px; transition: background 0.3s; }
    button:hover { background: #B45309; }
    .error { color: #EF4444; font-size: 13px; margin-bottom: 15px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Access Certificate</h2>
    <p style="font-size: 14px; color: #8892B0;">Enter the email address associated with your certificate to verify your identity.</p>
    ${request.query.error ? '<div class="error">Email address does not match our records.</div>' : ''}
    <form method="POST" action="/secure-download/${certNoEncoded}">
      <input type="email" name="email" placeholder="Your Email Address" required>
      <button type="submit">Verify & Access</button>
    </form>
  </div>
</body>
</html>`;
    return reply.type('text/html').send(html);
  } catch (err) {
    return reply.status(500).send('Database Error');
  }
});

// Route: Validate Secure Download
fastify.post('/secure-download/:certNoEncoded', async (request, reply) => {
  const certNoEncoded = request.params.certNoEncoded;
  const certNo = certNoEncoded.replace(/_/g, '/').trim();
  const submittedEmail = (request.body.email || '').trim().toLowerCase();

  try {
    const res = await pool.query('SELECT email FROM certificates WHERE UPPER(certificate_no) = UPPER($1)', [certNo]);
    if (res.rows.length === 0) {
      return reply.status(404).send('Certificate not found');
    }

    const dbEmail = (res.rows[0].email || '').trim().toLowerCase();
    
    if (dbEmail === submittedEmail && dbEmail !== '') {
      // Set a secure cookie valid for 1 hour to access this specific certificate
      reply.setCookie(`cert_access_${certNoEncoded}`, 'true', { path: '/', httpOnly: true, maxAge: 3600 });
      return reply.redirect(`/certificate/${certNoEncoded}`);
    } else {
      return reply.redirect(`/secure-download/${certNoEncoded}?error=1`);
    }
  } catch (err) {
    return reply.status(500).send('Database Error');
  }
});

// Route: Preview All Themes
fastify.get('/preview-templates', async (request, reply) => {
  const isAdmin = request.cookies.auth === 'true';
  if (!isAdmin) return reply.status(403).send('Unauthorized');

  try {
    const res = await pool.query('SELECT certificate_no FROM certificates LIMIT 1');
    const sampleCert = res.rows.length > 0 ? res.rows[0].certificate_no.replace(/\//g, '_') : '';

    if (!sampleCert) {
      return reply.type('text/html').send('<h2>No certificates available to use for preview. Please add at least one certificate first.</h2>');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Theme Previews</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Montserrat', sans-serif; background: #0A192F; color: #fff; padding: 30px; text-align: center; margin: 0; }
    h2 { color: #D97706; margin-bottom: 30px; font-weight: 800; font-size: 28px; }
    .grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; }
    .preview-card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(217,119,6,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h3 { margin: 0 0 15px 0; color: #E2E8F0; font-size: 18px; }
    .iframe-wrapper { width: 560px; height: 396px; overflow: hidden; border-radius: 6px; border: 2px solid #1E3E62; }
    iframe { width: 1120px; height: 792px; border: none; transform: scale(0.5); transform-origin: top left; pointer-events: none; }
  </style>
</head>
<body>
  <h2>Available Certificate Themes</h2>
  <div class="grid">
    <div class="preview-card"><h3>Classic Gold</h3><div class="iframe-wrapper"><iframe src="/certificate/${sampleCert}?previewTheme=classic" scrolling="no"></iframe></div></div>
    <div class="preview-card"><h3>Ocean Blue</h3><div class="iframe-wrapper"><iframe src="/certificate/${sampleCert}?previewTheme=blue" scrolling="no"></iframe></div></div>
    <div class="preview-card"><h3>Royal Maroon</h3><div class="iframe-wrapper"><iframe src="/certificate/${sampleCert}?previewTheme=maroon" scrolling="no"></iframe></div></div>
    <div class="preview-card"><h3>Forest Green</h3><div class="iframe-wrapper"><iframe src="/certificate/${sampleCert}?previewTheme=forest" scrolling="no"></iframe></div></div>
    <div class="preview-card"><h3>Purple Royal</h3><div class="iframe-wrapper"><iframe src="/certificate/${sampleCert}?previewTheme=purple" scrolling="no"></iframe></div></div>
  </div>
</body>
</html>`;
    return reply.type('text/html').send(html);
  } catch (err) {
    return reply.status(500).send('Database Error');
  }
});

// Route: View beautiful landscape certificate
fastify.get('/certificate/:certNoEncoded', async (request, reply) => {
  const certNoEncoded = request.params.certNoEncoded;
  const certNo = certNoEncoded.replace(/_/g, '/').trim();

  // Check if admin (used later for showing admin controls)
  const isAdmin = request.cookies.auth === 'true';

  try {
    const res = await pool.query('SELECT * FROM certificates WHERE UPPER(certificate_no) = UPPER($1)', [certNo]);
    
    if (res.rows.length === 0) {
      return reply.status(404).send('Certificate not found');
    }

    const row = res.rows[0];
    
    const formattedData = {
      id: row.id,
      certificate_no: row.certificate_no,
      student_name: row.student_name,
      college_name: row.college_name,
      degree: row.degree,
      domain: row.domain,
      duration: row.duration,
      place: row.place,
      authorized_signatory: row.authorized_signatory,
      signatory_designation: row.signatory_designation,
      certificate_type: (row.certificate_type || 'INTERNSHIP').toUpperCase(),
      start_date_formatted: formatCertDate(row.start_date),
      end_date_formatted: formatCertDate(row.end_date),
      issue_date_formatted: formatCertDate(row.issue_date)
    };

    const dateParts = formattedData.issue_date_formatted.split(' ');

    const themeClassMap = {
      'classic': 'theme-classic-gold',
      'blue': 'theme-ocean-blue',
      'maroon': 'theme-royal-maroon',
      'forest': 'theme-forest-green',
      'purple': 'theme-purple-royal'
    };
    let certThemeClass = themeClassMap[row.template || 'classic'] || 'theme-classic-gold';
    // Admin preview override
    if (isAdmin && request.query.previewTheme && themeClassMap[request.query.previewTheme]) {
      certThemeClass = themeClassMap[request.query.previewTheme];
    }

    const issueDateObj = row.issue_date ? new Date(row.issue_date) : new Date();
    const issueYear = issueDateObj.getFullYear();
    const issueMonth = issueDateObj.getMonth() + 1;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of ${formattedData.certificate_type} - ${formattedData.student_name}</title>

  <!-- Open Graph Meta Tags for LinkedIn and Social Sharing -->
  <meta property="og:title" content="Certificate of ${formattedData.certificate_type.charAt(0) + formattedData.certificate_type.slice(1).toLowerCase()} - ${formattedData.student_name}">
  <meta property="og:description" content="Verified certificate of ${formattedData.certificate_type.toLowerCase()} in ${formattedData.domain} from Aadhira Training and Placement Solutions (ATPS). Certificate No: ${formattedData.certificate_no}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aadhira.onrender.com/certificate/${certNoEncoded}">
  <meta property="og:image" content="https://aadhira.onrender.com/logos.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Google Fonts for high-end look -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Great+Vibes&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&family=Alex+Brush&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
  
  <!-- qrcode.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <!-- html2canvas and jsPDF CDNs for client-side rendering -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

  <style>
    /* Styling for Screen Preview */
    :root {
      --bg: #F8F9FA;
      --border-outer-color: #0A192F;
    }

    /* Theme 1: Classic Gold (Default) */
    .cert-container.theme-classic-gold {
      --navy: #0A192F;
      --gold: #D97706;
      --gold-light: #F5A623;
      --accent: #E07A5F;
      --paper: #FFFFFF;
      --title-font: 'Cinzel', serif;
      --body-font: 'Montserrat', sans-serif;
      --recipient-font: 'Playfair Display', serif;
      --recipient-font-size: 36px;
      --recipient-font-weight: 700;
      --medal-grad-1: #FDE047;
      --medal-grad-2: #F5A623;
      --medal-grad-3: #D97706;
      --medal-grad-4: #78350F;
      --ribbon-grad-1: #0A192F;
      --ribbon-grad-2: #1E3E62;
      --ribbon-accent-1: #F5A623;
      --ribbon-accent-2: #D97706;
      --border-outer-color: var(--navy);
      --border-inner-color: var(--gold);
    }

    /* Theme 2: Ocean Blue */
    .cert-container.theme-ocean-blue {
      --navy: #0F3057;
      --gold: #008891;
      --gold-light: #438a5e;
      --accent: #005f73;
      --paper: #F5F7FA;
      --title-font: 'Playfair Display', serif;
      --body-font: 'Montserrat', sans-serif;
      --recipient-font: 'Alex Brush', cursive;
      --recipient-font-size: 46px;
      --recipient-font-weight: 400;
      --medal-grad-1: #E2E8F0;
      --medal-grad-2: #94A3B8;
      --medal-grad-3: #64748B;
      --medal-grad-4: #334155;
      --ribbon-grad-1: #0F3057;
      --ribbon-grad-2: #005F73;
      --ribbon-accent-1: #008891;
      --ribbon-accent-2: #E2E8F0;
      --border-outer-color: var(--navy);
      --border-inner-color: var(--gold);
    }

    /* Theme 3: Royal Maroon */
    .cert-container.theme-royal-maroon {
      --navy: #4A0E17;
      --gold: #C5A880;
      --gold-light: #D4AF37;
      --accent: #B33939;
      --paper: #FCF8F2;
      --title-font: 'Cinzel', serif;
      --body-font: 'Montserrat', sans-serif;
      --recipient-font: 'Great Vibes', cursive;
      --recipient-font-size: 48px;
      --recipient-font-weight: 400;
      --medal-grad-1: #FDE047;
      --medal-grad-2: #D4AF37;
      --medal-grad-3: #AA7C11;
      --medal-grad-4: #5B3A00;
      --ribbon-grad-1: #4A0E17;
      --ribbon-grad-2: #800000;
      --ribbon-accent-1: #C5A880;
      --ribbon-accent-2: #D4AF37;
      --border-outer-color: var(--navy);
      --border-inner-color: var(--gold);
    }

    /* Theme 4: Forest Green */
    .cert-container.theme-forest-green {
      --navy: #133B2E;
      --gold: #D4AF37;
      --gold-light: #F3E5AB;
      --accent: #2D5A27;
      --paper: #FAF9F6;
      --title-font: 'Playfair Display', serif;
      --body-font: 'Montserrat', sans-serif;
      --recipient-font: 'Mrs Saint Delafield', cursive;
      --recipient-font-size: 58px;
      --recipient-font-weight: 400;
      --medal-grad-1: #FFFDD0;
      --medal-grad-2: #D4AF37;
      --medal-grad-3: #C5A880;
      --medal-grad-4: #5C4033;
      --ribbon-grad-1: #133B2E;
      --ribbon-grad-2: #2D5A27;
      --ribbon-accent-1: #D4AF37;
      --ribbon-accent-2: #F3E5AB;
      --border-outer-color: var(--navy);
      --border-inner-color: var(--gold);
    }

    /* Theme 5: Purple Royal */
    .cert-container.theme-purple-royal {
      --navy: #2A1B3D;
      --gold: #A29BFE;
      --gold-light: #D6A2E8;
      --accent: #6C5CE7;
      --paper: #F8F9FC;
      --title-font: 'Cinzel', serif;
      --body-font: 'Montserrat', sans-serif;
      --recipient-font: 'Great Vibes', cursive;
      --recipient-font-size: 48px;
      --recipient-font-weight: 400;
      --medal-grad-1: #E0B0FF;
      --medal-grad-2: #9F5F9F;
      --medal-grad-3: #6F2DA8;
      --medal-grad-4: #301934;
      --ribbon-grad-1: #2A1B3D;
      --ribbon-grad-2: #44318D;
      --ribbon-accent-1: #A29BFE;
      --ribbon-accent-2: #D6A2E8;
      --border-outer-color: var(--navy);
      --border-inner-color: var(--gold);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
      font-family: 'Montserrat', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
      overflow-x: hidden; /* Prevent horizontal scrolling on mobile */
      position: relative;
    }

    /* Abstract Background Blobs */
    .bg-shape {
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      z-index: 0;
      pointer-events: none;
      opacity: 0.15;
    }
    
    .shape-1 {
      top: -10%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: #BFDBFE; /* light blue */
    }
    
    .shape-2 {
      bottom: -10%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: #DBEAFE; /* very light blue */
    }

    /* Page Header Styles */
    .page-header {
      width: 100%;
      max-width: 1122px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      margin-bottom: 30px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 30px rgba(15, 23, 42, 0.05);
      z-index: 10;
    }
    
    .page-header-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .page-header-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #1E3A8A;
      background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .badge-verified {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #065F46;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.05);
      animation: pulse-glow-light 2s infinite alternate;
    }
    
    @keyframes pulse-glow-light {
      0% {
        box-shadow: 0 0 5px rgba(16, 185, 129, 0.05);
      }
      100% {
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
      }
    }
    
    .badge-icon {
      width: 15px;
      height: 15px;
    }

    /* Verification Card Styles */
    .verification-card {
      width: 100%;
      max-width: 1122px;
      margin-top: 40px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.05);
      color: #334155;
      z-index: 10;
      text-align: left;
    }
    
    .verification-card .card-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      padding-bottom: 15px;
    }
    
    .verification-card .verify-shield {
      width: 28px;
      height: 28px;
      color: #10B981;
    }
    
    .verification-card h2 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #1E3A8A;
      margin: 0;
    }
    
    .verification-card .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 25px;
      margin-bottom: 25px;
    }
    
    .verification-card .grid-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .verification-card .item-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748B;
      font-weight: 700;
    }
    
    .verification-card .item-value {
      font-size: 15px;
      color: #0F172A;
      font-weight: 600;
    }
    
    .verification-card .font-mono {
      font-family: monospace;
      letter-spacing: 0.5px;
      color: #D97706; /* gold accent */
    }
    
    .verification-card .status-verified {
      color: #10B981;
      font-weight: 700;
    }
    
    .verification-card .card-footer {
      border-top: 1px solid rgba(15, 23, 42, 0.05);
      padding-top: 20px;
      font-size: 12.5px;
      line-height: 1.6;
      color: #64748B;
    }

    /* Ambient Certificate Glow */
    .cert-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1000px;
      height: 700px;
      background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.05) 0%, rgba(245, 158, 11, 0.02) 50%, rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
      z-index: 0;
      border-radius: 50%;
      filter: blur(60px);
    }

    /* Wrapper to scale and center the certificate on small viewports */
    .cert-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      overflow: visible;
    }

    /* Fixed Landscape A4 Dimensions for Preview */
    .cert-container {
      width: 1122px;
      min-width: 1122px;
      flex-shrink: 0;
      height: 793px;
      background: var(--paper);
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(10, 25, 47, 0.15);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
      transition: background 0.3s ease;
    }

    /* Responsive scaling for mobile viewports */
    @media (max-width: 1200px) {
      .cert-wrapper {
        min-height: auto;
        height: auto;
        padding: 0;
        overflow: hidden;
      }
      .cert-container {
        transform-origin: top center;
        transform: scale(calc(90vw / 1122px));
        margin-bottom: calc(-793px * (1 - (90vw / 1122px)));
        min-width: 1122px !important;
        flex-shrink: 0 !important;
      }
    }

    /* Mobile Responsive Optimizations */
    @media (max-width: 768px) {
      body {
        padding: 20px 12px;
      }
      .page-header {
        flex-direction: column;
        gap: 12px;
        padding: 16px 20px;
        margin-bottom: 20px;
        border-radius: 12px;
        text-align: center;
      }
      .page-header-logo {
        flex-direction: column;
        gap: 6px;
      }
      .page-header-title {
        font-size: 13px;
        letter-spacing: 1.5px;
      }
      .badge-verified {
        padding: 4px 12px;
        font-size: 10px;
      }
      .controls {
        margin-top: 25px;
        padding: 12px 16px;
        border-radius: 20px;
        gap: 10px;
        width: 100%;
      }
      .btn {
        width: 100%;
        justify-content: center;
        padding: 10px 20px;
        font-size: 11.5px;
      }
      .verification-card {
        padding: 20px;
        margin-top: 25px;
        border-radius: 16px;
      }
      .verification-card .card-header {
        gap: 10px;
        margin-bottom: 15px;
        padding-bottom: 10px;
      }
      .verification-card h2 {
        font-size: 16px;
      }
      .verification-card .card-grid {
        grid-template-columns: 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }
      .verification-card .grid-item {
        gap: 3px;
      }
      .verification-card .item-value {
        font-size: 14px;
      }
      .verification-card .card-footer {
        padding-top: 15px;
        font-size: 11.5px;
      }
    }

    /* Outer Borders */
    .border-outer {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 8px solid var(--border-outer-color);
      pointer-events: none;
      transition: border-color 0.3s ease;
    }

    .border-inner {
      position: absolute;
      top: 28px;
      left: 28px;
      right: 28px;
      bottom: 28px;
      border: 2px solid var(--border-inner-color);
      pointer-events: none;
      transition: border-color 0.3s ease;
    }

    /* Border Corner Decorations */
    .corner-dec {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid var(--border-inner-color);
      pointer-events: none;
      transition: border-color 0.3s ease;
    }

    .corner-tl {
      top: 25px;
      left: 25px;
      border-right: none;
      border-bottom: none;
    }

    .corner-tr {
      top: 25px;
      right: 25px;
      border-left: none;
      border-bottom: none;
    }

    .corner-bl {
      bottom: 25px;
      left: 25px;
      border-right: none;
      border-top: none;
    }

    .corner-br {
      bottom: 25px;
      right: 25px;
      border-left: none;
      border-top: none;
    }

    /* Decorative Corner SVG Accents */
    .corner-svg {
      position: absolute;
      width: 45px;
      height: 45px;
      fill: var(--border-inner-color);
      opacity: 0.85;
      transition: fill 0.3s ease;
    }
    .svg-tl { top: 32px; left: 32px; }
    .svg-tr { top: 32px; right: 32px; transform: rotate(90deg); }
    .svg-bl { bottom: 32px; left: 32px; transform: rotate(-90deg); }
    .svg-br { bottom: 32px; right: 32px; transform: rotate(180deg); }

    /* Watermark background using your real corporate Aadhira Tree logo */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 332.4px;
      height: 340px;
      pointer-events: none;
      z-index: 1;
      opacity: 0.08;
      background-image: url('/logos.png');
      background-size: 1329.7px 340px;
      background-position: 0px 0px;
      background-repeat: no-repeat;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    /* Header Layout */
    .header {
      display: flex;
      justify-content: center; /* PERFECT CENTER */
      align-items: center;
      z-index: 2;
      position: relative;
      width: 100%;
      height: auto;
      margin-top: 50px; /* PUSH IT DOWN */
      margin-bottom: 0px;
    }

    .cert-id {
      position: absolute;
      left: 0;
      top: -35px;
      font-size: 11px;
      color: var(--border-outer-color);
      font-weight: 700;
      letter-spacing: 1.5px;
      background: rgba(10, 25, 47, 0.05);
      padding: 6px 12px;
      border-radius: 4px;
      border-left: 3px solid var(--border-inner-color);
      transition: all 0.3s ease;
    }

    .header-branding {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Brand Logo & Accreditations Sprites */
    .logo-sprite {
      background-image: url('/logos.png');
      background-size: 280.8px 72px;
      background-repeat: no-repeat;
      display: inline-block;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    .logo-aadhira {
      background-position: 0px 0px;
      width: 69.7px;
      height: 72px;
      margin-bottom: 4px;
    }

    .company-subtitle {
      font-size: 26px;
      color: var(--border-inner-color);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 0px;
      margin-bottom: 4px;
      transition: color 0.3s ease;
    }

    /* Center-Aligned Accreditation Badges */
    .accreditations {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
    }

    .logo-iso {
      background-position: -70.2px 0px;
      width: 70.2px;
      height: 72px;
    }

    .logo-arms {
      background-position: -140.4px 0px;
      width: 70.2px;
      height: 72px;
    }

    .logo-uk {
      background-position: -210.6px 0px;
      width: 70.2px;
      height: 72px;
    }

    .logo-msme {
      height: 72px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    .medal-container {
      position: absolute;
      right: 0;
      top: -45px;
      width: 80px;
      height: 100px;
      display: flex;
      justify-content: flex-end;
    }

    /* Body/Content Layout */
    .content {
      text-align: center;
      z-index: 2;
      position: relative;
      margin-top: -8px;
      margin-bottom: 5px;
    }

    .title {
      font-family: var(--title-font);
      font-size: 30px;
      font-weight: 800;
      color: var(--border-outer-color);
      letter-spacing: 3px;
      margin-bottom: 10px;
      position: relative;
      display: inline-block;
      transition: all 0.3s ease;
    }

    .title::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 15%;
      width: 70%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--border-inner-color), transparent);
      transition: background 0.3s ease;
    }

    .subtitle {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-style: italic;
      color: #555;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }

    .recipient-name {
      font-family: var(--recipient-font);
      font-size: var(--recipient-font-size);
      font-weight: var(--recipient-font-weight);
      color: var(--border-outer-color);
      margin-bottom: 16px;
      display: inline-block;
      position: relative;
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .recipient-name::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 2.2px;
      background: linear-gradient(90deg, transparent, var(--gold-light), var(--border-inner-color), var(--gold-light), transparent);
      transition: background 0.3s ease;
    }

    .achievement-text {
      font-family: var(--body-font);
      font-size: 15.5px;
      color: #333;
      line-height: 1.75;
      max-width: 860px;
      margin: 0 auto;
      font-weight: 500;
    }

    .highlight {
      font-weight: 700;
      color: var(--border-outer-color);
      transition: color 0.3s ease;
    }

    /* Bottom Section Layout */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      z-index: 2;
      position: relative;
    }

    .signatory-block {
      width: 250px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .signature-container {
      height: 60px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 8px;
    }

    /* Handwritten signature image displaying K. Rohini nicely overlayed */
    .signature-img {
      max-width: 150px;
      max-height: 60px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    .sign-line {
      border-top: 1.5px solid var(--border-inner-color);
      width: 100%;
      height: 1px;
    }

    .sign-name {
      font-size: 11px;
      font-weight: 700;
      color: var(--border-outer-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: color 0.3s ease;
    }

    .sign-designation {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
      font-weight: 500;
    }

    .sign-title {
      font-family: var(--title-font);
      font-size: 15px;
      font-weight: 700;
      color: var(--border-inner-color);
      margin-top: 6px;
      letter-spacing: 1.5px;
      transition: color 0.3s ease;
    }

    .seal-block {
      width: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: -10px;
    }

    .verification-block {
      display: flex;
      align-items: center;
      gap: 15px;
      width: auto;
    }

    .verification-details {
      text-align: left;
      flex: none;
    }

    .verif-label {
      font-size: 8px;
      font-weight: 700;
      color: var(--border-outer-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
      transition: color 0.3s ease;
    }

    .verif-link {
      font-size: 8px;
      color: #666;
      text-decoration: none;
      word-break: break-all;
      font-family: monospace;
      font-weight: 500;
      line-height: 1.3;
      display: block;
      max-width: 150px;
    }

    .verif-link:hover {
      color: var(--border-inner-color);
    }

    .qrcode-container {
      background: white;
      padding: 6px;
      border: 1px solid rgba(10, 25, 47, 0.12);
      border-radius: 4px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Print & Floating Controls */
    .controls {
      margin-top: 35px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      z-index: 10;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 14px 28px;
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }

    .btn {
      padding: 12px 28px;
      font-family: 'Montserrat', sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }

    .btn-print {
      background: linear-gradient(135deg, #1E3A8A, #2563EB);
      color: white;
    }

    .btn-print:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(37, 99, 235, 0.25);
    }

    .btn-back {
      background: white;
      color: #1E3A8A;
      border: 1.5px solid #1E3A8A;
    }

    .btn-back:hover {
      background: #F1F5F9;
      transform: translateY(-2px);
    }

    /* Theme Switcher Bar */
    .theme-switcher-bar {
      width: 100%;
      max-width: 297mm;
      background: white;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 12px 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      gap: 15px;
      flex-wrap: wrap;
    }

    .switcher-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .switcher-title i {
      color: #2563eb;
    }

    .theme-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .theme-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 30px;
      padding: 6px 14px;
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .theme-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #1e293b;
    }

    .theme-btn.active {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }

    .color-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.1);
    }

    /* ── Print / PDF Export ─────────────────────────────── */
    @page {
      size: 297mm 210mm;   /* exact A4 landscape */
      margin: 0mm;
    }

    @media print {
      /* Hard-lock root elements to exactly one A4 landscape page */
      html {
        width:  297mm !important;
        height: 210mm !important;
        max-height: 210mm !important;
        overflow: hidden !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      body {
        width:  297mm !important;
        height: 210mm !important;
        max-height: 210mm !important;
        overflow: hidden !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        min-height: unset !important;
      }

      /* Collapse the scaling wrapper */
      .cert-wrapper {
        display: block !important;
        width:  297mm !important;
        height: 210mm !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Certificate fills the page exactly */
      .cert-container {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width:  297mm !important;
        height: 210mm !important;
        max-height: 210mm !important;
        margin: 0 !important;
        padding: 40px !important;
        transform: none !important;
        transform-origin: unset !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Hide all non-certificate UI */
      .no-print,
      .controls,
      .theme-switcher-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Elegant Abstract Background Blobs -->
  <div class="bg-shape shape-1 no-print"></div>
  <div class="bg-shape shape-2 no-print"></div>

  <!-- Top Header Navigation -->
  <header class="page-header no-print">
    <div class="page-header-logo">
      <svg class="page-header-svg-logo" viewBox="0 0 100 100" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--gold, #D97706); vertical-align: middle;">
        <path d="M50 15 L85 75 L15 75 Z"/>
        <circle cx="50" cy="50" r="10" stroke="var(--gold-light, #F5A623)"/>
      </svg>
      <span class="page-header-title">AADHIRA Verification Portal</span>
    </div>
    <div class="badge-verified">
      <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 4px;">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      Verified Credential
    </div>
  </header>

  <!-- Certificate Container Wrapper -->
  <div class="cert-wrapper">
    <div class="cert-glow no-print"></div>
    <!-- Certificate Container -->
    <div class="cert-container ${certThemeClass}">
    
    <!-- Borders -->
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    
    <!-- Corner Decorative Lines -->
    <div class="corner-dec corner-tl"></div>
    <div class="corner-dec corner-tr"></div>
    <div class="corner-dec corner-bl"></div>
    <div class="corner-dec corner-br"></div>
    
    <!-- Corner Decorative SVGs -->
    <svg class="corner-svg svg-tl" viewBox="0 0 100 100">
      <path d="M 0,0 L 50,0 C 20,10 10,20 0,50 Z" />
      <circle cx="15" cy="15" r="4" />
      <path d="M 5,5 Q 25,5 25,25 Q 5,25 5,5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <svg class="corner-svg svg-tr" viewBox="0 0 100 100">
      <path d="M 0,0 L 50,0 C 20,10 10,20 0,50 Z" />
      <circle cx="15" cy="15" r="4" />
      <path d="M 5,5 Q 25,5 25,25 Q 5,25 5,5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <svg class="corner-svg svg-bl" viewBox="0 0 100 100">
      <path d="M 0,0 L 50,0 C 20,10 10,20 0,50 Z" />
      <circle cx="15" cy="15" r="4" />
      <path d="M 5,5 Q 25,5 25,25 Q 5,25 5,5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <svg class="corner-svg svg-br" viewBox="0 0 100 100">
      <path d="M 0,0 L 50,0 C 20,10 10,20 0,50 Z" />
      <circle cx="15" cy="15" r="4" />
      <path d="M 5,5 Q 25,5 25,25 Q 5,25 5,5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>

    <!-- Watermark Background using corporate Aadhira Tree logo -->
    <div class="watermark"></div>

    <!-- Top Header -->
    <div class="header">
      <div class="cert-id">ID: ${formattedData.certificate_no}</div>
      
      <div class="header-branding">
        <!-- Render your corporate Aadhira Tree logo via sprite -->
        <div class="logo-sprite logo-aadhira"></div>
        <div class="company-subtitle">AADHIRA TRAINING AND PLACEMENT SOLUTIONS - CHENNAI</div>
        
        <!-- Accreditation badges horizontally aligned -->
        <div class="accreditations">
          <img src="/ministry-of-micro-small-and-medium-enterprises-logo-png.png" class="logo-msme" title="MSME Certified" alt="MSME Logo">
          <div class="logo-sprite logo-iso" title="ISO 9001:2015 Certified"></div>
          <div class="logo-sprite logo-arms" title="International Standards Certified"></div>
          <div class="logo-sprite logo-uk" title="Euro UK Accreditation Licensed"></div>
        </div>
      </div>

      <!-- Gold Medal Ribbon -->
      <div class="medal-container">
        <svg viewBox="0 0 120 180" width="75" height="110">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--medal-grad-1)"/>
              <stop offset="30%" stop-color="var(--medal-grad-2)"/>
              <stop offset="70%" stop-color="var(--medal-grad-3)"/>
              <stop offset="100%" stop-color="var(--medal-grad-4)"/>
            </linearGradient>
            <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--ribbon-grad-1)"/>
              <stop offset="100%" stop-color="var(--ribbon-grad-2)"/>
            </linearGradient>
            <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--ribbon-accent-1)"/>
              <stop offset="100%" stop-color="var(--ribbon-accent-2)"/>
            </linearGradient>
          </defs>
          <!-- Ribbons -->
          <path d="M38 70 L20 160 L50 145 L62 160 L45 70" fill="url(#ribbonGrad1)"/>
          <path d="M82 70 L100 160 L70 145 L58 160 L75 70" fill="url(#ribbonGrad1)"/>
          <path d="M48 70 L53 160 L65 145 L77 160 L72 70" fill="url(#ribbonGrad2)" opacity="0.95"/>
          <!-- Medal Outer -->
          <circle cx="60" cy="60" r="40" fill="url(#goldGrad)" stroke="#92400E" stroke-width="2.5" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.15))"/>
          <!-- Medal Ridges -->
          <circle cx="60" cy="60" r="33" fill="none" stroke="#FEF3C7" stroke-width="1.5" stroke-dasharray="2 1.5"/>
          <!-- Medal Emblem -->
          <polygon points="60,35 66,50 82,50 69,60 74,76 60,66 46,76 51,60 38,50 54,50" fill="#FFF" opacity="0.95"/>
          <circle cx="60" cy="60" r="14" fill="none" stroke="#D97706" stroke-width="1.2"/>
        </svg>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content">
      <h1 class="title">CERTIFICATE OF ${formattedData.certificate_type}</h1>
      <p class="subtitle">This certificate is proudly awarded to</p>
      
      <div class="recipient-name">${formattedData.student_name}</div>
      
      <p class="achievement-text">
        ${(() => {
          const ct = formattedData.certificate_type;
          if (ct === 'INTERNSHIP') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , for successfully completing the <span class="highlight">${formattedData.domain} Internship Program</span> conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , for a duration of <span class="highlight">${formattedData.duration}</span> , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else if (ct === 'COMPLETION') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , for successfully completing the <span class="highlight">${formattedData.domain} Program</span> conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , for a duration of <span class="highlight">${formattedData.duration}</span> , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else if (ct === 'PARTICIPATION') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , for actively participating in the <span class="highlight">${formattedData.domain} Program</span> conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else if (ct === 'TRAINING') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , for successfully completing the <span class="highlight">${formattedData.domain} Training Program</span> conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , for a duration of <span class="highlight">${formattedData.duration}</span> , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else if (ct === 'APPRECIATION') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , in recognition of outstanding contribution and dedication in the field of <span class="highlight">${formattedData.domain}</span> at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else if (ct === 'EXCELLENCE') {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , in recognition of exceptional performance and excellence demonstrated in the <span class="highlight">${formattedData.domain} Program</span> at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          } else {
            return `from <span class="highlight">${formattedData.college_name}</span> , pursuing <span class="highlight">${formattedData.degree}</span> , for successfully completing the <span class="highlight">${formattedData.domain} Program</span> conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, Chennai , for a duration of <span class="highlight">${formattedData.duration}</span> , from <span class="highlight">${formattedData.start_date_formatted}</span> to <span class="highlight">${formattedData.end_date_formatted}</span> .`;
          }
        })()}
      </p>
    </div>

    <!-- Bottom Footer Section -->
    <div class="footer">
      
      <!-- Signature Block -->
      <div class="signatory-block">
        <div class="signature-container">
          <!-- Render your brand's handwritten signature image -->
          <img src="/signature.png" class="signature-img" alt="Signature of K. Rohini">
        </div>
        <div class="sign-line"></div>
      </div>

      <!-- Company Seal -->
      <div class="seal-block">
        <svg viewBox="0 0 120 120" width="95" height="95">
          <defs>
            <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--border-inner-color)"/>
              <stop offset="50%" stop-color="var(--border-outer-color)"/>
              <stop offset="100%" stop-color="var(--border-inner-color)"/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" fill="none" stroke="url(#sealGrad)" stroke-width="3"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke="url(#sealGrad)" stroke-width="1.5" stroke-dasharray="3 1.5"/>
          <circle cx="60" cy="60" r="40" fill="none" stroke="url(#sealGrad)" stroke-width="1"/>
          
          <!-- Curved text using SVG path -->
          <path id="sealTextPath-${formattedData.id}" d="M60 18 A42 42 0 0 1 102 60 A42 42 0 0 1 60 102 A42 42 0 0 1 18 60 A42 42 0 0 1 60 18 Z" fill="none"/>
          <text fill="url(#sealGrad)" font-family="'Montserrat', sans-serif" font-size="6.8" font-weight="700" letter-spacing="0.8">
            <textPath href="#sealTextPath-${formattedData.id}" startOffset="0%">• AADHIRA TRAINING & PLACEMENT SOLUTIONS • ATPS •</textPath>
          </text>
          
          <!-- Star and Seal Center Logo -->
          <path d="M60 38 L72 72 L48 72 Z" fill="none" stroke="url(#sealGrad)" stroke-width="2"/>
          <circle cx="60" cy="60" r="7" fill="none" stroke="url(#sealGrad)" stroke-width="1.2"/>
          <path d="M60 25 L62 30 L67 30 L63 33 L65 38 L60 35 L55 38 L57 33 L53 30 L58 30 Z" fill="url(#sealGrad)"/>
          <text x="60" y="87" text-anchor="middle" fill="url(#sealGrad)" font-family="'Montserrat', sans-serif" font-size="7.5" font-weight="800" letter-spacing="1">CHENNAI</text>
        </svg>
      </div>

      <!-- Verification QR & Details -->
      <div class="verification-block" style="display: flex; align-items: center; justify-content: flex-end; gap: 15px; width: auto;">
        <div class="verification-details" style="display: flex; flex-direction: column; justify-content: center; text-align: left; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #718096; gap: 2px;">
          <div style="font-size: 8.5px; letter-spacing: 0.5px; color: #718096; line-height: 1.2;">PLACE:</div>
          <div style="font-size: 9px; letter-spacing: 0.5px; color: #4A5568; margin-bottom: 2px; line-height: 1.2;">${formattedData.place.toUpperCase()}</div>
          <div style="font-size: 8.5px; letter-spacing: 0.5px; color: #718096; line-height: 1.2;">DATE: ${dateParts[0] ? dateParts[0].toUpperCase() : ''}</div>
          <div style="font-size: 9px; letter-spacing: 0.5px; color: #4A5568; line-height: 1.2;">${(dateParts[1] || '').toUpperCase()} ${(dateParts[2] || '')}</div>
        </div>
        
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div class="qrcode-container" style="display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--border-inner-color); padding: 4px; background: white; border-radius: 4px;">
            <div id="qrcode-${formattedData.id}" style="width: 100px; height: 100px;"></div>
          </div>
          <div style="font-size: 7.5px; font-weight: 700; color: #718096; letter-spacing: 0.5px; text-transform: uppercase;">SCAN TO VERIFY</div>
        </div>
      </div>

    </div>

  </div>
  </div>

  <!-- Print Button (Hidden on Print) -->
  <div class="controls no-print">
    <button class="btn btn-print" onclick="downloadPDF()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Download PDF
    </button>
    <a class="btn btn-back" href="#" onclick="addToLinkedInProfile(event)" title="Add this certificate to your LinkedIn Profile's Licenses & Certifications section">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
      Add to Profile
    </a>
    <a class="btn btn-back" href="#" onclick="nativeShare(event)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      Share
    </a>
    ${isAdmin ? `<a class="btn btn-back" href="/admin">Admin Panel</a>` : ''}
  </div>

  <!-- Verification Details Card -->
  <div class="verification-card no-print">
    <div class="card-header">
      <svg class="verify-shield" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h2>Official Certificate Verification</h2>
    </div>
    <div class="card-grid">
      <div class="grid-item">
        <span class="item-label">Student Name</span>
        <span class="item-value">${formattedData.student_name}</span>
      </div>
      <div class="grid-item">
        <span class="item-label">Certificate ID</span>
        <span class="item-value font-mono">${formattedData.certificate_no}</span>
      </div>
      <div class="grid-item">
        <span class="item-label">Program Domain</span>
        <span class="item-value">${formattedData.domain}</span>
      </div>
      <div class="grid-item">
        <span class="item-label">Verification Status</span>
        <span class="item-value status-verified">✓ Active & Verified</span>
      </div>
    </div>
    <div class="card-footer">
      <p>This certificate is issued by Aadhira Training and Placement Solutions (ATPS) and is cryptographically registered. Use the QR code on the certificate or this URL to verify at any time.</p>
    </div>
  </div>

  <!-- Dynamic QR Code Script -->
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const verifyUrl = "https://aadhira.onrender.com/verify?cert=" + encodeURIComponent("${formattedData.certificate_no}");
      
      const qrcodeEl = document.getElementById("qrcode-${formattedData.id}");
      if (qrcodeEl) {
        new QRCode(qrcodeEl, {
          text: verifyUrl,
          width: 100,
          height: 100,
          colorDark : "#000000",
          colorLight : "#FFFFFF",
          correctLevel : QRCode.CorrectLevel.H
        });
      }

    });



    function addToLinkedInProfile(e) {
      e.preventDefault();
      const name = encodeURIComponent("Certificate of ${formattedData.certificate_type.charAt(0) + formattedData.certificate_type.slice(1).toLowerCase()} in ${formattedData.domain}");
      const orgName = encodeURIComponent("Aadhira Training and Placement Solutions");
      const issueYear = "${issueYear}";
      const issueMonth = "${issueMonth}";
      const certId = encodeURIComponent("${formattedData.certificate_no}");
      
      let shareUrl = window.location.href;
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.') || host.startsWith('10.') || host.startsWith('172.')) {
        shareUrl = 'https://aadhira.onrender.com/certificate/${certNoEncoded}';
      }
      const certUrl = encodeURIComponent(shareUrl);
      
      const linkedinUrl = \`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=\${name}&organizationName=\${orgName}&issueYear=\${issueYear}&issueMonth=\${issueMonth}&certId=\${certId}&certUrl=\${certUrl}\`;
      window.open(linkedinUrl, '_blank');
    }

    async function nativeShare(e) {
      e.preventDefault();
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My Certificate',
            text: 'Check out my certificate from Aadhira Training and Placement Solutions!',
            url: window.location.href,
          });
        } catch (err) {
          console.error('Error sharing:', err);
        }
      } else {
        alert('Web Share API is not supported in your browser. You can copy the URL to share.');
      }
    }

    // ── Client-side PDF Generation helper ────────────────────
    // Uses html2pdf.js to capture the certificate container element
    // and render it as a single-page landscape A4 PDF.
    // ── Client-side PDF Generation helper ────────────────────
    // Uses html2canvas and jsPDF directly to capture the reflowed layout
    // and render it as a single-page landscape A4 PDF.
    function downloadPDF() {
      const wrapper   = document.querySelector('.cert-wrapper');
      const container = document.querySelector('.cert-container');
      const btn       = document.querySelector('.btn-print');
      if (!container || !btn) return;

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span style="border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; width: 14px; height: 14px; display: inline-block; animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle;"></span> Generating PDF...';

      // Inject spinner animation stylesheet dynamically if not already present
      if (!document.getElementById('pdf-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'pdf-spinner-style';
        style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }

      // Save user's dynamic styles and viewport configurations
      const prevBodyStyle      = document.body.getAttribute('style') || '';
      const prevWrapperStyle   = wrapper ? (wrapper.getAttribute('style') || '') : '';
      const prevContainerStyle = container.getAttribute('style') || '';

      // Force absolute positioning, scale(1), and exact pixels during snapshot to bypass mobile scale constraints
      // Also temporarily override body & wrapper block widths to avoid centered overflow clipping at negative coordinates
      document.body.style.width = '1122px';
      document.body.style.minWidth = '1122px';
      document.body.style.overflow = 'visible';
      document.body.style.position = 'relative';

      if (wrapper) {
        wrapper.setAttribute('style', 'display: block !important; width: 1122px !important; min-width: 1122px !important; margin: 0 !important; padding: 0 !important; overflow: visible !important;');
      }

      container.setAttribute('style', 'width: 1122px !important; height: 793px !important; transform: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; position: relative !important; left: 0 !important; top: 0 !important; float: left !important;');

      // Force viewport meta tag to simulate 1122px width to avoid mobile scaling/layout issues during capture
      const metaViewport = document.querySelector('meta[name="viewport"]');
      const originalViewport = metaViewport ? metaViewport.getAttribute('content') : '';
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=1122, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // Scroll to top-left to ensure scroll offsets don't mess with html2canvas positioning
      window.scrollTo(0, 0);

      // Wait 150ms for browser to complete reflowing layout before taking snapshot
      setTimeout(function() {
        html2canvas(container, {
          scale: 2,           // 2x DPI for high-quality rendering with optimized file size
          useCORS: true,      // Enable cross-origin resource sharing for fonts and external images
          logging: false,
          scrollY: 0,
          scrollX: 0,
          width: 1122,
          height: 793,
          windowWidth: 1122,
          windowHeight: 793
        }).then(canvas => {
          // Use JPEG with 0.8 quality to keep the PDF file size small (under 4MB) while maintaining sharpness
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          
          // Access jsPDF class from the bundled html2pdf dependencies
          const { jsPDF } = window.jspdf || window;
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1122, 793]
          });
          
          pdf.addImage(imgData, 'JPEG', 0, 0, 1122, 793);
          pdf.save('Certificate_${formattedData.student_name.replace(/\\s+/g, '_')}.pdf');

          // Restore styles
          restoreStyles();
        }).catch(err => {
          console.error('PDF generation failed:', err);
          alert('Failed to generate PDF. Please try again.');
          restoreStyles();
        });
      }, 150);

      function restoreStyles() {
        // Restore viewport meta
        if (metaViewport && originalViewport) {
          metaViewport.setAttribute('content', originalViewport);
        }
        // Restore screen styles
        if (prevBodyStyle) {
          document.body.setAttribute('style', prevBodyStyle);
        } else {
          document.body.removeAttribute('style');
        }
        if (wrapper) {
          if (prevWrapperStyle) {
            wrapper.setAttribute('style', prevWrapperStyle);
          } else {
            wrapper.removeAttribute('style');
          }
        }
        if (prevContainerStyle) {
          container.setAttribute('style', prevContainerStyle);
        } else {
          container.removeAttribute('style');
        }
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  </script>

</body>
</html>`;

    return reply.type('text/html').send(htmlContent);
  } catch (err) {
    console.error('Error fetching certificate:', err);
    return reply.status(500).send('Database Error');
  }
});


// Route: Get Admin Panel
fastify.get('/admin', { preHandler: checkAuth }, async (request, reply) => {
  const message = request.query.msg || '';
  const error = request.query.err || '';

  try {
    const res = await pool.query('SELECT * FROM certificates ORDER BY id DESC');
    return reply.type('text/html').send(adminHtml(res.rows, message, error));
  } catch (err) {
    console.error('Error fetching admin data:', err);
    return reply.status(500).send('Database Error');
  }
});

// Action: Get the highest certificate ID sequence
fastify.get('/api/last-cert-id', { preHandler: checkAuth }, async (request, reply) => {
  try {
    const res = await pool.query(`
      SELECT certificate_no FROM certificates 
      WHERE certificate_no LIKE 'ATPS/' || extract(year from current_date) || '/%'
    `);
    let maxSeq = 0;
    for (const row of res.rows) {
      const parts = row.certificate_no.split('/');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    return reply.send({ lastIndex: maxSeq });
  } catch (err) {
    console.error('Error fetching last cert id:', err);
    return reply.send({ lastIndex: 0 });
  }
});

// Action: Bulk Store Certificates via API
fastify.post('/api/store-certificates', { preHandler: checkAuth }, async (request, reply) => {
  const certs = request.body.certificates || [];
  let added = 0;
  let skipped = 0;
  const errors = [];

  logDbMessage(`Received /api/store-certificates request for ${certs.length} certificate(s).`);

  for (const c of certs) {
    try {
      const parsedStartDate = parseDateForDb(c.start_date);
      const parsedEndDate = parseDateForDb(c.end_date);
      const parsedIssueDate = parseDateForDb(c.issue_date || new Date());

      if (!parsedStartDate || !parsedEndDate) {
        throw new Error(`Invalid date formats: start_date="${c.start_date}", end_date="${c.end_date}"`);
      }

      const checkDup = await pool.query(
        'SELECT id FROM certificates WHERE student_name = $1 AND domain = $2', 
        [c.student_name, c.domain]
      );
      if (checkDup.rows.length === 0) {
        await pool.query(`
          INSERT INTO certificates (
            certificate_no, student_name, email, college_name, degree, domain, 
            duration, start_date, end_date, issue_date, place, 
            authorized_signatory, signatory_designation, certificate_type, template, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        `, [
          c.certificate_no, c.student_name, c.email || null, c.college_name, c.degree, c.domain,
          c.duration, parsedStartDate, parsedEndDate, parsedIssueDate, c.place,
          c.authorized_signatory || 'K. Rohini', c.signatory_designation || 'Director, ATPS',
          (c.certificate_type || 'INTERNSHIP').toUpperCase(),
          c.template || 'classic'
        ]);
        added++;
        logDbMessage(`Successfully stored certificate ${c.certificate_no} for ${c.student_name}.`);

        // Trigger background email delivery asynchronously
        if (c.send_email !== false && c.email && c.email.trim() !== '') {
          const emailVal = c.email.trim();
          const nameVal = c.student_name;
          const certNoVal = c.certificate_no;
          setImmediate(() => {
            generateAndEmailCertificate(certNoVal, nameVal, emailVal)
              .catch(err => console.error(`Background email failed for ${certNoVal}:`, err));
          });
        }
      } else {
        skipped++;
        logDbMessage(`Skipped duplicate certificate for ${c.student_name} in domain ${c.domain}.`);
      }
    } catch (err) {
      const errMsg = `Error inserting certificate ${c.certificate_no || 'unknown'} for ${c.student_name || 'unknown'}: ${err.message}`;
      logDbMessage(errMsg);
      errors.push({ certificate_no: c.certificate_no, student_name: c.student_name, error: err.message });
    }
  }
  return reply.send({ success: errors.length === 0, added, skipped, errors });
});

// Action: Manual creation of certificate
fastify.post('/admin/add', { preHandler: checkAuth }, async (request, reply) => {
  const {
    certificate_no,
    student_name,
    email,
    college_name,
    degree,
    year,
    domain,
    duration,
    start_date,
    end_date,
    issue_date,
    place,
    authorized_signatory,
    signatory_designation,
    certificate_type,
    template
  } = request.body;

  const finalDegree = year && year.trim() ? `${degree} - ${year.trim()}` : degree;

  try {
    // Check duplicate
    const checkDup = await pool.query('SELECT id FROM certificates WHERE certificate_no = $1', [certificate_no]);
    if (checkDup.rows.length > 0) {
      return reply.redirect('/admin?err=' + encodeURIComponent('Certificate number already exists in database!'));
    }

    const parsedStartDate = parseDateForDb(start_date) || start_date;
    const parsedEndDate = parseDateForDb(end_date) || end_date;
    const parsedIssueDate = parseDateForDb(issue_date) || issue_date;

    await pool.query(`
      INSERT INTO certificates (
        certificate_no, student_name, email, college_name, degree, domain, 
        duration, start_date, end_date, issue_date, place, 
        authorized_signatory, signatory_designation, certificate_type, template
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      certificate_no,
      student_name,
      email || null,
      college_name,
      finalDegree,
      domain,
      duration,
      parsedStartDate,
      parsedEndDate,
      parsedIssueDate,
      place,
      authorized_signatory,
      signatory_designation,
      (certificate_type || 'INTERNSHIP').toUpperCase(),
      template || 'classic'
    ]);

    logDbMessage(`Manual creation succeeded for student: ${student_name}, ID: ${certificate_no}`);

    // Trigger background email delivery asynchronously
    if (email && email.trim() !== '') {
      const emailVal = email.trim();
      const nameVal = student_name;
      const certNoVal = certificate_no;
      setImmediate(() => {
        generateAndEmailCertificate(certNoVal, nameVal, emailVal)
          .catch(err => console.error(`Background email failed for ${certNoVal}:`, err));
      });
    }

    return reply.redirect('/admin?msg=' + encodeURIComponent('Certificate issued successfully to ' + student_name + '!'));
  } catch (err) {
    logDbMessage(`Manual creation failed for student ${student_name || 'unknown'}: ${err.message}`);
    console.error('Error manual insert:', err);
    return reply.redirect('/admin?err=' + encodeURIComponent('Database error: ' + err.message));
  }
});

// Action: Sync from Google Sheets via Service Account JSON
fastify.post('/admin/sync', { preHandler: checkAuth }, async (request, reply) => {
  const { spreadsheetId, sheetName } = request.body;

  if (!spreadsheetId || !sheetName) {
    return reply.redirect('/admin?err=' + encodeURIComponent('Spreadsheet ID and Sheet Name are required!'));
  }

  try {
    const sheets = getSheetsClient();
    
    console.log(`Syncing from spreadsheet ${spreadsheetId}, sheet ${sheetName}...`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:L500`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return reply.redirect('/admin?err=' + encodeURIComponent('No data rows found in Google Sheet. Make sure headers are in row 1, and rows are shared.'));
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const [
        certNo,
        studentName,
        collegeName,
        degree,
        domain,
        duration,
        startDate,
        endDate,
        issueDate,
        place,
        authSignatory,
        signDesignation
      ] = row;

      if (!certNo || !studentName) continue;

      const checkRes = await pool.query('SELECT id FROM certificates WHERE certificate_no = $1', [certNo]);
      
      const parsedStartDate = parseDateForDb(startDate) || startDate;
      const parsedEndDate = parseDateForDb(endDate) || endDate;
      const parsedIssueDate = parseDateForDb(issueDate) || issueDate;

      if (checkRes.rows.length === 0) {
        logDbMessage(`Google Sync: Inserting certificate for student: ${studentName}, ID: ${certNo}`);
        await pool.query(`
          INSERT INTO certificates (
            certificate_no, student_name, college_name, degree, domain, 
            duration, start_date, end_date, issue_date, place, 
            authorized_signatory, signatory_designation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          certNo, studentName, collegeName, degree, domain,
          duration, parsedStartDate, parsedEndDate, parsedIssueDate, place || 'Chennai',
          authSignatory || 'K. Rohini', signDesignation || 'Founder'
        ]);
        insertedCount++;
      } else {
        logDbMessage(`Google Sync: Updating certificate for student: ${studentName}, ID: ${certNo}`);
        await pool.query(`
          UPDATE certificates SET
            student_name = $2,
            college_name = $3,
            degree = $4,
            domain = $5,
            duration = $6,
            start_date = $7,
            end_date = $8,
            issue_date = $9,
            place = $10,
            authorized_signatory = $11,
            signatory_designation = $12
          WHERE certificate_no = $1
        `, [
          certNo, studentName, collegeName, degree, domain,
          duration, parsedStartDate, parsedEndDate, parsedIssueDate, place || 'Chennai',
          authSignatory || 'K. Rohini', signDesignation || 'Founder'
        ]);
        updatedCount++;
      }
    }

    const msg = `Sync completed! Imported ${insertedCount} new certificate(s) and updated ${updatedCount} certificate(s) successfully.`;
    return reply.redirect('/admin?msg=' + encodeURIComponent(msg));

  } catch (err) {
    console.error('Error syncing Google Sheets:', err);
    let errMsg = err.message;
    if (err.message.includes('caller does not have permission')) {
      errMsg = 'Access Denied. You MUST share the Google Sheet with: adhira@adhira-496911.iam.gserviceaccount.com';
    }
    return reply.redirect('/admin?err=' + encodeURIComponent('Sync Failed: ' + errMsg));
  }
});

// Action: Update certificate in database
fastify.post('/admin/update', { preHandler: checkAuth }, async (request, reply) => {
  const {
    certificate_no,
    student_name,
    email,
    college_name,
    degree,
    domain,
    duration,
    start_date,
    end_date,
    issue_date,
    place,
    authorized_signatory,
    signatory_designation,
    template
  } = request.body;

  try {
    const parsedStartDate = parseDateForDb(start_date) || start_date;
    const parsedEndDate = parseDateForDb(end_date) || end_date;
    const parsedIssueDate = parseDateForDb(issue_date) || issue_date;

    await pool.query(`
      UPDATE certificates SET
        student_name = $2,
        email = $3,
        college_name = $4,
        degree = $5,
        domain = $6,
        duration = $7,
        start_date = $8,
        end_date = $9,
        issue_date = $10,
        place = $11,
        authorized_signatory = $12,
        signatory_designation = $13,
        template = $14
      WHERE certificate_no = $1
    `, [
      certificate_no,
      student_name,
      email || null,
      college_name,
      degree,
      domain,
      duration,
      parsedStartDate,
      parsedEndDate,
      parsedIssueDate,
      place,
      authorized_signatory,
      signatory_designation,
      template || 'classic'
    ]);

    logDbMessage(`Manual update succeeded for student: ${student_name}, ID: ${certificate_no}`);

    // Trigger background email delivery asynchronously
    if (email && email.trim() !== '') {
      const emailVal = email.trim();
      const nameVal = student_name;
      const certNoVal = certificate_no;
      setImmediate(() => {
        generateAndEmailCertificate(certNoVal, nameVal, emailVal)
          .catch(err => console.error(`Background email failed for ${certNoVal}:`, err));
      });
    }

    return reply.send({ success: true, message: 'Certificate updated successfully!' });
  } catch (err) {
    logDbMessage(`Manual update failed for student ${student_name || 'unknown'}: ${err.message}`);
    console.error('Error manual update:', err);
    return reply.status(500).send({ success: false, error: 'Database error: ' + err.message });
  }
});

// Action: Delete certificate from database
fastify.post('/admin/delete', { preHandler: checkAuth }, async (request, reply) => {
  const { certificate_no } = request.body;

  if (!certificate_no) {
    return reply.status(400).send({ success: false, error: 'Certificate number is required!' });
  }

  try {
    await pool.query('DELETE FROM certificates WHERE certificate_no = $1', [certificate_no]);
    logDbMessage(`Manual deletion succeeded for ID: ${certificate_no}`);
    return reply.send({ success: true, message: 'Certificate deleted successfully!' });
  } catch (err) {
    logDbMessage(`Manual deletion failed for ID ${certificate_no}: ${err.message}`);
    console.error('Error manual delete:', err);
    return reply.status(500).send({ success: false, error: 'Database error: ' + err.message });
  }
});

// Dynamic background SMTP email sender for Secure Download Link
async function generateAndEmailCertificate(certificateNo, studentName, recipientEmail) {
  try {
    const certNoEncoded = certificateNo.replace(/\//g, '_');
    const downloadUrl = `${process.env.APP_URL || 'https://aadhira.onrender.com'}/certificate/${certNoEncoded}`;
    
    // Fetch certificate type for dynamic email subject
    let certType = 'Internship';
    try {
      const res = await pool.query('SELECT certificate_type FROM certificates WHERE certificate_no = $1', [certificateNo]);
      if (res.rows.length > 0 && res.rows[0].certificate_type) {
        let typeVal = res.rows[0].certificate_type;
        certType = typeVal.charAt(0).toUpperCase() + typeVal.slice(1).toLowerCase();
      }
    } catch (e) {
      console.error('Failed to fetch cert type:', e);
    }

    // Send email using our existing Brevo integration code directly
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'vsgrpsemail@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Aadhira Solutions';
    
    if (!apiKey) {
      logDbMessage(`[Background Email Error] BREVO_API_KEY environment variable is not defined.`);
      return;
    }
    
    logDbMessage(`[Background Email] Attempting to send secure link for certificate ${certificateNo} to ${studentName} (${recipientEmail})`);
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: recipientEmail,
          name: studentName
        }
      ],
      subject: `Secure Download Link: Certificate of ${certType} - ${studentName}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #0A192F;">Aadhira Training and Placement Solutions</h2>
            </div>
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Congratulations on successfully completing your program!</p>
            <p>Your Certificate of ${certType} (No. <strong>${certificateNo}</strong>) has been generated and is ready for download.</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${downloadUrl}" style="background-color: #D97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Certificate</a>
            </div>
            <p style="font-size: 13px; color: #666;">For security purposes, you will need to verify your email address (${recipientEmail}) to access the certificate.</p>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p>Warm regards,<br><strong>Aadhira Solutions Team</strong></p>
          </body>
        </html>
      `
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    logDbMessage(`[Background Email Success] Secure link for certificate ${certificateNo} successfully sent to ${recipientEmail}. Message ID: ${response.data.messageId || 'unknown'}`);
  } catch (err) {
    let errMsg = err.message;
    if (err.response && err.response.data) {
      errMsg += ' - ' + JSON.stringify(err.response.data);
    }
    logDbMessage(`[Background Email Error] Failed to send email to ${recipientEmail} for certificate ${certificateNo}: ${errMsg}`);
  }
}

// Action: Send certificate email via Brevo SMTP API (Fallback / manual trigger)
fastify.post('/api/send-email', { preHandler: checkAuth }, async (request, reply) => {
  const { email, studentName, certificateNo } = request.body || {};

  if (!email || !studentName || !certificateNo) {
    return reply.status(400).send({ success: false, error: 'Missing email, studentName, or certificateNo' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'vsgrpsemail@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Aadhira Solutions';

  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY environment variable is not defined.';
    logDbMessage(`[Email Error] ${errorMsg}`);
    return reply.status(500).send({ success: false, error: errorMsg });
  }

  logDbMessage(`[Email] Attempting to send secure link for ${certificateNo} to ${studentName} (${email})`);

  try {
    const certNoEncoded = certificateNo.replace(/\//g, '_');
    const downloadUrl = `${process.env.APP_URL || 'https://aadhira.onrender.com'}/certificate/${certNoEncoded}`;

    let certType = 'Internship';
    try {
      const res = await pool.query('SELECT certificate_type FROM certificates WHERE certificate_no = $1', [certificateNo]);
      if (res.rows.length > 0 && res.rows[0].certificate_type) {
        let typeVal = res.rows[0].certificate_type;
        certType = typeVal.charAt(0).toUpperCase() + typeVal.slice(1).toLowerCase();
      }
    } catch (e) {
      console.error('Failed to fetch cert type:', e);
    }

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: email,
          name: studentName
        }
      ],
      subject: `Secure Download Link: Certificate of ${certType} - ${studentName}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #0A192F;">Aadhira Training and Placement Solutions</h2>
            </div>
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Congratulations on successfully completing your program!</p>
            <p>Your Certificate of ${certType} (No. <strong>${certificateNo || 'N/A'}</strong>) has been generated and is ready for download.</p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${downloadUrl}" style="background-color: #D97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Certificate</a>
            </div>
            <p style="font-size: 13px; color: #666;">For security purposes, you will need to verify your email address (${email}) to access the certificate.</p>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p>Warm regards,<br><strong>Aadhira Solutions Team</strong></p>
          </body>
        </html>
      `
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    logDbMessage(`[Email Success] Certificate ${certificateNo || 'unknown'} successfully sent to ${email}. Message ID: ${response.data.messageId || 'unknown'}`);
    return reply.send({ success: true, messageId: response.data.messageId });
  } catch (err) {
    let errMsg = err.message;
    if (err.response && err.response.data) {
      errMsg += ' - ' + JSON.stringify(err.response.data);
    }
    const logMsg = `[Email Error] Failed to send email to ${email} for certificate ${certificateNo || 'unknown'}: ${errMsg}`;
    logDbMessage(logMsg);
    return reply.status(500).send({ success: false, error: errMsg });
  }
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
const start = async () => {
  try {
    // Database schema migration: Add email column if not exists
    console.log('Running database schema migration...');
    const dbClient = await pool.connect();
    try {
      await dbClient.query('ALTER TABLE certificates ADD COLUMN IF NOT EXISTS email VARCHAR(255);');
      console.log('Database schema migration successful: email column verified.');
    } catch (dbErr) {
      console.error('Error running database schema migration:', dbErr.message);
    } finally {
      dbClient.release();
    }

    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`\n======================================================`);
    console.log(`🔥 Fastify server running successfully on http://localhost:${port}`);
    console.log('Centered Logo header layout active!');
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Fastify startup error:', err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

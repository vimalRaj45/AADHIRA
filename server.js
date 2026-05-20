const fastify = require('fastify')({ logger: false });
const { Pool } = require('pg');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
    
    <h1>Credential Verified Successfully</h1>
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
        <span class="detail-label">Internship Domain</span>
        <span class="detail-value">${student.domain}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Duration</span>
        <span class="detail-value">${student.duration}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Internship Dates</span>
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
  const tableRows = certificates.map(c => `
    <tr>
      <td style="font-family: monospace; font-weight: 700; color: #D97706;">${c.certificate_no}</td>
      <td style="font-weight: 600; color: white;">${c.student_name}</td>
      <td>${c.college_name}</td>
      <td><span class="domain-tag">${c.domain}</span></td>
      <td>${c.duration}</td>
      <td style="text-align: right;">
        <a href="/certificate/${c.certificate_no.replace(/\//g, '_')}" target="_blank" class="action-btn view-btn">View HTML</a>
        <a href="/verify?cert=${c.certificate_no}" target="_blank" class="action-btn verify-btn">Verify Portal</a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - Certificate Control Room - ATPS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0F1D;
      --card: #151D30;
      --navy: #0A192F;
      --gold: #D97706;
      --gold-light: #F5A623;
      --text: #F8F9FA;
      --border: rgba(255,255,255,0.06);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      font-family: 'Montserrat', sans-serif;
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-svg {
      width: 32px;
      height: 32px;
      fill: var(--gold);
    }
    .logo-text {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 800;
      color: white;
    }
    .header-nav {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .btn-portal-link {
      color: #94A3B8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: color 0.3s;
    }
    .btn-portal-link:hover {
      color: white;
    }
    .container {
      max-width: 1300px;
      width: 100%;
      margin: 40px auto;
      padding: 0 20px;
      flex: 1;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 22px 25px;
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
      background: var(--gold);
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
      display: block;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: white;
    }

    /* Alerts */
    .alert {
      padding: 15px 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      font-weight: 600;
      font-size: 14px;
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10B981;
      color: #10B981;
    }
    .alert-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #EF4444;
      color: #EF4444;
    }

    .main-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 30px;
    }

    /* Content Cards */
    .dashboard-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .card-title {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      color: white;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Forms */
    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .form-control {
      width: 100%;
      background: rgba(10, 25, 47, 0.4);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px;
      padding: 10px 14px;
      color: white;
      font-family: inherit;
      font-size: 13.5px;
      transition: all 0.3s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--gold);
      box-shadow: 0 0 8px rgba(217, 119, 6, 0.2);
    }
    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--gold), #B45309);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
      transition: all 0.3s;
    }
    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(217, 119, 6, 0.35);
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }
    th {
      background: rgba(10,25,47,0.3);
      padding: 14px 18px;
      font-weight: 700;
      font-size: 10.5px;
      text-transform: uppercase;
      color: #64748B;
      letter-spacing: 1px;
      border-bottom: 2px solid var(--border);
    }
    td {
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
      color: #94A3B8;
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255,255,255,0.01);
    }
    .domain-tag {
      background: rgba(217,119,6,0.1);
      border: 1px solid rgba(217,119,6,0.25);
      color: var(--gold-light);
      padding: 3px 10px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 600;
    }
    .action-btn {
      display: inline-block;
      font-size: 11.5px;
      font-weight: 700;
      text-decoration: none;
      padding: 5px 12px;
      border-radius: 4px;
      transition: all 0.3s;
      margin-left: 5px;
    }
    .view-btn {
      background: rgba(217,119,6,0.1);
      color: var(--gold-light);
      border: 1px solid rgba(217,119,6,0.2);
    }
    .view-btn:hover {
      background: var(--gold);
      color: white;
    }
    .verify-btn {
      background: rgba(255,255,255,0.05);
      color: #94A3B8;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .verify-btn:hover {
      background: white;
      color: var(--navy);
    }

    .instructions {
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
      background: rgba(10, 25, 47, 0.4);
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid var(--gold);
      margin-top: 10px;
    }
    .instructions code {
      color: var(--gold-light);
      background: rgba(0,0,0,0.2);
      padding: 2px 4px;
      border-radius: 3px;
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
      <span class="logo-text">ATPS Control Room</span>
    </div>
    <div class="header-nav">
      <a href="/" class="btn-portal-link">Public Search Portal</a>
    </div>
  </header>

  <div class="container">
    
    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Certificates Issued</span>
        <span class="stat-value">${certificates.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Active Domains</span>
        <span class="stat-value">${new Set(certificates.map(c => c.domain)).size}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Institutions</span>
        <span class="stat-value">${new Set(certificates.map(c => c.college_name)).size}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Service Account Status</span>
        <span class="stat-value" style="font-size:16px; color:#10B981; font-weight:700;">● Active Ready</span>
      </div>
    </div>

    <!-- Message Alerts -->
    ${message ? `<div class="alert alert-success">${message}</div>` : ''}
    ${error ? `<div class="alert alert-danger">${error}</div>` : ''}

    <div class="main-grid">
      
      <!-- Left side: List of certificates -->
      <div class="dashboard-card" style="margin-bottom: 0;">
        <div class="card-title">
          <span>Active Issued Credentials</span>
          <span style="font-size:11px; font-weight:500; font-family:sans-serif; color:#64748B;">Showing database rows</span>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student Name</th>
                <th>Institution</th>
                <th>Domain</th>
                <th>Duration</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align:center;">No certificate records in the database. Use sync or the form to add some!</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right side: Sidebar controllers (Sync and Manual Input) -->
      <div class="sidebar">
        
        <!-- Google Sheet Sync Widget -->
        <div class="dashboard-card">
          <div class="card-title">Google Sheets Sync</div>
          <form action="/admin/sync" method="POST">
            <div class="form-group">
              <label>Spreadsheet ID</label>
              <input type="text" name="spreadsheetId" class="form-control" placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ" required>
            </div>
            <div class="form-group">
              <label>Sheet / Tab Name</label>
              <input type="text" name="sheetName" class="form-control" placeholder="Sheet1" default="Sheet1" required>
            </div>
            <button type="submit" class="submit-btn" style="background: linear-gradient(135deg, #10B981, #047857); box-shadow: 0 4px 12px rgba(16,185,129,0.2);">Sync via Service Account</button>
          </form>
          
          <div class="instructions">
            <strong>How to Sync:</strong><br>
            1. Share your Google Sheet with: <code style="font-size:9.5px; word-break:break-all;">adhira@adhira-496911.iam.gserviceaccount.com</code><br>
            2. Make sure columns match: <br>
            <code>certificate_no, student_name, college_name, degree, domain, duration, start_date, end_date, issue_date, place, authorized_signatory, signatory_designation</code>
          </div>
        </div>

        <!-- Manual Creator Widget -->
        <div class="dashboard-card">
          <div class="card-title">Issue Manually</div>
          <form action="/admin/add" method="POST">
            <div class="form-group">
              <label>Certificate Number</label>
              <input type="text" name="certificate_no" class="form-control" placeholder="ATPS/2026/000005" required>
            </div>
            <div class="form-group">
              <label>Student Name</label>
              <input type="text" name="student_name" class="form-control" required>
            </div>
            <div class="form-group">
              <label>College / Institution</label>
              <input type="text" name="college_name" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Degree & Stream</label>
              <input type="text" name="degree" class="form-control" placeholder="B.Com (General)" required>
            </div>
            <div class="form-group">
              <label>Domain</label>
              <input type="text" name="domain" class="form-control" placeholder="Accounting" required>
            </div>
            <div class="form-group">
              <label>Duration</label>
              <input type="text" name="duration" class="form-control" placeholder="30 Days" required>
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
              <label>Designation</label>
              <input type="text" name="signatory_designation" class="form-control" value="Founder" required>
            </div>
            <button type="submit" class="submit-btn">Issue Certificate</button>
          </form>
        </div>

      </div>
    </div>
  </div>
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

// Route: View beautiful landscape certificate
fastify.get('/certificate/:certNoEncoded', async (request, reply) => {
  const certNo = request.params.certNoEncoded.replace(/_/g, '/');

  try {
    const res = await pool.query('SELECT * FROM certificates WHERE certificate_no = $1', [certNo]);
    
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
      signatory_designation: row.signatory_designation
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Internship - ${formattedData.student_name}</title>
  
  <!-- Google Fonts for high-end look -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Great+Vibes&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&family=Alex+Brush&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
  
  <!-- qrcode.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

  <style>
    /* Styling for Screen Preview */
    :root {
      --navy: #0A192F;
      --gold: #D97706;
      --gold-light: #F5A623;
      --accent: #E07A5F;
      --bg: #F8F9FA;
      --paper: #FFFFFF;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      font-family: 'Montserrat', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    /* Fixed Landscape A4 Dimensions for Preview */
    .cert-container {
      width: 297mm;
      height: 210mm;
      background: var(--paper);
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(10, 25, 47, 0.15);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
    }

    /* Outer Borders */
    .border-outer {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 8px solid var(--navy);
      pointer-events: none;
    }

    .border-inner {
      position: absolute;
      top: 28px;
      left: 28px;
      right: 28px;
      bottom: 28px;
      border: 2px solid var(--gold);
      pointer-events: none;
    }

    /* Border Corner Decorations */
    .corner-dec {
      position: absolute;
      width: 60px;
      height: 60px;
      border: 3px solid var(--gold);
      pointer-events: none;
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
      fill: var(--gold);
      opacity: 0.85;
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
      width: 340px;
      height: 340px;
      pointer-events: none;
      z-index: 1;
      opacity: 0.04;
      background-image: url('/logos.png');
      background-size: 400% 100%;
      background-position: 0% 0%;
      background-repeat: no-repeat;
    }

    /* Header Layout */
    .header {
      display: flex;
      justify-content: center; /* PERFECT CENTER */
      align-items: center;
      z-index: 2;
      position: relative;
      width: 100%;
      height: 110px;
    }

    .cert-id {
      position: absolute;
      left: 0;
      top: 0;
      font-size: 11px;
      color: var(--navy);
      font-weight: 700;
      letter-spacing: 1.5px;
      background: rgba(10, 25, 47, 0.05);
      padding: 6px 12px;
      border-radius: 4px;
      border-left: 3px solid var(--gold);
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
      background-size: 400% 100%;
      background-repeat: no-repeat;
      display: inline-block;
      mix-blend-mode: multiply;
    }

    .logo-aadhira {
      background-position: 0% 0%;
      width: 80px;
      height: 80px;
      margin-bottom: 2px;
    }

    .company-subtitle {
      font-size: 10px;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3.5px;
      margin-top: 2px;
      margin-bottom: 6px;
    }

    /* Center-Aligned Accreditation Badges */
    .accreditations {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
    }

    .logo-iso {
      background-position: 33.33% 0%;
      width: 44px;
      height: 44px;
    }

    .logo-arms {
      background-position: 66.66% 0%;
      width: 44px;
      height: 44px;
    }

    .logo-uk {
      background-position: 100% 0%;
      width: 44px;
      height: 44px;
    }

    .medal-container {
      position: absolute;
      right: 0;
      top: -10px;
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
      margin-top: 5px;
      margin-bottom: 5px;
    }

    .title {
      font-family: 'Cinzel', serif;
      font-size: 34px;
      font-weight: 800;
      color: var(--navy);
      letter-spacing: 4px;
      margin-bottom: 10px;
      position: relative;
      display: inline-block;
    }

    .title::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 15%;
      width: 70%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    .subtitle {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-style: italic;
      color: #555;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }

    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 16px;
      display: inline-block;
      position: relative;
      padding: 0 20px;
    }

    .recipient-name::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 2.2px;
      background: linear-gradient(90deg, transparent, var(--gold-light), var(--gold), var(--gold-light), transparent);
    }

    .achievement-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      color: #333;
      line-height: 1.7;
      max-width: 860px;
      margin: 0 auto;
      font-weight: 500;
    }

    .highlight {
      font-weight: 700;
      color: var(--navy);
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
      width: 220px;
      text-align: center;
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
      mix-blend-mode: multiply; /* Blends background color out */
    }

    .sign-line {
      border-top: 1.5px solid rgba(10, 25, 47, 0.3);
      padding-top: 6px;
    }

    .sign-name {
      font-size: 11px;
      font-weight: 700;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .sign-designation {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
      font-weight: 500;
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
      align-items: flex-end;
      gap: 15px;
      width: 240px;
    }

    .verification-details {
      text-align: left;
    }

    .verif-label {
      font-size: 8px;
      font-weight: 700;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
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
      color: var(--gold);
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
      margin-top: 30px;
      display: flex;
      gap: 15px;
      z-index: 10;
    }

    .btn {
      padding: 12px 28px;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(10, 25, 47, 0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }

    .btn-print {
      background: linear-gradient(135deg, var(--navy), #1E3A8A);
      color: white;
    }

    .btn-print:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(10, 25, 47, 0.25);
    }

    .btn-back {
      background: white;
      color: var(--navy);
      border: 1.5px solid var(--navy);
    }

    .btn-back:hover {
      background: #F1F5F9;
      transform: translateY(-2px);
    }

    /* Print styling rules */
    @media print {
      body {
        background: none;
        padding: 0;
        margin: 0;
        width: 297mm;
        height: 210mm;
      }

      .cert-container {
        width: 297mm;
        height: 210mm;
        box-shadow: none;
        border-radius: 0;
        position: absolute;
        top: 0;
        left: 0;
        margin: 0;
        padding: 40px;
        page-break-after: always;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .no-print {
        display: none !important;
      }
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }
  </style>
</head>
<body>

  <!-- Certificate Container -->
  <div class="cert-container">
    
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
        <div class="company-subtitle">Training & Placement Solutions</div>
        
        <!-- Accreditation badges horizontally aligned -->
        <div class="accreditations">
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
              <stop offset="0%" stop-color="#FDE047"/>
              <stop offset="30%" stop-color="#F5A623"/>
              <stop offset="70%" stop-color="#D97706"/>
              <stop offset="100%" stop-color="#78350F"/>
            </linearGradient>
            <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0A192F"/>
              <stop offset="100%" stop-color="#1E3E62"/>
            </linearGradient>
            <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#F5A623"/>
              <stop offset="100%" stop-color="#D97706"/>
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
      <h1 class="title">CERTIFICATE OF INTERNSHIP</h1>
      <p class="subtitle">This internship program certificate is proudly awarded to</p>
      
      <div class="recipient-name">${formattedData.student_name}</div>
      
      <p class="achievement-text">
        from <span class="highlight">${formattedData.college_name}</span>, pursuing <span class="highlight">${formattedData.degree}</span>, 
        for successfully completing the <span class="highlight">${formattedData.domain} Internship Program</span> 
        conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, 
        Chennai, for a duration of <span class="highlight">${formattedData.duration}</span>, 
        from <span class="highlight">21st April 2026</span> to <span class="highlight">20th May 2026</span>.
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
        <div class="sign-line">
          <div class="sign-name">${formattedData.authorized_signatory}</div>
          <div class="sign-designation">${formattedData.signatory_designation}</div>
        </div>
      </div>

      <!-- Company Seal -->
      <div class="seal-block">
        <svg viewBox="0 0 120 120" width="95" height="95">
          <defs>
            <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F5A623"/>
              <stop offset="50%" stop-color="#D97706"/>
              <stop offset="100%" stop-color="#92400E"/>
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
      <div class="verification-block">
        <div class="verification-details">
          <div class="verif-label">Verification At</div>
          <a class="verif-link" id="verifLinkDisplay" href="#" target="_blank">Loading...</a>
          <div class="verif-label" style="margin-top: 8px; font-size: 7px; color: #888;">Place: ${formattedData.place}</div>
          <div class="verif-label" style="font-size: 7px; color: #888;">Date: 20 May 2026</div>
        </div>
        
        <div class="qrcode-container">
          <div id="qrcode-${formattedData.id}" style="width: 60px; height: 60px;"></div>
        </div>
      </div>

    </div>

  </div>

  <!-- Print Button (Hidden on Print) -->
  <div class="controls no-print">
    <button class="btn btn-print" onclick="window.print()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print to PDF
    </button>
    <a class="btn btn-back" href="/admin">
      Admin Panel
    </a>
  </div>

  <!-- Dynamic QR Code Script -->
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const currentHost = window.location.protocol + "//" + window.location.host;
      const verifyUrl = currentHost + "/verify?cert=" + encodeURIComponent("${formattedData.certificate_no}");
      
      const linkDisplay = document.getElementById("verifLinkDisplay");
      if (linkDisplay) {
        linkDisplay.href = verifyUrl;
        linkDisplay.innerText = window.location.host + "/verify?cert=...";
      }

      const qrcodeEl = document.getElementById("qrcode-${formattedData.id}");
      if (qrcodeEl) {
        new QRCode(qrcodeEl, {
          text: verifyUrl,
          width: 60,
          height: 60,
          colorDark : "#0A192F",
          colorLight : "#FFFFFF",
          correctLevel : QRCode.CorrectLevel.H
        });
      }
    });
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
fastify.get('/admin', async (request, reply) => {
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

// Action: Manual creation of certificate
fastify.post('/admin/add', async (request, reply) => {
  const {
    certificate_no,
    student_name,
    college_name,
    degree,
    domain,
    duration,
    start_date,
    end_date,
    issue_date,
    place,
    authorized_signatory,
    signatory_designation
  } = request.body;

  try {
    // Check duplicate
    const checkDup = await pool.query('SELECT id FROM certificates WHERE certificate_no = $1', [certificate_no]);
    if (checkDup.rows.length > 0) {
      return reply.redirect('/admin?err=' + encodeURIComponent('Certificate number already exists in database!'));
    }

    await pool.query(`
      INSERT INTO certificates (
        certificate_no, student_name, college_name, degree, domain, 
        duration, start_date, end_date, issue_date, place, 
        authorized_signatory, signatory_designation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      certificate_no,
      student_name,
      college_name,
      degree,
      domain,
      duration,
      start_date,
      end_date,
      issue_date,
      place,
      authorized_signatory,
      signatory_designation
    ]);

    return reply.redirect('/admin?msg=' + encodeURIComponent('Certificate issued successfully to ' + student_name + '!'));
  } catch (err) {
    console.error('Error manual insert:', err);
    return reply.redirect('/admin?err=' + encodeURIComponent('Database error: ' + err.message));
  }
});

// Action: Sync from Google Sheets via Service Account JSON
fastify.post('/admin/sync', async (request, reply) => {
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
      
      if (checkRes.rows.length === 0) {
        await pool.query(`
          INSERT INTO certificates (
            certificate_no, student_name, college_name, degree, domain, 
            duration, start_date, end_date, issue_date, place, 
            authorized_signatory, signatory_designation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          certNo, studentName, collegeName, degree, domain,
          duration, startDate, endDate, issueDate, place || 'Chennai',
          authSignatory || 'K. Rohini', signDesignation || 'Founder'
        ]);
        insertedCount++;
      } else {
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
          duration, startDate, endDate, issueDate, place || 'Chennai',
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

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`\n======================================================`);
    console.log(`🔥 Fastify server running successfully on http://localhost:${port}`);
    console.log('Centered Logo header layout active!');
    console.log(`======================================================\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const verifyTemplate = (certificatesData) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATPS - Certificate Verification</title>
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
      --success: #10B981;
      --error: #EF4444;
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
    .hidden { display: none !important; }
    
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
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
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
    
    /* Search Form */
    .search-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
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
    .btn {
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
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(217, 119, 6, 0.5);
    }
    
    /* Success View */
    .success-card {
      border-color: rgba(16, 185, 129, 0.25);
      max-width: 680px;
      position: relative;
      overflow: hidden;
    }
    .success-card::before {
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
    .detail-item.full-width { grid-column: span 2; }
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
    
    /* Error View */
    .error-card {
      border-color: rgba(239, 68, 68, 0.2);
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
    
    footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #8892B0;
      letter-spacing: 0.5px;
    }
    
    .btn-secondary {
      background: rgba(255,255,255,0.05);
      color: #94A3B8;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: none;
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    @media (max-width: 600px) {
      .card { padding: 30px 20px; }
      h1 { font-size: 22px; }
      header { padding: 20px; }
      .details-grid { grid-template-columns: 1fr; gap: 15px; padding: 20px; }
      .detail-item.full-width { grid-column: span 1; }
      div[style*="display: flex; gap: 15px"] { flex-direction: column; gap: 10px; }
      .btn { width: 100%; text-align: center; justify-content: center; }
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
    <!-- View 1: Search Form -->
    <div id="searchView" class="card">
      <h1>Certificate Verification</h1>
      <p class="subtitle">Aadhira Training and Placement Solutions secure credential verification. Enter a certificate number below to check its authenticity.</p>
      
      <form class="search-form" id="searchForm">
        <input type="text" id="certInput" class="search-input" placeholder="e.g. ATPS/2026/000001" required>
        <button type="submit" class="btn">Verify Credential</button>
      </form>
    </div>

    <!-- View 2: Success Details -->
    <div id="successView" class="card success-card hidden">
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
          <span class="detail-value" id="resCertId" style="font-family: monospace; letter-spacing: 1px; color: var(--gold-light);"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Issue Date</span>
          <span class="detail-value" id="resIssueDate"></span>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">Recipient Student Name</span>
          <span class="detail-value" id="resName" style="font-size: 18px; color: white;"></span>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">College & Institution</span>
          <span class="detail-value" id="resCollege"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Degree & Stream</span>
          <span class="detail-value" id="resDegree"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Internship Domain</span>
          <span class="detail-value" id="resDomain"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Duration</span>
          <span class="detail-value" id="resDuration"></span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Internship Dates</span>
          <span class="detail-value" id="resDates" style="font-size: 13px;"></span>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; justify-content: center;">
        <a href="#" id="viewHtmlBtn" target="_blank" class="btn">View Certificate</a>
        <button onclick="resetSearch()" class="btn btn-secondary">Search Another</button>
      </div>
    </div>

    <!-- View 3: Error -->
    <div id="errorView" class="card error-card hidden">
      <div class="icon-container">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1>Verification Failed</h1>
      <p class="subtitle">The certificate credential you provided could not be verified in our records.</p>
      <div class="cert-input-display" id="errorCertId"></div>
      <button onclick="resetSearch()" class="btn btn-secondary">Back to Portal</button>
    </div>
  </main>

  <footer>
    &copy; 2026 Aadhira Training & Placement Solutions (ATPS). All Rights Reserved.
  </footer>

  <script>
    // Embedded Certificate Data
    const certificatesData = ${JSON.stringify(certificatesData)};
    
    function formatDate(dateStr) {
      if(!dateStr) return '';
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function showView(viewId) {
      document.getElementById('searchView').classList.add('hidden');
      document.getElementById('successView').classList.add('hidden');
      document.getElementById('errorView').classList.add('hidden');
      document.getElementById(viewId).classList.remove('hidden');
    }

    function verifyCertificate(certNo) {
      certNo = certNo.trim().toUpperCase();
      const cert = certificatesData.find(c => c.certificate_no.toUpperCase() === certNo);
      
      if (cert) {
        document.getElementById('resCertId').textContent = cert.certificate_no;
        document.getElementById('resIssueDate').textContent = formatDate(cert.issue_date);
        document.getElementById('resName').textContent = cert.student_name;
        document.getElementById('resCollege').textContent = cert.college_name;
        document.getElementById('resDegree').textContent = cert.degree;
        document.getElementById('resDomain').textContent = cert.domain;
        document.getElementById('resDuration').textContent = cert.duration;
        document.getElementById('resDates').textContent = formatDate(cert.start_date) + ' — ' + formatDate(cert.end_date);
        
        const serial = cert.certificate_no.split('/').pop();
        document.getElementById('viewHtmlBtn').href = 'cert_' + serial + '.html';
        
        showView('successView');
      } else {
        document.getElementById('errorCertId').textContent = certNo || 'NO ID SUBMITTED';
        showView('errorView');
      }
    }

    function resetSearch() {
      // Clear URL params without reloading
      window.history.pushState({}, document.title, window.location.pathname);
      document.getElementById('certInput').value = '';
      showView('searchView');
    }

    document.getElementById('searchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const val = document.getElementById('certInput').value;
      // Update URL so it can be shared
      window.history.pushState({}, document.title, "?cert=" + encodeURIComponent(val));
      verifyCertificate(val);
    });

    // Check URL on load
    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('cert')) {
        verifyCertificate(params.get('cert'));
      }
    });
  </script>
</body>
</html>
`;

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    const res = await client.query('SELECT * FROM certificates ORDER BY certificate_no ASC');
    console.log('Fetched certificates for verify page.');
    
    const htmlContent = verifyTemplate(res.rows);
    const filepath = path.join(__dirname, 'verify.html');
    fs.writeFileSync(filepath, htmlContent, 'utf8');
    
    console.log('Successfully generated verify.html');

  } catch (err) {
    console.error('Error generating verify page:', err);
  } finally {
    await client.end();
  }
}

main();

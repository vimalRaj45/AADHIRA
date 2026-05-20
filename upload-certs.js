const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { google } = require('googleapis');

const connectionString = 'postgresql://neondb_owner:npg_c3Z8hrJHXGIR@ep-old-shape-apznh8mh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'adhira-496911-6d81bb10334b.json');
const DRIVE_FOLDER_ID = '1llnhxEsbxMx7r_H58BrWMRRdEqrp7-M1';

// Dynamic HTML Template with Centered Header and Badges matching user's reference image
const certTemplate = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Internship - ${data.student_name}</title>
  
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
      background-image: url('logos.png');
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
      background-image: url('logos.png');
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
      <div class="cert-id">ID: ${data.certificate_no}</div>
      
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
      
      <div class="recipient-name">${data.student_name}</div>
      
      <p class="achievement-text">
        from <span class="highlight">${data.college_name}</span>, pursuing <span class="highlight">${data.degree}</span>, 
        for successfully completing the <span class="highlight">${data.domain} Internship Program</span> 
        conducted at <span class="highlight">Aadhira Training and Placement Solutions (ATPS)</span>, 
        Chennai, for a duration of <span class="highlight">${data.duration}</span>, 
        from <span class="highlight">21st April 2026</span> to <span class="highlight">20th May 2026</span>.
      </p>
    </div>

    <!-- Bottom Footer Section -->
    <div class="footer">
      
      <!-- Signature Block -->
      <div class="signatory-block">
        <div class="signature-container">
          <!-- Render your brand's handwritten signature image -->
          <img src="signature.png" class="signature-img" alt="Signature of K. Rohini">
        </div>
        <div class="sign-line">
          <div class="sign-name">${data.authorized_signatory}</div>
          <div class="sign-designation">${data.signatory_designation}</div>
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
          <path id="sealTextPath-${data.id}" d="M60 18 A42 42 0 0 1 102 60 A42 42 0 0 1 60 102 A42 42 0 0 1 18 60 A42 42 0 0 1 60 18 Z" fill="none"/>
          <text fill="url(#sealGrad)" font-family="'Montserrat', sans-serif" font-size="6.8" font-weight="700" letter-spacing="0.8">
            <textPath href="#sealTextPath-${data.id}" startOffset="0%">• AADHIRA TRAINING & PLACEMENT SOLUTIONS • ATPS •</textPath>
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
          <a class="verif-link" href="https://yoursite.com/verify?cert=${data.certificate_no}" target="_blank">yoursite.com/verify?cert=${data.certificate_no}</a>
          <div class="verif-label" style="margin-top: 8px; font-size: 7px; color: #888;">Place: ${data.place}</div>
          <div class="verif-label" style="font-size: 7px; color: #888;">Date: 20 May 2026</div>
        </div>
        
        <div class="qrcode-container">
          <div id="qrcode-${data.id}" style="width: 60px; height: 60px;"></div>
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
  </div>

  <!-- Dynamic QR Code Script -->
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const qrcodeEl = document.getElementById("qrcode-${data.id}");
      if (qrcodeEl) {
        new QRCode(qrcodeEl, {
          text: "https://yoursite.com/verify?cert=${data.certificate_no}",
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
</html>
`;

// Helper to authenticate Google Drive Client
function getDriveClient() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error('Service account JSON file not found at: ' + SERVICE_ACCOUNT_PATH);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    // 1. Connect to PostgreSQL
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    // 2. Fetch the certificates
    const res = await client.query('SELECT * FROM certificates ORDER BY certificate_no ASC');
    console.log(`Retrieved ${res.rows.length} certificate records from database.`);

    // 3. Initialize Google Drive API client
    console.log('Initializing Google Drive client...');
    const drive = getDriveClient();

    // 4. Check folder permission & retrieve existing files in that folder
    console.log(`Checking files in Google Drive folder: ${DRIVE_FOLDER_ID}...`);
    let driveFiles = [];
    try {
      const folderRes = await drive.files.list({
        q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      driveFiles = folderRes.data.files || [];
      console.log(`Found ${driveFiles.length} files currently in Google Drive folder.`);
    } catch (driveErr) {
      console.error('\n⚠️ Google Drive Access Denied! ⚠️');
      console.error('Make sure you have shared your Google Drive folder:');
      console.error(`  ${DRIVE_FOLDER_ID}`);
      console.error('with the service account email:');
      console.error('  adhira@adhira-496911.iam.gserviceaccount.com');
      console.error('as an EDITOR/WRITER.\n');
      throw driveErr;
    }

    // 5. Generate and upload/update each certificate
    for (const row of res.rows) {
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

      const serial = row.certificate_no.split('/').pop();
      const filename = `cert_${serial}.html`;
      const localFilepath = path.join('c:\\Users\\USER\\OneDrive\\Desktop\\adhira', filename);

      console.log(`\n--- Processing ${filename} for ${row.student_name} ---`);
      
      // Generate updated centered HTML
      const htmlContent = certTemplate(formattedData);
      
      // Save locally
      fs.writeFileSync(localFilepath, htmlContent, 'utf8');
      console.log(`[Local] Saved ${filename} successfully.`);

      // Check if it already exists in the Google Drive folder
      const existingFile = driveFiles.find(f => f.name === filename);

      // Create a temporary stream or buffer to upload
      const readableStream = require('stream').Readable.from([htmlContent]);

      if (existingFile) {
        console.log(`[Google Drive] File "${filename}" already exists with ID: ${existingFile.id}. Updating...`);
        await drive.files.update({
          fileId: existingFile.id,
          media: {
            mimeType: 'text/html',
            body: readableStream,
          },
          supportsAllDrives: true,
        });
        console.log(`[Google Drive] Updated "${filename}" successfully.`);
      } else {
        console.log(`[Google Drive] File "${filename}" does not exist. Uploading new file...`);
        const fileMetadata = {
          name: filename,
          parents: [DRIVE_FOLDER_ID],
        };
        const driveRes = await drive.files.create({
          requestBody: fileMetadata,
          media: {
            mimeType: 'text/html',
            body: readableStream,
          },
          fields: 'id',
          supportsAllDrives: true,
        });
        console.log(`[Google Drive] Uploaded "${filename}" successfully with ID: ${driveRes.data.id}`);
      }
    }

    console.log('\n✨ All static A4-Landscape HTML certificates have been regenerated locally & successfully uploaded to Google Drive! ✨');
  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    await client.end();
  }
}

main();

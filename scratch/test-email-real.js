require('dotenv').config();
const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY not found in .env');
    return;
  }

  const email = "vimalraj5207@gmail.com";
  const studentName = "Sample Student";

  try {
    console.log('Launching puppeteer to generate actual certificate PDF...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Load a sample certificate HTML
    const certPath = path.join(__dirname, '../cert_000001.html');
    await page.goto(`file://${certPath}`, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      printBackground: true,
      landscape: true,
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    console.log('PDF generated successfully.');

    // Convert PDF buffer to Base64
    const pdfBase64 = pdfBuffer.toString('base64');
    fs.writeFileSync(path.join(__dirname, 'test-cert.pdf'), pdfBuffer);
    console.log('Base64 length:', pdfBase64.length);

    console.log('Sending email via local endpoint...');
    const response = await axios.post('http://localhost:3000/api/send-email', {
      email: email,
      studentName: studentName,
      pdfBase64: pdfBase64,
      filename: "Certificate_Sample_Student.pdf",
      certificateNo: "TEST-001"
    });

    console.log('Successfully sent test email!', response.data);
  } catch (err) {
    console.error('Failed to send test email:');
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

run();

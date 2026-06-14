require('dotenv').config();
const axios = require('axios');

async function run() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY not found in .env');
    return;
  }

  // A minimal valid PDF in base64
  const pdfBase64 = "JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iaiAyIDAgb2JqIDw8L1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDE+PiBlbmRvYmogMyAwIG9iaiA8PC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNTk1IDg0Ml0gL0NvbnRlbnRzIDQgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMSA1IDAgUj4+Pj4+PiBlbmRvYmogNCAwIG9iaiA8PC9MZW5ndGggNjY+PiBzdHJlYW0KQlQKMDw8L0YxIDI0IFRmCjUwIDc1MCBUZAooQ2VydGlmaWNhdGUgb2YgSW50ZXJuc2hpcCAtIFNhbXBsZSkgVGoKRVQKZW5kc3RyZWFtIGVuZG9iaiA1IDAgb2JqIDw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4gZW5kb2JqIHhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDYyIDAwMDAwIG4gCjAwMDAwMDAxMTYgMDAwMDAgbiAKMDAwMDAwMDIyNiAwMDAwMCBuIAowMDAwMDAwMzQxIDAwMDAwIG4gCnRyYWlsZXIgPDwvU2l6ZSA2IC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQyOAolJUVPRg==";

  const email = "vimalraj5207@gmail.com";
  const studentName = "Sample Student";

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'Aadhira Solutions',
        email: process.env.BREVO_SENDER_EMAIL || 'vsgrpsemail@gmail.com'
      },
      to: [
        {
          email: email,
          name: studentName
        }
      ],
      subject: `Certificate of Internship - ${studentName}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Congratulations on successfully completing your internship!</p>
            <p>Please find attached your Certificate of Internship (No. TEST-001) issued by <strong>Aadhira Training and Placement Solutions (ATPS)</strong>.</p>
            <p>Warm regards,<br><strong>Aadhira Solutions Team</strong></p>
          </body>
        </html>
      `,
      attachment: [
        {
          content: pdfBase64,
          name: `Certificate_Sample_Student.pdf`
        }
      ]
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
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

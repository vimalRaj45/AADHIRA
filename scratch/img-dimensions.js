const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: 'File does not exist' };
  }
  const buffer = fs.readFileSync(filePath);
  // PNG header check
  if (buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Not a valid PNG file: ' + path.basename(filePath));
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

try {
  const logosPath = path.join(__dirname, '..', 'logos.png');
  const msmePath = path.join(__dirname, '..', 'ministry-of-micro-small-and-medium-enterprises-logo-png.png');
  const sigPath = path.join(__dirname, '..', 'signature.png');
  
  console.log('logos.png dimensions:', getPngDimensions(logosPath));
  console.log('MSME logo dimensions:', getPngDimensions(msmePath));
  console.log('signature.png dimensions:', getPngDimensions(sigPath));
} catch (err) {
  console.error('Error:', err.message);
}

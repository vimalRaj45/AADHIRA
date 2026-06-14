fetch('http://127.0.0.1:3000/api/last-cert-id')
  .then(res => res.json())
  .then(data => console.log('Last Cert Index:', data.lastIndex))
  .catch(err => console.error('Fetch error:', err));

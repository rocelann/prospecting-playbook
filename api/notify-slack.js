const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const payload = JSON.stringify(req.body);

    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'hooks.zapier.com',
        path: '/hooks/catch/8137009/4ugap6n/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });

      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Zapier notify error:', err);
    res.json({ success: false });
  }
};

const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { payment_token, amount, email, name, tracker, xray, market } = req.body;

    if (!payment_token || !amount) {
      return res.status(400).json({ error: 'Missing payment token or amount' });
    }

    // Build NMI API request
    const postData = [
      'security_key=' + encodeURIComponent(process.env.NMI_PRIVATE_KEY),
      'type=sale',
      'amount=' + (amount / 100).toFixed(2),
      'payment_token=' + encodeURIComponent(payment_token),
      'email=' + encodeURIComponent(email || ''),
      'first_name=' + encodeURIComponent((name || '').split(' ')[0]),
      'last_name=' + encodeURIComponent((name || '').split(' ').slice(1).join(' ')),
      'order_description=Sales Rep Prospecting Playbook',
      'merchant_defined_field_1=' + encodeURIComponent(name || ''),
      'merchant_defined_field_2=prospecting-playbook',
      'merchant_defined_field_3=' + (tracker ? 'yes' : 'no'),
      'merchant_defined_field_4=' + (xray ? 'yes' : 'no'),
      'merchant_defined_field_5=' + (market ? 'yes' : 'no')
    ].join('&');

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'secure.nmi.com',
        path: '/api/transact.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          const params = {};
          data.split('&').forEach(pair => {
            const [key, val] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(val || '');
          });
          resolve(params);
        });
      });

      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    if (result.response === '1') {
      // Success
      res.json({
        success: true,
        transaction_id: result.transactionid,
        response_text: result.responsetext
      });
    } else {
      // Declined or error
      res.status(400).json({
        success: false,
        error: result.responsetext || 'Payment declined'
      });
    }
  } catch (err) {
    console.error('NMI payment error:', err);
    res.status(500).json({ error: err.message });
  }
};

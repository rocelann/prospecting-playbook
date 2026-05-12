const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
const { amount, email, name, tracker, xray, market } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount, currency: 'usd', receipt_email: email,
      setup_future_usage: 'off_session',
      metadata: { name, product: 'prospecting-playbook',
        tracker: tracker ? 'yes' : 'no',
        commissions_xray: xray ? 'yes' : 'no',
        market_mind: market ? 'yes' : 'no' }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

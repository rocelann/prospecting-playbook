const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { amount, email, name, original_payment_id } = req.body;
    const originalPI = await stripe.paymentIntents.retrieve(original_payment_id);
    const paymentMethod = originalPI.payment_method;
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) { customer = existing.data[0]; }
    else { customer = await stripe.customers.create({ email, name }); }
    try { await stripe.paymentMethods.attach(paymentMethod,
      { customer: customer.id }); } catch (e) { }
    const paymentIntent = await stripe.paymentIntents.create({
      amount, currency: 'usd', customer: customer.id,
      payment_method: paymentMethod, off_session: true, confirm: true,
      receipt_email: email,
      metadata: { name, product: 'career-review-call' }
    });
    res.json({ success: true, payment_id: paymentIntent.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

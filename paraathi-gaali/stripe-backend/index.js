const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use the secret key from the .env file
const cors = require('cors');
const bodyParser = require('body-parser');  // Add body-parser
const nodemailer = require('nodemailer'); // Add nodemailer for sending emails

module.exports = async (req, res) => {
  // Enable CORS with the frontend URL
  const corsOptions = {
    origin: '*', // your frontend deployed URL
    methods: ['GET', 'POST'], // Allow these methods
    allowedHeaders: ['Content-Type'], // Allow these headers
  };

  // Apply CORS to all routes
  cors(corsOptions)(req, res, async () => {
    // Handle the Stripe checkout session creation
    if (req.method === 'POST' && req.url === '/api/create-checkout-session') { // Make sure route matches /api/*
      try {
        const { items } = req.body; // Get items from the frontend cart

        // Map the items to line items for Stripe
        const lineItems = items.map((item) => ({
          price_data: {
            currency: 'gbp',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // Price in smallest unit (pence for GBP)
          },
          quantity: 1,
        }));

        // Create a new Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: 'https://front-end-beta-tawny.vercel.app/success.html',
          cancel_url: 'https://front-end-beta-tawny.vercel.app/cancel.html',
        });

        // Send the session ID to the frontend
        res.status(200).json({ id: session.id });
      } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(500).json({ error: error.message });
      }
    }
    // Handle the Stripe webhook for payment success
    else if (req.method === 'POST' && req.url === '/api/webhook') {
      // Use raw body for Stripe webhook verification
      bodyParser.raw({ type: 'application/json' })(req, res, async () => {
        try {
          const sig = req.headers['stripe-signature'];
          const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
          const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

          if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;

            // Example: Handle successful payment (e.g., send email)
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
              },
            });

            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: paymentIntent.receipt_email,
              subject: 'Payment Successful - Order Confirmation',
              text: `Your payment of £${(paymentIntent.amount_received / 100).toFixed(2)} was successful! Thank you for your purchase.`,
            };

            await transporter.sendMail(mailOptions);
            console.log('Payment confirmation email sent.');
          }

          res.status(200).json({ received: true });
        } catch (error) {
          console.error('Webhook signature verification failed:', error.message);
          res.status(400).json({ error: 'Webhook signature verification failed' });
        }
      });
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  });
};

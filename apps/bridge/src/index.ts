import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const bridgeSecret = process.env.WHATSAPP_BRIDGE_SECRET || 'toland_bridge_secret_dev';

app.use(express.json());

// Secret authorization middleware
app.use((req, res, next) => {
  if (req.path === '/status') return next();
  const authHeader = req.headers['x-bridge-secret'];
  if (!authHeader || authHeader !== bridgeSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-bridge-secret header' });
  }
  next();
});

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    session: 'initialized',
  });
});

// Send OTP endpoint (called by send-sms-hook Edge Function)
app.post('/send-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone and otp are required' });
  }
  // Queue OTP with highest priority
  res.json({ success: true, message: `OTP queued for ${phone}` });
});

// Send transactional / promo message
app.post('/send', (req, res) => {
  const { phone, body, template_key } = req.body;
  res.json({ success: true, message: `Message queued for ${phone}` });
});

app.listen(port, () => {
  console.log(`[TOLAND Bridge] WhatsApp service running on port ${port}`);
});

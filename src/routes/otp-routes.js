const express = require('express');
const twilio = require('twilio');
const otpGenerator = require('otp-generator');

const router = express.Router();

let otpStore = {};

router.post('/generate', (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
  otpStore[phoneNumber] = otp;

  const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  client.messages.create({
    body: `Your OTP is ${otp}`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER
  })
  .then((message) => {
    console.log(message.sid);
    res.json({ message: 'OTP sent successfully' });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP' });
  });
});

router.post('/verify', (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = req.body.otp;

  if (otp === otpStore[phoneNumber]) {
    res.json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});

router.post('/resend', (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const otp = otpStore[phoneNumber];

  const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  client.messages.create({
    body: `Your OTP is ${otp}`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER
  })
  .then((message) => {
    console.log(message.sid);
    res.json({ message: 'OTP resent successfully' });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ message: 'Error resending OTP' });
  });
});

module.exports = router;

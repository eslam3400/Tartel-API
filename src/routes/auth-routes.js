const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const authController = require('../controllers/auth-controller');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ msg: 'Protected route', user: req.user });
});

module.exports = router;

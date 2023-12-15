const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authController.auth);
router.get('/invitation-by/:firebaseId', authMiddleware, authController.invitation);

module.exports = router;

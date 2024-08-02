const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, supportController.create);
router.get('/status', authMiddleware, supportController.status);

module.exports = router;

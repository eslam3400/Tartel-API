const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/', authMiddleware, statisticsController.overview);

module.exports = router;

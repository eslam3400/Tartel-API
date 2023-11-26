const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/', authMiddleware, statisticsController.appOverview);
router.get('/user', authMiddleware, statisticsController.userOverview);

module.exports = router;

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/', authMiddleware, statisticsController.appOverview);
router.get('/user', authMiddleware, statisticsController.userOverview);
router.get('/user/telawat', authMiddleware, statisticsController.getTelawat);
router.get('/user/progress', authMiddleware, statisticsController.progress);

module.exports = router;

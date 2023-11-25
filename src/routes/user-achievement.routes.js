const express = require('express');
const router = express.Router();
const userAchievementController = require('../controllers/user-achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, userAchievementController.get);

module.exports = router;

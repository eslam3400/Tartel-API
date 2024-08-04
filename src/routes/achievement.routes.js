const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', achievementController.create);
router.get('/', authMiddleware, achievementController.getAll);
router.get('/mine', authMiddleware, achievementController.getMine);

module.exports = router;

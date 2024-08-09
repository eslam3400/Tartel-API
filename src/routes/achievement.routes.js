const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');

router.post('/', achievementController.create);
router.get('/', achievementController.getAll);
router.get('/mine', achievementController.getMine);

module.exports = router;

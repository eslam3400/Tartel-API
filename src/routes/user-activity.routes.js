const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/user-activity.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, userActivityController.create);

module.exports = router;

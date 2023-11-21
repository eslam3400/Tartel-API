const express = require('express');
const router = express.Router();
const taskController = require('../controllers/tasks.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, taskController.getUserTasks);
router.post('/', authMiddleware, taskController.createUserTasks);
router.get('/chapter-tasks', taskController.getChapterTasks);

module.exports = router;

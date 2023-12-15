const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/', authMiddleware, statisticsController.appOverview);
router.get('/user', authMiddleware, statisticsController.userOverview);
router.get('/user/activities-tracking', authMiddleware, statisticsController.activitiesTracking);
router.get('/user/pages-tracking', authMiddleware, statisticsController.pagesTracking);
router.get('/user/pledges-tracking', authMiddleware, statisticsController.pledgesTracking);
router.get('/user/activities/:filter', authMiddleware, statisticsController.getActivities);

module.exports = router;

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');

router.get('/', statisticsController.appOverview);
router.get('/v2', statisticsController.appOverviewV2);
router.get('/activities', statisticsController.getActivitiesScore);
router.get('/user', statisticsController.userOverview);
router.get('/user/activities-tracking', statisticsController.activitiesTracking);
router.get('/user/pages-tracking', statisticsController.pagesTracking);
router.get('/user/pledges-tracking', statisticsController.pledgesTracking);
router.get('/user/progress', statisticsController.progress);
router.get('/user/activities', statisticsController.getActivities);
router.get('/user/owned-users', statisticsController.getUserOwnedUsers);

module.exports = router;

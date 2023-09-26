const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');

router.get('/', statisticsController.overview);

module.exports = router;

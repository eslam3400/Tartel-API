const express = require('express');
const router = express.Router();
const optionController = require('../controllers/option.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, optionController.create);
// router.get('/', authMiddleware, optionController.getAll);
router.get('/:key', authMiddleware, optionController.getByKey);
// router.put('/:id', authMiddleware, optionController.update);
// router.delete('/:id', authMiddleware, optionController.remove);

module.exports = router;
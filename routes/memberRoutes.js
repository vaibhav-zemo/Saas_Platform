const express = require('express');
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, memberController.create);
router.delete('/', authMiddleware, memberController.remove);

module.exports = router;

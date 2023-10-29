const express = require('express');
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, communityController.create);
router.get('/', communityController.getAll);
router.get('/:id/members', communityController.getAllMembers);
router.get('/me/owner', authMiddleware, communityController.getMyOwnedCommunities);
router.get('/me/member', authMiddleware, communityController.getMyCommunities);


module.exports = router;

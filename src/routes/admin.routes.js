const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));

router.get('/overview', admin.overview);
router.get('/analytics', admin.analytics);
router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.removeUser);
router.get('/meetings', admin.listMeetings);
router.patch('/meetings/:meetingId', admin.updateMeeting);
router.delete('/meetings/:meetingId', admin.removeMeeting);
router.get('/attendance', admin.attendance);
router.get('/settings', admin.getSettings);
router.patch('/settings', admin.updateSettings);

module.exports = router;

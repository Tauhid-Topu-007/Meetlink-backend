const User = require('../models/User');
const Meeting = require('../models/Meeting');
const SystemSetting = require('../models/SystemSetting');

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  allowRegistrations: true,
  allowNewMeetings: true,
  maxMeetingParticipants: 0,
  announcement: '',
};

const publicUser = (u) => ({
  id: u._id,
  username: u.username,
  email: u.email,
  displayName: u.displayName,
  avatar: u.avatar,
  role: u.role,
  isActive: u.isActive,
  isVerified: u.isVerified,
  onlineStatus: u.onlineStatus,
  lastLogin: u.lastLogin,
  lastSeen: u.lastSeen,
  totalMeetings: u.totalMeetings,
  totalMeetingTime: u.totalMeetingTime,
  createdAt: u.createdAt,
});

const getSettings = async () => {
  const rows = await SystemSetting.find({ key: { $in: Object.keys(DEFAULT_SETTINGS) } }).lean();
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => { settings[row.key] = row.value; });
  return settings;
};

exports.overview = async (req, res, next) => {
  try {
    const [users, activeUsers, meetings, liveMeetings, attendance] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Meeting.countDocuments(),
      Meeting.countDocuments({ status: 'live' }),
      Meeting.aggregate([
        { $unwind: { path: '$participants', preserveNullAndEmptyArrays: false } },
        { $count: 'total' },
      ]),
    ]);

    const [meetingByStatus, meetingByType, usersByRole, recentMeetings] = await Promise.all([
      Meeting.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Meeting.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Meeting.find().populate('hostId', 'displayName email').sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const duration = await Meeting.aggregate([
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' }, averageMinutes: { $avg: '$durationMinutes' } } },
    ]);

    res.json({
      success: true,
      stats: {
        users,
        activeUsers,
        meetings,
        liveMeetings,
        attendanceRecords: attendance[0]?.total || 0,
        totalMeetingMinutes: duration[0]?.totalMinutes || 0,
        averageMeetingMinutes: Math.round(duration[0]?.averageMinutes || 0),
      },
      charts: {
        meetingByStatus,
        meetingByType,
        usersByRole,
      },
      recentMeetings,
      settings: await getSettings(),
    });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim();
    const filter = {};
    if (req.query.role && ['user', 'admin', 'moderator'].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users: items.map(publicUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+tokenVersion');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (String(user._id) === String(req.user._id) && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin role.' });
    }

    if (req.body.role !== undefined) {
      if (!['user', 'admin', 'moderator'].includes(req.body.role)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }
      user.role = req.body.role;
    }
    if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
    if (typeof req.body.isVerified === 'boolean') user.isVerified = req.body.isVerified;
    await user.save();

    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.removeUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account from admin.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

exports.listMeetings = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: String(req.query.search), $options: 'i' } },
        { meetingId: { $regex: String(req.query.search), $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Meeting.find(filter)
        .populate('hostId', 'displayName email username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Meeting.countDocuments(filter),
    ]);

    res.json({ success: true, meetings: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: String(req.params.meetingId).toUpperCase() });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (req.body.status && ['scheduled', 'live', 'ended', 'cancelled'].includes(req.body.status)) {
      meeting.status = req.body.status;
      if (req.body.status === 'ended' && !meeting.actualEnd) meeting.actualEnd = new Date();
      if (req.body.status === 'live' && !meeting.actualStart) meeting.actualStart = new Date();
    }
    if (typeof req.body.locked === 'boolean') meeting.locked = req.body.locked;
    if (req.body.title !== undefined) meeting.title = String(req.body.title).trim().slice(0, 200);
    await meeting.save();

    res.json({ success: true, meeting });
  } catch (err) {
    next(err);
  }
};

exports.removeMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ meetingId: String(req.params.meetingId).toUpperCase() });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (err) {
    next(err);
  }
};

exports.attendance = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .select('meetingId title status hostId participants durationMinutes createdAt actualStart actualEnd')
        .populate('hostId', 'displayName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Meeting.countDocuments(filter),
    ]);

    const rows = meetings.map((m) => {
      const participants = m.participants || [];
      const totalMinutes = participants.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);
      return {
        meetingId: m.meetingId,
        title: m.title,
        status: m.status,
        host: m.hostId,
        participantCount: participants.length,
        activeParticipants: participants.filter((p) => p.isActive).length,
        totalParticipantMinutes: totalMinutes,
        startedAt: m.actualStart || m.createdAt,
        endedAt: m.actualEnd || null,
      };
    });

    res.json({ success: true, attendance: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    res.json({ success: true, settings: await getSettings() });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.maxMeetingParticipants !== undefined) {
      const n = Number(updates.maxMeetingParticipants);
      if (!Number.isInteger(n) || n < 0) {
        return res.status(400).json({ success: false, message: 'maxMeetingParticipants must be a non-negative integer.' });
      }
      updates.maxMeetingParticipants = n;
    }

    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { $set: { value } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, settings: await getSettings() });
  } catch (err) {
    next(err);
  }
};

exports.analytics = async (req, res, next) => {
  try {
    const [dailyMeetings, dailyUsers, dailyMinutes, topHosts] = await Promise.all([
      Meeting.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Meeting.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, minutes: { $sum: '$durationMinutes' } } },
        { $sort: { _id: 1 } },
      ]),
      Meeting.aggregate([
        { $group: { _id: '$hostId', meetings: { $sum: 1 }, minutes: { $sum: '$durationMinutes' } } },
        { $sort: { meetings: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'host' } },
        { $unwind: { path: '$host', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, meetings: 1, minutes: 1, name: '$host.displayName', email: '$host.email' } },
      ]),
    ]);

    res.json({ success: true, rangeDays: 30, series: { dailyMeetings, dailyUsers, dailyMinutes }, topHosts });
  } catch (err) {
    next(err);
  }
};

const SystemSetting = require('../models/SystemSetting');

const getSetting = async (key, fallback) => {
  const setting = await SystemSetting.findOne({ key }).lean();
  return setting ? setting.value : fallback;
};

const maintenanceGuard = async (req, res, next) => {
  try {
    if (req.path === '/auth/login' || req.path === '/auth/me' || req.path.startsWith('/admin')) {
      return next();
    }

    const maintenanceMode = await getSetting('maintenanceMode', false);
    if (maintenanceMode && req.user?.role !== 'admin') {
      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE_MODE',
        message: 'MeetLink is temporarily in maintenance mode. Please try again later.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { getSetting, maintenanceGuard };

import Notification from '../models/notificationModel.js';

// Admin: Create new notification
export const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      isActive,
      scheduledDate,
      priority
    } = req.body;

    // Handle admin user (dummy user ID)
    const createdBy = req.user.userId === 'admin-user-id' ? null : req.user.userId;

    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      isActive: isActive !== undefined ? isActive : true,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      priority: priority || 'normal',
      createdBy: createdBy
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// Admin: Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Admin: Get single notification
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('sentTo.userId', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
};

// Admin: Update notification
export const updateNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      isActive,
      scheduledDate,
      priority
    } = req.body;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const updateData = {
      title,
      message,
      type,
      targetAudience,
      isActive: isActive !== undefined ? isActive : notification.isActive,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      priority
    };

    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};

// Admin: Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Admin: Toggle notification status
export const toggleNotificationStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isActive = !notification.isActive;
    await notification.save();

    res.status(200).json({
      success: true,
      message: `Notification ${notification.isActive ? 'activated' : 'deactivated'} successfully`,
      data: notification
    });
  } catch (error) {
    console.error('Error toggling notification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling notification status',
      error: error.message
    });
  }
};

// Admin: Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const activeNotifications = await Notification.countDocuments({ isActive: true });
    const scheduledNotifications = await Notification.countDocuments({ 
      scheduledDate: { $gt: new Date() } 
    });

    const notificationsByType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const notificationsByPriority = await Notification.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        activeNotifications,
        scheduledNotifications,
        notificationsByType,
        notificationsByPriority
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification statistics',
      error: error.message
    });
  }
}; 
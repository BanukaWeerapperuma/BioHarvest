import Promo from '../models/promoModel.js';
import User from '../models/userModel.js';

// Admin: Create new promo code
export const createPromo = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      maxUsage,
      maxUsagePerUser,
      startDate,
      endDate,
      sendNotification,
      notificationMessage
    } = req.body;

    // Check if promo code already exists
    const existingPromo = await Promo.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }

    // Handle admin user (dummy user ID)
    const createdBy = req.user.userId === 'admin-user-id' ? null : req.user.userId;

    const promo = new Promo({
      code: code.toUpperCase(),
      name,
      description,
      discountType: discountType || 'fixed',
      discountValue: parseFloat(discountValue),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minimumOrderAmount: parseFloat(minimumOrderAmount) || 0,
      maxUsage: parseInt(maxUsage) || -1,
      maxUsagePerUser: parseInt(maxUsagePerUser) || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      sendNotification: sendNotification || false,
      notificationMessage,
      createdBy: createdBy
    });

    await promo.save();

    // Send notification to users if enabled
    if (sendNotification && notificationMessage) {
      // This would integrate with your notification system
      console.log('Notification sent to users about new promo code:', code);
    }

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: promo
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating promo code',
      error: error.message
    });
  }
};

// Admin: Get all promo codes
export const getAllPromos = async (req, res) => {
  try {
    const promos = await Promo.find()
      .sort({ createdAt: -1 });

    // Handle null createdBy values
    const promosWithUser = promos.map(promo => {
      const promoObj = promo.toObject();
      if (!promoObj.createdBy) {
        promoObj.createdBy = { name: 'Admin', email: 'admin@bioharvest.com' };
      }
      return promoObj;
    });

    res.status(200).json({
      success: true,
      data: promosWithUser
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promo codes',
      error: error.message
    });
  }
};

// Admin: Get single promo code
export const getPromoById = async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('usedBy.userId', 'name email');

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.status(200).json({
      success: true,
      data: promo
    });
  } catch (error) {
    console.error('Error fetching promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promo code',
      error: error.message
    });
  }
};

// Admin: Update promo code
export const updatePromo = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      maxUsage,
      maxUsagePerUser,
      startDate,
      endDate,
      isActive,
      sendNotification,
      notificationMessage
    } = req.body;

    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    const updateData = {
      name,
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minimumOrderAmount: parseFloat(minimumOrderAmount) || 0,
      maxUsage: parseInt(maxUsage) || -1,
      maxUsagePerUser: parseInt(maxUsagePerUser) || 1,
      startDate: startDate ? new Date(startDate) : promo.startDate,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive !== undefined ? isActive : promo.isActive,
      sendNotification: sendNotification || false,
      notificationMessage
    };

    const updatedPromo = await Promo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Promo code updated successfully',
      data: updatedPromo
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating promo code',
      error: error.message
    });
  }
};

// Admin: Delete promo code
export const deletePromo = async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    await Promo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting promo code',
      error: error.message
    });
  }
};

// Customer: Validate promo code
export const validatePromo = async (req, res) => {
  try {
    const { promoCode, cartTotal } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to use promo codes'
      });
    }

    const userId = req.user.userId;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }

    console.log('Validating promo code:', promoCode, 'for user:', userId, 'cart total:', cartTotal);

    const promo = await Promo.findOne({ 
      code: promoCode.toUpperCase(),
      isActive: true
    });

    if (!promo) {
      console.log('Promo code not found or inactive:', promoCode);
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    console.log('Found promo:', promo.code, 'isExpired:', promo.isExpired, 'isValid:', promo.isValid);

    // Check if promo is expired
    if (promo.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired'
      });
    }

    // Check if promo usage limit reached
    if (promo.maxUsage > 0 && promo.currentUsage >= promo.maxUsage) {
      return res.status(400).json({
        success: false,
        message: 'Promo code usage limit reached'
      });
    }

    // Check if user can use this promo (skip for admin users)
    if (userId !== 'admin-user-id' && !promo.canUserUse(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this promo code maximum times'
      });
    }

    // Check minimum order amount
    if (cartTotal < promo.minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${promo.minimumOrderAmount} required`
      });
    }

    // Calculate discount based on actual cart total
    const orderAmount = parseFloat(cartTotal) || 0;
    const discount = promo.calculateDiscount(orderAmount);

    console.log('Promo validation successful. Discount:', discount);

    res.status(200).json({
      success: true,
      message: 'Promo code is valid',
      discount: discount,
      promoId: promo._id,
      code: promo.code,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumOrderAmount: promo.minimumOrderAmount
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating promo code',
      error: error.message
    });
  }
};

// Admin: Get promo usage statistics
export const getPromoStats = async (req, res) => {
  try {
    const totalPromos = await Promo.countDocuments();
    const activePromos = await Promo.countDocuments({ isActive: true });
    const expiredPromos = await Promo.countDocuments({ 
      endDate: { $lt: new Date() } 
    });

    const totalUsage = await Promo.aggregate([
      { $group: { _id: null, totalUsage: { $sum: '$currentUsage' } } }
    ]);

    // Get top used promo codes
    let topPromos = await Promo.find()
      .sort({ currentUsage: -1 })
      .limit(5)
      .select('code name currentUsage');

    // If no promo codes have been used, show the most recent ones
    if (topPromos.length === 0 || topPromos.every(promo => promo.currentUsage === 0)) {
      topPromos = await Promo.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('code name currentUsage');
    }

    res.status(200).json({
      success: true,
      data: {
        totalPromos,
        activePromos,
        expiredPromos,
        totalUsage: totalUsage[0]?.totalUsage || 0,
        topPromos
      }
    });
  } catch (error) {
    console.error('Error fetching promo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promo statistics',
      error: error.message
    });
  }
}; 
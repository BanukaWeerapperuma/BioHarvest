import userModel from "../models/userModel.js";
import blogModel from "../models/blogModel.js";
import orderModel from "../models/orderModel.js";

// Get analytics dashboard data
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { month, day } = req.query;
    
    // Calculate date ranges
    const now = new Date();
    let startDate;
    let endDate;
    
    if (day) {
      const selectedDay = new Date(day);
      startDate = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
      endDate = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() + 1);
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 1); // first day of next month
    } else {
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all data in parallel with optimized queries
    const [totalBlogViews, totalCustomers, totalNewUsers, dailyStats, dayStats, orderSummary] = await Promise.all([
      // Get total blog views (sum of all blog view counts)
      blogModel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: { $ifNull: ["$views", 0] } }
          }
        }
      ]),

      // Get total customers (users who are not admins)
      userModel.countDocuments({ role: { $ne: 'admin' } }),

      // Get new users in the selected period
      userModel.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: startDate, $lt: endDate }
      }),

      // Get daily stats for the selected month (only if month view)
      month ? generateDailyStats(startDate, endDate) : Promise.resolve([]),

      // Get hourly stats for the selected day (only if day view)
      day ? generateHourlyStats(startDate, endDate) : Promise.resolve({}),

      // Order summary within selected period
      orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: { $ifNull: ["$amount", 0] } },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0]
              }
            },
            processingOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Food Processing"] }, 1, 0]
              }
            },
            outForDeliveryOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Out for delivery"] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const ordersSummary = orderSummary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredOrders: 0,
      processingOrders: 0,
      outForDeliveryOrders: 0
    };

    res.json({
      success: true,
      data: {
        totalBlogViews: totalBlogViews[0]?.totalViews || 0,
        totalCustomers,
        totalNewUsers,
        dailyStats: month ? dailyStats : [],
        dayStats: day ? dayStats : {},
        orderSummary: ordersSummary
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
};

// Generate hourly statistics for a specific day
const generateHourlyStats = async (startDate, endDate) => {
  try {
    const [userStats, orderStats, totalBlogViews] = await Promise.all([
      userModel.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" }
            },
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ["$lastLogin", null] },
                    { $gte: ["$lastLogin", startDate] },
                    { $lt: ["$lastLogin", endDate] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" }
            },
            orders: { $sum: 1 },
            revenue: { $sum: { $ifNull: ["$amount", 0] } },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0]
              }
            }
          }
        }
      ]),
      blogModel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: { $ifNull: ["$views", 0] } }
          }
        }
      ])
    ]);

    const totalViews = totalBlogViews[0]?.totalViews || 0;
    const averageHourlyViews = Math.floor(totalViews / (365 * 24));

    const orderMap = new Map();
    orderStats.forEach(stat => {
      orderMap.set(stat._id.hour, {
        orders: stat.orders,
        revenue: stat.revenue,
        deliveredOrders: stat.deliveredOrders
      });
    });

    // Generate stats for each hour (0-23)
    const stats = {};
    for (let hour = 0; hour < 24; hour++) {
      // Find stats for this hour
      const hourStats = userStats.find(stat => stat._id.hour === hour);

      const orderData = orderMap.get(hour) || {};
      stats[hour.toString().padStart(2, '0')] = {
        newUsers: hourStats ? hourStats.newUsers : 0,
        activeUsers: hourStats ? hourStats.activeUsers : 0,
        blogViews: averageHourlyViews,
        orders: orderData.orders || 0,
        deliveredOrders: orderData.deliveredOrders || 0,
        revenue: orderData.revenue || 0
      };
    }

    return stats;
  } catch (error) {
    console.error('Error generating hourly stats:', error);
    return {};
  }
};

// Generate daily statistics for a specific month
const generateDailyStats = async (startDate, endDate) => {
  try {
    const [userStats, orderStats, totalBlogViews] = await Promise.all([
      userModel.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ["$lastLogin", null] },
                    { $gte: ["$lastLogin", startDate] },
                    { $lt: ["$lastLogin", endDate] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            totalOrders: { $sum: 1 },
            revenue: { $sum: { $ifNull: ["$amount", 0] } },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0]
              }
            },
            processingOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Food Processing"] }, 1, 0]
              }
            },
            outForDeliveryOrders: {
              $sum: {
                $cond: [{ $eq: ["$status", "Out for delivery"] }, 1, 0]
              }
            }
          }
        }
      ]),
      blogModel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: { $ifNull: ["$views", 0] } }
          }
        }
      ])
    ]);

    const totalViews = totalBlogViews[0]?.totalViews || 0;
    const averageDailyViews = Math.floor(totalViews / 365);

    const userMap = new Map();
    userStats.forEach(stat => {
      const key = `${stat._id.year}-${stat._id.month}-${stat._id.day}`;
      userMap.set(key, {
        newUsers: stat.newUsers,
        activeUsers: stat.activeUsers
      });
    });

    const orderMap = new Map();
    orderStats.forEach(stat => {
      const key = `${stat._id.year}-${stat._id.month}-${stat._id.day}`;
      orderMap.set(key, {
        totalOrders: stat.totalOrders,
        revenue: stat.revenue,
        deliveredOrders: stat.deliveredOrders,
        processingOrders: stat.processingOrders,
        outForDeliveryOrders: stat.outForDeliveryOrders
      });
    });

    const stats = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
      const userData = userMap.get(key) || {};
      const orderData = orderMap.get(key) || {};

      stats.push({
        date: currentDate.toISOString(),
        newUsers: userData.newUsers || 0,
        activeUsers: userData.activeUsers || 0,
        blogViews: averageDailyViews,
        orders: orderData.totalOrders || 0,
        deliveredOrders: orderData.deliveredOrders || 0,
        processingOrders: orderData.processingOrders || 0,
        outForDeliveryOrders: orderData.outForDeliveryOrders || 0,
        revenue: orderData.revenue || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return stats;
  } catch (error) {
    console.error('Error generating daily stats:', error);
    return [];
  }
};

// Optimized monthly stats generation using aggregation
const generateOptimizedMonthlyStats = async (startDate, endDate) => {
  try {
    // Get user registration stats by month
    const userStats = await userModel.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$lastLogin", null] },
                  { $gte: ["$lastLogin", startDate] },
                  { $lte: ["$lastLogin", endDate] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Get blog views stats by month (simplified - using total views)
    const totalBlogViews = await blogModel.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ["$views", 0] } }
        }
      }
    ]);

    const totalViews = totalBlogViews[0]?.totalViews || 0;
    const monthsDiff = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    const averageMonthlyViews = Math.floor(totalViews / monthsDiff);

    // Format the stats to match expected structure
    const stats = userStats.map(stat => {
      const date = new Date(stat._id.year, stat._id.month - 1, 1);
      return {
        date: date.toISOString(),
        newUsers: stat.newUsers,
        activeUsers: stat.activeUsers,
        blogViews: averageMonthlyViews
      };
    });

    // If no stats found, create default monthly entry
    if (stats.length === 0) {
      const currentMonth = new Date();
      stats.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString(),
        newUsers: 0,
        activeUsers: 0,
        blogViews: averageMonthlyViews
      });
    }

    return stats;
  } catch (error) {
    console.error('Error generating monthly stats:', error);
    return [];
  }
};

// Get blog analytics
export const getBlogAnalytics = async (req, res) => {
  try {
    const blogs = await blogModel.find({}).sort({ views: -1 }).limit(10);
    
    const blogStats = blogs.map(blog => ({
      title: blog.title,
      views: blog.views || 0,
      createdAt: blog.createdAt
    }));

    res.json({
      success: true,
      data: blogStats
    });
  } catch (error) {
    console.error('Error fetching blog analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog analytics'
    });
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user registration trends with optimized aggregation
    const [userTrends, totalUsers, newUsers] = await Promise.all([
      userModel.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
        }
      ]),

      userModel.countDocuments({ role: { $ne: 'admin' } }),

      userModel.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: startDate }
      })
    ]);

    res.json({
      success: true,
      data: {
        userTrends,
        totalUsers,
        newUsers
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics'
    });
  }
}; 
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import courseModel from "../models/courseModel.js";
import Enrollment from "../models/enrollmentModel.js";
import foodModel from "../models/foodModel.js";
import Stripe from "stripe";
import mongoose from "mongoose";

// Initialize Stripe with proper error handling
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } else {
    console.log('Warning: STRIPE_SECRET_KEY not found in environment variables');
    stripe = null;
  }
} catch (error) {
  console.log('Error initializing Stripe:', error);
  stripe = null;
}

// placing user order for frontend
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5174";
  try {
    const { promoCode, promoId, discount } = req.body;
    
    // Calculate the final amount after discount
    const subtotal = req.body.subtotal || req.body.amount;
    const deliveryFee = req.body.deliveryFee || 0;
    const discountAmount = discount || 0;
    const finalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);
    
    console.log('Order calculation:', {
      subtotal,
      deliveryFee,
      discountAmount,
      finalAmount
    });
    
    // Validate final amount
    if (finalAmount <= 0) {
      console.log('Final amount is 0 or negative, cannot process payment');
      return res.json({ 
        success: false, 
        message: "Discount cannot exceed order total. Please adjust your promo code." 
      });
    }
    
    // Validate discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      console.log('Discount exceeds subtotal:', { discountAmount, subtotal });
      return res.json({ 
        success: false, 
        message: "Discount cannot exceed order subtotal. Please adjust your promo code." 
      });
    }
    
    const newOrder = new orderModel({
      userId: req.user.userId,
      items: req.body.items,
      amount: finalAmount, // Use the discounted final amount
      address: req.body.address,
      promoCode: promoCode || null,
      promoId: promoId || null,
      discount: discountAmount,
      subtotal: subtotal,
      deliveryFee: deliveryFee
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.user.userId, { cartData: {} });

    // Record promo code usage if applicable
    if (promoId && req.user.userId !== 'admin-user-id') {
      try {
        const Promo = (await import('../models/promoModel.js')).default;
        const promo = await Promo.findById(promoId);
        if (promo) {
          await promo.recordUsage(req.user.userId);
          console.log('Promo code usage recorded:', promoCode);
        }
      } catch (error) {
        console.error('Error recording promo code usage:', error);
      }
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.log('Stripe not configured, cannot process payment');
      return res.json({ success: false, message: "Payment gateway not configured" });
    }

    // Create line items for Stripe
    const line_items = [];
    
    // Create a single line item for the final amount
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Order Total${promoCode ? ` (${promoCode} applied)` : ''}`,
          description: `${req.body.items.length} item(s)${deliveryFee > 0 ? ' + Delivery' : ''}${discountAmount > 0 ? ` - $${discountAmount.toFixed(2)} discount` : ''}`
        },
        unit_amount: Math.round(finalAmount * 100),
      },
      quantity: 1,
    });

    console.log('Stripe line items:', line_items);
    console.log('Final amount to charge:', finalAmount);

    // Create session with the properly calculated line items
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: line_items,
        mode: "payment",
        success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        // Add metadata to track promo code
        metadata: {
          promoCode: promoCode || '',
          discount: String(discountAmount || '0'),
          orderId: String(newOrder._id)
        }
      });
      
      console.log('Stripe session created successfully:', session.url);
      res.json({ success: true, session_url: session.url });
    } catch (stripeError) {
      console.error('Stripe session creation failed:', stripeError);
      console.error('Stripe error details:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      });
      
      // Delete the order since payment failed
      await orderModel.findByIdAndDelete(newOrder._id);
      
      res.json({ 
        success: false, 
        message: "Payment gateway error. Please try again.",
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.log('Error in placeOrder:', error);
    console.log('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.json({ success: false, message: "Error processing order", error: error.message });
  }
};

// placing course enrollment for frontend
const placeCourseOrder = async (req, res) => {
  const frontend_url = "http://localhost:5174";
  const admin_url = "http://localhost:5173"; // Admin panel URL (not used for redirect)
  try {
    console.log('Course enrollment request received:', req.body);
    const { courseId, courseName, amount, studentInfo } = req.body;
    
    if (!courseId || !courseName || !amount) {
      console.log('Missing required fields:', { courseId, courseName, amount });
      return res.json({ success: false, message: "Missing required fields" });
    }
    
    // Create course enrollment order
    const newOrder = new orderModel({
      userId: req.user.userId,
      items: [{
        name: courseName,
        price: amount,
        quantity: 1,
        type: 'course',
        courseId: courseId
      }],
      amount: amount,
      address: studentInfo,
      orderType: 'course'
    });
    await newOrder.save();
    console.log('Order created:', newOrder._id);

    // Check if Stripe is configured
    if (!stripe) {
      console.log('Stripe not configured, cannot process payment');
      return res.json({ success: false, message: "Payment gateway not configured" });
    }

    // Create Stripe session for course payment
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: courseName,
            description: "Course Enrollment"
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}&type=course`,
      cancel_url: `${frontend_url}/learn?payment=cancelled`,
    });

    console.log('Stripe session created:', session.url);
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log('Error in placeCourseOrder:', error);
    res.json({ success: false, message: "Error processing course enrollment" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success, type } = req.body;
  console.log('verifyOrder called with:', { orderId, success, type });
  
  try {
    if (success == "true") {
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      console.log('Order payment status updated to true');
      
      // If it's a course enrollment, create enrollment record and increment course count
      if (type === 'course') {
        console.log('Processing course enrollment...');
        console.log('Found order:', order);
        
        if (order && order.items && order.items[0] && order.items[0].courseId) {
          const courseId = order.items[0].courseId;
          const userId = order.userId;
          console.log('Course ID:', courseId, 'User ID:', userId);
          
          // Check if user is already enrolled
          const existingEnrollment = await Enrollment.findOne({
            student: userId,
            course: courseId
          });
          console.log('Existing enrollment:', existingEnrollment);

          if (!existingEnrollment) {
            // Create new enrollment
            const enrollment = new Enrollment({
              student: userId,
              course: courseId,
              payment: {
                amount: order.amount,
                status: 'completed'
              },
              status: 'enrolled'
            });
            await enrollment.save();
            console.log('Enrollment created successfully:', enrollment._id);
          } else {
            console.log('User already enrolled in this course');
          }

          // Increment course enrollment count
          await courseModel.findByIdAndUpdate(
            courseId,
            { $inc: { enrolledStudents: 1 } }
          );
          console.log('Course enrollment count incremented');
        } else {
          console.log('Order or course information not found');
        }
      } else {
        // If it's a food order, decrease available quantity for each item
        if (order.items && Array.isArray(order.items)) {
          console.log('Processing food order - decreasing available quantities...');
          for (const item of order.items) {
            if (item._id && item.quantity) {
              try {
                const foodItem = await foodModel.findById(item._id);
                if (foodItem && foodItem.availableQuantity !== null && foodItem.availableQuantity !== undefined) {
                  const oldQuantity = foodItem.availableQuantity;
                  const purchasedQuantity = item.quantity;
                  const newQuantity = Math.max(0, oldQuantity - purchasedQuantity);
                  
                  await foodModel.findByIdAndUpdate(item._id, { availableQuantity: newQuantity });
                  console.log(`✓ Updated ${foodItem.name}: Available ${oldQuantity} - Purchased ${purchasedQuantity} = Remaining ${newQuantity}`);
                } else {
                  console.log(`Item ${item._id} (${foodItem?.name || 'Unknown'}) has no availableQuantity set, skipping update`);
                }
              } catch (error) {
                console.error(`Error updating quantity for item ${item._id}:`, error);
              }
            }
          }
        }
      }
      
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log('Error in verifyOrder:', error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.user.userId }).lean();

    // Enrich each order's items with any review by this user for that food + reviewId
    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          // identify food id in item
          const foodId = item.food || item._id || item.id || null;
          if (!foodId) continue;
          try {
            const food = await foodModel.findById(foodId).lean();
            if (food && Array.isArray(food.reviews) && food.reviews.length) {
              const match = food.reviews.find(r => r.user && String(r.user) === String(req.user.userId) && r.orderId && String(r.orderId) === String(order._id));
              if (match) {
                item.review = {
                  reviewId: match._id,
                  rating: match.rating,
                  comment: match.comment
                };
              }
            }
          } catch (err) {
            console.error('Error enriching order item with review:', err);
          }
        }
      }
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({});
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Admin orders without authentication (for local admin system)
const adminListOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Admin update status without authentication (for local admin system)
const adminUpdateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.json({ success: false, message: "Order ID and status are required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    await orderModel.findByIdAndUpdate(orderId, { status: status });
    res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating order status" });
  }
};

// Admin remove order without authentication (for local admin system)
const adminRemoveOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    
    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Log the removal with reason for audit purposes
    console.log(`Order ${orderId} removed by admin. Reason: ${reason || 'No reason provided'}`);
    
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: true, message: "Order removed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing order" });
  }
};

// api for updating status
const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, {
        status: req.body.status,
      });
      res.json({ success: true, message: "Status Updated Successfully" });
    }else{
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Validate that orderId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.json({ success: false, message: "Invalid order ID format" });
    }
    
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Verify payment from URL parameters (for frontend redirect)
const verifyPaymentFromUrl = async (req, res) => {
  const { orderId, success } = req.query;
  console.log('verifyPaymentFromUrl called with:', { orderId, success });
  
  try {
    if (success === "true" && orderId) {
      const order = await orderModel.findById(orderId);
      console.log('Found order:', order);
      
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }
      
      if (!order.payment) {
        // Update payment status
        await orderModel.findByIdAndUpdate(orderId, { payment: true });
        console.log('Order payment status updated to true');
        
        // If it's a course enrollment, create enrollment record and increment course count
        if (order.orderType === 'course' && order.items && order.items[0] && order.items[0].courseId) {
          const courseId = order.items[0].courseId;
          const userId = order.userId;
          console.log('Course ID:', courseId, 'User ID:', userId);
          
          // Check if user is already enrolled
          const existingEnrollment = await Enrollment.findOne({
            student: userId,
            course: courseId
          });
          console.log('Existing enrollment:', existingEnrollment);

          if (!existingEnrollment) {
            // Create new enrollment
            const enrollment = new Enrollment({
              student: userId,
              course: courseId,
              payment: {
                amount: order.amount,
                status: 'completed'
              },
              status: 'enrolled'
            });
            await enrollment.save();
            console.log('Enrollment created successfully:', enrollment._id);
          } else {
            console.log('User already enrolled in this course');
          }

          // Increment course enrollment count
          await courseModel.findByIdAndUpdate(
            courseId,
            { $inc: { enrolledStudents: 1 } }
          );
          console.log('Course enrollment count incremented');
        } else {
          // If it's a food order, decrease available quantity for each item
          if (order.items && Array.isArray(order.items)) {
            console.log('Processing food order - decreasing available quantities...');
            for (const item of order.items) {
              if (item._id && item.quantity) {
                try {
                  const foodItem = await foodModel.findById(item._id);
                  if (foodItem && foodItem.availableQuantity !== null && foodItem.availableQuantity !== undefined) {
                    const oldQuantity = foodItem.availableQuantity;
                    const purchasedQuantity = item.quantity;
                    const newQuantity = Math.max(0, oldQuantity - purchasedQuantity);
                    
                    await foodModel.findByIdAndUpdate(item._id, { availableQuantity: newQuantity });
                    console.log(`✓ Updated ${foodItem.name}: Available ${oldQuantity} - Purchased ${purchasedQuantity} = Remaining ${newQuantity}`);
                  } else {
                    console.log(`Item ${item._id} (${foodItem?.name || 'Unknown'}) has no availableQuantity set, skipping update`);
                  }
                } catch (error) {
                  console.error(`Error updating quantity for item ${item._id}:`, error);
                }
              }
            }
          }
        }
      }
      
      res.json({ success: true, message: "Payment verified and enrollment processed" });
    } else {
      res.json({ success: false, message: "Invalid payment verification parameters" });
    }
  } catch (error) {
    console.log('Error in verifyPaymentFromUrl:', error);
    res.json({ success: false, message: "Error verifying payment" });
  }
};

export { placeOrder, placeCourseOrder, verifyOrder, userOrders, listOrders, adminListOrders, adminUpdateStatus, adminRemoveOrder, updateStatus, getOrderById, verifyPaymentFromUrl };

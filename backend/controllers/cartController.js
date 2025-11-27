import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

// add items to user cart
const addToCart = async (req, res) => {
  try {
    // Check if item has available quantity limit
    const foodItem = await foodModel.findById(req.body.itemId);
    if (foodItem && foodItem.availableQuantity !== null && foodItem.availableQuantity !== undefined) {
      let userData = await userModel.findById(req.user.userId);
      let cartData = await userData.cartData || {};
      const currentCartQuantity = cartData[req.body.itemId] || 0;
      const requestedQuantity = currentCartQuantity + 1;
      
      // Check if adding one more would exceed available quantity
      if (requestedQuantity > foodItem.availableQuantity) {
        return res.json({ 
          success: false, 
          message: `Only ${foodItem.availableQuantity} item(s) available. Cannot add more to cart.` 
        });
      }
    }
    
    let userData = await userModel.findById(req.user.userId);
    let cartData = await userData.cartData;
    if (!cartData) {
      cartData = {};
    }
    if (cartData[req.body.itemId]) {
      cartData[req.body.itemId] += 1;
    } else {
      cartData[req.body.itemId] = 1;
    }
    await userModel.findByIdAndUpdate(req.user.userId, { cartData });
    res.json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId]) {
      cartData[req.body.itemId] -= 1;
    }
    await userModel.findByIdAndUpdate(req.user.userId, { cartData });
    res.json({ success: true, message: "Removed from cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    res.json({ success: true, cartData: userData.cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart };

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  orderType: { type: String, default: "food" }, // "food" or "course"
  // Promo code fields
  promoCode: { type: String, default: null },
  promoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo', default: null },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 }
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;

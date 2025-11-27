import mongoose from "mongoose";

// Define SLS Certificate schema as a separate schema for better handling
const slsCertificateSchema = new mongoose.Schema({
  url: { type: String, default: null },
  filename: { type: String, default: null },
  public_id: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null }
}, { _id: false }); // _id: false prevents creating an _id for the nested object

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  isCustomerAdded: { type: Boolean, default: false },
  // Customer contact and inventory information
  phone: { type: String, default: null },
  address: { type: String, default: null },
  availableQuantity: { type: Number, default: null },
  slsCertificate: { type: slsCertificateSchema, default: () => ({
    url: null,
    filename: null,
    public_id: null,
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null
  })}
  ,
  // Reviews: store individual reviews and aggregate rating
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, default: '' },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order', default: null },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
});

const foodModel=mongoose.models.food || mongoose.model("food",foodSchema);

export default foodModel;

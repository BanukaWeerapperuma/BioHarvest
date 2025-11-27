import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import { uploadFile, deleteFromCloudinary } from "../utils/cloudinary.js";
import orderModel from "../models/orderModel.js";

// add food items

const addFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    if (userData && userData.role === "admin") {
      const { name, price, category, image } = req.body;
      const newFood = new foodModel({
        name,
        price,
        category,
        image,
        isCustomerAdded: false, // Explicitly mark as admin-added
      });
      await newFood.save();
      res.json({ success: true, message: "Food Added" });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Admin add food without authentication (for local admin system)
const adminAddFood = async (req, res) => {
  try {
    const imageFile = req.files?.image?.[0] || req.file;
    if (!imageFile) {
      return res.json({ success: false, message: "Please upload an image" });
    }
    
    // Upload product image to Cloudinary
    let imageUrl = '';
    try {
      const uploadResult = await uploadFile(imageFile, 'food/images', 'image');
      imageUrl = uploadResult.url;
    } catch (error) {
      console.log('Error uploading to Cloudinary:', error);
      return res.json({ success: false, message: "Error uploading image to cloud storage" });
    }
    
    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: imageUrl,
      isCustomerAdded: false, // Explicitly mark as admin-added
    });
    
    // Handle optional SLS certificate upload
    const certificateFile = req.files?.certificate?.[0];
    if (certificateFile) {
      try {
        const certUploadResult = await uploadFile(certificateFile, 'food/certificates', 'image');
        food.slsCertificate = {
          url: certUploadResult.url,
          filename: certificateFile.originalname,
          public_id: certUploadResult.public_id,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: null
        };
        food.markModified('slsCertificate');
      } catch (error) {
        console.log('Error uploading certificate to Cloudinary:', error);
        return res.json({ success: false, message: "Error uploading certificate to cloud storage" });
      }
    }
    
    await food.save();
    res.json({ 
      success: true, 
      message: certificateFile ? "Food and certificate added successfully" : "Food Added Successfully" 
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding food item" });
  }
};

// all foods (for frontend - shows both admin and customer items to all customers)
const listFood = async (req, res) => {
  try {
    // Return ALL foods - both admin and customer items are visible to all customers
    const foods = await foodModel.find({}).lean();
    
    console.log('Food list request - Total items found:', foods.length);
    console.log('Items being returned:');
    foods.forEach(food => {
      console.log(`  - ${food.name} (${food.category}) - isCustomerAdded: ${food.isCustomerAdded} - Added by: ${food.addedBy || 'admin'}`);
      // Log certificate info for debugging
      if (food.slsCertificate) {
        console.log(`    Certificate: ${food.slsCertificate.url ? 'URL exists' : 'URL missing'} - Verified: ${food.slsCertificate.isVerified}`);
      }
    });
    
    // Ensure slsCertificate data is properly included with URL
    const foodsWithCertificates = foods.map(food => {
      // If slsCertificate exists but URL is missing, try to reconstruct it from public_id
      if (food.slsCertificate) {
        // If URL is missing but public_id exists, construct Cloudinary URL
        if (!food.slsCertificate.url && food.slsCertificate.public_id) {
          // Reconstruct Cloudinary URL from public_id
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k';
          food.slsCertificate.url = `https://res.cloudinary.com/${cloudName}/image/upload/${food.slsCertificate.public_id}`;
          console.log(`Reconstructed URL for ${food.name}: ${food.slsCertificate.url}`);
        }
        // If URL exists but doesn't start with http, ensure it's a valid URL
        if (food.slsCertificate.url && !food.slsCertificate.url.startsWith('http')) {
          // If it's a relative path, we might need to construct full URL
          // But for Cloudinary, URLs should always be absolute
          console.warn(`Certificate URL for ${food.name} is not a valid HTTP URL: ${food.slsCertificate.url}`);
        }
      }
      return food;
    });
    
    res.json({ success: true, data: foodsWithCertificates });
  } catch (error) {
    console.error('Error fetching food list:', error);
    res.json({ success: false, message: "Error fetching food list" });
  }
};

// Admin list all foods (both admin and customer items)
const adminListAllFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).lean();
    
    // Ensure slsCertificate data is properly included with URL
    const foodsWithCertificates = foods.map(food => {
      // If slsCertificate exists but URL is missing, try to reconstruct it from public_id
      if (food.slsCertificate) {
        // If URL is missing but public_id exists, construct Cloudinary URL
        if (!food.slsCertificate.url && food.slsCertificate.public_id) {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k';
          food.slsCertificate.url = `https://res.cloudinary.com/${cloudName}/image/upload/${food.slsCertificate.public_id}`;
          console.log(`Admin List - Reconstructed URL for ${food.name}: ${food.slsCertificate.url}`);
        }
        console.log(`Admin List - ${food.name}: Certificate URL: ${food.slsCertificate.url || 'MISSING'}`);
      }
      return food;
    });
    
    res.json({ success: true, data: foodsWithCertificates });
  } catch (error) {
    console.error('Error fetching admin food list:', error);
    res.json({ success: false, message: "Error fetching food list" });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    let userData = await userModel.findById(req.user.userId);
    if (userData && userData.role === "admin") {
      // Find the food item first to delete images
      const food = await foodModel.findById(req.body.id);
      if (food) {
        // Delete the image file from Cloudinary if exists
        if (food.image && food.image.includes('cloudinary.com')) {
          try {
            await deleteFromCloudinary(food.image, 'image');
          } catch (error) {
            console.log("Error deleting image from Cloudinary:", error);
          }
        }
        
        // Delete SLS certificate from Cloudinary if exists
        if (food.slsCertificate) {
          try {
            // Use public_id if available for more reliable deletion
            if (food.slsCertificate.public_id) {
              await deleteFromCloudinary(food.slsCertificate.public_id, 'image');
            } else if (food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
              await deleteFromCloudinary(food.slsCertificate.url, 'image');
            }
          } catch (error) {
            console.log("Error deleting SLS certificate from Cloudinary:", error);
          }
        }
      }
      
      // Delete the food item from database
      await foodModel.findByIdAndDelete(req.body.id);
      res.json({ success: true, message: "Food Removed" });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Admin remove food without authentication (for local admin system)
const adminRemoveFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (food) {
      // Delete image from Cloudinary if exists
      if (food.image && food.image.includes('cloudinary.com')) {
        try {
          await deleteFromCloudinary(food.image, 'image');
        } catch (error) {
          console.log("Error deleting image from Cloudinary:", error);
        }
      }
      
      // Delete SLS certificate from Cloudinary if exists
      if (food.slsCertificate && food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
        try {
          await deleteFromCloudinary(food.slsCertificate.url, 'image');
        } catch (error) {
          console.log("Error deleting SLS certificate from Cloudinary:", error);
        }
      }
      
      await foodModel.findByIdAndDelete(req.body.id);
      res.json({ success: true, message: "Food Removed Successfully" });
    } else {
      res.json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing food" });
  }
};

// Customer add food item
const customerAddFood = async (req, res) => {
  try {
    // Handle both single file (old format) and multiple files (new format with certificate)
    const imageFile = req.files?.image?.[0] || req.file;
    
    if (!imageFile) {
      return res.json({ success: false, message: "Please upload an image" });
    }
    
    // Upload food image to Cloudinary
    let imageUrl = '';
    try {
      const uploadResult = await uploadFile(imageFile, 'food/images', 'image');
      imageUrl = uploadResult.url;
    } catch (error) {
      console.log('Error uploading image to Cloudinary:', error);
      return res.json({ success: false, message: "Error uploading image to cloud storage" });
    }
    
    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: imageUrl,
      addedBy: req.user.userId, // Track who added the item
      isCustomerAdded: true, // Flag to identify customer-added items
      phone: req.body.phone || null,
      address: req.body.address || null,
      availableQuantity: req.body.availableQuantity ? Number(req.body.availableQuantity) : null,
    });
    
    // Handle certificate upload if provided
    const certificateFile = req.files?.certificate?.[0];
    if (certificateFile) {
      try {
        // Upload certificate to Cloudinary
        const certUploadResult = await uploadFile(certificateFile, 'food/certificates', 'image');
        const certificateUrl = certUploadResult.url;
        const publicId = certUploadResult.public_id;
        
        // Validate certificate upload
        if (!certificateUrl || !certificateUrl.includes('cloudinary.com')) {
          console.error('Error: Certificate URL does not contain cloudinary.com');
          return res.json({ success: false, message: "Error: Certificate was not uploaded to Cloudinary correctly" });
        }
        
        if (!publicId) {
          console.error('Error: Certificate public_id is missing');
          return res.json({ success: false, message: "Error: Certificate public_id is missing" });
        }
        
        // Set certificate data (unverified by default for customer uploads)
        food.slsCertificate = {
          url: certificateUrl,
          filename: certificateFile.originalname,
          public_id: publicId,
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null
        };
        
        // IMPORTANT: Mark the nested object as modified so Mongoose saves it
        food.markModified('slsCertificate');
        
        console.log('✓ Certificate uploaded successfully with food item');
        console.log('  Folder: food/certificates');
        console.log('  Public ID:', publicId);
        console.log('  Cloudinary URL:', certificateUrl);
        console.log('  Certificate object before save:', JSON.stringify(food.slsCertificate, null, 2));
      } catch (error) {
        console.error('Error uploading certificate to Cloudinary:', error);
        // Don't fail the entire request if certificate upload fails, just log it
        console.log('Continuing without certificate...');
      }
    }
    
    const savedFood = await food.save();
    
    // Reload from database to verify certificate was saved with URL
    if (certificateFile) {
      const refreshedFood = await foodModel.findById(savedFood._id);
      if (refreshedFood && refreshedFood.slsCertificate) {
        console.log('✓ Certificate saved to database - URL:', refreshedFood.slsCertificate.url);
        if (!refreshedFood.slsCertificate.url) {
          console.error('ERROR: Certificate URL is missing after save!');
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: certificateFile 
        ? "Food Added Successfully with SLS Certificate. Waiting for admin verification."
        : "Food Added Successfully",
      data: savedFood
    });
  } catch (error) {
    console.error('Error adding food item:', error);
    res.json({ success: false, message: error.message || "Error adding food item" });
  }
};

// Customer update food item
const customerUpdateFood = async (req, res) => {
  try {
    const { id, name, description, price, category, phone, address, availableQuantity } = req.body;
    
    const food = await foodModel.findById(id);
    if (!food) {
      return res.json({ success: false, message: "Food not found" });
    }
    
    // Check if the user owns this food item
    if (food.addedBy && String(food.addedBy) !== String(req.user.userId)) {
      return res.json({ success: false, message: "You can only update your own items" });
    }
    
    const updateData = { 
      name, 
      description, 
      price, 
      category,
      phone: phone || null,
      address: address || null,
      availableQuantity: availableQuantity ? Number(availableQuantity) : null
    };
    
    // Handle image update if provided
    if (req.file) {
      // Delete old image from Cloudinary
      if (food.image && food.image.includes('cloudinary.com')) {
        try {
          await deleteFromCloudinary(food.image, 'image');
        } catch (error) {
          console.log("Error deleting old image from Cloudinary:", error);
        }
      }
      
      // Upload new image to Cloudinary
      try {
        const uploadResult = await uploadFile(req.file, 'food/images', 'image');
        updateData.image = uploadResult.url;
      } catch (error) {
        console.log('Error uploading to Cloudinary:', error);
        return res.json({ success: false, message: "Error uploading image to cloud storage" });
      }
    }
    
    await foodModel.findByIdAndUpdate(id, updateData);
    res.json({ success: true, message: "Food Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating food item" });
  }
};

// Customer remove food item
const customerRemoveFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (!food) {
      return res.json({ success: false, message: "Food not found" });
    }
    
    // Check if the user owns this food item
    if (food.addedBy && String(food.addedBy) !== String(req.user.userId)) {
      return res.json({ success: false, message: "You can only delete your own items" });
    }
    
    // Delete the image file from Cloudinary
    if (food.image && food.image.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(food.image, 'image');
      } catch (error) {
        console.log("Error deleting image from Cloudinary:", error);
      }
    }
    
    // Delete SLS certificate from Cloudinary if exists
    if (food.slsCertificate && food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(food.slsCertificate.url, 'image');
      } catch (error) {
        console.log("Error deleting SLS certificate from Cloudinary:", error);
      }
    }
    
    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food Removed Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing food" });
  }
};

// Get customer's food items
const getCustomerFood = async (req, res) => {
  try {
    const foods = await foodModel.find({ 
      addedBy: req.user.userId,
      isCustomerAdded: true 
    }).lean();
    
    // Ensure slsCertificate data is properly included with URL
    const foodsWithCertificates = foods.map(food => {
      // If slsCertificate exists but URL is missing, try to reconstruct it from public_id
      if (food.slsCertificate) {
        // If URL is missing but public_id exists, construct Cloudinary URL
        if (!food.slsCertificate.url && food.slsCertificate.public_id) {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k';
          food.slsCertificate.url = `https://res.cloudinary.com/${cloudName}/image/upload/${food.slsCertificate.public_id}`;
          console.log(`Customer Food - Reconstructed URL for ${food.name}: ${food.slsCertificate.url}`);
        }
        console.log(`Customer Food - ${food.name}: Certificate URL: ${food.slsCertificate.url || 'MISSING'}`);
      }
      return food;
    });
    
    res.json({ success: true, data: foodsWithCertificates });
  } catch (error) {
    console.error('Error fetching customer food:', error);
    res.json({ success: false, message: "Error fetching customer food" });
  }
};

// Upload SLS Certificate
const uploadSLSCertificate = async (req, res) => {
  try {
    const { foodId } = req.params;
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.json({ success: false, message: "Please upload a certificate image" });
    }
    
    // Check if user is admin (handle admin-user-id string)
    let isAdmin = false;
    if (userId === 'admin-user-id') {
      isAdmin = true;
    } else {
      const user = await userModel.findById(userId);
      isAdmin = user && user.role === "admin";
    }
    
    // Admins can only view and verify certificates, not upload them
    if (isAdmin) {
      return res.json({ success: false, message: "Admins can only view and verify certificates. Please contact the customer to upload the certificate." });
    }
    
    // Find the food item
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.json({ success: false, message: "Food item not found" });
    }
    
    // Check if user owns this food item (customers can only upload for their own items)
    if (food.addedBy && String(food.addedBy) !== String(userId)) {
      return res.json({ success: false, message: "You can only upload certificates for your own items" });
    }
    
    // Delete old certificate from Cloudinary if exists
    if (food.slsCertificate && food.slsCertificate.public_id) {
      try {
        // Use public_id directly for more reliable deletion
        await deleteFromCloudinary(food.slsCertificate.public_id, 'image');
      } catch (error) {
        console.log("Error deleting old certificate from Cloudinary:", error);
        // If public_id deletion fails, try with URL
        if (food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
          try {
            await deleteFromCloudinary(food.slsCertificate.url, 'image');
          } catch (urlError) {
            console.log("Error deleting old certificate by URL:", urlError);
          }
        }
      }
    }
    
    // Upload certificate to Cloudinary in specific folder
    let certificateUrl = '';
    let publicId = '';
    try {
      // Upload to food/certificates folder to keep it separate from food images
      const uploadResult = await uploadFile(req.file, 'food/certificates', 'image');
      certificateUrl = uploadResult.url;
      publicId = uploadResult.public_id;
      
      // Validate that the certificate was uploaded to Cloudinary
      if (!certificateUrl || !certificateUrl.includes('cloudinary.com')) {
        console.error('Error: Certificate URL does not contain cloudinary.com');
        console.error('Certificate URL received:', certificateUrl);
        return res.json({ success: false, message: "Error: Certificate was not uploaded to Cloudinary correctly" });
      }
      
      if (!publicId) {
        console.error('Error: Certificate public_id is missing');
        return res.json({ success: false, message: "Error: Certificate public_id is missing" });
      }
      
      console.log('✓ Certificate uploaded successfully to Cloudinary');
      console.log('  Folder: food/certificates');
      console.log('  Public ID:', publicId);
      console.log('  Cloudinary URL:', certificateUrl);
    } catch (error) {
      console.error('Error uploading certificate to Cloudinary:', error);
      return res.json({ success: false, message: "Error uploading certificate to cloud storage: " + error.message });
    }
    
    // Verify that food.image field exists and is not being modified
    const originalFoodImage = food.image;
    console.log('Original food image (should not change):', originalFoodImage);
    
    // Update food item with certificate (DO NOT touch food.image field)
    // Set the slsCertificate object with all fields
    // Certificates uploaded by customers are set to unverified (admins will verify them)
    food.slsCertificate = {
      url: certificateUrl,  // Cloudinary URL saved here
      filename: req.file.originalname,
      public_id: publicId,  // Cloudinary public_id saved here
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null
    };
    
    // IMPORTANT: Mark the nested object as modified so Mongoose saves it
    food.markModified('slsCertificate');
    
    // Ensure we don't accidentally modify the food.image field
    // The food.image should remain unchanged
    if (food.image !== originalFoodImage) {
      console.error('WARNING: food.image field was modified! Restoring original value.');
      food.image = originalFoodImage;
    }
    
    // Log before save
    console.log('Before save - slsCertificate:', JSON.stringify(food.slsCertificate, null, 2));
    
    const savedFood = await food.save();
    
    // Reload from database to ensure we have the latest data
    const refreshedFood = await foodModel.findById(foodId);
    console.log('After save - slsCertificate from DB:', JSON.stringify(refreshedFood?.slsCertificate, null, 2));
    
    // Use the refreshed food data for validation and response
    const finalFood = refreshedFood || savedFood;
    
    // Verify the saved data
    console.log('✓ Certificate saved to database successfully');
    console.log('  Food ID:', finalFood._id);
    console.log('  Certificate URL (Cloudinary):', finalFood.slsCertificate?.url);
    console.log('  Certificate Public ID:', finalFood.slsCertificate?.public_id);
    console.log('  Certificate Filename:', finalFood.slsCertificate?.filename);
    console.log('  Certificate isVerified:', finalFood.slsCertificate?.isVerified);
    console.log('  Food Image (unchanged):', finalFood.image);
    
    // Final validation
    if (!finalFood.slsCertificate?.url || !finalFood.slsCertificate?.url.includes('cloudinary.com')) {
      console.error('ERROR: Certificate URL is not a Cloudinary URL after saving!');
      console.error('Certificate data:', JSON.stringify(finalFood.slsCertificate, null, 2));
      return res.json({ success: false, message: "Error: Certificate URL validation failed. Please try again." });
    }
    
    res.json({ 
      success: true, 
      message: "Certificate uploaded successfully. Waiting for admin verification.",
      data: finalFood
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.json({ 
      success: false, 
      message: error.message || "Error uploading certificate. Please try again." 
    });
  }
};

// Get SLS Certificate
const getSLSCertificate = async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('Getting SLS certificate for foodId:', foodId);
    
    const food = await foodModel.findById(foodId);
    if (!food) {
      console.log('Food item not found for ID:', foodId);
      return res.json({ success: false, message: "Food item not found" });
    }
    
    console.log('Food item found:', food.name);
    console.log('SLS Certificate data:', JSON.stringify(food.slsCertificate, null, 2));
    
    // Check if certificate exists - support both url and filename for backward compatibility
    if (!food.slsCertificate) {
      console.log('No certificate object found');
      return res.json({ success: false, message: "No certificate found for this item" });
    }
    
    // Determine the image URL - prefer url, reconstruct from public_id if missing, fallback to filename
    let imageUrl = food.slsCertificate.url;
    
    // If URL is missing but public_id exists, reconstruct Cloudinary URL
    if (!imageUrl && food.slsCertificate.public_id) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k';
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${food.slsCertificate.public_id}`;
      console.log(`Reconstructed certificate URL from public_id: ${imageUrl}`);
      
      // Update the food item with the reconstructed URL if it was missing
      if (!food.slsCertificate.url) {
        food.slsCertificate.url = imageUrl;
        food.markModified('slsCertificate');
        await food.save();
        console.log('Updated food item with reconstructed certificate URL');
      }
    }
    
    // Fallback to filename if URL still doesn't exist
    if (!imageUrl) {
      imageUrl = food.slsCertificate.filename;
    }
    
    if (!imageUrl) {
      console.log('No certificate URL, public_id, or filename found - slsCertificate:', food.slsCertificate);
      return res.json({ success: false, message: "No certificate found for this item" });
    }
    
    console.log('Certificate found, imageUrl:', imageUrl);
    
    // Ensure certificate object has URL for frontend
    const certificateData = {
      ...food.slsCertificate.toObject ? food.slsCertificate.toObject() : food.slsCertificate,
      url: imageUrl
    };
    
    res.json({
      success: true,
      data: {
        imageUrl: imageUrl,
        certificate: certificateData
      }
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.json({ 
      success: false, 
      message: error.message || "Error fetching certificate. Please try again." 
    });
  }
};

// Delete SLS Certificate
const deleteSLSCertificate = async (req, res) => {
  try {
    const { foodId } = req.params;
    const userId = req.user.userId;
    
    // Check if user is admin (handle admin-user-id string)
    let isAdmin = false;
    if (userId === 'admin-user-id') {
      isAdmin = true;
    } else {
      const user = await userModel.findById(userId);
      isAdmin = user && user.role === "admin";
    }
    
    // Admins can only view and verify certificates, not delete them
    if (isAdmin) {
      return res.json({ success: false, message: "Admins can only view and verify certificates. Please contact the customer to remove the certificate." });
    }
    
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.json({ success: false, message: "Food item not found" });
    }
    
    // Customers can only delete their own certificates
    if (food.addedBy && String(food.addedBy) !== String(userId)) {
      return res.json({ success: false, message: "You can only delete certificates for your own items" });
    }
    
    if (!food.slsCertificate || (!food.slsCertificate.url && !food.slsCertificate.filename)) {
      return res.json({ success: false, message: "No certificate found for this item" });
    }
    
    // Delete certificate from Cloudinary using public_id if available
    if (food.slsCertificate.public_id) {
      try {
        // Use public_id directly for more reliable deletion
        await deleteFromCloudinary(food.slsCertificate.public_id, 'image');
      } catch (error) {
        console.log("Error deleting certificate from Cloudinary using public_id:", error);
        // Fallback to URL if public_id deletion fails
        if (food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
          try {
            await deleteFromCloudinary(food.slsCertificate.url, 'image');
          } catch (urlError) {
            console.log("Error deleting certificate by URL:", urlError);
          }
        }
      }
    } else if (food.slsCertificate.url && food.slsCertificate.url.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(food.slsCertificate.url, 'image');
      } catch (error) {
        console.log("Error deleting certificate from Cloudinary:", error);
      }
    }
    
    // Remove certificate from food item
    food.slsCertificate = {
      url: null,
      filename: null,
      public_id: null,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null
    };
    
    // Mark the nested object as modified so Mongoose saves it
    food.markModified('slsCertificate');
    
    await food.save();
    
    res.json({ 
      success: true, 
      message: "Certificate removed successfully" 
    });
  } catch (error) {
    console.error('Error removing certificate:', error);
    res.json({ 
      success: false, 
      message: error.message || "Error removing certificate. Please try again." 
    });
  }
};

// Verify SLS Certificate (Admin only)
const verifySLSCertificate = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { isVerified } = req.body; // Get verification status from request body
    const userId = req.user.userId;
    
    // Check if user is admin (handle admin-user-id string)
    let isAdmin = false;
    if (userId === 'admin-user-id') {
      isAdmin = true;
    } else {
      const user = await userModel.findById(userId);
      isAdmin = user && user.role === "admin";
    }
    
    if (!isAdmin) {
      return res.json({ success: false, message: "You are not authorized to verify certificates" });
    }
    
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.json({ success: false, message: "Food item not found" });
    }
    
    if (!food.slsCertificate || !food.slsCertificate.url) {
      return res.json({ success: false, message: "No certificate found for this item" });
    }
    
    // Toggle verification status
    food.slsCertificate.isVerified = isVerified !== undefined ? isVerified : true;
    
    if (food.slsCertificate.isVerified) {
      food.slsCertificate.verifiedAt = new Date();
      // Set verifiedBy to null for admin-user-id (string) since schema expects ObjectId
      // For regular admin users, use their actual ObjectId
      food.slsCertificate.verifiedBy = (userId === 'admin-user-id') ? null : userId;
    } else {
      food.slsCertificate.verifiedAt = null;
      food.slsCertificate.verifiedBy = null;
    }
    
    // Mark the nested object as modified so Mongoose saves it
    food.markModified('slsCertificate');
    
    await food.save();
    
    res.json({ 
      success: true, 
      message: food.slsCertificate.isVerified ? "Certificate verified successfully" : "Certificate unverified successfully",
      data: food
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.json({ 
      success: false, 
      message: error.message || "Error verifying certificate. Please try again." 
    });
  }
};

// Add review for a food item (only by users who purchased it)
const addReview = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { rating, comment, orderId } = req.body;
    const userId = req.user.userId;

    // Validate rating
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.json({ success: false, message: "Rating must be a number between 1 and 5" });
    }

    // Ensure order exists and belongs to user and contains the food item
    if (!orderId) {
      return res.json({ success: false, message: "orderId is required to verify purchase" });
    }

    const order = await orderModel.findById(orderId).lean();
    if (!order) return res.json({ success: false, message: "Order not found" });
    // order model stores userId
    if (String(order.userId) !== String(userId)) return res.json({ success: false, message: "You are not authorized to review this item" });

    const boughtItem = order.items && order.items.find(it => (it.food || it._id || it.id) && String(it.food || it._id || it.id) === String(foodId));
    if (!boughtItem) return res.json({ success: false, message: "This item was not part of the provided order" });

    const food = await foodModel.findById(foodId);
    if (!food) return res.json({ success: false, message: "Food item not found" });

    // Prevent duplicate review for same order by same user
    const existing = (food.reviews || []).find(r => (r.user && String(r.user) === String(userId)) && (r.orderId && String(r.orderId) === String(orderId)));
    if (existing) return res.json({ success: false, message: "You have already reviewed this item for the provided order" });

    const review = {
      user: userId,
      rating: parsedRating,
      comment: comment || null,
      orderId: orderId,
      createdAt: new Date()
    };

    food.reviews = food.reviews || [];
    food.reviews.push(review);

    // Recalculate aggregates
    const total = food.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    food.reviewCount = food.reviews.length;
    food.rating = food.reviewCount ? Number((total / food.reviewCount).toFixed(2)) : 0;

    await food.save();

    // Return the saved review id so frontend can reference it
    const savedReview = food.reviews && food.reviews.length ? food.reviews[food.reviews.length - 1] : null;
    res.json({ success: true, message: "Review added", data: { rating: food.rating, reviewCount: food.reviewCount, reviewId: savedReview ? savedReview._id : null } });
  } catch (error) {
    console.error('Error adding review:', error);
    res.json({ success: false, message: error.message || "Error adding review" });
  }
};

// Edit an existing review (only by the review owner or admin)
const editReview = async (req, res) => {
  try {
    const { foodId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate rating if provided
    if (rating !== undefined) {
      const parsed = Number(rating);
      if (!parsed || parsed < 1 || parsed > 5) {
        return res.json({ success: false, message: "Rating must be a number between 1 and 5" });
      }
    }

    const food = await foodModel.findById(foodId);
    if (!food) return res.json({ success: false, message: "Food item not found" });

    const review = food.reviews.id(reviewId);
    if (!review) return res.json({ success: false, message: "Review not found" });

    // Allow owner or admin
    if (review.user && String(review.user) !== String(userId)) {
      const user = await userModel.findById(userId);
      if (!user || user.role !== 'admin') {
        return res.json({ success: false, message: "You are not authorized to edit this review" });
      }
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    review.updatedAt = new Date();

    // Recalculate aggregates
    const total = food.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    food.reviewCount = food.reviews.length;
    food.rating = food.reviewCount ? Number((total / food.reviewCount).toFixed(2)) : 0;

    await food.save();

    res.json({ success: true, message: 'Review updated', data: { rating: food.rating, reviewCount: food.reviewCount, review } });
  } catch (error) {
    console.error('Error editing review:', error);
    res.json({ success: false, message: error.message || 'Error editing review' });
  }
};

// Delete a review (only by the review owner or admin)
const deleteReview = async (req, res) => {
  try {
    const { foodId, reviewId } = req.params;
    const userId = req.user.userId;

    const food = await foodModel.findById(foodId);
    if (!food) return res.json({ success: false, message: "Food item not found" });

    const review = food.reviews.id(reviewId);
    if (!review) return res.json({ success: false, message: "Review not found" });

    // Allow owner or admin
    if (review.user && String(review.user) !== String(userId)) {
      const user = await userModel.findById(userId);
      if (!user || user.role !== 'admin') {
        return res.json({ success: false, message: "You are not authorized to delete this review" });
      }
    }

    review.remove();

    // Recalculate aggregates after removal
    const total = food.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    food.reviewCount = food.reviews.length;
    food.rating = food.reviewCount ? Number((total / food.reviewCount).toFixed(2)) : 0;

    await food.save();

    res.json({ success: true, message: 'Review deleted', data: { rating: food.rating, reviewCount: food.reviewCount } });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.json({ success: false, message: error.message || 'Error deleting review' });
  }
};

// Return reviews for the current user on a given food item
const getMyReviews = async (req, res) => {
  try {
    const { foodId } = req.params;
    const userId = req.user.userId;
    const food = await foodModel.findById(foodId).lean();
    if (!food) return res.json({ success: false, message: 'Food not found' });
    const myReviews = (food.reviews || []).filter(r => r.user && String(r.user) === String(userId));
    res.json({ success: true, data: myReviews });
  } catch (error) {
    console.error('Error fetching user reviews for food:', error);
    res.json({ success: false, message: error.message || 'Error fetching reviews' });
  }
};

export { addFood, listFood, removeFood, adminRemoveFood, adminAddFood, customerAddFood, customerUpdateFood, customerRemoveFood, getCustomerFood, adminListAllFood, uploadSLSCertificate, getSLSCertificate, deleteSLSCertificate, verifySLSCertificate, addReview, editReview, deleteReview, getMyReviews };

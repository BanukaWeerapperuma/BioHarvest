import express from "express";
import { addFood, listFood, removeFood, adminRemoveFood, adminAddFood, customerAddFood, customerUpdateFood, customerRemoveFood, getCustomerFood, adminListAllFood, uploadSLSCertificate, getSLSCertificate, deleteSLSCertificate, verifySLSCertificate, addReview, editReview, deleteReview, getMyReviews } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// Configure multer to use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload= multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
})

foodRouter.post("/add",upload.single("image"),authMiddleware,addFood);
foodRouter.get("/list",listFood);
foodRouter.post("/remove",authMiddleware,removeFood);
foodRouter.post("/admin/remove",adminRemoveFood);
foodRouter.post(
  "/admin/add",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  adminAddFood
);
foodRouter.get("/admin/list-all",adminListAllFood);

// Customer food management routes
// Allow both image and certificate to be uploaded together
foodRouter.post("/customer/add",upload.fields([{ name: 'image', maxCount: 1 }, { name: 'certificate', maxCount: 1 }]),authMiddleware,customerAddFood);
foodRouter.put("/customer/update",upload.single("image"),authMiddleware,customerUpdateFood);
foodRouter.post("/customer/remove",authMiddleware,customerRemoveFood);
foodRouter.get("/customer/list",authMiddleware,getCustomerFood);

// SLS Certificate routes (must be before /list route to avoid conflicts)
foodRouter.post("/:foodId/sls-certificate", upload.single("certificate"), authMiddleware, uploadSLSCertificate);
foodRouter.get("/:foodId/sls-certificate", authMiddleware, getSLSCertificate);
foodRouter.delete("/:foodId/sls-certificate", authMiddleware, deleteSLSCertificate);
foodRouter.put("/:foodId/sls-certificate/verify", authMiddleware, verifySLSCertificate);

// Review route - only users who purchased the item may post a review for that order
foodRouter.post("/:foodId/review", authMiddleware, addReview);
foodRouter.put('/:foodId/review/:reviewId', authMiddleware, editReview);
foodRouter.delete('/:foodId/review/:reviewId', authMiddleware, deleteReview);
// Get current user's reviews for this food
foodRouter.get('/:foodId/reviews/me', authMiddleware, getMyReviews);

// Error handling middleware for multer
foodRouter.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.log('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    return res.json({ success: false, message: 'File upload error: ' + error.message });
  } else if (error) {
    console.log('Other error:', error);
    return res.json({ success: false, message: error.message });
  }
  next();
});

export default foodRouter;

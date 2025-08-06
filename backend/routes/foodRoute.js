import express from "express";
import { addFood, listFood, removeFood, adminRemoveFood, adminAddFood, customerAddFood, customerUpdateFood, customerRemoveFood, getCustomerFood, adminListAllFood, getSlsCertificate, verifySlsCertificate } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// Image Storage Engine

const storage= multer.diskStorage({
    destination:"uploads",
    filename:(req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

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
foodRouter.post("/admin/add", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "slsCertificate", maxCount: 1 }
]), adminAddFood);
foodRouter.get("/admin/list-all",adminListAllFood);

// SLS Certificate routes
foodRouter.get("/:id/sls-certificate", getSlsCertificate);
foodRouter.put("/:id/sls-certificate/verify", authMiddleware, verifySlsCertificate);

// Customer food management routes
foodRouter.post("/customer/add", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "slsCertificate", maxCount: 1 }
]), authMiddleware, customerAddFood);
foodRouter.put("/customer/update", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "slsCertificate", maxCount: 1 }
]), authMiddleware, customerUpdateFood);
foodRouter.post("/customer/remove",authMiddleware,customerRemoveFood);
foodRouter.get("/customer/list",authMiddleware,getCustomerFood);

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

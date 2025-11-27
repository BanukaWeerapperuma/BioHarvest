import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

// Import models to ensure they are registered
import "./models/userModel.js";
import "./models/communityPostModel.js";
import "./models/foodModel.js";
import "./models/blogModel.js";
import "./models/courseModel.js";
import "./models/orderModel.js";
import "./models/promoModel.js";
import "./models/notificationModel.js";

import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import blogRouter from "./routes/blogRoute.js";
import courseRouter from "./routes/courseRoute.js";
import enrollmentRouter from "./routes/enrollmentRoute.js";
import communityRouter from "./routes/communityRoute.js";
import promoRouter from "./routes/promoRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import analyticsRouter from "./routes/analyticsRoute.js";
import adminRouter from "./routes/adminRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import path from "path";
import { fileURLToPath } from "url";

// app config
const app = express();
const port =process.env.PORT || 4000;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//middlewares
app.use(express.json());
app.use(cors());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/blog", blogRouter);
app.use("/api/courses", courseRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/community", communityRouter);
app.use("/api/promo", promoRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});

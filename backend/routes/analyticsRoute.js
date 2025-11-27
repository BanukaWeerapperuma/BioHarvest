import express from "express";
import { getDashboardAnalytics, getBlogAnalytics, getUserAnalytics } from "../controllers/analyticsController.js";
import authMiddleware from "../middleware/auth.js";

const analyticsRouter = express.Router();

// Analytics dashboard data
analyticsRouter.get("/dashboard", authMiddleware, getDashboardAnalytics);

// Blog analytics
analyticsRouter.get("/blog", authMiddleware, getBlogAnalytics);

// User analytics
analyticsRouter.get("/users", authMiddleware, getUserAnalytics);

export default analyticsRouter; 
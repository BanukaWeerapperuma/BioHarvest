import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, placeCourseOrder, updateStatus, userOrders, verifyOrder, adminListOrders, adminUpdateStatus, adminRemoveOrder, getOrderById, verifyPaymentFromUrl } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/place-course",authMiddleware,placeCourseOrder);
orderRouter.post("/verify",verifyOrder);
orderRouter.get("/verify-payment",verifyPaymentFromUrl);
orderRouter.post("/status",authMiddleware,updateStatus);
orderRouter.post("/userorders",authMiddleware,userOrders);
orderRouter.get("/user-orders",authMiddleware,userOrders);
orderRouter.get("/list",authMiddleware,listOrders);
orderRouter.get("/admin/list",adminListOrders);
orderRouter.post("/admin/status",adminUpdateStatus);
orderRouter.post("/admin/remove",adminRemoveOrder);
orderRouter.get("/:orderId",authMiddleware,getOrderById);

export default orderRouter;
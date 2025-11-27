import express from "express";
import { getPosts, createPost, likePost, addComment, deletePost, getUserPosts } from "../controllers/communityController.js";
import authMiddleware from "../middleware/auth.js";

const communityRouter = express.Router();

// Public routes (no authentication required)
communityRouter.get("/posts", getPosts);

// Protected routes (authentication required)
communityRouter.post("/posts", authMiddleware, createPost);
communityRouter.post("/posts/:postId/like", authMiddleware, likePost);
communityRouter.post("/posts/:postId/comments", authMiddleware, addComment);
communityRouter.delete("/posts/:postId", authMiddleware, deletePost);
communityRouter.get("/user/posts", authMiddleware, getUserPosts);

export default communityRouter; 
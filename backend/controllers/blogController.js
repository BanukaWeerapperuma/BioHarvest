import Blog from '../models/blogModel.js';
import Reaction from '../models/reactionModel.js';
import mongoose from 'mongoose';
import { uploadFile, deleteFromCloudinary } from '../utils/cloudinary.js';

// Get all published blog posts
const getAllBlogPosts = async (req, res) => {
  try {
    const posts = await Blog.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .select('title excerpt image category createdAt');
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
};

// Get single blog post by ID
const getBlogPostById = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save();
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
};

// Get reactions for a blog post
const getBlogReactions = async (req, res) => {
  try {
    const reactions = await Reaction.aggregate([
      { $match: { blogPostId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$reaction', count: { $sum: 1 } } }
    ]);

    const reactionCounts = {
      likes: 0,
      loves: 0,
      helpful: 0,
      shares: 0 // This would be tracked separately
    };

    reactions.forEach(reaction => {
      reactionCounts[reaction._id + 's'] = reaction.count;
    });

    res.json({
      success: true,
      data: reactionCounts
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reactions'
    });
  }
};

// Add reaction to blog post
const addReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    const blogPostId = req.params.id;
    
    // Generate user ID from IP and user agent
    const userId = `${req.ip}-${req.get('User-Agent')}`;
    
    // Check if user already reacted
    const existingReaction = await Reaction.findOne({ blogPostId, userId });
    
    if (existingReaction) {
      // Update existing reaction
      existingReaction.reaction = reaction;
      await existingReaction.save();
    } else {
      // Create new reaction
      await Reaction.create({
        blogPostId,
        userId,
        reaction,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
    }
    
    res.json({
      success: true,
      message: 'Reaction added successfully'
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
};

// Create new blog post (Admin only)
const createBlogPost = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    // Upload image to Cloudinary
    let imageUrl = '';
    let imagePublicId = '';
    try {
      const uploadResult = await uploadFile(req.file, 'blog/images', 'image');
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image to cloud storage'
      });
    }
    
    const newPost = new Blog({
      title,
      content,
      excerpt,
      image: imageUrl,
      imagePublicId,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    const savedPost = await newPost.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: savedPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post'
    });
  }
};

// Update blog post (Admin only)
const updateBlogPost = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, isPublished } = req.body;
    
    const updateData = {
      title,
      content,
      excerpt,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublished
    };
    
    let currentPost = null;
    if (req.file) {
      currentPost = await Blog.findById(req.params.id);
      if (currentPost) {
        const publicIdToDelete = currentPost.imagePublicId || (currentPost.image?.includes('cloudinary.com') ? currentPost.image : null);
        if (publicIdToDelete) {
          try {
            await deleteFromCloudinary(publicIdToDelete, 'image');
          } catch (error) {
            console.error('Error deleting old image from Cloudinary:', error);
          }
        }
      }
      try {
        const uploadResult = await uploadFile(req.file, 'blog/images', 'image');
        updateData.image = uploadResult.url;
        updateData.imagePublicId = uploadResult.public_id;
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image to cloud storage'
        });
      }
    }
    
    const updatedPost = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post'
    });
  }
};

// Delete blog post (Admin only)
const deleteBlogPost = async (req, res) => {
  try {
    const deletedPost = await Blog.findByIdAndDelete(req.params.id);
    
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Delete image from Cloudinary if exists
    if (deletedPost.image) {
      try {
        await deleteFromCloudinary(deletedPost.imagePublicId || (deletedPost.image.includes('cloudinary.com') ? deletedPost.image : null), 'image');
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
    
    // Also delete associated reactions
    await Reaction.deleteMany({ blogPostId: req.params.id });
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post'
    });
  }
};

// Get all blog posts for admin (including unpublished)
const getAllBlogPostsAdmin = async (req, res) => {
  try {
    const posts = await Blog.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
};

export {
  getAllBlogPosts,
  getBlogPostById,
  getBlogReactions,
  addReaction,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPostsAdmin
}; 
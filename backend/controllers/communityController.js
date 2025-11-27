import CommunityPost from "../models/communityPostModel.js";
import userModel from "../models/userModel.js";

// Ensure User model is registered
import "../models/userModel.js";

// Get all community posts
const getPosts = async (req, res) => {
  try {
    // Fetch posts as plain objects to make augmentation easier
    const posts = await CommunityPost.find({}).sort({ createdAt: -1 }).lean();

    // Collect all unique user IDs from posts and comments
    const userIdSet = new Set();
    posts.forEach(p => {
      if (p.author) userIdSet.add(String(p.author));
      if (Array.isArray(p.comments)) {
        p.comments.forEach(c => { if (c.author) userIdSet.add(String(c.author)); });
      }
    });

    const userIds = Array.from(userIdSet);
    let users = [];
    if (userIds.length) {
      users = await userModel.find({ _id: { $in: userIds } }).select('profileImage name').lean();
    }

    const userMap = {};
    users.forEach(u => { userMap[String(u._id)] = u; });

    // Attach author profileImage to posts and comments for frontend convenience
    const postsWithProfiles = posts.map(p => {
      const postCopy = { ...p };
      postCopy.authorProfileImage = userMap[String(p.author)] ? userMap[String(p.author)].profileImage : null;
      if (Array.isArray(postCopy.comments)) {
        postCopy.comments = postCopy.comments.map(c => ({
          ...c,
          authorProfileImage: userMap[String(c.author)] ? userMap[String(c.author)].profileImage : null
        }));
      }
      return postCopy;
    });

    res.json({ success: true, posts: postsWithProfiles });
  } catch (error) {
    console.log('Error fetching community posts:', error);
    res.json({ success: false, message: "Error fetching posts" });
  }
};

// Create a new community post
const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.json({ success: false, message: "Post content is required" });
    }
    
    // Get user info
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Create new post
    const newPost = new CommunityPost({
      author: userId,
      authorName: user.name,
      content: content.trim()
    });
    
    await newPost.save();
    
    // Return the post without populating to avoid the model registration issue
    // The frontend will handle displaying the author info from authorName
    console.log('New community post created:', newPost._id);
    res.json({ success: true, post: newPost });
  } catch (error) {
    console.log('Error creating community post:', error);
    res.json({ success: false, message: "Error creating post" });
  }
};

// Like/unlike a post
const likePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }
    
    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => String(id) !== String(userId));
    } else {
      // Like
      post.likes.push(userId);
    }
    
    await post.save();
    
    console.log(`Post ${postId} ${isLiked ? 'unliked' : 'liked'} by user ${userId}`);
    res.json({ success: true, likes: post.likes });
  } catch (error) {
    console.log('Error liking/unliking post:', error);
    res.json({ success: false, message: "Error updating like" });
  }
};

// Add comment to a post
const addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.json({ success: false, message: "Comment content is required" });
    }
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }
    
    // Get user info
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Add comment
    const newComment = {
      author: userId,
      authorName: user.name,
      content: content.trim()
    };
    
    post.comments.push(newComment);
    await post.save();
    
    // Return the comment without populating to avoid the model registration issue
    const addedComment = post.comments[post.comments.length - 1];
    
    console.log(`Comment added to post ${postId} by user ${userId}`);
    res.json({ success: true, comment: addedComment });
  } catch (error) {
    console.log('Error adding comment:', error);
    res.json({ success: false, message: "Error adding comment" });
  }
};

// Delete a post (only by author)
const deletePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }
    
    // Check if user is the author
    if (String(post.author) !== String(userId)) {
      return res.json({ success: false, message: "Not authorized to delete this post" });
    }
    
    await CommunityPost.findByIdAndDelete(postId);
    
    console.log(`Post ${postId} deleted by user ${userId}`);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log('Error deleting post:', error);
    res.json({ success: false, message: "Error deleting post" });
  }
};

// Get posts by user
const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const posts = await CommunityPost.find({ author: userId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, posts });
  } catch (error) {
    console.log('Error fetching user posts:', error);
    res.json({ success: false, message: "Error fetching user posts" });
  }
};

export {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost,
  getUserPosts
}; 
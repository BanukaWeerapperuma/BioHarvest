import React, { useState, useEffect, useContext } from 'react'
import './community.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const Community = () => {
  const { token, url, userProfile } = useContext(StoreContext)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userProfiles, setUserProfiles] = useState({})
  const [expandedComments, setExpandedComments] = useState({})

  // Toggle comments visibility for a specific post
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Fetch user profile image by user ID
  const fetchUserProfile = async (userId) => {
    if (userProfiles[userId]) return userProfiles[userId];
    
    try {
      const response = await axios.get(`${url}/api/user/${userId}`, {
        headers: { token }
      });
      
      if (response.data && response.data.success) {
        const profileImage = response.data.user.profileImage;
        setUserProfiles(prev => ({
          ...prev,
          [userId]: profileImage
        }));
        return profileImage;
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
    return null;
  };

  // Fetch community posts
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${url}/api/community/posts`)
      
      if (response.data && response.data.success) {
        console.log('Fetched community posts:', response.data.posts)
        setPosts(response.data.posts)
        
        // Fetch profile images for all authors
        const uniqueUserIds = [...new Set([
          ...response.data.posts.map(post => post.author),
          ...response.data.posts.flatMap(post => post.comments.map(comment => comment.author))
        ])];
        
        for (const userId of uniqueUserIds) {
          if (userId && !userProfiles[userId]) {
            await fetchUserProfile(userId);
          }
        }
      } else {
        console.log('No posts found or API error')
        setPosts([])
      }
    } catch (error) {
      console.log('Error fetching community posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() || !token || submitting) return

    try {
      setSubmitting(true)
      
      const response = await axios.post(
        `${url}/api/community/posts`,
        { content: newPost },
        { headers: { token } }
      )
      
      if (response.data && response.data.success) {
        console.log('Post created successfully:', response.data.post)
        
        // Fetch the current user's profile image if not already cached
        if (response.data.post.author && !userProfiles[response.data.post.author]) {
          await fetchUserProfile(response.data.post.author);
        }
        
        setNewPost('')
        fetchPosts() // Refresh posts
      } else {
        console.log('Failed to create post:', response.data.message)
        alert('Failed to create post. Please try again.')
      }
    } catch (error) {
      console.log('Error creating post:', error)
      alert('Error creating post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Like a post
  const handleLikePost = async (postId) => {
    if (!token) return

    try {
      const response = await axios.post(
        `${url}/api/community/posts/${postId}/like`,
        {},
        { headers: { token } }
      )
      
      if (response.data && response.data.success) {
        console.log('Post liked/unliked successfully')
        // Update posts with new like data
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, likes: response.data.likes }
            : post
        ))
      } else {
        console.log('Failed to like post:', response.data.message)
      }
    } catch (error) {
      console.log('Error liking post:', error)
    }
  }

  // Add comment to a post
  const handleAddComment = async (postId, comment) => {
    if (!token || !comment.trim()) return

    try {
      const response = await axios.post(
        `${url}/api/community/posts/${postId}/comments`,
        { content: comment },
        { headers: { token } }
      )
      
      if (response.data && response.data.success) {
        console.log('Comment added successfully:', response.data.comment)
        
        // Fetch the new commenter's profile image
        if (response.data.comment.author && !userProfiles[response.data.comment.author]) {
          await fetchUserProfile(response.data.comment.author);
        }
        
        // Update posts with new comment
        setPosts(prev => prev.map(post => 
          post._id === postId 
            ? { ...post, comments: [...post.comments, response.data.comment] }
            : post
        ))
      } else {
        console.log('Failed to add comment:', response.data.message)
        alert('Failed to add comment. Please try again.')
      }
    } catch (error) {
      console.log('Error adding comment:', error)
      alert('Error adding comment. Please try again.')
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="community-container">
      <div className="community-header">
        <h1>Community</h1>
        <p>Connect with fellow food enthusiasts, share recipes, and get inspired!</p>
      </div>

      <div className="community-content">
        {/* Create Post Section */}
        {token && (
          <div className="create-post-section">
            <div className="post-form">
              <div className="user-info">
                <img 
                  src={userProfile?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                  alt="Profile" 
                  className="user-avatar"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                  }}
                />
                <span className="username">{userProfile?.name || 'User'}</span>
              </div>
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts, recipes, or questions with the community..."
                  className="post-textarea"
                  disabled={submitting}
                />
                <button 
                  type="submit" 
                  className="post-button"
                  disabled={submitting || !newPost.trim()}
                >
                  {submitting ? 'Sharing...' : 'Share Post'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="posts-feed">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <h3>No posts yet</h3>
              <p>Be the first to share something with the community!</p>
              {!token && (
                <p className="login-suggestion">Log in to create the first post!</p>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <img 
                    src={userProfiles[post.author] ? `${url}/uploads/${userProfiles[post.author]}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                    alt="Author" 
                    className="author-avatar"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="post-info">
                    <h4 className="author-name">{post.authorName || 'Anonymous'}</h4>
                    <span className="post-date">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`like-button ${post.likes.includes(userProfile?._id) ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post._id)}
                    disabled={!token}
                  >
                    ❤️ {post.likes.length}
                  </button>
                  <button 
                    className="comments-toggle-button"
                    onClick={() => toggleComments(post._id)}
                  >
                    💬 {post.comments.length}
                  </button>
                </div>
                
                {/* Comments Section - Hidden by default */}
                {expandedComments[post._id] && (
                  <>
                    {post.comments.length > 0 && (
                      <div className="comments-section">
                        <h5>Comments</h5>
                        {post.comments.map((comment, index) => (
                          <div key={index} className="comment">
                            <div className="comment-header">
                              <img 
                                src={userProfiles[comment.author] ? `${url}/uploads/${userProfiles[comment.author]}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='} 
                                alt="Commenter" 
                                className="comment-avatar"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iMTcuNSIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTMiIHI9IjYiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUuODMzIDMwLjY2N0M1LjgzMyAyNi4wNTc2IDkuNTcyNiAyMi4zMzMgMTQuMTY2NyAyMi4zMzNIMjAuODMzQzI1LjQyNzQgMjIuMzMzIDI5LjE2NjcgMjYuMDU3NiAyOS4xNjY3IDMwLjY2N1YzNUg1LjgzM1YzMC42NjdaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                }}
                              />
                              <div className="comment-info">
                                <strong>{comment.authorName || 'Anonymous'}</strong>
                                <p>{comment.content}</p>
                                <span className="comment-date">
                                  {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Comment Form */}
                    {token && (
                      <div className="add-comment-section">
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          const comment = e.target.comment.value
                          if (comment.trim()) {
                            handleAddComment(post._id, comment)
                            e.target.comment.value = ''
                          }
                        }}>
                          <input
                            type="text"
                            name="comment"
                            placeholder="Add a comment..."
                            className="comment-input"
                          />
                          <button type="submit" className="comment-button">
                            Comment
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Community
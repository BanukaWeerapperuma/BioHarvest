import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';
import './BlogPost.css';

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState({
    likes: 0,
    loves: 0,
    helpful: 0,
    shares: 0
  });
  const [userReaction, setUserReaction] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchBlogPost();
    fetchReactions();
  }, [id]);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${url}/uploads/${imagePath}`;
  };

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/blog/${id}`);
      if (response.data.success) {
        setPost(response.data.data);
      } else {
        setError('Failed to fetch blog post');
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setError('Unable to load blog post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReactions = async () => {
    try {
      const response = await axios.get(`${url}/api/blog/${id}/reactions`);
      if (response.data.success) {
        setReactions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      const response = await axios.post(`${url}/api/blog/${id}/react`, {
        reaction: reactionType
      });
      
      if (response.data.success) {
        setUserReaction(reactionType);
        fetchReactions(); // Refresh reactions
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleShare = (platform) => {
    const postUrl = window.location.href;
    const title = post?.title || 'Check out this blog post!';
    const text = post?.excerpt || 'Interesting read from our blog';

    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${postUrl}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
        setShowShareModal(false);
        return;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    setShowShareModal(false);
  };

  const handleRetry = () => {
    fetchBlogPost();
  };

  // Loading state
  if (loading) {
    return (
      <div className="blog-post-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="blog-post-container">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
          <button onClick={() => navigate('/blog')} className="back-btn" style={{ marginTop: '15px' }}>
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!post) {
    return (
      <div className="blog-post-container">
        <div className="error-message">
          <h2>Blog Post Not Found</h2>
          <p>The blog post you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/blog')} className="back-btn">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-container">
      <div className="blog-post-header">
        <button 
          onClick={() => navigate('/blog')} 
          className="back-btn"
          aria-label="Go back to blog"
        >
          ← Back to Blog
        </button>
        
        <div className="post-meta-header">
          <span className="post-category">{post.category}</span>
          <span className="post-date">
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        
        <h1 className="post-title">{post.title}</h1>
        <p className="post-excerpt">{post.excerpt}</p>
        
        <div className="post-author">
          <span>By {post.author}</span>
        </div>
      </div>

      <div className="blog-post-content">
        <div className="post-image-container">
          <img 
            src={resolveImageUrl(post.image)} 
            alt={post.title} 
            className="post-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJsb2cgUG9zdCBJbWFnZTwvdGV4dD48L3N2Zz4=';
            }}
          />
        </div>

        <div className="post-text-content">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="post-paragraph">
              {paragraph}
            </p>
          ))}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            <h3>Tags:</h3>
            <div className="tags-list">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="blog-post-actions">
        <div className="reactions-section">
          <h3>What do you think?</h3>
          <div className="reactions-buttons">
            <button 
              className={`reaction-btn ${userReaction === 'like' ? 'active' : ''}`}
              onClick={() => handleReaction('like')}
              aria-label={`Like this post (${reactions.likes} likes)`}
            >
              👍 Like ({reactions.likes})
            </button>
            <button 
              className={`reaction-btn ${userReaction === 'love' ? 'active' : ''}`}
              onClick={() => handleReaction('love')}
              aria-label={`Love this post (${reactions.loves} loves)`}
            >
              ❤️ Love ({reactions.loves})
            </button>
            <button 
              className={`reaction-btn ${userReaction === 'helpful' ? 'active' : ''}`}
              onClick={() => handleReaction('helpful')}
              aria-label={`Mark as helpful (${reactions.helpful} helpful votes)`}
            >
              👍 Helpful ({reactions.helpful})
            </button>
          </div>
        </div>

        <div className="share-section">
          <h3>Share this post</h3>
          <div className="share-buttons">
            <button 
              className="share-btn facebook"
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
            >
              Facebook
            </button>
            <button 
              className="share-btn twitter"
              onClick={() => handleShare('twitter')}
              aria-label="Share on Twitter"
            >
              Twitter
            </button>
            <button 
              className="share-btn linkedin"
              onClick={() => handleShare('linkedin')}
              aria-label="Share on LinkedIn"
            >
              LinkedIn
            </button>
            <button 
              className="share-btn whatsapp"
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
            >
              WhatsApp
            </button>
            <button 
              className="share-btn copy"
              onClick={() => handleShare('copy')}
              aria-label="Copy link to clipboard"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="blog-post-footer">
        <div className="post-stats">
          <span>👁️ {reactions.shares} shares</span>
          <span>📅 Published {new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogPost; 
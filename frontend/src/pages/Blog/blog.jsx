import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './blog.css';
import axios from 'axios';
import { url } from '../../assets/frontend_assets/assets';

const Blog = () => {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${url}/uploads/${imagePath}`;
  };

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/blog/list`);
      if (response.data.success) {
        setBlogPosts(response.data.data);
      } else {
        setError('Failed to fetch blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Unable to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(blogPosts.length / postsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostClick = (postId) => {
    navigate(`/blog/${postId}`);
  };

  const handleRetry = () => {
    fetchBlogPosts();
  };

  // Loading state
  if (loading) {
    return (
      <div className="blog-container">
        <div className="blog-header">
          <h1>Our Blog</h1>
          <p>Discover the latest news, tips, and stories</p>
        </div>
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="blog-container">
        <div className="blog-header">
          <h1>Our Blog</h1>
          <p>Discover the latest news, tips, and stories</p>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1>Our Blog</h1>
        <p>Discover the latest news, tips, and stories</p>
      </div>

      {blogPosts.length === 0 ? (
        <div className="no-posts-message">
          <p>No blog posts available yet.</p>
          <p>Check back soon for updates!</p>
        </div>
      ) : (
        <>
          <div className="blog-grid">
            {currentPosts.map((post) => (
              <div 
                key={post._id} 
                className="blog-tile" 
                onClick={() => handlePostClick(post._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePostClick(post._id);
                  }
                }}
              >
                <div className="blog-image-container">
                  <img 
                    src={resolveImageUrl(post.image)} 
                    alt={post.title} 
                    className="blog-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJsb2cgSW1hZ2U8L3RleHQ+PC9zdmc+';
                    }}
                  />
                  <div className="blog-overlay">
                    <div className="blog-caption">
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <div className="blog-meta">
                        <span className="blog-date">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="blog-category">{post.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="blog-content">
                  <h3 className="blog-title">{post.title}</h3>
                  <p className="blog-excerpt">{post.excerpt}</p>
                  <div className="blog-meta-bottom">
                    <span className="blog-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="blog-category">{post.category}</span>
                  </div>
                  <button 
                    className="read-more-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePostClick(post._id);
                    }}
                    aria-label={`Read more about ${post.title}`}
                  >
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" role="navigation" aria-label="Blog pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
                aria-label="Go to previous page"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current
                const shouldShow = 
                  pageNumber === 1 || 
                  pageNumber === totalPages || 
                  Math.abs(pageNumber - currentPage) <= 1;
                
                if (shouldShow) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                      aria-label={`Go to page ${pageNumber}`}
                      aria-current={currentPage === pageNumber ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                  return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                aria-label="Go to next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Blog;
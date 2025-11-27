import React, { useState, useEffect, useContext } from 'react';
import './Blog.css';
import axios from 'axios';
import { url } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Blog = () => {
  const { admin } = useContext(StoreContext);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Health',
    tags: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePost, setDeletePost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      fetchBlogPosts();
    }
  }, [admin]);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${url}/uploads/${imagePath}`;
  };

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/blog/admin/list`);
      if (response.data.success) {
        setBlogPosts(response.data.data);
      } else {
        console.error('Failed to fetch blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image) {
      alert('Please select an image');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('excerpt', formData.excerpt);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('image', formData.image);

      const response = await axios.post(`${url}/api/blog/admin/add`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Blog post added successfully!');
        setShowAddForm(false);
        resetForm();
        fetchBlogPosts();
      } else {
        alert('Failed to add blog post');
      }
    } catch (error) {
      console.error('Error adding blog post:', error);
      alert('Error adding blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'Health',
      tags: '',
      image: null
    });
    setImagePreview(null);
  };

  const handleDeleteClick = (post) => {
    setDeletePost(post);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete(`${url}/api/blog/admin/remove/${deletePost._id}`);
      
      if (response.data.success) {
        alert('Blog post deleted successfully!');
        fetchBlogPosts();
      } else {
        alert('Failed to delete blog post');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Error deleting blog post');
    } finally {
      setShowDeleteModal(false);
      setDeletePost(null);
    }
  };

  const handleEditClick = (postId) => {
    navigate(`/blog/edit/${postId}`);
  };

  if (!admin) {
    return (
      <div className="blog-admin-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need to be logged in as admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-admin-container">
      <div className="blog-admin-header">
        <h1>Blog Management</h1>
        <button 
          className="add-blog-btn"
          onClick={() => setShowAddForm(true)}
        >
          Add New Blog Post
        </button>
      </div>

      {showAddForm && (
        <div className="add-blog-form">
          <div className="form-header">
            <h2>Add New Blog Post</h2>
            <button 
              className="close-btn"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter blog post title"
              />
            </div>

            <div className="form-group">
              <label>Excerpt *</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                placeholder="Enter a short excerpt (max 200 characters)"
                maxLength={200}
                rows={3}
              />
              <span className="char-count">{formData.excerpt.length}/200</span>
            </div>

            <div className="form-group">
              <label>Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                placeholder="Enter blog post content"
                rows={8}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Health">Health</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Recipes">Recipes</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Wellness">Wellness</option>
                  <option value="News">News</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Blog Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-message">
          <p>Loading blog posts...</p>
        </div>
      ) : (
        <div className="blog-posts-list">
          {blogPosts.length === 0 ? (
            <div className="no-posts-message">
              <p>No blog posts available.</p>
              <p>Add your first blog post to get started!</p>
            </div>
          ) : (
            blogPosts.map((post) => (
              <div key={post._id} className="blog-post-item">
                <div className="post-image">
                  <img 
                    src={resolveImageUrl(post.image)} 
                    alt={post.title} 
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJsb2cgSW1hZ2U8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </div>
                <div className="post-content">
                  <h3>{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-meta">
                    <span className="post-category">{post.category}</span>
                    <span className="post-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`post-status ${post.isPublished ? 'published' : 'draft'}`}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="post-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditClick(post._id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteClick(post)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Blog Post</h3>
            <p>Are you sure you want to delete "{deletePost?.title}"?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePost(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog; 
import React, { useState, useEffect, useContext } from 'react';
import './Promo.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Promo = () => {
  const { url, token } = useContext(StoreContext);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'fixed',
    discountValue: '',
    maxDiscount: '',
    minimumOrderAmount: '0',
    maxUsage: '-1',
    maxUsagePerUser: '1',
    startDate: '',
    endDate: '',
    sendNotification: false,
    notificationMessage: ''
  });

  useEffect(() => {
    fetchPromos();
    fetchStats();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await axios.get(`${url}/api/promo/all`, {
        headers: { token }
      });
      setPromos(response.data.data);
    } catch (error) {
      console.error('Error fetching promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${url}/api/promo/stats`, {
        headers: { token }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'fixed',
      discountValue: '',
      maxDiscount: '',
      minimumOrderAmount: '0',
      maxUsage: '-1',
      maxUsagePerUser: '1',
      startDate: '',
      endDate: '',
      sendNotification: false,
      notificationMessage: ''
    });
    setEditingPromo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPromo) {
        await axios.put(`${url}/api/promo/${editingPromo._id}`, formData, {
          headers: { token }
        });
      } else {
        await axios.post(`${url}/api/promo/create`, formData, {
          headers: { token }
        });
      }
      
      setShowForm(false);
      resetForm();
      fetchPromos();
      fetchStats();
    } catch (error) {
      console.error('Error saving promo:', error);
      alert(error.response?.data?.message || 'Error saving promo code');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      maxDiscount: promo.maxDiscount ? promo.maxDiscount.toString() : '',
      minimumOrderAmount: promo.minimumOrderAmount.toString(),
      maxUsage: promo.maxUsage.toString(),
      maxUsagePerUser: promo.maxUsagePerUser.toString(),
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
      sendNotification: promo.sendNotification,
      notificationMessage: promo.notificationMessage || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (promoId) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await axios.delete(`${url}/api/promo/${promoId}`, {
          headers: { token }
        });
        fetchPromos();
        fetchStats();
      } catch (error) {
        console.error('Error deleting promo:', error);
        alert('Error deleting promo code');
      }
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      await axios.put(`${url}/api/promo/${promoId}`, {
        isActive: !currentStatus
      }, {
        headers: { token }
      });
      fetchPromos();
    } catch (error) {
      console.error('Error updating promo status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (promo) => {
    if (!promo.isActive) return <span className="status-badge inactive">Inactive</span>;
    if (promo.isExpired) return <span className="status-badge expired">Expired</span>;
    if (promo.maxUsage > 0 && promo.currentUsage >= promo.maxUsage) {
      return <span className="status-badge limit-reached">Limit Reached</span>;
    }
    return <span className="status-badge active">Active</span>;
  };

  if (loading) {
    return <div className="promo-loading">Loading promo codes...</div>;
  }

  return (
    <div className="promo-container">
      <div className="promo-header">
        <h1>Promo Code Management</h1>
        <button 
          className="add-promo-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add New Promo Code
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Promo Codes</h3>
          <p>{stats.totalPromos || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Promo Codes</h3>
          <p>{stats.activePromos || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Usage</h3>
          <p>{stats.totalUsage || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Expired Promo Codes</h3>
          <p>{stats.expiredPromos || 0}</p>
        </div>
      </div>

      {/* Top Promo Codes */}
      {stats.topPromos && stats.topPromos.length > 0 && (
        <div className="top-promos">
          <h3>Top Used Promo Codes</h3>
          <div className="top-promos-list">
            {stats.topPromos.map((promo, index) => (
              <div key={promo._id} className="top-promo-item">
                <span className="rank">#{index + 1}</span>
                <span className="code">{promo.code}</span>
                <span className="name">{promo.name}</span>
                <span className="usage">{promo.currentUsage} uses</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="promo-form-overlay">
          <div className="promo-form">
            <div className="form-header">
              <h2>{editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Promo Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingPromo}
                    placeholder="e.g., SAVE20"
                  />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Summer Sale"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description of the promo code"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div className="form-group">
                  <label>Maximum Discount ($)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50.00"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order Amount ($)</label>
                  <input
                    type="number"
                    name="minimumOrderAmount"
                    value={formData.minimumOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Max Usage (-1 for unlimited)</label>
                  <input
                    type="number"
                    name="maxUsage"
                    value={formData.maxUsage}
                    onChange={handleInputChange}
                    min="-1"
                    placeholder="-1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Usage Per User</label>
                  <input
                    type="number"
                    name="maxUsagePerUser"
                    value={formData.maxUsagePerUser}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="1"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendNotification"
                    checked={formData.sendNotification}
                    onChange={handleInputChange}
                  />
                  Send notification to users
                </label>
              </div>

              {formData.sendNotification && (
                <div className="form-group">
                  <label>Notification Message</label>
                  <textarea
                    name="notificationMessage"
                    value={formData.notificationMessage}
                    onChange={handleInputChange}
                    placeholder="Message to send to users about this promo code"
                    rows="3"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit">
                  {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="promo-list">
        <h2>All Promo Codes</h2>
        <div className="promo-table">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo._id}>
                  <td>
                    <span className="promo-code">{promo.code}</span>
                  </td>
                  <td>{promo.name}</td>
                  <td>
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}%` 
                      : `$${promo.discountValue}`
                    }
                    {promo.maxDiscount && promo.discountType === 'percentage' && (
                      <span className="max-discount"> (max ${promo.maxDiscount})</span>
                    )}
                  </td>
                  <td>
                    {promo.currentUsage}
                    {promo.maxUsage > 0 && ` / ${promo.maxUsage}`}
                  </td>
                  <td>{getStatusBadge(promo)}</td>
                  <td>{formatDate(promo.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(promo)}
                      >
                        Edit
                      </button>
                      <button 
                        className={`toggle-btn ${promo.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => togglePromoStatus(promo._id, promo.isActive)}
                      >
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(promo._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Promo; 
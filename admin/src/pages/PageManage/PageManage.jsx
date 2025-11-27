import React, { useState, useEffect, useContext } from 'react';
import './PageManage.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PageManage = () => {
  const { url, token } = useContext(StoreContext);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoStats, setPromoStats] = useState({
    totalPromos: 0,
    activePromos: 0,
    totalUsage: 0,
    expiredPromos: 0,
    topPromos: []
  });

  // Promo form data
  const [promoFormData, setPromoFormData] = useState({
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
    fetchPromoStats();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/promo/all`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setPromos(response.data.data || []);
      } else {
        setPromos([]);
        toast.error('Failed to fetch promo codes');
      }
    } catch (error) {
      console.error('Error fetching promos:', error);
      setPromos([]);
      toast.error('Error fetching promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoStats = async () => {
    try {
      const response = await axios.get(`${url}/api/promo/stats`, {
        headers: { token }
      });
      if (response.data.success) {
        setPromoStats(response.data.data || {
          totalPromos: 0,
          activePromos: 0,
          totalUsage: 0,
          expiredPromos: 0,
          topPromos: []
        });
      }
    } catch (error) {
      console.error('Error fetching promo stats:', error);
      setPromoStats({
        totalPromos: 0,
        activePromos: 0,
        totalUsage: 0,
        expiredPromos: 0,
        topPromos: []
      });
    }
  };

  const handlePromoInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetPromoForm = () => {
    setPromoFormData({
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

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPromo) {
        const response = await axios.put(`${url}/api/promo/${editingPromo._id}`, promoFormData, {
          headers: { token }
        });
        toast.success('Promo code updated successfully');
      } else {
        const response = await axios.post(`${url}/api/promo/create`, promoFormData, {
          headers: { token }
        });
        toast.success('Promo code created successfully');
      }
      
      setShowPromoForm(false);
      resetPromoForm();
      await fetchPromos();
      await fetchPromoStats();
    } catch (error) {
      console.error('Error saving promo:', error);
      toast.error(error.response?.data?.message || 'Error saving promo code');
    }
  };

  const handleEditPromo = (promo) => {
    setPromoFormData({
      code: promo.code || '',
      name: promo.name || '',
      description: promo.description || '',
      discountType: promo.discountType || 'fixed',
      discountValue: promo.discountValue?.toString() || '',
      maxDiscount: promo.maxDiscount?.toString() || '',
      minimumOrderAmount: promo.minimumOrderAmount?.toString() || '0',
      maxUsage: promo.maxUsage?.toString() || '-1',
      maxUsagePerUser: promo.maxUsagePerUser?.toString() || '1',
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
      sendNotification: promo.sendNotification || false,
      notificationMessage: promo.notificationMessage || ''
    });
    setEditingPromo(promo);
    setShowPromoForm(true);
  };

  const handleDeletePromo = async (promoId) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await axios.delete(`${url}/api/promo/${promoId}`, {
          headers: { token }
        });
        toast.success('Promo code deleted successfully');
        fetchPromos();
        fetchPromoStats();
      } catch (error) {
        console.error('Error deleting promo:', error);
        toast.error('Error deleting promo code');
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
      toast.success(`Promo code ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPromos();
      fetchPromoStats();
    } catch (error) {
      console.error('Error toggling promo status:', error);
      toast.error('Error updating promo status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (item, type) => {
    if (!item) return <span className="status-badge inactive">Unknown</span>;
    
    if (type === 'promo') {
      if (!item.isActive) return <span className="status-badge inactive">Inactive</span>;
      if (item.isExpired) return <span className="status-badge expired">Expired</span>;
      if (item.maxUsage > 0 && (item.currentUsage || 0) >= item.maxUsage) {
        return <span className="status-badge limit-reached">Limit Reached</span>;
      }
      return <span className="status-badge active">Active</span>;
    } else {
      return item.isActive ? 
        <span className="status-badge active">Active</span> : 
        <span className="status-badge inactive">Inactive</span>;
    }
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      info: '#3498db',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c'
    };
    return (
      <span 
        className="type-badge" 
        style={{ backgroundColor: typeColors[type] }}
      >
        {type.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="page-manage-loading">Loading...</div>;
  }

  return (
    <div className="page-manage-container">
      <div className="page-manage-header">
        <h1>Promo Code Management</h1>
        <p>Manage promo codes and track their performance</p>
      </div>

      {/* Promo Codes Tab */}
      <div className="tab-content">
        <div className="promo-header">
          <h2>Promo Code Management</h2>
          <button 
            className="add-btn"
            onClick={() => {
              resetPromoForm();
              setShowPromoForm(true);
            }}
          >
            Add New Promo Code
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Promo Codes</h3>
            <p>{promoStats.totalPromos}</p>
          </div>
          <div className="stat-card">
            <h3>Active Promo Codes</h3>
            <p>{promoStats.activePromos}</p>
          </div>
          <div className="stat-card">
            <h3>Total Usage</h3>
            <p>{promoStats.totalUsage}</p>
          </div>
          <div className="stat-card">
            <h3>Expired Promo Codes</h3>
            <p>{promoStats.expiredPromos}</p>
          </div>
        </div>

        {/* Promo Codes List */}
        <div className="data-list">
          <h3>All Promo Codes</h3>
          <div className="table-container">
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
                {promos && promos.length > 0 ? (
                  promos.map((promo) => (
                    <tr key={promo._id || Math.random()}>
                      <td>
                        <span className="promo-code">{promo.code || 'N/A'}</span>
                      </td>
                      <td>{promo.name || 'N/A'}</td>
                      <td>
                        {promo.discountType === 'percentage' 
                          ? `${promo.discountValue || 0}%` 
                          : `$${promo.discountValue || 0}`
                        }
                        {promo.maxDiscount && promo.discountType === 'percentage' && (
                          <span className="max-discount"> (max ${promo.maxDiscount})</span>
                        )}
                      </td>
                      <td>
                        {promo.currentUsage || 0}
                        {promo.maxUsage > 0 && ` / ${promo.maxUsage}`}
                      </td>
                      <td>{getStatusBadge(promo, 'promo')}</td>
                      <td>{formatDate(promo.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditPromo(promo)}
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
                            onClick={() => handleDeletePromo(promo._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No promo codes found. Create your first promo code!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Promo Form Modal */}
      {showPromoForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPromoForm(false);
                  resetPromoForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePromoSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Promo Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={promoFormData.code}
                    onChange={handlePromoInputChange}
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
                    value={promoFormData.name}
                    onChange={handlePromoInputChange}
                    required
                    placeholder="e.g., Summer Sale"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={promoFormData.description}
                  onChange={handlePromoInputChange}
                  placeholder="Description of the promo code"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    name="discountType"
                    value={promoFormData.discountType}
                    onChange={handlePromoInputChange}
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
                    value={promoFormData.discountValue}
                    onChange={handlePromoInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder={promoFormData.discountType === 'percentage' ? '10' : '5.00'}
                  />
                </div>
              </div>

              {promoFormData.discountType === 'percentage' && (
                <div className="form-group">
                  <label>Maximum Discount ($)</label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={promoFormData.maxDiscount}
                    onChange={handlePromoInputChange}
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
                    value={promoFormData.minimumOrderAmount}
                    onChange={handlePromoInputChange}
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
                    value={promoFormData.maxUsage}
                    onChange={handlePromoInputChange}
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
                    value={promoFormData.maxUsagePerUser}
                    onChange={handlePromoInputChange}
                    min="1"
                    placeholder="1"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={promoFormData.startDate}
                    onChange={handlePromoInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={promoFormData.endDate}
                  onChange={handlePromoInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="sendNotification"
                    checked={promoFormData.sendNotification}
                    onChange={handlePromoInputChange}
                  />
                  Send notification to users
                </label>
              </div>

              {promoFormData.sendNotification && (
                <div className="form-group">
                  <label>Notification Message</label>
                  <textarea
                    name="notificationMessage"
                    value={promoFormData.notificationMessage}
                    onChange={handlePromoInputChange}
                    placeholder="Message to send to users about this promo code"
                    rows="3"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowPromoForm(false);
                  resetPromoForm();
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
    </div>
  );
};

export default PageManage; 
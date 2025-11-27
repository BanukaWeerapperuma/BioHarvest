import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets, url } from '../../assets/assets';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/price';

const Orders = () => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/order/admin/list`);
      if (response.data.success) {
        setOrders(response.data.data.reverse());
        console.log('Orders fetched:', response.data.data);
      } else {
        toast.error("Failed to fetch orders");
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Error connecting to server. Please check if backend is running.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(`${url}/api/order/admin/status`, {
        orderId,
        status: event.target.value
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchAllOrders();
      } else {
        toast.error(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Error updating order status. Please check if backend is running.");
    }
  }

  const handleRemoveOrder = (order) => {
    setSelectedOrder(order);
    setShowRemoveModal(true);
  }

  const confirmRemoveOrder = async () => {
    try {
      const response = await axios.post(`${url}/api/order/admin/remove`, {
        orderId: selectedOrder._id,
        reason: removeReason
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setShowRemoveModal(false);
        setSelectedOrder(null);
        setRemoveReason('');
        await fetchAllOrders();
      } else {
        toast.error(response.data.message || "Failed to remove order");
      }
    } catch (error) {
      console.error('Error removing order:', error);
      toast.error("Error removing order. Please check if backend is running.");
    }
  }

  const cancelRemoveOrder = () => {
    setShowRemoveModal(false);
    setSelectedOrder(null);
    setRemoveReason('');
  }

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    } else {
      fetchAllOrders();
    }
  }, [admin, token]);

  if (loading) {
    return (
      <div className='order add'>
        <h3>Order Page</h3>
        <div className="loading-message">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      {orders.length === 0 ? (
        <div className="no-orders-message">
          <p>No orders found.</p>
          <p>Orders will appear here when customers place them through the frontend.</p>
          <button onClick={fetchAllOrders} className="refresh-btn">Refresh Orders</button>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order, index) => (
            <div key={index} className='order-item'>
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className='order-item-food'>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return item.name + " x " + item.quantity
                    }
                    else {
                      return item.name + " x " + item.quantity + ", "
                    }
                  })}
                </p>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <div className='order-item-address'>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p className='order-item-phone'>{order.address.phone}</p>
              </div>
              <p>Items : {order.items.length}</p>
              <p>{formatCurrency(order.amount)}</p>
              <select onChange={(e) => statusHandler(e, order._id)} value={order.status} name="" id="">
                <option value="Food Processing">Food Processing</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button 
                className="remove-order-btn" 
                onClick={() => handleRemoveOrder(order)}
                title="Remove order"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Remove Order Modal */}
      {showRemoveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Remove Order</h3>
            <p>Are you sure you want to remove this order?</p>
            <div className="order-summary">
              <p><strong>Customer:</strong> {selectedOrder?.address.firstName} {selectedOrder?.address.lastName}</p>
              <p><strong>Items:</strong> {selectedOrder?.items.length}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedOrder?.amount)}</p>
            </div>
            <div className="reason-input">
              <label htmlFor="removeReason">Reason for removal (optional):</label>
              <textarea
                id="removeReason"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Enter reason for removing this order..."
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button onClick={cancelRemoveOrder} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmRemoveOrder} className="confirm-btn">
                Remove Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders

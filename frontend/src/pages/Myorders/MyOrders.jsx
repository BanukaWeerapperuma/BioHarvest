import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import { RatingContext } from "../../context/RatingContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const { updateRating } = useContext(RatingContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({}); // { `${orderId}_${foodId}`: number }
  const [submitting, setSubmitting] = useState({});
  const [submittedMap, setSubmittedMap] = useState({});
  const [reviewIdMap, setReviewIdMap] = useState({});
  const navigate = useNavigate();

  // Helper function to get image URL (handles both Cloudinary URLs and local paths)
  const getImageUrl = (imgPath) => {
    if (!imgPath) return '';
    // If it's already a full URL (starts with http), return as is
    if (imgPath.startsWith('http')) {
      return imgPath;
    }
    // Otherwise, it's a local path
    return url + "/uploads/" + imgPath;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        // Sort orders by date (newest first)
        const sortedOrders = response.data.data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        setData(sortedOrders);

        // Prefill ratings/comments/reviewIdMap/submittedMap from returned order item.review
        const preRatings = {};
        const preComments = {};
        const preReviewIds = {};
        const preSubmitted = {};
        for (const order of sortedOrders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              const foodId = item.food || item._id || item.id;
              if (!foodId) continue;
              const key = `${order._id}_${foodId}`;
              if (item.review) {
                if (item.review.rating !== undefined && item.review.rating !== null) preRatings[key] = item.review.rating;
                if (item.review.reviewId) preReviewIds[key] = item.review.reviewId;
                preSubmitted[key] = true;
              }
            }
          }
        }
        setRatings(prev => ({ ...preRatings, ...prev }));
        setReviewIdMap(prev => ({ ...preReviewIds, ...prev }));
        setSubmittedMap(prev => ({ ...preSubmitted, ...prev }));
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Error loading orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login to view your orders");
      navigate("/");
    } else {
      fetchOrders();
    }
  }, [token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'food processing':
        return '#ff9800';
      case 'out for delivery':
        return '#2196f3';
      case 'delivered':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="my-orders">
        <h2>My Orders</h2>
        <div className="loading-message">
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="my-orders">
        <h2>My Orders</h2>
        <div className="no-orders-message">
          <img src={assets.parcel_icon} alt="No orders" />
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate("/")}>Start Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          return (
            <div key={order._id || index} className="my-orders-order">
              <div className="order-header">
                <div className="order-info">
                  <p className="order-date">Order Date: {formatDate(order.date)}</p>
                  <p className="order-id">Order ID: {order._id?.slice(-8) || 'N/A'}</p>
                </div>
                <div className="order-status" style={{ color: getStatusColor(order.status) }}>
                  <span>&#x25cf;</span>
                  <b>{order.status || 'Food Processing'}</b>
                </div>
              </div>
              
              <div className="order-items">
                <h3>Items ({order.items.length})</h3>
                {order.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="order-item">
                    <img 
                      src={getImageUrl(item.image)} 
                      alt={item.name} 
                      className="order-item-image"
                      onError={(e) => {
                        e.target.src = assets.parcel_icon;
                      }}
                    />
                    <div className="order-item-details">
                      <p className="order-item-name">{item.name}</p>
                      <p className="order-item-quantity">Quantity: {item.quantity || 1}</p>
                      <p className="order-item-price">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                      <div className="order-item-review">
                        {(() => {
                          const foodId = item.food || item._id || item.id;
                          const key = `${order._id}_${foodId}`;
                          const current = ratings[key] || 0;
                          const isSubmitted = submittedMap[key];

                          const submitReview = async () => {
                            if (isSubmitted) return;
                            const rating = ratings[key] || 0;
                            if (!rating) return toast.error('Please select a rating');
                            try {
                              setSubmitting(prev => ({ ...prev, [key]: true }));
                              const payload = { rating, orderId: order._id };
                              const res = await axios.post(url + `/api/food/${foodId}/review`, payload, { headers: { token } });
                              if (res.data.success) {
                                toast.success('Review submitted');
                                setSubmittedMap(prev => ({ ...prev, [key]: true }));
                                if (res.data.data && res.data.data.reviewId) {
                                  setReviewIdMap(prev => ({ ...prev, [key]: res.data.data.reviewId }));
                                }
                                // Update shared rating context so other components refresh immediately
                                if (res.data.data && (res.data.data.rating !== undefined || res.data.data.reviewCount !== undefined)) {
                                  try {
                                    updateRating(String(foodId), res.data.data.rating, res.data.data.reviewCount);
                                  } catch (e) {
                                    console.warn('Failed to update rating context', e);
                                  }
                                }
                              } else {
                                toast.error(res.data.message || 'Failed to submit review');
                              }
                            } catch (err) {
                              console.error('Review submit error', err);
                              toast.error('Error submitting review');
                            } finally {
                              setSubmitting(prev => ({ ...prev, [key]: false }));
                            }
                          };

                          return (
                            <div>
                              {!isSubmitted ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div className="star-picker" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {[1,2,3,4,5].map(s => (
                                      <span key={s}
                                        onClick={() => {
                                          // allow selecting only when not yet submitted
                                          if (submittedMap[key]) return;
                                          setRatings(prev => ({ ...prev, [key]: s }));
                                        }}
                                        style={{ cursor: submittedMap[key] ? 'default' : 'pointer', color: s <= current ? '#ffc107' : '#ccc', fontSize: 18 }}
                                      >★</span>
                                    ))}
                                    <button onClick={submitReview} disabled={submitting[key]} style={{ marginLeft: 8 }}>{submittedMap[key] ? 'Submitted' : 'Submit'}</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ color: '#666', fontSize: 14 }}>Your rating: {ratings[key] || '—'}</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${order.subtotal?.toFixed(2) || order.amount?.toFixed(2) || '0.00'}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount ({order.promoCode || 'Promo'}):</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span><b>Total:</b></span>
                  <span><b>${order.amount?.toFixed(2) || '0.00'}</b></span>
                </div>
                <div className="summary-row">
                  <span>Payment Status:</span>
                  <span className={order.payment ? 'paid' : 'unpaid'}>
                    {order.payment ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              {order.address && (
                <div className="order-address">
                  <h3>Delivery Address</h3>
                  <p>
                    {order.address.firstName} {order.address.lastName}<br />
                    {order.address.street}<br />
                    {order.address.city}, {order.address.state} {order.address.zipcode}<br />
                    {order.address.country}<br />
                    Phone: {order.address.phone}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;

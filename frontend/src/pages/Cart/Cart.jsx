import React, { useState, useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, token } = useContext(StoreContext);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoId, setPromoId] = useState(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const navigate = useNavigate();

  const handlePromoSubmit = async () => {
    if (!promoCode.trim()) {
      setPromoMessage("Please enter a promo code");
      return;
    }

    if (promoApplied) {
      setPromoMessage("Promo code already applied");
      return;
    }

    if (!token) {
      setPromoMessage("Please login to use promo codes");
      return;
    }

    const cartTotal = getSubtotal();
    if (cartTotal === 0) {
      setPromoMessage("Your cart is empty. Add items to apply promo code.");
      return;
    }

    setPromoLoading(true);
    setPromoMessage("");

    console.log('Applying promo code:', promoCode.trim());
    console.log('Cart total:', cartTotal);
    console.log('Token:', token);
    console.log('URL:', url);

    try {
      const response = await axios.post(`${url}/api/promo/validate`, {
        promoCode: promoCode.trim(),
        cartTotal: cartTotal
      }, {
        headers: { token }
      });

      console.log('Promo validation response:', response.data);

      if (response.data.success) {
        const discount = response.data.discount;
        setPromoDiscount(discount);
        setPromoApplied(true);
        setPromoId(response.data.promoId);
        setPromoMessage(`Promo code "${response.data.code}" applied! You saved $${discount.toFixed(2)}`);
      } else {
        setPromoMessage(response.data.message || "Invalid promo code");
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        setPromoMessage("Please login to use promo codes");
      } else if (error.response?.data?.message) {
        setPromoMessage(error.response.data.message);
      } else {
        setPromoMessage("Error applying promo code. Please try again.");
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoId(null);
    setPromoMessage("");
  };

  const getSubtotal = () => {
    return getTotalCartAmount();
  };

  const getDeliveryFee = () => {
    return getTotalCartAmount() > 0 ? 2 : 0;
  };

  const getDiscount = () => {
    return promoApplied ? promoDiscount : 0;
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscount();
    return Math.max(0, subtotal + deliveryFee - discount);
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}> {/* Add unique key here */}
                <div className="cart-items-title cart-items-item">
                  <img src={url+"/uploads/"+item.image} alt="" />
                  <p>{item.name}</p>
                  <p>$ {item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>$ {item.price * cartItems[item._id]}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>$ {getSubtotal()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>$ {getDeliveryFee()}</p>
            </div>
            {promoApplied && (
              <>
                <hr />
                <div className="cart-total-details discount">
                  <p>Discount</p>
                  <p>-$ {getDiscount()}</p>
                </div>
              </>
            )}
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>$ {getFinalTotal()}</b>
            </div>
          </div>
          <button onClick={() => navigate("/order", { 
            state: { 
              promoCode: promoApplied ? promoCode : null,
              promoDiscount: promoApplied ? promoDiscount : 0,
              promoId: promoApplied ? promoId : null
            }
          })}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            {!token && (
              <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '10px' }}>
                * Please login to use promo codes
              </p>
            )}
            <div className="cart-promocode-input">
              <input 
                type="text" 
                placeholder="promo code" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied || !token}
              />
              {promoApplied ? (
                <button onClick={removePromo} className="remove-promo">
                  Remove
                </button>
              ) : (
                <button 
                  onClick={handlePromoSubmit}
                  disabled={promoLoading || !token}
                  className={promoLoading ? "loading" : ""}
                >
                  {promoLoading ? "Applying..." : "Submit"}
                </button>
              )}
            </div>
            {promoMessage && (
              <div className={`promo-message ${promoApplied ? "success" : "error"}`}>
                {promoMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

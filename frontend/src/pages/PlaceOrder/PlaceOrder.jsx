import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { getTotalCartAmount, token, food_list, cartItems, url } =
    useContext(StoreContext);
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // Check if this is a course enrollment
  const isCourseEnrollment = location.state?.type === 'course';
  const courseData = location.state;

  // Get promo code data from cart
  const promoData = location.state?.promoCode ? {
    promoCode: location.state.promoCode,
    promoDiscount: location.state.promoDiscount,
    promoId: location.state.promoId
  } : null;

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    
    if (isCourseEnrollment) {
      // Handle course enrollment
      try {
        console.log('Attempting course enrollment with data:', {
          courseId: courseData.courseId,
          courseName: courseData.courseName,
          amount: courseData.amount,
          studentInfo: data
        });

        const enrollmentData = {
          courseId: courseData.courseId,
          courseName: courseData.courseName,
          amount: courseData.amount,
          studentInfo: data
        };

        const response = await axios.post(url + "/api/order/place-course", enrollmentData, {
          headers: { token },
        });

        console.log('Course enrollment response:', response.data);

        if (response.data.success) {
          const { session_url } = response.data;
          console.log('Redirecting to payment gateway:', session_url);
          window.location.replace(session_url);
        } else {
          console.error('Course enrollment failed:', response.data.message);
          toast.error(response.data.message || "Error processing course enrollment!");
        }
      } catch (error) {
        console.error('Error enrolling in course:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          toast.error(error.response.data.message || "Error processing course enrollment!");
        } else {
          toast.error("Network error. Please check your connection.");
        }
      }
    } else {
      // Handle food order
      let orderItems = [];
      food_list.map((item) => {
        if (cartItems[item._id] > 0) {
          let itemInfo = item;
          itemInfo["quantity"] = cartItems[item._id];
          orderItems.push(itemInfo);
        }
      });

      const subtotal = getTotalCartAmount();
      const deliveryFee = subtotal > 0 ? 2 : 0;
      const discount = promoData ? promoData.promoDiscount : 0;
      const finalAmount = Math.max(0, subtotal + deliveryFee - discount);

      let orderData = {
        address: data,
        items: orderItems,
        amount: finalAmount,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        promoCode: promoData ? promoData.promoCode : null,
        promoId: promoData ? promoData.promoId : null
      };

      console.log('Sending order data to backend:', orderData);
      console.log('Promo data:', promoData);

      try {
        let response = await axios.post(url + "/api/order/place", orderData, {
          headers: { token },
        });
        if (response.data.success) {
          const { session_url } = response.data;
          console.log('Redirecting to payment gateway:', session_url);
          window.location.replace(session_url);
        } else {
          console.error('Order placement failed:', response.data);
          toast.error(response.data.message || "Error placing order!");
        }
      } catch (error) {
        console.error('Error placing order:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          toast.error(error.response.data.message || "Error placing order!");
        } else {
          toast.error("Network error. Please check your connection.");
        }
      }
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please Login first");
      navigate(isCourseEnrollment ? "/learn" : "/cart");
    } else if (!isCourseEnrollment && getTotalCartAmount() === 0) {
      toast.error("Please Add Items to Cart");
      navigate("/cart");
    }
  }, [token, isCourseEnrollment]);

  if (isCourseEnrollment && !courseData) {
    return (
      <div className="place-order">
        <div className="error-message">
          <h2>Invalid Course Enrollment</h2>
          <p>Please select a course to enroll in.</p>
          <button onClick={() => navigate("/learn")}>Back to Courses</button>
        </div>
      </div>
    );
  }

  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <p className="title">
          {isCourseEnrollment ? "Student Information" : "Delivery Information"}
        </p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            value={data.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="First name"
          />
          <input
            required
            name="lastName"
            value={data.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          name="email"
          value={data.email}
          onChange={onChangeHandler}
          type="email"
          placeholder="Email Address"
        />
        {!isCourseEnrollment && (
          <>
            <input
              required
              name="street"
              value={data.street}
              onChange={onChangeHandler}
              type="text"
              placeholder="Street"
            />
            <div className="multi-fields">
              <input
                required
                name="city"
                value={data.city}
                onChange={onChangeHandler}
                type="text"
                placeholder="City"
              />
              <input
                required
                name="state"
                value={data.state}
                onChange={onChangeHandler}
                type="text"
                placeholder="State"
              />
            </div>
            <div className="multi-fields">
              <input
                required
                name="zipcode"
                value={data.zipcode}
                onChange={onChangeHandler}
                type="text"
                placeholder="Zip Code"
              />
              <input
                required
                name="country"
                value={data.country}
                onChange={onChangeHandler}
                type="text"
                placeholder="Country"
              />
            </div>
          </>
        )}
        <input
          required
          name="phone"
          value={data.phone}
          onChange={onChangeHandler}
          type="text"
          placeholder="Phone"
        />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>
            {isCourseEnrollment ? "Course Enrollment" : "Cart Totals"}
          </h2>
          {isCourseEnrollment ? (
            <div>
              <div className="course-enrollment-details">
                <h3>{courseData.courseName}</h3>
                <div className="enrollment-info">
                  <p>Course Enrollment</p>
                  <p>${courseData.amount}</p>
                </div>
                <hr />
                <div className="enrollment-info">
                  <b>Total</b>
                  <b>${courseData.amount}</b>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="cart-total-details">
                <p>Subtotals</p>
                <p>${getTotalCartAmount()}</p>
              </div>
              <hr />
              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
              </div>
              {promoData && (
                <>
                  <hr />
                  <div className="cart-total-details discount">
                    <p>Discount ({promoData.promoCode})</p>
                    <p>-${promoData.promoDiscount.toFixed(2)}</p>
                  </div>
                </>
              )}
              <hr />
              <div className="cart-total-details">
                <b>Total</b>
                <b>
                  ${promoData ? 
                    Math.max(0, getTotalCartAmount() + (getTotalCartAmount() === 0 ? 0 : 2) - promoData.promoDiscount).toFixed(2) : 
                    (getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2)
                  }
                </b>
              </div>
            </div>
          )}
          <button type="submit">
            {isCourseEnrollment ? "ENROLL NOW" : "PROCEED TO PAYMENT"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;

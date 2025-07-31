import React, { useContext } from 'react'
import './Verify.css'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Verify = () => {

    const [searchParams,setSearchParams]=useSearchParams();
    const success=searchParams.get("success");
    const orderId=searchParams.get("orderId");
    const type=searchParams.get("type");
    const {url} =useContext(StoreContext);
    const navigate= useNavigate();

    const verifyPayment=async()=>{
        try {
            const response= await axios.post(url+"/api/order/verify",{success,orderId,type});
            if(response.data.success){
                if (type === 'course') {
                    // Course enrollment is handled automatically by the backend
                    toast.success("Course enrolled successfully!");
                    navigate("/learn");
                } else {
                    navigate("/");
                    toast.success("Order Placed Successfully");
                }
            }else{
                toast.error("Something went wrong");
                navigate("/");
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error("Error verifying payment");
            navigate("/");
        }
    }

    useEffect(() => {
            verifyPayment() 
    },[])
    //order payment status and order id
    console.log(success, orderId, type)
    
  return (
    <div className='verify'>
        <div className='spinner'>
        </div>
    </div>
  )
}

export default Verify
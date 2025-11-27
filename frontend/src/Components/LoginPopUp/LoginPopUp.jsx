import React, { use } from 'react'
import './LoginPopUp.css'
import { assets } from '../../assets/frontend_assets/assets'
import { useState } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'




const LoginPopUp = ({setShowLogin}) => {

    //fetch url from api
    const {url , setToken, fetchUserProfile} = useContext(StoreContext)

    const [currState , setCurrState] = useState("Login")
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    // send data to backend
    const [data , setData] = useState({
        name : "",
        email : "",
        password : ""
    })

    // forgot / reset password data
    const [forgotData, setForgotData] = useState({
        username: "",
        email: "",
        currentPassword: "",
        newPassword: ""
    })

    const onForgotChange = (e) => {
        const {name, value} = e.target
        setForgotData({
            ...forgotData,
            [name]: value
        })
    }

    //
    const onChangeHandler = (e) => {
        const {name , value} = e.target

        setData({
            ...data,
            [name] : value
        })
    }

    const onLogin = async (event) => {
        event.preventDefault();

        let newUrl = url;

        if(currState === "Login"){
            newUrl += "/api/user/login";
        }else{
            newUrl += "/api/user/register";
        }

        const response = await axios.post(newUrl , data);

        if(response.data.success){
            setToken(response.data.token);
            localStorage.setItem("token" , response.data.token);
            
            // Fetch user profile after successful login
            try {
                await fetchUserProfile(response.data.token);
            } catch (error) {
                console.log('Error fetching user profile after login:', error);
            }
            
            setShowLogin(false);
        }else{
            alert(response.data.message);
        }
    }

    const onForgotPassword = async (event) => {
        event.preventDefault();

        if (!forgotData.username) {
            toast.error("Please enter your username");
            return;
        }

        if (!forgotData.email) {
            toast.error("Please enter your email address");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!forgotData.currentPassword) {
            toast.error("Please enter your current password");
            return;
        }

        if (!forgotData.newPassword) {
            toast.error("Please enter a new password");
            return;
        }

        if (forgotData.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        try {
            const response = await axios.post(`${url}/api/user/forgot-password`, {
                username: forgotData.username,
                email: forgotData.email,
                currentPassword: forgotData.currentPassword,
                newPassword: forgotData.newPassword
            });

            if (response.data.success) {
                toast.success("Password reset instructions have been sent to your email. Please check your Gmail.");
                setShowForgotPassword(false);
                setForgotData({ username: "", email: "", currentPassword: "", newPassword: "" });
            } else {
                toast.error(response.data.message || "Failed to send password reset email");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error sending password reset email. Please try again.";
            toast.error(errorMessage);
        }
    }


  return (
    <div  className="login-popup">
        {showForgotPassword ? (
            <form onSubmit={onForgotPassword} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>Forgot Password</h2>
                    <img onClick={() => setShowForgotPassword(false)} src={assets.cross_icon} alt="" />
                </div>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    Enter your username and email address and provide your current and new passwords. We'll update your credentials immediately.
                </p>
                <div className="login-popup-inputs">
                    <input 
                        name='username' 
                        onChange={onForgotChange} 
                        value={forgotData.username} 
                        type="text" 
                        placeholder='Your username' 
                        required 
                    />
                    <input 
                        name='email' 
                        onChange={onForgotChange} 
                        value={forgotData.email} 
                        type="email" 
                        placeholder='Your email address' 
                        required 
                    />
                    <div style={{ position: 'relative' }}>
                        <input
                            name='currentPassword'
                            onChange={onForgotChange}
                            value={forgotData.currentPassword}
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder='Current password'
                            required
                        />
                        <span onClick={() => setShowCurrentPassword(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#555', fontSize: '12px' }}>
                            {showCurrentPassword ? 'Hide' : 'Show'}
                        </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input
                            name='newPassword'
                            onChange={onForgotChange}
                            value={forgotData.newPassword}
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder='New password'
                            required
                        />
                        <span onClick={() => setShowNewPassword(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#555', fontSize: '12px' }}>
                            {showNewPassword ? 'Hide' : 'Show'}
                        </span>
                    </div>
                </div>
                <button type='submit'>Send Reset Instructions</button>
                <p><span onClick={() => setShowForgotPassword(false)} style={{ color: 'tomato', cursor: 'pointer', textDecoration: 'underline' }}>Back to Login</span></p>
            </form>
        ) : (
            <form  onSubmit={onLogin} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img  onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt="" />
                </div>

                <div className="login-popup-inputs">
                    {currState==="Login"?<></>: <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
                    
                    <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
                    <input  name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
                </div>

                <button type='submit'>{currState==="Sign Up"?"Create Account":"Login"}</button>
                {currState === "Login" && (
                    <p style={{ marginTop: '-10px', fontSize: '13px', textAlign: 'center' }}>
                        <span onClick={() => setShowForgotPassword(true)} style={{ color: 'tomato', cursor: 'pointer', textDecoration: 'underline' }}>
                            Forgot Password?
                        </span>
                    </p>
                )}
                <div className="login-popup-condition">
                    <input type="checkbox"  required/>
                    <p>By continuing, I agree to the Terms of Use and Privacy Policy</p>
                </div>
                {currState === "Login" ? 
               <p>Create a new account ? <span onClick={()=>setCurrState("Sign Up")}>Click here</span></p> : 
               <p>Already have an account ? <span onClick={()=>setCurrState("Login")}>Login here</span></p>}
                
                
            </form>
        )}
    </div>
  )
}

export default LoginPopUp
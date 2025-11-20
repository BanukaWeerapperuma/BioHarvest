import { createContext, useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';


export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

        const [cartItems , setCartItems] = useState({});
        const [userProfile, setUserProfile] = useState(null);

        const url = "http://localhost:4000";

        const [token , setToken] = useState("");
        const [food_list , setFoodList] = useState([]);
        


        const addToCart = async(itemId) => {
            // Check available quantity before adding to cart
            const item = food_list.find(product => product._id === itemId);
            if (item && item.availableQuantity !== null && item.availableQuantity !== undefined) {
                const currentCartQuantity = cartItems[itemId] || 0;
                if (currentCartQuantity + 1 > item.availableQuantity) {
                    toast.error(`Only ${item.availableQuantity} item(s) available. Cannot add more to cart.`);
                    return;
                }
            }
            
            if(!cartItems[itemId]){
                setCartItems((prev)=>({...prev , [itemId]:1}))
                
            }else{
                setCartItems((prev)=>({...prev , [itemId]:prev[itemId]+1}))
            }
            if(token){
                const response = await axios.post(url + "/api/cart/add" , {itemId} , {headers:{token}});
                if (!response.data.success && response.data.message) {
                    toast.error(response.data.message);
                    // Revert the cart update if backend validation fails
                    if(cartItems[itemId]){
                        setCartItems((prev)=>({...prev , [itemId]:prev[itemId]-1}))
                    }else{
                        setCartItems((prev)=>{
                            const newCart = {...prev};
                            delete newCart[itemId];
                            return newCart;
                        })
                    }
                }
            }

        }

        const removeFromCart = async (itemId) => {
            setCartItems((prev)=>({...prev , [itemId]:prev[itemId]-1}))

            if(token){
                await axios.post(url + "/api/cart/remove" , {itemId} , {headers:{token}})
            }
        }

           
    const getTotalCartAmount =() =>{
        let totalAmount =0;
       
        for (const item in cartItems){
            if(cartItems[item]>0){
                let itemInfo =food_list.find((product) =>product._id===item);
                totalAmount += itemInfo.price*cartItems[item]
            }
        }

        return totalAmount;
    }

    const getTotalCartQuantity = () => {
        let totalQty = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalQty += cartItems[item];
            }
        }
        return totalQty;
    };

    // Fetch food list from the server/database
    const fetchFoodList = async () => {
        try {
            // Fetch all foods (both admin and customer items are visible to all customers)
            const response = await axios.get(url + "/api/food/list");
            if (response.data && response.data.data) {
                const allFoods = response.data.data;
                console.log('Total foods loaded:', allFoods.length);
                
                // Count admin vs customer items for logging
                const adminFoods = allFoods.filter(food => !food.isCustomerAdded);
                const customerFoods = allFoods.filter(food => food.isCustomerAdded);
                console.log('- Admin foods:', adminFoods.length);
                console.log('- Customer foods:', customerFoods.length);
                
                setFoodList(allFoods);
            }
        } catch (error) {
            console.error('Error fetching food list:', error);
            // Don't throw error, just log it - this prevents the app from crashing
            if (error.response) {
                console.error('Food list error response:', error.response.data);
            }
        }
    }

    // Fetch user profile from the server/database
    const fetchUserProfile = async (userToken) => {
        if (!userToken) return
        
        try {
            const response = await axios.get(`${url}/api/user/profile`, {
                headers: { token: userToken }
            });
            
            if (response.data && response.data.success) {
                console.log('Fetched user profile:', response.data.user);
                setUserProfile(response.data.user);
                return response.data.user;
            } else {
                console.error('Failed to fetch user profile:', response.data);
                // Don't throw error, just log it
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Don't throw error, just log it - this prevents the app from crashing
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
        }
    }

    // Update user profile
    const updateUserProfile = async (profileData) => {
        try {
            const response = await axios.put(
                url + "/api/user/profile",
                profileData,
                { headers: { token } }
            );
            if (response.data && response.data.success) {
                setUserProfile(response.data.user);
                return { success: true };
            }
        } catch (error) {
            console.log('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload profile picture
    const uploadProfilePicture = async (imageFile) => {
        try {
            const formData = new FormData();
            formData.append('profileImage', imageFile);
            
            console.log('Uploading file:', imageFile.name, 'Size:', imageFile.size);
            console.log('Token present:', !!token);
            
            const response = await axios.post(
                url + "/api/user/profile/picture",
                formData,
                { 
                    headers: { 
                        token,
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );
            
            console.log('Upload response:', response.data);
            
            if (response.data && response.data.success) {
                // Immediately update the userProfile with the new image URL
                setUserProfile(prev => ({ ...prev, profileImage: response.data.user.profileImage }));
                return { success: true, imageUrl: response.data.user.profileImage };
            } else {
                console.log('Upload failed:', response.data);
                return { success: false, error: response.data.message || 'Upload failed' };
            }
        } catch (error) {
            console.log('Error uploading profile picture:', error);
            if (error.response) {
                console.log('Error response:', error.response.data);
                return { success: false, error: error.response.data.message || 'Upload failed' };
            } else if (error.code === 'ECONNABORTED') {
                return { success: false, error: 'Upload timeout - please try again' };
            }
            return { success: false, error: error.message || 'Network error' };
        }
    }

    const loadCartData = async (token) => {
        try {
            const response = await axios.post(url + "/api/cart/get" ,{}, {headers:{token}})
            if (response.data && response.data.cartData) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error('Error loading cart data:', error);
            // Don't throw error, just log it - this prevents the app from crashing
            if (error.response) {
                console.error('Cart error response:', error.response.data);
            }
        }
    }

    useEffect(() => {
        async function loadData(){
            // Fetch food list first (all items are visible to all users)
            await fetchFoodList();
            
            if(localStorage.getItem("token")) {
                const userToken = localStorage.getItem("token");
                setToken(userToken);
                await loadCartData(userToken);
                await fetchUserProfile(userToken);
            }
        }
        loadData();
    },[])

    const contextValue = {
        food_list , 
        cartItems ,
        setCartItems , 
        addToCart ,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartQuantity,
        url,
        token,
        setToken,
        userProfile,
        setUserProfile,
        fetchUserProfile,
        updateUserProfile,
        uploadProfilePicture,
        fetchFoodList,
    }
    
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
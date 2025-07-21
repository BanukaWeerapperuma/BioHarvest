import React, { useContext, useState, useEffect } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import CustomerFoodManager from '../CustomerFoodManager/CustomerFoodManager'

const FoodDisplay = ({category}) => {
    const {food_list, token, fetchFoodList} = useContext(StoreContext)
    const [showCustomerManager, setShowCustomerManager] = useState(false)

    const handleFoodAdded = async () => {
        // Refresh the food list when new items are added
        await fetchFoodList()
    }

    const filteredFoods = food_list.filter(item => {
        const categoryMatch = category === "All" || category === item.category;
        const isVerified = item.slsCertificateVerified === true;
        return categoryMatch && isVerified;
    })

    return (
        <div className='food-display' id='food-display'>
            <div className="food-display-header">
                <h2>Fresh Picks Just for You</h2>
                {token && (
                    <button 
                        className="add-your-food-btn"
                        onClick={() => setShowCustomerManager(true)}
                    >
                        + Add Your Food
                    </button>
                )}
            </div>
            <div className="food-display-list">
                {filteredFoods.map((item, index) => {
                    return <FoodItem 
                        key={`${item._id}-${index}`} 
                        id={item._id} 
                        name={item.name}  
                        description={item.description} 
                        price={item.price} 
                        image={item.image}
                        isCustomerAdded={item.isCustomerAdded}
                        slsCertificate={item.slsCertificate}
                        slsCertificateVerified={item.slsCertificateVerified}
                        slsCertificateVerifiedAt={item.slsCertificateVerifiedAt}
                    />
                })}
            </div>
            
            {showCustomerManager && (
                <CustomerFoodManager 
                    onClose={() => setShowCustomerManager(false)}
                    onFoodAdded={handleFoodAdded}
                />
            )}
        </div>
    )
}

export default FoodDisplay
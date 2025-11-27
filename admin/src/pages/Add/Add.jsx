import React, { useState, useEffect } from 'react'
import './Add.css'
import { assets, url } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Add = () => {
    const navigate = useNavigate();
    const { token, admin } = useContext(StoreContext);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Fresh Vegetables"
    });

    const [image, setImage] = useState(false);
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        
        if (!image) {
            toast.error("Please select an image");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description);
            formData.append("price", Number(data.price));
            formData.append("category", data.category);
            formData.append("image", image);
            if (certificate) {
                formData.append("certificate", certificate);
            }
            
            const response = await axios.post(`${url}/api/food/admin/add`, formData);
            if (response.data.success) {
                toast.success(response.data.message);
                setData({
                    name: "",
                    description: "",
                    price: "",
                    category: "Fresh Vegetables"
                });
                setImage(false);
                setCertificate(null);
                // Reset the file input
                const fileInput = document.getElementById('image');
                if (fileInput) fileInput.value = '';
                const certificateInput = document.getElementById('certificate');
                if (certificateInput) certificateInput.value = '';
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error adding food item:', error);
            toast.error("Error adding food item. Please check if backend is running.");
        } finally {
            setLoading(false);
        }
    }

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }));
    }

    useEffect(() => {
        if (!admin && !token) {
            toast.error("Please Login First");
            navigate("/");
        }
    }, [admin, token]);

    return (
        <div className='add'>
            <form className='flex-col' onSubmit={onSubmitHandler}>
                <div className='add-img-upload flex-col'>
                    <p>Upload image</p>
                    <label htmlFor="image">
                        <img src={!image ? assets.upload_area : URL.createObjectURL(image)} alt="" />
                    </label>
                    <input 
                        onChange={(e) => { setImage(e.target.files[0]) }} 
                        type="file" 
                        id="image" 
                        hidden 
                        required 
                        accept="image/*"
                    />
                </div>
                <div className='add-product-name flex-col'>
                    <p>Product name</p>
                    <input 
                        name='name' 
                        onChange={onChangeHandler} 
                        value={data.name} 
                        type="text" 
                        placeholder='Type here' 
                        required 
                    />
                </div>
                <div className='add-product-description flex-col'>
                    <p>Product description</p>
                    <textarea 
                        name='description' 
                        onChange={onChangeHandler} 
                        value={data.description} 
                        rows={6} 
                        placeholder='Write content here' 
                        required 
                    />
                </div>
                <div className='add-category-price'>
                    <div className='add-category flex-col'>
                        <p>Product category</p>
                        <select name='category' onChange={onChangeHandler} value={data.category}>
                            <option value="Fresh Vegetables">Fresh Vegetables</option>
                            <option value="Organic Fruits">Organic Fruits</option>
                            <option value="Dairy & Eggs">Dairy & Eggs</option>
                            <option value="Grains & Pulses">Grains & Pulses</option>
                            <option value="Organic Snacks">Organic Snacks</option>
                            <option value="Herbs & Spices">Herbs & Spices</option>
                            <option value="Oils & Condiments">Oils & Condiments</option>
                            <option value="Personal Care & Wellness">Personal Care & Wellness</option>
                        </select>
                    </div>
                    <div className='add-price flex-col'>
                        <p>Product Price</p>
                        <input 
                            type="Number" 
                            name='price' 
                            onChange={onChangeHandler} 
                            value={data.price} 
                            placeholder='$25' 
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>
                <div className='add-certificate-upload flex-col'>
                    <div className='certificate-header'>
                        <p>SLS Certificate (optional)</p>
                        <span className='certificate-chip'>Verifies authenticity</span>
                    </div>
                    <label htmlFor="certificate" className={`certificate-dropzone ${certificate ? 'has-file' : ''}`}>
                        {certificate ? (
                            <div className='certificate-file'>
                                <span className='file-name'>{certificate.name}</span>
                                <span className='file-size'>{(certificate.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className='certificate-placeholder'>
                                <img src={assets.upload_area} alt="Upload certificate" />
                                <p>Upload scanned SLS certificate (JPG/PNG, max 10MB)</p>
                            </div>
                        )}
                    </label>
                    <input 
                        onChange={(e) => setCertificate(e.target.files[0] || null)} 
                        type="file" 
                        id="certificate" 
                        hidden 
                        accept="image/*"
                    />
                    <small className='certificate-hint'>
                        Certificates uploaded by admins are marked as verified automatically.
                    </small>
                </div>
                <button 
                    type='submit' 
                    className='add-btn' 
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'ADD'}
                </button>
            </form>
        </div>
    )
}

export default Add

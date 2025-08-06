import mongoose from "mongoose";


export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://banukaweerapperuma:nYrnjEqwMzSKymam@cluster0.cvd6b.mongodb.net/food-delivery');
        console.log('DB Connected');
    } catch (error) {
        console.error('DB Connection Failed:', error.message);
    }
};



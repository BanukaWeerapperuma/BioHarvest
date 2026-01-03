const listFeaturedFood = async (req, res) => {
  try {
 
    const foods = await foodModel.find({ featured: true }).lean();
    console.log('Featured Food request - Total items found:', foods.length);
    const foodsWithCertificates = foods.map(food => {
      if (food.slsCertificate) {
        
        if (!food.slsCertificate.url && food.slsCertificate.public_id) {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k';
          food.slsCertificate.url = `https://res.cloudinary.com/${cloudName}/image/upload/${food.slsCertificate.public_id}`;
        }
        // Validate URL format
        if (food.slsCertificate.url && !food.slsCertificate.url.startsWith('http')) {
          console.warn(`Invalid URL for ${food.name}: ${food.slsCertificate.url}`);
        }
      }
      return food;
    });

    res.json({ success: true, data: foodsWithCertificates });
  } catch (error) {
    console.error('Error fetching featured foods:', error);
    res.json({ success: false, message: "Error fetching featured foods" });
  }
};
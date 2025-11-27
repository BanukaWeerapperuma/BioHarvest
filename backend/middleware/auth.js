import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  // Support token in headers, query (for direct file/PDF links), or Authorization header
  let token = req.headers.token;

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  console.log('Auth middleware - token received:', token ? 'Yes' : 'No');
  console.log('Token value:', token ? token.substring(0, 20) + '...' : 'None');
  
  if (!token) {
    console.log('No token provided');
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }
  
  // Handle admin token (for admin panel)
  if (token === 'admin-token' || token === 'dummy-token') {
    console.log('Admin token detected, allowing access');
    // Create a dummy user for admin operations
    req.user = { userId: 'admin-user-id' };
    return next();
  }
  
  // Use environment variable or fallback to a default secret
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';
  console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
  
  try {
    const token_decode = jwt.verify(token, jwtSecret);
    console.log('Auth middleware - token decoded, userId:', token_decode.id);
    // Set userId in req.user to avoid conflicts with multer
    req.user = { userId: token_decode.id };
    next();
  } catch (error) {
    console.log('Auth middleware error:', error);
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');
    res.json({success:false,message:"Error"});
  }
};
export default authMiddleware;

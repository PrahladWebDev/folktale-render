import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Check if Authorization header exists and is properly formatted
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization header missing or improperly formatted',
        error: 'no_auth_header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication token is empty',
        error: 'empty_token'
      });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Internal server error: Configuration issue',
        error: 'server_config_error'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ 
        message: 'Invalid token payload',
        error: 'invalid_token_payload'
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found or account deleted',
        error: 'user_not_found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid or malformed token',
        error: 'invalid_token'
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token has expired',
        error: 'token_expired'
      });
    }

    // Handle database or unexpected errors
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication',
      error: 'server_error'
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // Call auth middleware and pass a callback
    await auth(req, res, async () => {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required',
          error: 'auth_required'
        });
      }
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          message: 'Administrator access required',
          error: 'admin_access_denied'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during admin authentication',
      error: 'server_error'
    });
  }
};

export { auth, adminAuth };

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const config = process.env;

exports.authenticate = (req, res, next) => {
  console.log('Authentication middleware called for:', req.method, req.path);
  const authHeader = req.headers['authorization'] || '';
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully, payload:', payload);
    req.user = payload;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware to check if the user has the required documents
 * This is a placeholder - you should implement the actual document verification logic
 * based on your application's requirements
 */
exports.requireDocuments = (req, res, next) => {
  // For now, we'll just log and continue
  // In a real application, you would check if the user has uploaded the required documents
  console.log('Checking if user has required documents');
  
  // Example: Check if user has uploaded required documents
  // This is a placeholder - replace with your actual document verification logic
  const hasRequiredDocuments = true; // Replace with actual check
  
  if (!hasRequiredDocuments) {
    return res.status(403).json({ 
      error: 'Document verification required',
      message: 'Please upload the required documents to access this feature'
    });
  }
  
  next();
};

exports.authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase();
    if (!allowedRoles.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
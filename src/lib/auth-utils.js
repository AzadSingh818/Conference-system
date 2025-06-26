// src/lib/auth-utils.js
// No JWT import needed for client-side

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Client-side: Store token in localStorage
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    console.log('✅ Token saved to localStorage');
  }
};

// Client-side: Get token from localStorage
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Client-side: Remove token
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    console.log('🗑️ Token removed from localStorage');
  }
};

// Simple token validation - just check if exists and not expired
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) {
    console.log('❌ No token found');
    return false;
  }
  
  try {
    // Simple JWT decode without verification (client-side safe)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isValid = payload.exp ? payload.exp > Date.now() / 1000 : false;
    console.log('🔍 Token validation:', isValid ? 'Valid' : 'Expired');
    return isValid;
  } catch (error) {
    console.log('❌ Token parsing error:', error);
    return false;
  }
};

// Get current user from token (simple decode)
export const getCurrentUser = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('👤 Current user:', payload);
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.log('❌ User parsing error:', error);
    return null;
  }
};

// API call helper with auth
export const apiCall = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle auth errors
  if (response.status === 401) {
    console.log('🔒 Unauthorized - redirecting to login');
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/delegate-login';
    }
  }
  
  return response;
};

// Login helper function
export const loginUser = async (email, password) => {
  try {
    console.log('🔄 Attempting login for:', email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('📡 Login response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Login response data:', data);
    
    if (data.success && data.token) {
      console.log('✅ Login successful! Setting token...');
      setAuthToken(data.token);
      return {
        success: true,
        message: data.message,
        user: data.user
      };
    }
    
    console.log('❌ Login failed:', data.message);
    return {
      success: false,
      message: data.message || 'Login failed'
    };
  } catch (error) {
    console.log('🚨 Login network error:', error);
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
};

// Register helper function
export const registerUser = async (userData) => {
  try {
    console.log('🔄 Attempting registration for:', userData.email);
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password,
        institution: userData.institution,
        phone: userData.phone,
      }),
    });
    
    console.log('📡 Registration response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Registration response data:', data);
    
    if (data.success) {
      console.log('✅ Registration successful! Attempting auto-login...');
      const loginResult = await loginUser(userData.email, userData.password);
      return loginResult;
    }
    
    console.log('❌ Registration failed:', data.message);
    return {
      success: false,
      message: data.message || 'Registration failed'
    };
  } catch (error) {
    console.log('🚨 Registration network error:', error);
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
};

// Logout helper
export const logoutUser = () => {
  console.log('🔄 Logging out user...');
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/delegate-login';
  }
};

// Generate registration ID helper
export const generateRegistrationId = () => {
  const prefix = 'APBMT2025-';
  const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return prefix + randomNum;
};
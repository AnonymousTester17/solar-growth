import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for existing user and token in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        // Verify token is still valid
        verifyToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Update localStorage whenever user or token changes
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user, token]);

  // Network error handler
  const handleNetworkError = (error) => {
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please try again later.');
    }
    throw error;
  };

  // Token verification with refresh logic
  const verifyToken = useCallback(async (authToken) => {
    if (!authToken) return false;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      } else if (response.status === 401) {
        // Token is invalid or expired
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return false;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return false;
    }
  }, []);

  // API request wrapper with token refresh
  const apiRequest = useCallback(async (url, options = {}) => {
    const makeRequest = async (authToken) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          ...options.headers,
        },
      });

      if (response.status === 401 && authToken && !isRefreshing) {
        // Token expired, try to refresh
        setIsRefreshing(true);
        const isValid = await verifyToken(authToken);
        setIsRefreshing(false);
        
        if (!isValid) {
          throw new Error('Session expired. Please log in again.');
        }
        
        // Retry the request with the same token (if it's still valid)
        return makeRequest(authToken);
      }

      return response;
    };

    try {
      return await makeRequest(token);
    } catch (error) {
      handleNetworkError(error);
    }
  }, [token, verifyToken, isRefreshing]);

  const register = async (username, phone, email, password, confirmPassword) => {
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          phone,
          email,
          password,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.join(', '));
        }
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      return data; // Returns userId for OTP verification
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const sendOTP = async (phone) => {
    try {
      const response = await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.join(', '));
        }
        throw new Error(error.message || 'Failed to send OTP');
      }

      return await response.json();
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      const response = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.join(', '));
        }
        throw new Error(error.message || 'OTP verification failed');
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const login = async (usernameOrPhone, password) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usernameOrPhone,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.join(', '));
        }
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          throw new Error(error.errors.join(', '));
        }
        throw new Error(error.message || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isRefreshing,
    register,
    sendOTP,
    verifyOTP,
    login,
    logout,
    updateProfile,
    apiRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
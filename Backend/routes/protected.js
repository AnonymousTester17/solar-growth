const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Home route - Dashboard data
router.get('/home', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Mock dashboard data - you can replace with actual data from your database
    const dashboardData = {
      user: user.getPublicProfile(),
      stats: {
        totalAmount: user.totalAmount || 0,
        depositedAmount: user.depositedAmount || 0,
        withdrawnAmount: user.withdrawnAmount || 0,
        netAmount: (user.totalAmount || 0) - (user.withdrawnAmount || 0)
      },
      recentActivity: [
        { id: 1, action: 'Deposit', description: 'Solar investment deposit', amount: 5000, time: new Date() },
        { id: 2, action: 'Withdrawal', description: 'Profit withdrawal', amount: 1200, time: new Date(Date.now() - 3600000) },
        { id: 3, action: 'Investment', description: 'New solar project', amount: 3000, time: new Date(Date.now() - 7200000) }
      ],
      quickActions: [
        { id: 1, title: 'Deposit', icon: 'plus', route: '/deposit' },
        { id: 2, title: 'Withdraw', icon: 'minus', route: '/withdraw' },
        { id: 3, title: 'Investments', icon: 'chart', route: '/investments' },
        { id: 4, title: 'Profile', icon: 'user', route: '/profile' }
      ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
  }
});

// Profile route - Get user profile only
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
});

// Profile update route
router.put('/user/profile', auth, async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
      user.username = username;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      user.email = email;
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      }
      user.phone = phone;
    }

    await user.save();

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

// Teams route
router.get('/teams', auth, async (req, res) => {
  try {
    // Mock teams data - replace with actual database queries
    const teams = [
      {
        id: 1,
        name: 'Solar Installation Team',
        members: [
          { id: 1, name: 'John Doe', role: 'Team Lead', avatar: '' },
          { id: 2, name: 'Jane Smith', role: 'Technician', avatar: '' },
          { id: 3, name: 'Mike Johnson', role: 'Technician', avatar: '' }
        ],
        projects: 5,
        activeProjects: 3
      },
      {
        id: 2,
        name: 'Maintenance Team',
        members: [
          { id: 4, name: 'Sarah Wilson', role: 'Team Lead', avatar: '' },
          { id: 5, name: 'Tom Brown', role: 'Technician', avatar: '' }
        ],
        projects: 3,
        activeProjects: 2
      }
    ];

    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teams', error: error.message });
  }
});

module.exports = router; 
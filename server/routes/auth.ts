import { RequestHandler } from 'express';
import { AuthService } from '../services/auth-service';
import { RegisterRequest, LoginRequest } from '@shared/api';

// Register new player
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { username, name, email, password } = req.body as RegisterRequest;

    // Validate inputs
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const result = await AuthService.registerPlayer(username, name, email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set auth cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      token: result.token,
      player: result.player
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Login player
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body as LoginRequest;

    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    const result = await AuthService.loginPlayer(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set auth cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token: result.token,
      player: result.player
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Admin login - with sitewide admin recognition
export const handleAdminLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    const result = await AuthService.loginAdmin(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set admin cookie
    res.cookie('admin_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Try to find a player account with the same email (sitewide admin recognition)
    let playerProfile = null;
    let playerToken = null;

    try {
      const dbQueries = await import('../db/queries');
      const playerResult = await dbQueries.getPlayerByEmail(email);

      if (playerResult.rows.length > 0) {
        const player = playerResult.rows[0];
        // Generate a player token for sitewide access
        playerToken = AuthService.generateJWT({ playerId: player.id, role: 'player' }, false);
        playerProfile = {
          id: player.id,
          username: player.username,
          name: player.name,
          email: player.email,
          gc_balance: player.gc_balance,
          sc_balance: player.sc_balance,
          status: player.status,
          kyc_level: player.kyc_level,
          kyc_verified: player.kyc_verified,
          created_at: player.created_at,
          last_login: player.last_login
        };
      }
    } catch (e) {
      console.warn('[Auth] Could not find associated player account for admin');
    }

    res.json({
      success: true,
      adminToken: result.token,
      playerToken: playerToken || null,
      admin: result.admin,
      playerProfile: playerProfile || null,
      isSitewideAdmin: !!playerProfile
    });
  } catch (error) {
    console.error('[Auth] Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin login failed'
    });
  }
};

// Get current player profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const profile = await AuthService.getPlayerProfile(req.user.playerId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

// Update player profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const { name, email, password } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const updated = await AuthService.updatePlayerProfile(req.user.playerId, updates);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Logout player
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Clear cookies
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

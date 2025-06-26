// src/app/api/admin/login/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Admin credentials (in production, store in database with hashed password)
const ADMIN_CREDENTIALS = {
  email: 'admin@apbmt2025.org',
  password: 'APBMT@2025#Admin', // This should be hashed in production
  name: 'APBMT Conference Admin',
  role: 'admin'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request) {
  try {
    console.log('🔐 Admin login attempt');
    
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Check admin credentials
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      console.log('❌ Invalid admin credentials for:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid admin credentials' 
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    console.log('✅ Admin login successful for:', email);

    // Create response
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Admin login successful',
        admin: {
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role
        },
        token: token // Also return token in response for client-side storage
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Admin logout
export async function DELETE(request) {
  try {
    console.log('🚪 Admin logout request');

    const response = NextResponse.json(
      { 
        success: true,
        message: 'Admin logout successful' 
      },
      { status: 200 }
    );

    // Clear the admin token cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Admin logout error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Logout failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Verify admin token
export async function GET(request) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No admin token found' 
        },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role !== 'admin') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid admin role' 
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        admin: {
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        },
        tokenValid: true
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired token' 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Admin verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Token verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

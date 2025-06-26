// src/app/api/auth/login/route.js
// 🚀 COMPLETELY FIXED LOGIN API

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { getUserByEmail, testConnection } from '@/lib/database-postgres';

console.log('🔐 Login API Route loaded with PostgreSQL');

export async function POST(request) {
  try {
    console.log('📥 [LOGIN] Login request received');
    
    // ========================================
    // 🚀 FIX 1: PROPER DATABASE CONNECTION TEST
    // ========================================
    
    try {
      await testConnection(); // ✅ Returns boolean or throws error, not object
      console.log('✅ [LOGIN] PostgreSQL database connected successfully');
    } catch (connectionError) {
      console.error('❌ [LOGIN] Database connection failed:', connectionError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: 'Unable to connect to database. Please try again later.'
      }, { status: 500 });
    }
    
    // ========================================
    // 🚀 FIX 2: SAFE REQUEST PARSING
    // ========================================
    
    let requestData;
    try {
      requestData = await request.json();
      console.log('📋 [LOGIN] Request data parsed successfully');
    } catch (parseError) {
      console.error('❌ [LOGIN] Request parsing error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid request format',
        error: 'Request body must be valid JSON'
      }, { status: 400 });
    }
    
    const { email, password } = requestData;
    
    console.log('🔑 [LOGIN] Login attempt for email:', email);
    
    // ========================================
    // 🚀 FIX 3: COMPREHENSIVE VALIDATION
    // ========================================
    
    // Required field validation
    if (!email || !password) {
      console.log('❌ [LOGIN] Missing email or password');
      return NextResponse.json({
        success: false,
        message: 'Email and password are required',
        error: 'Both email and password must be provided'
      }, { status: 400 });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ [LOGIN] Invalid email format:', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email address'
      }, { status: 400 });
    }
    
    // Password length validation
    if (password.length < 1) {
      console.log('❌ [LOGIN] Empty password provided');
      return NextResponse.json({
        success: false,
        message: 'Password cannot be empty',
        error: 'Please provide your password'
      }, { status: 400 });
    }
    
    // ========================================
    // 🚀 FIX 4: SAFE USER LOOKUP
    // ========================================
    
    let user;
    try {
      user = await getUserByEmail(email.toLowerCase().trim());
      console.log('📊 [LOGIN] User lookup result:', user ? 'Found' : 'Not found');
    } catch (userError) {
      console.error('❌ [LOGIN] Error getting user:', userError);
      return NextResponse.json({
        success: false,
        message: 'Database error during user lookup',
        error: 'Unable to verify credentials. Please try again.'
      }, { status: 500 });
    }
    
    if (!user) {
      console.log('❌ [LOGIN] User not found:', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password',
        error: 'No account found with this email address'
      }, { status: 401 });
    }
    
    // ========================================
    // 🚀 FIX 5: SECURE PASSWORD VERIFICATION
    // ========================================
    
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 [LOGIN] Password verification:', isValidPassword ? 'Valid' : 'Invalid');
    } catch (passwordError) {
      console.error('❌ [LOGIN] Password verification error:', passwordError);
      return NextResponse.json({
        success: false,
        message: 'Password verification failed',
        error: 'Unable to verify password. Please try again.'
      }, { status: 500 });
    }
    
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Invalid password for user:', email);
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password',
        error: 'Incorrect password provided'
      }, { status: 401 });
    }
    
    // ========================================
    // 🚀 FIX 6: SECURE JWT TOKEN GENERATION
    // ========================================
    
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.full_name,
          registrationId: user.registration_id,
          loginTime: new Date().toISOString()
        },
        process.env.JWT_SECRET || 'apbmt-jwt-secret-2025',
        { 
          expiresIn: '7d',
          issuer: 'apbmt-2025',
          audience: 'apbmt-delegates'
        }
      );
      console.log('🎫 [LOGIN] JWT token generated successfully');
    } catch (tokenError) {
      console.error('❌ [LOGIN] Token generation error:', tokenError);
      return NextResponse.json({
        success: false,
        message: 'Authentication token generation failed',
        error: 'Unable to create session. Please try again.'
      }, { status: 500 });
    }
    
    // ========================================
    // 🚀 FIX 7: COMPREHENSIVE SUCCESS RESPONSE
    // ========================================
    
    const successResponse = {
      success: true,
      message: 'Login successful! Welcome back to APBMT 2025.',
      token: token,
      
      // User information
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        fullName: user.full_name, // Alternative field name
        institution: user.institution || 'Not specified',
        phone: user.phone || 'Not provided',
        registrationId: user.registration_id,
        createdAt: user.created_at
      },
      
      // Alternative naming for frontend compatibility
      userId: user.id,
      userEmail: user.email,
      userName: user.full_name,
      
      // Session metadata
      loginTime: new Date().toISOString(),
      tokenExpiry: '7d',
      database: 'PostgreSQL',
      
      // Additional response data
      sessionInfo: {
        loginMethod: 'email_password',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('🎉 [LOGIN] Login completed successfully for:', user.email);
    console.log('✅ [LOGIN] User ID:', user.id);
    console.log('✅ [LOGIN] Institution:', user.institution || 'Not specified');
    
    return NextResponse.json(successResponse, {
      status: 200,
      headers: {
        'X-User-ID': user.id.toString(),
        'X-Login-Success': 'true',
        'X-Database': 'PostgreSQL',
        'X-Token-Expiry': '7d'
      }
    });
    
  } catch (error) {
    console.error('❌ [LOGIN] Fatal login error:', error);
    
    // ========================================
    // 🚀 FIX 8: COMPREHENSIVE ERROR HANDLING
    // ========================================
    
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json({
        success: false,
        message: 'Database connection error',
        error: 'Unable to connect to database. Please try again later.'
      }, { status: 500 });
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        success: false,
        message: 'Authentication error',
        error: 'Unable to create session. Please try again.'
      }, { status: 500 });
    }
    
    // Request parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request format',
        error: 'Request data is malformed. Please check your input.'
      }, { status: 400 });
    }
    
    // Generic server error
    return NextResponse.json({
      success: false,
      message: 'Login failed',
      error: 'An unexpected error occurred. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// ========================================
// OPTIONS - CORS handling
// ========================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-API-Route': 'login',
      'X-Database': 'PostgreSQL'
    },
  });
}

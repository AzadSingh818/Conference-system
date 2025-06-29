// src/app/api/auth/register/route.js
// 🚀 COMPLETELY FIXED REGISTRATION AP

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  createUser,
  getUserByEmail,
  testConnection,
  initializeDatabase,
} from "@/lib/database-postgres";
import { sendEmail, generateRegistrationEmail } from "@/lib/email-service";

console.log("🚀 Registration API Route loaded with PostgreSQL");

export async function POST(request) {
  try {
    console.log("📥 [REGISTER] Registration request received");

    // ========================================
    // 🚀 FIX 1: PROPER DATABASE CONNECTION TEST
    // ========================================

    try {
      await testConnection(); // ✅ Returns boolean or throws error, not object
      console.log("✅ [REGISTER] PostgreSQL database connected successfully");
    } catch (connectionError) {
      console.error(
        "❌ [REGISTER] Database connection failed:",
        connectionError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: "Unable to connect to database. Please try again later.",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 🚀 FIX 2: SAFE DATABASE INITIALIZATION
    // ========================================

    try {
      await initializeDatabase();
      console.log("✅ [REGISTER] Database tables verified");
    } catch (initError) {
      console.error("❌ [REGISTER] Database initialization error:", initError);
      // Continue anyway - tables might exist
    }

    // ========================================
    // 🚀 FIX 3: PROPER REQUEST PARSING WITH ERROR HANDLING
    // ========================================

    let requestData;
    try {
      requestData = await request.json();
      console.log("📋 [REGISTER] Request data parsed successfully");
    } catch (parseError) {
      console.error("❌ [REGISTER] Request parsing error:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format",
          error: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 🚀 FIX 4: FLEXIBLE FIELD MAPPING FOR DIFFERENT FRONTEND FORMATS
    // ========================================

    // Support multiple frontend naming conventions
    const userData = {
      email: requestData.email,
      password: requestData.password,
      // Support both naming conventions
      full_name:
        requestData.full_name ||
        requestData.fullName ||
        `${requestData.firstName || ""} ${requestData.lastName || ""}`.trim(),
      institution: requestData.institution || requestData.institution || "",
      phone: requestData.phone || requestData.phoneNumber || "",
      // Additional fields that might be sent
      specialty: requestData.specialty || "",
      country: requestData.country || "",
    };

    console.log("📝 [REGISTER] User data mapped:", {
      email: userData.email,
      full_name: userData.full_name,
      institution: userData.institution || "Not provided",
      phone: userData.phone || "Not provided",
    });

    // ========================================
    // 🚀 FIX 5: COMPREHENSIVE VALIDATION
    // ========================================

    // Required field validation
    if (!userData.email || !userData.password || !userData.full_name) {
      console.log("❌ [REGISTER] Validation failed: Missing required fields");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          error: "Email, password, and full name are required",
          missingFields: {
            email: !userData.email,
            password: !userData.password,
            full_name: !userData.full_name,
          },
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      console.log("❌ [REGISTER] Invalid email format:", userData.email);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
          error: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    // Password strength validation
    if (userData.password.length < 6) {
      console.log("❌ [REGISTER] Password too short");
      return NextResponse.json(
        {
          success: false,
          message: "Password too short",
          error: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // ========================================
    // 🚀 FIX 6: CHECK FOR EXISTING USER
    // ========================================

    try {
      const existingUser = await getUserByEmail(
        userData.email.toLowerCase().trim()
      );
      if (existingUser) {
        console.log("❌ [REGISTER] User already exists:", userData.email);
        return NextResponse.json(
          {
            success: false,
            message: "User already exists",
            error: "An account with this email address already exists",
          },
          { status: 400 }
        );
      }
      console.log("✅ [REGISTER] Email is available");
    } catch (checkError) {
      console.error("❌ [REGISTER] Error checking existing user:", checkError);
      // Continue with registration - the createUser will handle duplicates
    }

    // ========================================
    // 🚀 FIX 7: SECURE PASSWORD HASHING
    // ========================================

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(userData.password, 12);
      console.log("🔐 [REGISTER] Password hashed successfully");
    } catch (hashError) {
      console.error("❌ [REGISTER] Password hashing error:", hashError);
      return NextResponse.json(
        {
          success: false,
          message: "Password processing error",
          error: "Unable to process password. Please try again.",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 🚀 FIX 8: PROPER createUser CALL (No .success check)
    // ========================================

    let newUser;
    try {
      // createUser returns user object directly, not { success, user }
      newUser = await createUser({
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        full_name: userData.full_name.trim(),
        institution: userData.institution?.trim() || null,
        phone: userData.phone?.trim() || null,
        registration_id: null, // Will be set later if needed
      });

      console.log("✅ [REGISTER] User created successfully:", {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
      });
    } catch (createError) {
      console.error("❌ [REGISTER] User creation error:", createError);

      // Handle specific PostgreSQL errors
      if (createError.code === "23505") {
        // Unique violation
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists",
            error: "An account with this email address already exists",
          },
          { status: 400 }
        );
      }

      if (createError.code === "23502") {
        // Not null violation
        return NextResponse.json(
          {
            success: false,
            message: "Missing required information",
            error: "Please fill in all required fields",
          },
          { status: 400 }
        );
      }

      // Generic database error
      return NextResponse.json(
        {
          success: false,
          message: "Registration failed",
          error: "Unable to create account. Please try again later.",
        },
        { status: 500 }
      );
    }

    // ========================================
    // 🚀 FIX 9: GENERATE JWT TOKEN FOR AUTO-LOGIN
    // ========================================

    let token;
    try {
      token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          name: newUser.full_name,
          registrationId: newUser.registration_id,
        },
        process.env.JWT_SECRET || "apbmt-jwt-secret-2025",
        { expiresIn: "7d" }
      );
      console.log("🎫 [REGISTER] JWT token generated successfully");
    } catch (tokenError) {
      console.error("❌ [REGISTER] Token generation error:", tokenError);
      // Continue without token - user can login manually
      token = null;
    }

    if (newUser) {
      try {
        const emailPayload = generateRegistrationEmail({
          full_name: newUser.full_name,
          email: newUser.email,
          password: requestData.password, // Consider security implications
        });
        
        const emailResult = await sendEmail(emailPayload);
        if (emailResult.success) {
          console.log("�� Registration email sent successfully");
        }
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Don't fail registration if email fails
      }
    }
    // ========================================
    // 🚀 FIX 10: COMPREHENSIVE SUCCESS RESPONSE
    // ========================================

    const successResponse = {
      success: true,
      message: "Registration successful! Welcome to APBMT 2025.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.full_name,
        fullName: newUser.full_name, // Alternative field name
        institution: newUser.institution,
        phone: newUser.phone,
        registrationId: newUser.registration_id,
        createdAt: newUser.created_at,
      },
      token: token,

      // Additional response data for frontend compatibility
      userId: newUser.id,
      userEmail: newUser.email,
      userName: newUser.full_name,

      // Registration metadata
      timestamp: new Date().toISOString(),
      database: "PostgreSQL",
      autoLogin: !!token,
    };

    console.log(
      "🎉 [REGISTER] Registration completed successfully for:",
      newUser.email
    );

    return NextResponse.json(successResponse, {
      status: 201,
      headers: {
        "X-User-ID": newUser.id.toString(),
        "X-Registration-Success": "true",
        "X-Database": "PostgreSQL",
      },
    });
  } catch (error) {
    console.error("❌ [REGISTER] Fatal registration error:", error);

    // ========================================
    // 🚀 FIX 11: COMPREHENSIVE ERROR HANDLING
    // ========================================

    // Database connection errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection error",
          error: "Unable to connect to database. Please try again later.",
        },
        { status: 500 }
      );
    }

    // JWT errors
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication setup error",
          error:
            "Unable to setup user session. Please try logging in manually.",
        },
        { status: 500 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      {
        success: false,
        message: "Registration failed",
        error: "An unexpected error occurred. Please try again later.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ========================================
// OPTIONS - CORS handling
// ========================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-API-Route": "register",
      "X-Database": "PostgreSQL",
    },
  });
}

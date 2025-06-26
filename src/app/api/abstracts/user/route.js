// src/app/api/abstracts/user/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserAbstracts, testConnection } from '@/lib/database-postgres';

// Extract user from JWT token
function getUserFromToken(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

// GET - Fetch user's abstracts from PostgreSQL
export async function GET(request) {
  try {
    // Test database connection first
    await testConnection();

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify user token
    const user = getUserFromToken(authHeader);
    console.log('🔍 Fetching abstracts for user:', user.email, 'ID:', user.userId);

    // Get user's abstracts from PostgreSQL
    const userAbstracts = await getUserAbstracts(user.userId);

    // Calculate user stats
    const stats = {
      total: userAbstracts.length,
      pending: userAbstracts.filter(a => a.status === 'pending').length,
      approved: userAbstracts.filter(a => a.status === 'approved').length,
      rejected: userAbstracts.filter(a => a.status === 'rejected').length,
      final_submitted: userAbstracts.filter(a => a.status === 'final_submitted').length
    };

    console.log(`📊 User ${user.email} has ${userAbstracts.length} abstracts`);

    return NextResponse.json({
      success: true,
      abstracts: userAbstracts,
      stats,
      user: {
        email: user.email,
        name: user.name,
        id: user.userId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user abstracts:', error);
    
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch abstracts',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Submit new abstract for user (redirect to main API)
export async function POST(request) {
  try {
    // Test database connection
    await testConnection();

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify user token
    const user = getUserFromToken(authHeader);
    const submissionData = await request.json();

    console.log('📝 User submission from:', user.email);

    // Forward to main abstracts API with user context
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/abstracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Pass through authorization
      },
      body: JSON.stringify(submissionData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ User submission successful for:', user.email);
      return NextResponse.json(result);
    } else {
      throw new Error(result.message || result.error || 'Submission failed');
    }

  } catch (error) {
    console.error('❌ User submission error:', error);
    
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to submit abstract',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update user's abstract (redirect to main API)
export async function PUT(request) {
  try {
    // Test database connection
    await testConnection();

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify user token
    const user = getUserFromToken(authHeader);
    const updateData = await request.json();

    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Abstract ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 User updating abstract:', updateData.id, 'by:', user.email);

    // Forward to main abstracts API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/abstracts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Pass through authorization
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ User update successful for:', user.email);
      return NextResponse.json(result);
    } else {
      throw new Error(result.message || result.error || 'Update failed');
    }

  } catch (error) {
    console.error('❌ Error updating user abstract:', error);
    
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update abstract',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user's abstract (redirect to main API)
export async function DELETE(request) {
  try {
    // Test database connection
    await testConnection();

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify user token
    const user = getUserFromToken(authHeader);
    
    const url = new URL(request.url);
    const abstractId = url.searchParams.get('id');

    if (!abstractId) {
      return NextResponse.json(
        { error: 'Abstract ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ User deleting abstract:', abstractId, 'by:', user.email);

    // Forward to main abstracts API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/abstracts?id=${abstractId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader // Pass through authorization
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ User deletion successful for:', user.email);
      return NextResponse.json(result);
    } else {
      throw new Error(result.message || result.error || 'Deletion failed');
    }

  } catch (error) {
    console.error('❌ Error deleting user abstract:', error);
    
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete abstract',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

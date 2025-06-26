// src/app/api/abstracts/route.js
// 🚀 COMPLETE FIXED VERSION - Replace entire file

import { NextResponse } from 'next/server'; // 🚀 FIX: Added missing import
import jwt from 'jsonwebtoken';
import { 
  createAbstract, 
  getAllAbstracts, 
  updateAbstract, 
  deleteAbstract,
  getAbstractById,
  testConnection 
} from '../../../lib/database-postgres.js';

// Enhanced logging
console.log('🚀 APBMT Abstracts API Route (PostgreSQL) loaded at:', new Date().toISOString());

// Helper function to verify JWT token
function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    throw error;
  }
}

// POST - Submit new abstract
export async function POST(request) {
  try {
    console.log('📤 New abstract submission received');
    
    // Test database connection first
    await testConnection();
    console.log('✅ Database connection successful');

    // Parse request data
    let submissionData;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      submissionData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      submissionData = {
        title: formData.get('title'),
        presenter_name: formData.get('presenter_name'),
        institution_name: formData.get('institution_name'),
        presentation_type: formData.get('presentation_type'),
        abstract_content: formData.get('abstract_content'),
        co_authors: formData.get('co_authors') || '',
        registration_id: formData.get('registration_id') || '',
        userEmail: formData.get('userEmail'),
        userId: formData.get('userId')
      };
      
      // Handle file if present
      const file = formData.get('file');
      if (file && file.size > 0) {
        submissionData.file = file;
      }
    } else {
      submissionData = await request.json();
    }

    console.log('📝 Submission data received:', {
      title: submissionData.title?.substring(0, 50) + '...',
      presenter: submissionData.presenter_name,
      type: submissionData.presentation_type
    });

    // Get user info from token (if available)
    let decoded = null;
    try {
      decoded = verifyToken(request);
      console.log('✅ User authenticated:', decoded.email);
    } catch (authError) {
      console.log('⚠️ No valid token provided, treating as guest submission');
    }

    // Validation
    const requiredFields = ['title', 'presenter_name', 'institution_name', 'presentation_type', 'abstract_content'];
    const missingFields = requiredFields.filter(field => !submissionData[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields', 
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate word count based on presentation type
    const wordLimits = {
      'Free Paper': 300,
      'Poster': 300,
      'E-Poster': 300,
      'Award Paper': 300,
      'Oral Paper': 250,
      'Oral Presentation': 250
    };

    const wordCount = submissionData.abstract_content.trim().split(/\s+/).length;
    const limit = wordLimits[submissionData.presentation_type];
    
    if (limit && wordCount > limit) {
      console.log('❌ Word count exceeded:', wordCount, 'limit:', limit);
      return NextResponse.json(
        { 
          success: false, 
          error: `Abstract exceeds word limit. ${wordCount} words (max ${limit} for ${submissionData.presentation_type})` 
        },
        { status: 400 }
      );
    }

    // Prepare abstract data for database
    const abstractData = {
      user_id: decoded?.userId || 1, // Default to 1 if no auth
      title: submissionData.title,
      presenter_name: submissionData.presenter_name,
      institution_name: submissionData.institution_name,
      presentation_type: submissionData.presentation_type,
      abstract_content: submissionData.abstract_content,
      co_authors: submissionData.co_authors || '',
      registration_id: submissionData.registration_id || '',
      file_path: null,
      file_name: null,
      file_size: null
    };

    // Handle file upload if present
    if (submissionData.file) {
      console.log('📎 File attached:', submissionData.file.name, submissionData.file.size);
      abstractData.file_name = submissionData.file.name;
      abstractData.file_size = submissionData.file.size;
      abstractData.file_path = `/uploads/${Date.now()}-${submissionData.file.name}`;
    }

    console.log('✅ Validation passed, creating abstract in PostgreSQL...');

    // Create abstract in database
    const newAbstract = await createAbstract(abstractData);
    console.log('✅ Abstract created successfully:', newAbstract.id);

    // Send confirmation email (async, don't wait)
    try {
      const emailData = {
        abstractId: newAbstract.id,
        title: newAbstract.title,
        author: newAbstract.presenter_name,
        email: submissionData.userEmail || decoded?.email || 'not-provided@example.com',
        institution: newAbstract.institution_name,
        submissionDate: newAbstract.submission_date
      };

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'submission_confirmation',
          data: emailData
        })
      }).catch(err => console.error('Confirmation email failed:', err));

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the submission if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Abstract submitted successfully',
      abstract: {
        id: newAbstract.id,
        title: newAbstract.title,
        presenter_name: newAbstract.presenter_name,
        status: newAbstract.status,
        submission_date: newAbstract.submission_date,
        abstract_number: newAbstract.abstract_number
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Abstract submission error:', error);
    
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
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

// 🚀 FIX: GET - Static route configuration to prevent dynamic server usage
export const dynamic = 'force-dynamic'; // This fixes the static rendering issue

export async function GET(request) {
  try {
    console.log('📊 [API] GET abstracts request received');
    
    await testConnection();
    console.log('✅ [API] Database connection successful');
    
    // 🚀 FIX: Use searchParams instead of request.url for better static compatibility
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    console.log('📊 [API] Filters - Status:', status, 'Limit:', limit);
    
    // Get abstracts from PostgreSQL with proper field mapping
    let abstracts = await getAllAbstracts();
    
    console.log(`📊 [API] Retrieved ${abstracts.length} abstracts from database`);
    
    // Filter by status if provided
    if (status && status !== 'all') {
      const originalCount = abstracts.length;
      abstracts = abstracts.filter(abstract => 
        abstract.status && abstract.status.toLowerCase() === status.toLowerCase()
      );
      console.log(`🔍 [API] Filtered ${originalCount} → ${abstracts.length} with status: ${status}`);
    }
    
    // Sort by submission date (newest first)
    abstracts.sort((a, b) => {
      try {
        const dateA = new Date(a.submission_date || a.submissionDate);
        const dateB = new Date(b.submission_date || b.submissionDate);
        return dateB - dateA;
      } catch (sortError) {
        console.warn('⚠️ [API] Date sorting error:', sortError);
        return 0;
      }
    });
    
    // Limit results
    const originalCount = abstracts.length;
    abstracts = abstracts.slice(0, limit);
    
    if (originalCount > limit) {
      console.log(`📋 [API] Limited results from ${originalCount} to ${limit}`);
    }
    
    // Calculate statistics safely
    let stats;
    try {
      const allAbstracts = await getAllAbstracts();
      
      stats = {
        total: allAbstracts.length,
        pending: allAbstracts.filter(a => (a.status || 'pending').toLowerCase() === 'pending').length,
        approved: allAbstracts.filter(a => (a.status || 'pending').toLowerCase() === 'approved').length,
        rejected: allAbstracts.filter(a => (a.status || 'pending').toLowerCase() === 'rejected').length,
        final_submitted: allAbstracts.filter(a => (a.status || 'pending').toLowerCase() === 'final_submitted').length
      };
      
      console.log('📊 [API] Statistics calculated:', stats);
    } catch (statsError) {
      console.error('❌ [API] Statistics calculation error:', statsError);
      stats = {
        total: abstracts.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        final_submitted: 0
      };
    }
    
    // Final validation of abstracts
    const validatedAbstracts = abstracts.map((abstract, index) => {
      return {
        ...abstract,
        
        // Ensure core fields exist
        id: abstract.id || index + 1,
        title: abstract.title || 'Untitled',
        author: abstract.author || abstract.presenter_name || 'Unknown',
        presenter_name: abstract.presenter_name || abstract.author || 'Unknown',
        email: abstract.email || 'N/A',
        mobile_no: abstract.mobile_no || abstract.phone || abstract.mobile || 'N/A',
        status: abstract.status || 'pending',
        category: abstract.category || abstract.presentation_type || 'Free Paper',
        presentation_type: abstract.presentation_type || abstract.category || 'Free Paper',
        
        // Ensure safe string operations
        statusLower: (abstract.status || 'pending').toLowerCase(),
        presentationTypeLower: (abstract.presentation_type || abstract.category || 'free paper').toLowerCase(),
        
        // Ensure dates are valid
        submission_date: abstract.submission_date || new Date().toISOString(),
        submissionDate: abstract.submissionDate || abstract.submission_date || new Date().toISOString(),
        
        // Ensure other fields
        co_authors: abstract.co_authors || abstract.coAuthors || 'N/A',
        institution_name: abstract.institution_name || abstract.institution || abstract.affiliation || 'N/A',
        abstract_number: abstract.abstract_number || abstract.abstractNumber || `ABST-${String(index + 1).padStart(3, '0')}`,
        registration_id: abstract.registration_id || abstract.registrationId || 'N/A'
      };
    });
    
    console.log('📤 [API] Preparing response with', validatedAbstracts.length, 'validated abstracts');
    
    // Return response in multiple formats for frontend compatibility
    const response = {
      success: true,
      message: `Retrieved ${validatedAbstracts.length} abstracts successfully`,
      
      // Multiple data format options
      data: validatedAbstracts,
      abstracts: validatedAbstracts,
      
      // Count information
      count: validatedAbstracts.length,
      total: validatedAbstracts.length,
      
      // Statistics
      stats: stats,
      statistics: stats,
      
      // Metadata
      timestamp: new Date().toISOString(),
      filters: {
        status: status || 'all',
        limit: limit
      },
      
      version: '2.0',
      database: 'PostgreSQL'
    };
    
    console.log('✅ [API] GET request successful:', {
      abstractsReturned: response.count,
      totalInDatabase: stats.total,
      statusFilter: status || 'all'
    });
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Total-Count': stats.total.toString(),
        'X-Returned-Count': validatedAbstracts.length.toString(),
        'X-API-Version': '2.0',
        'X-Database': 'PostgreSQL'
      }
    });
    
  } catch (error) {
    console.error('❌ [API] GET abstracts fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch abstracts: ' + error.message,
      message: 'Internal server error occurred while fetching abstracts',
      
      // Return empty data on error
      data: [],
      abstracts: [],
      count: 0,
      total: 0,
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      },
      
      // Error metadata
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      version: '2.0',
      database: 'PostgreSQL'
    }, { status: 500 });
  }
}

// PUT - Update abstract
export async function PUT(request) {
  try {
    console.log('📝 PUT request received');
    
    await testConnection();
    const body = await request.json();
    
    console.log('📄 Request body:', JSON.stringify(body, null, 2));
    
    // Check if it's a bulk update
    if (Array.isArray(body) || body.bulk || body.bulkUpdate) {
      console.log('🔄 Processing bulk update - redirecting to bulk-update API');
      return NextResponse.json({
        success: false,
        error: 'Bulk updates should use /api/abstracts/bulk-update endpoint'
      }, { status: 400 });
    }
    
    // Single update
    const decoded = verifyToken(request);
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Abstract ID is required' },
        { status: 400 }
      );
    }

    // Check if abstract exists and belongs to user
    const existingAbstract = await getAbstractById(id);
    if (!existingAbstract) {
      return NextResponse.json(
        { success: false, message: 'Abstract not found' },
        { status: 404 }
      );
    }

    if (existingAbstract.user_id !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if abstract can be edited (only pending abstracts)
    if (existingAbstract.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Cannot edit abstract that is already reviewed' },
        { status: 400 }
      );
    }

    const updatedAbstract = await updateAbstract(id, updateData);

    console.log('✅ Abstract updated successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Abstract updated successfully',
      abstract: updatedAbstract
    });

  } catch (error) {
    console.error('❌ PUT request error:', error);
    
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update abstract', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete abstract
export async function DELETE(request) {
  try {
    console.log('🗑️ DELETE request received');
    
    await testConnection();
    const decoded = verifyToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Abstract ID is required' },
        { status: 400 }
      );
    }

    // Check if abstract exists and belongs to user
    const existingAbstract = await getAbstractById(id);
    if (!existingAbstract) {
      return NextResponse.json(
        { success: false, message: 'Abstract not found' },
        { status: 404 }
      );
    }

    if (existingAbstract.user_id !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if abstract can be deleted (only pending abstracts)
    if (existingAbstract.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete abstract that is already reviewed' },
        { status: 400 }
      );
    }

    await deleteAbstract(id);

    console.log('✅ Abstract deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Abstract deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE request error:', error);
    
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete abstract', details: error.message },
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

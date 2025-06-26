// src/app/api/admin/abstracts/route.js - QUICK FIX
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getAllAbstracts, getStatistics, testConnection } from '../../../../lib/database-postgres.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify admin token
function verifyAdminToken(request) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin' ? decoded : null;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all abstracts for admin from PostgreSQL
export async function GET(request) {
  try {
    console.log('🔄 Admin API: Starting request');
    
    // Test database connection
    await testConnection();
    console.log('✅ Database connected');

    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    console.log('✅ Admin authenticated');

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    console.log('📊 Query params:', { status, category, page, limit });

    // Get all abstracts from PostgreSQL
    let allAbstracts = await getAllAbstracts();
    console.log(`📋 Got ${allAbstracts.length} abstracts from database`);

    // SAFE FILTER - Handle undefined values
    let filteredAbstracts = [...allAbstracts];
    
    if (status && status !== 'all') {
      const originalCount = filteredAbstracts.length;
      filteredAbstracts = filteredAbstracts.filter(abstract => {
        const abstractStatus = abstract.status || 'pending'; // Default to pending if undefined
        return abstractStatus.toLowerCase() === status.toLowerCase();
      });
      console.log(`🔍 Status filter '${status}': ${originalCount} → ${filteredAbstracts.length}`);
    }
    
    if (category && category !== 'all') {
      const originalCount = filteredAbstracts.length;
      filteredAbstracts = filteredAbstracts.filter(abstract => {
        const abstractType = abstract.presentation_type || ''; // Handle undefined
        return abstractType.toLowerCase() === category.toLowerCase();
      });
      console.log(`🔍 Category filter '${category}': ${originalCount} → ${filteredAbstracts.length}`);
    }

    // Sort by submission date (newest first) - SAFE SORT
    filteredAbstracts.sort((a, b) => {
      const dateA = new Date(a.submission_date || '1970-01-01');
      const dateB = new Date(b.submission_date || '1970-01-01');
      return dateB - dateA;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAbstracts = filteredAbstracts.slice(startIndex, endIndex);

    console.log(`📄 Paginated: ${paginatedAbstracts.length} abstracts (page ${page})`);

    // Get statistics - SAFE STATS
    let stats;
    try {
      const dbStats = await getStatistics();
      stats = {
        total: allAbstracts.length,
        pending: allAbstracts.filter(a => (a.status || 'pending') === 'pending').length,
        approved: allAbstracts.filter(a => (a.status || 'pending') === 'approved').length,
        rejected: allAbstracts.filter(a => (a.status || 'pending') === 'rejected').length,
        filtered: filteredAbstracts.length
      };
    } catch (statsError) {
      console.error('⚠️ Stats error, using fallback:', statsError);
      stats = {
        total: allAbstracts.length,
        pending: allAbstracts.filter(a => (a.status || 'pending') === 'pending').length,
        approved: allAbstracts.filter(a => (a.status || 'pending') === 'approved').length,
        rejected: allAbstracts.filter(a => (a.status || 'pending') === 'rejected').length,
        filtered: filteredAbstracts.length
      };
    }

    console.log('📊 Final stats:', stats);

    return NextResponse.json({
      success: true,
      abstracts: paginatedAbstracts,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredAbstracts.length / limit),
        hasNext: endIndex < filteredAbstracts.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

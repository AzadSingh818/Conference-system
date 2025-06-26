// src/app/api/abstracts/bulk-update/route.js
// 🚀 COMPLETE FIXED VERSION - Replace entire file content

import { NextResponse } from 'next/server';
import { bulkUpdateAbstractStatus, testConnection } from '@/lib/database-postgres';

console.log('🚀 [API] Bulk Update Route (PostgreSQL) loaded at:', new Date().toISOString());

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    console.log('📥 [API] Bulk update request received');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📋 [API] Request body:', body);
    } catch (parseError) {
      console.error('❌ [API] Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        updatedCount: 0,
        successful: 0,
        failed: 0,
        total: 0
      }, { status: 400 });
    }
    
    const { abstractIds, status, comments } = body;
    
    // ========================================
    // 🚀 ENHANCED VALIDATION
    // ========================================
    
    if (!abstractIds || !Array.isArray(abstractIds) || abstractIds.length === 0) {
      console.error('❌ [API] Invalid abstractIds:', abstractIds);
      return NextResponse.json({
        success: false,
        error: 'Invalid or empty abstract IDs array',
        updatedCount: 0,
        successful: 0,
        failed: 0,
        total: 0,
        data: null
      }, { status: 400 });
    }
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      console.error('❌ [API] Invalid status:', status);
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be: pending, approved, or rejected',
        updatedCount: 0,
        successful: 0,
        failed: 0,
        total: 0,
        data: null
      }, { status: 400 });
    }
    
    console.log(`🔄 [API] Processing bulk update: ${abstractIds.length} abstracts → ${status}`);
    
    // ========================================
    // 🚀 DATABASE CONNECTION TEST
    // ========================================
    
    try {
      await testConnection();
      console.log('✅ [API] Database connection successful');
    } catch (dbError) {
      console.error('❌ [API] Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed: ' + dbError.message,
        updatedCount: 0,
        successful: 0,
        failed: 0,
        total: abstractIds.length,
        data: null
      }, { status: 500 });
    }
    
    // ========================================
    // 🚀 EXECUTE BULK UPDATE
    // ========================================
    
    let updatedAbstracts;
    try {
      console.log('🔄 [API] Calling bulkUpdateAbstractStatus...');
      updatedAbstracts = await bulkUpdateAbstractStatus(abstractIds, status, comments);
      console.log('📊 [API] Raw database result:', updatedAbstracts);
    } catch (updateError) {
      console.error('❌ [API] Bulk update database error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database update failed: ' + updateError.message,
        updatedCount: 0,
        successful: 0,
        failed: abstractIds.length,
        total: abstractIds.length,
        data: null
      }, { status: 200 }); // Return 200 for frontend compatibility
    }
    
    // ========================================
    // 🚀 PROCESS RESULTS
    // ========================================
    
    const updatedCount = Array.isArray(updatedAbstracts) ? updatedAbstracts.length : 0;
    const failedCount = abstractIds.length - updatedCount;
    
    console.log(`📊 [API] Results: ${updatedCount} successful, ${failedCount} failed`);
    
    // Check if any abstracts were updated
    if (updatedCount === 0) {
      console.error('❌ [API] No abstracts were successfully updated');
      return NextResponse.json({
        success: false,
        error: 'No abstracts were successfully updated',
        message: 'Database operation completed but no records were affected',
        updatedCount: 0,
        successful: 0,
        failed: abstractIds.length,
        total: abstractIds.length,
        data: null,
        results: abstractIds.map(id => ({
          id: id,
          success: false,
          error: 'Abstract not found or update failed'
        }))
      }, { status: 200 });
    }
    
    // ========================================
    // 🚀 CREATE SUCCESS RESPONSE - MULTIPLE FORMATS FOR FRONTEND COMPATIBILITY
    // ========================================
    
    const response = {
      // Primary success indicators
      success: true,
      message: `Successfully updated ${updatedCount} out of ${abstractIds.length} abstract(s) to ${status}`,
      
      // Multiple naming conventions for frontend compatibility
      updatedCount: updatedCount,
      successful: updatedCount,
      failed: failedCount,
      total: abstractIds.length,
      
      // Results array with individual abstract status
      results: abstractIds.map(id => {
        const updated = updatedAbstracts.find(a => a.id.toString() === id.toString());
        if (updated) {
          return {
            id: id,
            success: true,
            title: updated.title,
            presenter_name: updated.presenter_name,
            oldStatus: 'pending', // We don't track old status in simple implementation
            newStatus: updated.status,
            updatedAt: updated.updated_at
          };
        } else {
          return {
            id: id,
            success: false,
            error: 'Abstract not found or update failed',
            title: null,
            oldStatus: null,
            newStatus: null
          };
        }
      }),
      
      // Updated abstracts data
      updatedAbstracts: updatedAbstracts,
      
      // Additional data object (some frontends expect this structure)
      data: {
        updatedCount: updatedCount,
        successful: updatedCount,
        failed: failedCount,
        total: abstractIds.length,
        updatedAbstracts: updatedAbstracts,
        status: status,
        comments: comments
      },
      
      // Status flags
      operationSuccess: true,
      databaseUpdated: updatedCount > 0,
      hasErrors: failedCount > 0,
      allSuccessful: failedCount === 0,
      partialSuccess: failedCount > 0 && updatedCount > 0,
      
      // Processing metadata
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: 'PostgreSQL'
    };
    
    console.log('📤 [API] Sending success response:', {
      success: response.success,
      updatedCount: response.updatedCount,
      failed: response.failed,
      total: response.total
    });
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'X-Operation-Status': 'SUCCESS',
        'X-Updated-Count': updatedCount.toString(),
        'X-Failed-Count': failedCount.toString(),
        'X-Total-Count': abstractIds.length.toString(),
        'X-Processing-Time': (Date.now() - startTime).toString(),
        'X-API-Version': '2.0',
        'X-Database': 'PostgreSQL'
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [API] Fatal bulk update error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message,
      message: 'Bulk update operation failed due to server error',
      updatedCount: 0,
      successful: 0,
      failed: 0,
      total: 0,
      data: null,
      results: [],
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      database: 'PostgreSQL'
    }, { 
      status: 200, // Return 200 for frontend compatibility
      headers: {
        'X-Operation-Status': 'ERROR',
        'X-Error-Type': 'FATAL_ERROR',
        'X-Processing-Time': processingTime.toString(),
        'X-API-Version': '2.0',
        'X-Database': 'PostgreSQL'
      }
    });
  }
}

// ========================================
// GET - Health check and API info
// ========================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const abstractId = searchParams.get('id');
    
    // Test database connection
    await testConnection();
    
    if (abstractId) {
      // Get specific abstract status
      console.log(`📊 [API] Getting status for abstract: ${abstractId}`);
      
      const { getAbstractById } = await import('@/lib/database-postgres');
      const abstract = await getAbstractById(abstractId);
      
      if (!abstract) {
        return NextResponse.json({
          success: false,
          error: 'Abstract not found',
          message: `Abstract with ID ${abstractId} not found`
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          abstract: {
            id: abstract.id,
            title: abstract.title,
            status: abstract.status,
            updated_at: abstract.updated_at,
            submission_date: abstract.submission_date
          }
        },
        message: 'Abstract found successfully'
      });
      
    } else {
      // Health check
      console.log(`🏥 [API] Health check requested`);
      
      const { getStatistics } = await import('@/lib/database-postgres');
      const stats = await getStatistics();
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          version: '2.0',
          uptime: process.uptime(),
          database: {
            type: 'PostgreSQL',
            connected: true,
            connectionString: !!process.env.DATABASE_URL
          },
          statistics: stats,
          features: {
            maxBulkSize: 100,
            supportedStatuses: ['pending', 'approved', 'rejected'],
            emailNotifications: true,
            auditLogging: true,
            bulkOperations: true
          }
        },
        message: 'Bulk update API is healthy and operational'
      });
    }
    
  } catch (error) {
    console.error(`❌ [API] GET request error:`, error);
    return NextResponse.json({
      success: false,
      error: 'Database connection error: ' + error.message,
      message: 'Health check failed'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Expose-Headers': 'X-Request-ID, X-Processing-Time, X-Operation-Status, X-API-Version, X-Database',
      'X-API-Version': '2.0',
      'X-Database': 'PostgreSQL'
    },
  });
}

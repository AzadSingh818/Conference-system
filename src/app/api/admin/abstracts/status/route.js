// src/app/api/admin/abstracts/status/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { 
  updateAbstractStatus, 
  bulkUpdateAbstractStatus, 
  getAbstractById, 
  testConnection 
} from '@/lib/database-postgres';

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

// POST - Update abstract status (Single)
export async function POST(request) {
  try {
    // Test database connection
    await testConnection();

    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id, status, comments } = await request.json();

    // Validation
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Abstract ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Update abstract status in PostgreSQL
    const updatedAbstract = await updateAbstractStatus(id, status, comments);

    if (!updatedAbstract) {
      return NextResponse.json(
        { error: 'Abstract not found or update failed' },
        { status: 404 }
      );
    }

    // Send email notification (async)
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_update',
          data: {
            abstractId: updatedAbstract.id,
            title: updatedAbstract.title,
            author: updatedAbstract.presenter_name,
            email: updatedAbstract.user_email, // From JOIN query
            status: status,
            comments: comments,
            reviewDate: new Date().toISOString()
          }
        })
      }).catch(err => console.error('Email notification failed:', err));
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Abstract ${status} successfully`,
      abstract: {
        id: updatedAbstract.id,
        status: updatedAbstract.status,
        updatedAt: updatedAbstract.updated_at,
        updatedBy: admin.email,
        comments: updatedAbstract.reviewer_comments
      },
      notification: 'Email notification sent to the author'
    });

  } catch (error) {
    console.error('Error updating abstract status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Bulk status update
export async function PUT(request) {
  try {
    // Test database connection
    await testConnection();

    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { abstractIds, status, comments } = await request.json();

    // Validation
    if (!abstractIds || !Array.isArray(abstractIds) || abstractIds.length === 0) {
      return NextResponse.json(
        { error: 'Abstract IDs array is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Bulk update in PostgreSQL
    const updatedAbstracts = await bulkUpdateAbstractStatus(abstractIds, status, comments);

    if (!updatedAbstracts || updatedAbstracts.length === 0) {
      return NextResponse.json(
        { error: 'No abstracts were updated' },
        { status: 400 }
      );
    }

    // Send bulk email notifications (async)
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/abstracts/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bulk_status_update',
          abstractIds: abstractIds,
          status: status,
          comments: comments
        })
      }).catch(err => console.error('Bulk email notification failed:', err));
    } catch (emailError) {
      console.error('Bulk email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `${updatedAbstracts.length} abstracts ${status} successfully`,
      updatedAbstracts: updatedAbstracts.map(abstract => ({
        id: abstract.id,
        status: abstract.status,
        updatedAt: abstract.updated_at,
        updatedBy: admin.email,
        comments: abstract.reviewer_comments
      })),
      notification: 'Email notifications sent to all authors'
    });

  } catch (error) {
    console.error('Error bulk updating abstract status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get status history for an abstract
export async function GET(request) {
  try {
    // Test database connection
    await testConnection();

    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const abstractId = url.searchParams.get('id');

    if (!abstractId) {
      return NextResponse.json(
        { error: 'Abstract ID is required' },
        { status: 400 }
      );
    }

    // Get abstract from PostgreSQL
    const abstract = await getAbstractById(abstractId);

    if (!abstract) {
      return NextResponse.json(
        { error: 'Abstract not found' },
        { status: 404 }
      );
    }

    // Create status history (basic implementation)
    const statusHistory = [
      {
        id: '1',
        abstractId,
        status: 'pending',
        updatedAt: abstract.submission_date,
        updatedBy: 'system',
        comments: 'Abstract submitted'
      }
    ];

    if (abstract.status !== 'pending') {
      statusHistory.push({
        id: '2',
        abstractId,
        status: abstract.status,
        updatedAt: abstract.updated_at,
        updatedBy: admin.email,
        comments: abstract.reviewer_comments || `Abstract ${abstract.status}`
      });
    }

    return NextResponse.json({
      success: true,
      abstractId,
      statusHistory
    });

  } catch (error) {
    console.error('Error fetching status history:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

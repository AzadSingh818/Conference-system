// src/app/api/abstracts/final-upload/route.js
// Final Upload API for Post-Approval Workflow - PostgreSQL Version

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { getAbstractById, updateAbstract, testConnection } from '@/lib/database-postgres';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'final');

// POST - Handle final file upload
export async function POST(request) {
  try {
    // Test database connection
    await testConnection();

    const formData = await request.formData();
    const file = formData.get('file');
    const abstractId = formData.get('abstractId');
    const userId = formData.get('userId');
    const uploadType = formData.get('uploadType') || 'final_presentation';

    console.log('🔄 Final upload request:', { abstractId, userId, uploadType, fileName: file?.name });

    // Validation
    if (!file || !abstractId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: file, abstractId, or userId'
      }, { status: 400 });
    }

    // Check if abstract exists and is approved
    const abstract = await getAbstractById(abstractId);

    if (!abstract) {
      return NextResponse.json({
        success: false,
        error: 'Abstract not found'
      }, { status: 404 });
    }

    if (abstract.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Abstract not approved for final upload'
      }, { status: 400 });
    }

    // Verify user owns this abstract
    if (abstract.user_id !== parseInt(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: You can only upload files for your own abstracts'
      }, { status: 403 });
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only PDF, PowerPoint, and Word documents are allowed.'
      }, { status: 400 });
    }

    // Check file size (max 10MB for final uploads)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large. Maximum size allowed is 10MB.'
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${abstractId}_${uploadType}_${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    const publicPath = `/uploads/final/${uniqueFileName}`;

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update database with final file info using PostgreSQL
    const currentTime = new Date().toISOString();
    const updateData = {
      final_file_path: publicPath,
      file_name: file.name,
      file_size: file.size,
      status: 'final_submitted'
    };

    const updatedAbstract = await updateAbstract(abstractId, updateData);

    if (updatedAbstract) {
      // Log the upload
      console.log('✅ Final upload successful:', {
        abstractId,
        fileName: file.name,
        size: file.size,
        path: publicPath
      });

      return NextResponse.json({
        success: true,
        message: 'Final file uploaded successfully',
        data: {
          abstractId,
          fileName: file.name,
          fileSize: file.size,
          filePath: publicPath,
          uploadDate: currentTime,
          newStatus: 'final_submitted'
        }
      });
    } else {
      // If database update failed, remove the uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Failed to remove uploaded file after database error:', unlinkError);
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to update database record'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Final upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during file upload',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Get final upload status and file info
export async function GET(request) {
  try {
    // Test database connection
    await testConnection();

    const { searchParams } = new URL(request.url);
    const abstractId = searchParams.get('abstractId');
    const userId = searchParams.get('userId');

    if (!abstractId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing abstractId or userId'
      }, { status: 400 });
    }

    const abstract = await getAbstractById(abstractId);

    if (!abstract) {
      return NextResponse.json({
        success: false,
        error: 'Abstract not found'
      }, { status: 404 });
    }

    // Verify user owns this abstract
    if (abstract.user_id !== parseInt(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        abstractId: abstract.id,
        title: abstract.title,
        presenter: abstract.presenter_name,
        status: abstract.status,
        finalFile: {
          url: abstract.final_file_path,
          name: abstract.file_name,
          size: abstract.file_size,
          uploadDate: abstract.updated_at
        },
        canUpload: abstract.status === 'approved',
        hasUploaded: !!abstract.final_file_path
      }
    });

  } catch (error) {
    console.error('❌ Get final upload status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get upload status',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Remove final uploaded file (if needed for re-upload)
export async function DELETE(request) {
  try {
    // Test database connection
    await testConnection();

    const { searchParams } = new URL(request.url);
    const abstractId = searchParams.get('abstractId');
    const userId = searchParams.get('userId');

    if (!abstractId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing abstractId or userId'
      }, { status: 400 });
    }

    // Get current abstract info
    const abstract = await getAbstractById(abstractId);

    if (!abstract) {
      return NextResponse.json({
        success: false,
        error: 'Abstract not found'
      }, { status: 404 });
    }

    // Verify user owns this abstract
    if (abstract.user_id !== parseInt(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 });
    }

    if (!abstract.final_file_path) {
      return NextResponse.json({
        success: false,
        error: 'No file to delete'
      }, { status: 400 });
    }

    // Remove file from filesystem
    const fileName = path.basename(abstract.final_file_path);
    const filePath = path.join(uploadsDir, fileName);
    
    try {
      fs.unlinkSync(filePath);
      console.log('🗑️ File deleted:', filePath);
    } catch (fileError) {
      console.error('Warning: Could not delete file from disk:', fileError);
      // Continue with database update even if file deletion fails
    }

    // Update database to remove file reference
    const updateData = {
      final_file_path: null,
      status: 'approved'
    };

    const updatedAbstract = await updateAbstract(abstractId, updateData);

    if (updatedAbstract) {
      return NextResponse.json({
        success: true,
        message: 'Final file removed successfully',
        data: {
          abstractId,
          newStatus: 'approved'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update database'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Delete final upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete final upload',
      details: error.message
    }, { status: 500 });
  }
}

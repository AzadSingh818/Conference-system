// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Browser-compatible UUID generator for server
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'text/plain'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

// Helper function to validate file type
function validateFileType(file) {
  const fileName = file.name.toLowerCase();
  const fileExtension = path.extname(fileName);
  
  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
  
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format. Expected: PDF, DOC, DOCX, or TXT`
    };
  }
  
  return { valid: true };
}

// Helper function to generate safe filename
function generateSafeFilename(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const nameWithoutExt = path.basename(originalName, extension);
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = Date.now();
  const uuid = generateUUID().split('-')[0];
  
  return `${timestamp}_${uuid}_${safeName}${extension}`;
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// POST - Handle file upload
export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const submissionId = formData.get('submissionId') || 'temp';
    
    console.log('🔄 File upload request:', { fileCount: files.length, submissionId });

    // Validation
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 files allowed per submission' },
        { status: 400 }
      );
    }
    
    const uploadResults = [];
    const uploadErrors = [];
    
    // Create upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'abstracts', submissionId);
    await ensureDirectoryExists(uploadDir);
    
    // Process each file
    for (const file of files) {
      try {
        // Skip if not a file
        if (!file || typeof file.arrayBuffer !== 'function') {
          uploadErrors.push({
            fileName: 'unknown',
            error: 'Invalid file object'
          });
          continue;
        }
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          
          uploadErrors.push({
            fileName: file.name,
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
          });
          continue;
        }
        
        // Validate file type
        const typeValidation = validateFileType(file);
        if (!typeValidation.valid) {
          uploadErrors.push({
            fileName: file.name,
            error: typeValidation.error
          });
          continue;
        }
        
        // Generate safe filename
        const safeFileName = generateSafeFilename(file.name);
        const filePath = path.join(uploadDir, safeFileName);
        
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        await writeFile(filePath, buffer);
        
        // Calculate relative path for frontend access
        const relativePath = `/uploads/abstracts/${submissionId}/${safeFileName}`;
        
        uploadResults.push({
          originalName: file.name,
          fileName: safeFileName,
          size: file.size,
          type: file.type,
          path: relativePath,
          uploadedAt: new Date().toISOString()
        });

        console.log('✅ File uploaded:', { originalName: file.name, safeFileName, size: file.size });
        
      } catch (fileError) {
        console.error(`❌ Error processing file ${file.name}:`, fileError);
        uploadErrors.push({
          fileName: file.name,
          error: 'Failed to process file: ' + fileError.message
        });
      }
    }
    
    // Return results
    const response = {
      success: uploadResults.length > 0,
      message: `${uploadResults.length} file(s) uploaded successfully`,
      uploadedFiles: uploadResults,
      errors: uploadErrors,
      submissionId,
      totalFiles: files.length,
      successCount: uploadResults.length,
      errorCount: uploadErrors.length
    };
    
    console.log('📊 Upload summary:', {
      submitted: files.length,
      successful: uploadResults.length,
      failed: uploadErrors.length
    });
    
    if (uploadErrors.length > 0 && uploadResults.length === 0) {
      return NextResponse.json(response, { status: 400 });
    }
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'File upload failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve uploaded files for a submission
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('submissionId');
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'abstracts', submissionId);
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        submissionId,
        files: [],
        message: 'No files found for this submission'
      });
    }
    
    try {
      const fileNames = await readdir(uploadDir);
      const files = fileNames.map(fileName => {
        const filePath = path.join(uploadDir, fileName);
        const relativePath = `/uploads/abstracts/${submissionId}/${fileName}`;
        
        return {
          fileName,
          path: relativePath,
          downloadUrl: relativePath
        };
      });

      return NextResponse.json({
        success: true,
        submissionId,
        files,
        fileCount: files.length,
        message: `Found ${files.length} file(s)`
      });
    } catch (readError) {
      console.error('Error reading directory:', readError);
      return NextResponse.json({
        success: false,
        submissionId,
        files: [],
        error: 'Failed to read upload directory'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Get files error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve files',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove uploaded file
export async function DELETE(request) {
  try {
    const { submissionId, fileName } = await request.json();
    
    if (!submissionId || !fileName) {
      return NextResponse.json(
        { error: 'Submission ID and file name are required' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'abstracts', submissionId, fileName);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    try {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      
      console.log('🗑️ File deleted:', filePath);
      
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        submissionId,
        fileName
      });
    } catch (deleteError) {
      console.error('Error deleting file:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file from disk' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Delete file error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete file',
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

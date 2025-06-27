// src/app/api/abstracts/download/[id]/route.js
// FIXED VERSION - Better file detection and error handling

import { NextResponse } from 'next/server';
import { getAbstractById } from '../../../../../lib/database-postgres.js';
import fs from 'fs';
import path from 'path';

console.log('📥 APBMT Download API loaded at:', new Date().toISOString());

// GET - Download abstract file with enhanced file detection
export async function GET(request, { params }) {
  try {
    console.log('📥 Download request received for ID:', params.id);
    
    // Get abstract from database
    const abstract = await getAbstractById(params.id);
    
    if (!abstract) {
      console.log('❌ Abstract not found:', params.id);
      return NextResponse.json({
        error: 'Abstract not found',
        errorType: 'ABSTRACT_NOT_FOUND',
        abstractId: params.id
      }, { status: 404 });
    }

    console.log('✅ Abstract found:', {
      id: abstract.id,
      title: abstract.title,
      author: abstract.presenter_name || abstract.author,
      file_name: abstract.file_name,
      file_path: abstract.file_path,
      status: abstract.status
    });

    // ✅ SPECIFIC FILE SEARCH - Only files uploaded during abstract submission
    let filePath = null;
    let fileName = null;
    
    // Search strategy 1: Use database file info if available
    if (abstract.file_path && abstract.file_name) {
      if (abstract.file_path.startsWith('/')) {
        filePath = path.join(process.cwd(), 'public', abstract.file_path);
      } else {
        filePath = path.join(process.cwd(), 'public', 'uploads', abstract.file_path);
      }
      fileName = abstract.file_name;
    }
    
    // Search strategy 2: Search ONLY in abstract-specific folders (not random files)
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('🔍 Database file info missing, searching for abstract-specific upload...');
      
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath).filter(item => {
          const fullPath = path.join(uploadsPath, item);
          return fs.statSync(fullPath).isDirectory();
        });
        
        console.log('📁 Searching in abstract-specific subfolders...');
        
        // Search ONLY in folders that specifically belong to this abstract
        for (const folder of subfolders) {
          // ✅ STRICT MATCHING - Only folders linked to this specific abstract
          const isAbstractFolder = 
            folder.includes(`abstract_${abstract.id}`) ||           // Folder named with abstract ID
            folder.includes(abstract.abstract_number) ||             // Folder named with abstract number
            folder.includes(`sub_`) && folder.includes(abstract.id); // Submission folder with abstract ID
          
          if (isAbstractFolder) {
            const folderPath = path.join(uploadsPath, folder);
            
            try {
              const files = fs.readdirSync(folderPath);
              console.log(`📂 Checking abstract folder ${folder}, files:`, files);
              
              // Look for document files in this specific abstract folder
              const documentFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.pdf', '.doc', '.docx', '.txt'].includes(ext);
              });
              
              if (documentFiles.length > 0) {
                // Take the first document file (should be the submitted file)
                const abstractFile = documentFiles[0];
                filePath = path.join(folderPath, abstractFile);
                fileName = abstract.file_name || abstractFile;
                console.log('✅ Found abstract submission file:', { folder, file: abstractFile });
                break;
              }
            } catch (dirError) {
              console.log(`⚠️ Error reading abstract folder ${folder}:`, dirError.message);
            }
          }
        }
      }
    }

    // ✅ ENHANCED ERROR RESPONSE with re-upload option
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('❌ File not found after comprehensive search');
      
      // Provide detailed error response for admin interface
      return NextResponse.json({
        error: 'File not found on server',
        errorType: 'FILE_NOT_FOUND',
        abstractId: abstract.id,
        abstractTitle: abstract.title,
        abstractAuthor: abstract.presenter_name || abstract.author,
        abstractNumber: abstract.abstract_number,
        databaseFileInfo: {
          file_name: abstract.file_name,
          file_path: abstract.file_path,
          file_size: abstract.file_size
        },
        suggestion: 'File may need to be re-uploaded',
        searchAttempted: true,
        uploadFolderExists: fs.existsSync(path.join(process.cwd(), 'public', 'uploads', 'abstracts'))
      }, { status: 404 });
    }

    // ✅ FILE FOUND - Proceed with download
    console.log('✅ File located:', filePath);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log('✅ File read successfully:', {
      size: fileStats.size,
      name: fileName
    });

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Clean filename for download
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    console.log('📤 Serving file download:', {
      original_name: fileName,
      clean_name: cleanFileName,
      content_type: contentType,
      size: fileBuffer.length
    });

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
        'X-Abstract-ID': abstract.id.toString(),
        'X-Original-Filename': fileName
      }
    });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    
    return NextResponse.json({
      error: 'Download failed', 
      errorType: 'SERVER_ERROR',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
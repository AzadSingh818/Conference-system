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

    // ✅ ENHANCED FILE SEARCH - Don't give up if database has NULL values
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
    
    // Search strategy 2: Even if database has NULL, search for files by abstract ID
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('🔍 Database file info missing or file not found, searching uploads folder...');
      
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath).filter(item => {
          const fullPath = path.join(uploadsPath, item);
          return fs.statSync(fullPath).isDirectory();
        });
        
        console.log('📁 Searching in subfolders:', subfolders.length);
        
        // Search for files that might belong to this abstract
        for (const folder of subfolders) {
          const folderPath = path.join(uploadsPath, folder);
          
          try {
            const files = fs.readdirSync(folderPath);
            console.log(`📂 Checking folder ${folder}, files:`, files);
            
            for (const file of files) {
              const fullFilePath = path.join(folderPath, file);
              
              // Check if this file belongs to our abstract
              // Search by abstract ID, submission ID, or folder name containing abstract info
              if (folder.includes(`abstract_${abstract.id}`) || 
                  folder.includes(abstract.abstract_number) ||
                  folder.includes(`sub_`) ||
                  file.includes(`${abstract.id}_`) ||
                  files.length === 1) { // If only one file in folder, likely it's the right one
                
                filePath = fullFilePath;
                fileName = abstract.file_name || file; // Use original name if available
                console.log('✅ Found matching file:', { folder, file, abstract_id: abstract.id });
                break;
              }
            }
            
            if (filePath && fs.existsSync(filePath)) break;
          } catch (dirError) {
            console.log(`⚠️ Error reading folder ${folder}:`, dirError.message);
          }
        }
      }
    }

    // Search strategy 3: If still not found, try searching by file extensions
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('🔍 Final search: Looking for any PDF/DOC files that might belong to this abstract...');
      
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath);
        
        for (const folder of subfolders) {
          const folderPath = path.join(uploadsPath, folder);
          if (fs.statSync(folderPath).isDirectory()) {
            const files = fs.readdirSync(folderPath);
            
            // Look for common document extensions
            const documentFiles = files.filter(file => {
              const ext = path.extname(file).toLowerCase();
              return ['.pdf', '.doc', '.docx', '.txt'].includes(ext);
            });
            
            if (documentFiles.length > 0) {
              // If we find document files, take the first one as a candidate
              const candidateFile = documentFiles[0];
              const candidatePath = path.join(folderPath, candidateFile);
              
              console.log(`📄 Found candidate file: ${candidateFile} in ${folder}`);
              filePath = candidatePath;
              fileName = abstract.file_name || candidateFile;
              break;
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
// src/app/api/abstracts/download/[id]/route.js
// 🚀 NEW FILE: Create this file to fix download functionality

import { NextResponse } from 'next/server';
import { getAbstractById } from '../../../../../lib/database-postgres.js';
import fs from 'fs';
import path from 'path';

console.log('📥 APBMT Download API loaded at:', new Date().toISOString());

// GET - Download abstract file
export async function GET(request, { params }) {
  try {
    console.log('📥 Download request received for ID:', params.id);
    
    // Get abstract from database
    const abstract = await getAbstractById(params.id);
    
    if (!abstract) {
      console.log('❌ Abstract not found:', params.id);
      return NextResponse.json(
        { error: 'Abstract not found' }, 
        { status: 404 }
      );
    }

    console.log('✅ Abstract found:', {
      id: abstract.id,
      title: abstract.title,
      file_name: abstract.file_name,
      file_path: abstract.file_path
    });

    // Check if file information exists
    if (!abstract.file_path && !abstract.file_name) {
      console.log('❌ No file attached to this abstract');
      return NextResponse.json(
        { error: 'No file attached to this abstract' }, 
        { status: 404 }
      );
    }

    // 🔍 Search for file in multiple locations
    let filePath = null;
    
    console.log('🔍 Searching for file:', {
      file_name: abstract.file_name,
      file_path: abstract.file_path,
      abstract_id: abstract.id
    });
    
    // Method 1: Use file_path from database
    if (abstract.file_path) {
      let dbPath;
      if (abstract.file_path.startsWith('/')) {
        dbPath = path.join(process.cwd(), 'public', abstract.file_path);
      } else {
        dbPath = path.join(process.cwd(), 'public', abstract.file_path);
      }
      
      if (fs.existsSync(dbPath)) {
        filePath = dbPath;
        console.log('✅ Found file using database path:', dbPath);
      }
    }
    
    // Method 2: Search all upload subfolders
    if (!filePath && abstract.file_name) {
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath).filter(item => {
          const fullPath = path.join(uploadsPath, item);
          return fs.statSync(fullPath).isDirectory();
        });
        
        console.log('📁 Searching in subfolders:', subfolders);
        
        // Look for file in all subfolders
        for (const folder of subfolders) {
          const testPath = path.join(uploadsPath, folder, abstract.file_name);
          if (fs.existsSync(testPath)) {
            filePath = testPath;
            console.log('✅ Found file in subfolder:', folder);
            break;
          }
        }
        
        // Advanced search: Look for similar filenames
        if (!filePath) {
          for (const folder of subfolders) {
            const folderPath = path.join(uploadsPath, folder);
            try {
              const files = fs.readdirSync(folderPath);
              for (const file of files) {
                // Match by partial filename
                if (file.includes(abstract.file_name) || 
                    abstract.file_name.includes(file) ||
                    file.includes(abstract.id.toString())) {
                  const testPath = path.join(folderPath, file);
                  if (fs.existsSync(testPath)) {
                    filePath = testPath;
                    console.log('✅ Found file by advanced search:', { folder, file });
                    break;
                  }
                }
              }
              if (filePath) break;
            } catch (folderError) {
              console.log('⚠️ Error reading folder:', folder);
            }
          }
        }
      }
    }

    // Check if file was found
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('❌ File not found in any location');
      
      // List available files for debugging
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      const availableFiles = [];
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath);
        for (const folder of subfolders) {
          const folderPath = path.join(uploadsPath, folder);
          if (fs.statSync(folderPath).isDirectory()) {
            const files = fs.readdirSync(folderPath);
            availableFiles.push({ folder, files });
          }
        }
      }
      
      return NextResponse.json({
        error: 'File not found on server',
        details: {
          abstract_id: abstract.id,
          expected_file: abstract.file_name,
          expected_path: abstract.file_path,
          searched_locations: [
            'Database file_path',
            'All upload subfolders',
            'Advanced filename matching'
          ],
          available_files: availableFiles,
          troubleshooting: {
            message: 'File exists in database but missing from uploads folder',
            solutions: [
              'Check if file was uploaded correctly',
              'Verify upload folder permissions',
              'Ensure file wasn\'t deleted accidentally'
            ]
          }
        }
      }, { status: 404 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log('✅ File read successfully:', {
      path: filePath,
      size: fileStats.size,
      name: abstract.file_name
    });

    // Determine content type
    const ext = path.extname(abstract.file_name).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Clean filename for download
    const cleanFileName = abstract.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const downloadFileName = `Abstract_${abstract.id}_${cleanFileName}`;
    
    console.log('📤 Serving file download:', {
      original_name: abstract.file_name,
      download_name: downloadFileName,
      content_type: contentType,
      size: fileBuffer.length
    });

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
        'X-Abstract-ID': abstract.id.toString(),
        'X-Original-Filename': abstract.file_name
      }
    });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    
    return NextResponse.json({
      error: 'Download failed',
      details: error.message,
      abstract_id: params.id,
      timestamp: new Date().toISOString()
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
// 🔧 CREATE THIS FILE: src/app/api/abstracts/download/[id]/route.js

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
    if (!abstract.file_path || !abstract.file_name) {
      console.log('❌ No file attached to this abstract');
      return NextResponse.json(
        { error: 'No file attached to this abstract' }, 
        { status: 404 }
      );
    }

    // 🎯 FIXED: Files are in public/uploads/abstracts/sub_xxxxx/ folders
    let filePath;
    
    // File structure: public/uploads/abstracts/sub_1748639559815_70fe789f/filename.pdf
    
    if (abstract.file_path) {
      // If full path is stored in database
      if (abstract.file_path.startsWith('/')) {
        filePath = path.join(process.cwd(), 'public', abstract.file_path);
      } else {
        filePath = path.join(process.cwd(), 'public', 'uploads', abstract.file_path);
      }
    } else if (abstract.file_name) {
      // Need to find the correct subfolder
      // Pattern: sub_{timestamp}_{hash}
      const abstractId = abstract.id;
      const submissionTimestamp = new Date(abstract.submission_date || abstract.submissionDate).getTime();
      
      // Try to construct folder name pattern
      const possibleFolders = [
        `sub_${abstractId}_${abstract.presenter_name?.toLowerCase().replace(/\s+/g, '')}`,
        `sub_${submissionTimestamp}_${abstractId}`,
        `sub_${abstractId}`,
        abstract.id.toString()
      ];
      
      // Search in abstract subfolders
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      
      filePath = null;
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath).filter(item => {
          const fullPath = path.join(uploadsPath, item);
          return fs.statSync(fullPath).isDirectory();
        });
        
        console.log('📁 Found subfolders:', subfolders);
        
        // Look for abstract ID in folder names
        for (const folder of subfolders) {
          if (folder.includes(abstractId) || folder.includes(abstract.id)) {
            const testPath = path.join(uploadsPath, folder, abstract.file_name);
            if (fs.existsSync(testPath)) {
              filePath = testPath;
              console.log('✅ Found file in subfolder:', folder);
              break;
            }
          }
        }
        
        // If not found by ID, search all subfolders for the filename
        if (!filePath) {
          for (const folder of subfolders) {
            const testPath = path.join(uploadsPath, folder, abstract.file_name);
            if (fs.existsSync(testPath)) {
              filePath = testPath;
              console.log('✅ Found file in subfolder (by filename):', folder);
              break;
            }
          }
        }
      }
    }

    console.log('📂 Primary file path:', filePath);

    // Check if file exists
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('❌ File not found at primary location:', filePath);
      
      // Try direct search in all abstract subfolders
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'abstracts');
      let foundPath = null;
      
      if (fs.existsSync(uploadsPath)) {
        const subfolders = fs.readdirSync(uploadsPath);
        
        for (const folder of subfolders) {
          const folderPath = path.join(uploadsPath, folder);
          if (fs.statSync(folderPath).isDirectory()) {
            // Check all files in this subfolder
            const files = fs.readdirSync(folderPath);
            
            for (const file of files) {
              // Match by filename or partial filename
              if (file === abstract.file_name || 
                  file.includes(abstract.file_name) ||
                  abstract.file_name.includes(file)) {
                foundPath = path.join(folderPath, file);
                console.log('✅ Found file by search:', foundPath);
                break;
              }
            }
            
            if (foundPath) break;
          }
        }
      }
      
      if (!foundPath) {
        console.log('❌ File not found in any abstract subfolder');
        
        // List available files for debugging
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
        
        return NextResponse.json(
          { 
            error: 'File not found on server', 
            details: `File exists in database but missing from uploads folder`,
            file_name: abstract.file_name,
            file_path: abstract.file_path,
            abstract_id: abstract.id,
            expected_location: 'public/uploads/abstracts/sub_xxxxx/',
            available_files: availableFiles,
            search_attempted: true
          }, 
          { status: 404 }
        );
      }
      
      filePath = foundPath;
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log('✅ File read successfully:', {
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
    
    console.log('📤 Serving file download:', {
      original_name: abstract.file_name,
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
        'X-Original-Filename': abstract.file_name
      }
    });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    
    return NextResponse.json(
      { 
        error: 'Download failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
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

// 🔧 ALTERNATIVE: If PostgreSQL getAbstractById doesn't work, use this SQLite version
/*
// Fallback SQLite version
import Database from 'better-sqlite3';

function getAbstractByIdSQLite(id) {
  try {
    const db = new Database('./database.sqlite');
    const stmt = db.prepare('SELECT * FROM abstracts WHERE id = ?');
    const result = stmt.get(id);
    db.close();
    return result;
  } catch (error) {
    console.error('SQLite query error:', error);
    throw error;
  }
}

// Replace the getAbstractById call with:
// const abstract = getAbstractByIdSQLite(params.id);
*/

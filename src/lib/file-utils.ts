// src/lib/file-utils.ts

import path from 'path'

// Browser-compatible UUID generator
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// File upload response interface
export interface UploadResponse {
  success: boolean
  message: string
  uploadedFiles: UploadedFileInfo[]
  errors: UploadError[]
  submissionId: string
}

export interface UploadedFileInfo {
  originalName: string
  fileName: string
  size: number
  type: string
  path: string
  uploadedAt: string
}

export interface UploadError {
  fileName: string
  error: string
}

// ✅ DOWNLOAD RESPONSE INTERFACE
export interface DownloadResponse {
  success: boolean
  message: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  contentType?: string
  error?: string
}

// Generate unique submission ID (client-side only)
export function generateSubmissionId(): string {
  // Avoid hydration issues by using simpler approach
  if (typeof window === 'undefined') {
    // Server-side fallback
    return 'sub_loading'
  }
  
  // Client-side generation
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `sub_${timestamp}_${randomPart}`
}

// Generate safe filename with timestamp and UUID
export function generateSafeFilename(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase()
  const nameWithoutExt = path.basename(originalName, extension)
  
  // Remove special characters and replace with underscore
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50) // Limit length
    .trim()
  
  const timestamp = Date.now()
  const uuid = generateUUID().split('-')[0]
  
  return `${timestamp}_${uuid}_${safeName}${extension}`
}

// Create upload directory path
export function createUploadPath(submissionId: string, subDir: string = 'abstracts'): string {
  return path.join(process.cwd(), 'public', 'uploads', subDir, submissionId)
}

// Create relative path for frontend access
export function createRelativePath(submissionId: string, fileName: string, subDir: string = 'abstracts'): string {
  return `/uploads/${subDir}/${submissionId}/${fileName}`
}

// Upload file to server
export async function uploadFileToServer(
  file: File, 
  submissionId: string = 'temp'
): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('submissionId', submissionId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Upload multiple files to server
export async function uploadMultipleFiles(
  files: File[], 
  submissionId: string = 'temp'
): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    
    files.forEach(file => {
      formData.append('files', file)
    })
    
    formData.append('submissionId', submissionId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get uploaded files for a submission
export async function getUploadedFiles(submissionId: string): Promise<UploadedFileInfo[]> {
  try {
    const response = await fetch(`/api/upload?submissionId=${submissionId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`)
    }

    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('Error fetching uploaded files:', error)
    return []
  }
}

// Delete uploaded file
export async function deleteUploadedFile(submissionId: string, fileName: string): Promise<boolean> {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissionId, fileName })
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// ✅ ENHANCED DOWNLOAD FUNCTION
export async function downloadAbstractFile(
  abstractId: string | number,
  fileName?: string
): Promise<DownloadResponse> {
  try {
    console.log('📥 Downloading abstract file:', abstractId);
    
    const response = await fetch(`/api/abstracts/download/${abstractId}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
      
      return {
        success: false,
        message: `Download failed: ${response.status} ${response.statusText}`,
        error: errorData.error || 'Unknown error'
      };
    }

    // Get file information from headers
    const contentDisposition = response.headers.get('content-disposition');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    let downloadFileName = fileName || `abstract_${abstractId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        downloadFileName = filenameMatch[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    console.log('✅ Download successful:', downloadFileName);
    
    return {
      success: true,
      message: 'File downloaded successfully',
      fileName: downloadFileName,
      fileSize: contentLength ? parseInt(contentLength) : undefined,
      contentType: contentType
    };
    
  } catch (error) {
    console.error('❌ Download error:', error);
    
    return {
      success: false,
      message: `Download error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ✅ BATCH DOWNLOAD FUNCTION
export async function downloadMultipleAbstracts(
  abstractIds: (string | number)[],
  zipFileName?: string
): Promise<DownloadResponse> {
  try {
    console.log('📥 Downloading multiple abstracts:', abstractIds.length);
    
    const downloadPromises = abstractIds.map(async (id, index) => {
      try {
        const response = await fetch(`/api/abstracts/download/${id}`);
        if (response.ok) {
          const blob = await response.blob();
          const contentDisposition = response.headers.get('content-disposition');
          let fileName = `abstract_${id}.pdf`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              fileName = filenameMatch[1];
            }
          }
          
          return { blob, fileName, success: true };
        } else {
          return { success: false, error: `Failed to download abstract ${id}` };
        }
      } catch (error) {
        return { success: false, error: `Error downloading abstract ${id}: ${error}` };
      }
    });
    
    const results = await Promise.all(downloadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length === 0) {
      return {
        success: false,
        message: 'No files could be downloaded',
        error: 'All downloads failed'
      };
    }
    
    // For now, download files individually
    // In the future, you could implement ZIP creation here
    let downloadCount = 0;
    for (const result of successful) {
      if (result.blob && result.fileName) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        downloadCount++;
        
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return {
      success: true,
      message: `Downloaded ${downloadCount} files successfully${failed.length > 0 ? ` (${failed.length} failed)` : ''}`,
    };
    
  } catch (error) {
    console.error('❌ Batch download error:', error);
    
    return {
      success: false,
      message: `Batch download error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Download file (generic)
export function downloadFile(filePath: string, originalName: string): void {
  const link = document.createElement('a')
  link.href = filePath
  link.download = originalName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ✅ ENHANCED DOWNLOAD WITH PROGRESS
export async function downloadFileWithProgress(
  url: string,
  fileName: string,
  onProgress?: (percentage: number) => void
): Promise<DownloadResponse> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      received += value.length;
      
      if (onProgress && total > 0) {
        const percentage = (received / total) * 100;
        onProgress(Math.round(percentage));
      }
    }
    
    // Combine chunks
    const blob = new Blob(chunks);
    
    // Download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
    
    return {
      success: true,
      message: 'Download completed successfully',
      fileName: fileName,
      fileSize: received
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// File type detection
export function getFileCategory(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase()
  
  switch (extension) {
    case '.pdf':
      return 'PDF Document'
    case '.doc':
    case '.docx':
      return 'Word Document'
    case '.txt':
      return 'Text Document'
    default:
      return 'Document'
  }
}

// Check if file is an image (for future use)
export function isImageFile(fileName: string): boolean {
  const extension = path.extname(fileName).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension)
}

// Check if file is a document
export function isDocumentFile(fileName: string): boolean {
  const extension = path.extname(fileName).toLowerCase()
  return ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(extension)
}

// ✅ CHECK IF FILE IS DOWNLOADABLE
export function isDownloadableFile(fileName: string): boolean {
  const extension = path.extname(fileName).toLowerCase()
  return ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.jpg', '.jpeg', '.png', '.gif'].includes(extension)
}

// Format bytes to human readable size
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Create file preview object
export function createFilePreview(file: File) {
  return {
    name: file.name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    type: file.type,
    category: getFileCategory(file.name),
    lastModified: new Date(file.lastModified),
    extension: path.extname(file.name).toLowerCase(),
    isImage: isImageFile(file.name),
    isDocument: isDocumentFile(file.name),
    isDownloadable: isDownloadableFile(file.name)
  }
}

// ✅ CREATE DOWNLOAD PREVIEW
export function createDownloadPreview(fileName: string, fileSize?: number) {
  return {
    name: fileName,
    size: fileSize || 0,
    formattedSize: fileSize ? formatBytes(fileSize) : 'Unknown size',
    category: getFileCategory(fileName),
    extension: path.extname(fileName).toLowerCase(),
    isImage: isImageFile(fileName),
    isDocument: isDocumentFile(fileName),
    isDownloadable: isDownloadableFile(fileName)
  }
}

// Validate file upload response
export function validateUploadResponse(response: any): response is UploadResponse {
  return (
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string' &&
    Array.isArray(response.uploadedFiles) &&
    Array.isArray(response.errors) &&
    typeof response.submissionId === 'string'
  )
}

// ✅ VALIDATE DOWNLOAD RESPONSE
export function validateDownloadResponse(response: any): response is DownloadResponse {
  return (
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string'
  )
}

// Create error response
export function createErrorResponse(error: string, submissionId: string = 'temp'): UploadResponse {
  return {
    success: false,
    message: error,
    uploadedFiles: [],
    errors: [{ fileName: 'unknown', error }],
    submissionId
  }
}

// ✅ CREATE DOWNLOAD ERROR RESPONSE
export function createDownloadErrorResponse(error: string): DownloadResponse {
  return {
    success: false,
    message: error,
    error
  }
}

// Create success response
export function createSuccessResponse(
  files: UploadedFileInfo[], 
  submissionId: string,
  errors: UploadError[] = []
): UploadResponse {
  return {
    success: true,
    message: `${files.length} file(s) uploaded successfully`,
    uploadedFiles: files,
    errors,
    submissionId
  }
}

// ✅ CREATE DOWNLOAD SUCCESS RESPONSE
export function createDownloadSuccessResponse(
  fileName: string,
  fileSize?: number,
  contentType?: string
): DownloadResponse {
  return {
    success: true,
    message: 'File downloaded successfully',
    fileName,
    fileSize,
    contentType
  }
}

// ✅ UTILITY FUNCTIONS FOR DOWNLOAD
export const downloadUtils = {
  // Check if browser supports downloads
  isDownloadSupported(): boolean {
    return typeof window !== 'undefined' && 'document' in window;
  },

  // Generate download filename with timestamp
  generateDownloadFilename(originalName: string, prefix: string = 'download'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = path.extname(originalName);
    const name = path.basename(originalName, extension);
    return `${prefix}_${name}_${timestamp}${extension}`;
  },

  // Clean filename for download
  cleanFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  },

  // Get MIME type from extension
  getMimeType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
};
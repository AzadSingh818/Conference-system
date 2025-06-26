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

// Download file
export function downloadFile(filePath: string, originalName: string): void {
  const link = document.createElement('a')
  link.href = filePath
  link.download = originalName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
    isDocument: isDocumentFile(file.name)
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
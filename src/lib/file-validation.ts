// src/lib/file-validation.ts

export interface FileValidationResult {
    valid: boolean
    error?: string
    details?: string
  }
  
  export interface FileValidationConfig {
    maxSize: number // in bytes
    allowedTypes: string[]
    allowedExtensions: string[]
    maxFiles: number
  }
  
  // Default configuration
  export const DEFAULT_FILE_CONFIG: FileValidationConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
    maxFiles: 5
  }
  
  // Validate single file
  export function validateFile(file: File, config: FileValidationConfig = DEFAULT_FILE_CONFIG): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        valid: false,
        error: 'No file provided'
      }
    }
  
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File too large`,
        details: `Maximum size allowed: ${formatFileSize(config.maxSize)}. Your file: ${formatFileSize(file.size)}`
      }
    }
  
    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty',
        details: 'Please select a valid file with content'
      }
    }
  
    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = config.allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file type',
        details: `Allowed types: ${config.allowedExtensions.join(', ')}`
      }
    }
  
    // Check MIME type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format',
        details: `Expected: PDF, DOC, DOCX, or TXT. Received: ${file.type}`
      }
    }
  
    return { valid: true }
  }
  
  // Validate multiple files
  export function validateFiles(files: File[], config: FileValidationConfig = DEFAULT_FILE_CONFIG): {
    valid: boolean
    errors: string[]
    validFiles: File[]
    invalidFiles: { file: File; error: string }[]
  } {
    const errors: string[] = []
    const validFiles: File[] = []
    const invalidFiles: { file: File; error: string }[] = []
  
    // Check number of files
    if (files.length > config.maxFiles) {
      errors.push(`Too many files. Maximum ${config.maxFiles} files allowed.`)
      return {
        valid: false,
        errors,
        validFiles: [],
        invalidFiles: files.map(file => ({ file, error: 'Too many files' }))
      }
    }
  
    // Validate each file
    files.forEach(file => {
      const validation = validateFile(file, config)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push({
          file,
          error: validation.error + (validation.details ? `: ${validation.details}` : '')
        })
        errors.push(`${file.name}: ${validation.error}`)
      }
    })
  
    return {
      valid: validFiles.length > 0 && invalidFiles.length === 0,
      errors,
      validFiles,
      invalidFiles
    }
  }
  
  // Check for duplicate file names
  export function checkDuplicateFiles(files: File[]): {
    hasDuplicates: boolean
    duplicates: string[]
  } {
    const fileNames = files.map(file => file.name.toLowerCase())
    const duplicates: string[] = []
    
    fileNames.forEach((name, index) => {
      if (fileNames.indexOf(name) !== index && !duplicates.includes(name)) {
        duplicates.push(name)
      }
    })
  
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates
    }
  }
  
  // Calculate total size of files
  export function calculateTotalSize(files: File[]): number {
    return files.reduce((total, file) => total + file.size, 0)
  }
  
  // Format file size in human readable format
  export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Get file extension
  export function getFileExtension(fileName: string): string {
    return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
  }
  
  // Check if file type is supported
  export function isFileTypeSupported(fileName: string, mimeType: string): boolean {
    const extension = getFileExtension(fileName)
    return DEFAULT_FILE_CONFIG.allowedExtensions.some(ext => ext.slice(1) === extension) &&
           DEFAULT_FILE_CONFIG.allowedTypes.includes(mimeType)
  }
  
  // Generate file preview info
  export function generateFilePreview(file: File) {
    return {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      extension: getFileExtension(file.name),
      lastModified: new Date(file.lastModified).toLocaleString()
    }
  }
  
  // Sanitize filename
  export function sanitizeFileName(fileName: string): string {
    // Remove special characters and replace with underscore
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
    const extension = fileName.substring(fileName.lastIndexOf('.'))
    
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9-_\s]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
    
    return sanitized + extension
  }
  
  // File type icons mapping
  export function getFileIcon(fileName: string): string {
    const extension = getFileExtension(fileName)
    
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'txt':
        return '📃'
      default:
        return '📎'
    }
  }
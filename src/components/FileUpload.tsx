'use client'
// src/components/FileUpload.tsx
import React, { useState, useRef, useCallback } from 'react'
import { validateFiles, formatFileSize, getFileIcon, generateFilePreview, DEFAULT_FILE_CONFIG } from '@/lib/file-validation'

interface UploadedFile {
  originalName: string
  fileName: string
  size: number
  type: string
  path: string
  uploadedAt: string
}

interface FileUploadProps {
  submissionId?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export default function FileUpload({
  submissionId = 'temp',
  onUploadComplete,
  onUploadError,
  maxFiles = DEFAULT_FILE_CONFIG.maxFiles,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const totalFiles = selectedFiles.length + fileArray.length

    // Check total file limit
    if (totalFiles > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed. You're trying to add ${totalFiles} files.`])
      return
    }

    // Validate files
    const validation = validateFiles(fileArray)
    
    if (validation.valid) {
      setSelectedFiles(prev => [...prev, ...validation.validFiles])
      setErrors([])
    } else {
      setErrors(validation.errors)
    }
  }, [selectedFiles.length, maxFiles])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, handleFileSelect])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setErrors([])
  }

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setErrors(['Please select files to upload'])
      return
    }

    setUploading(true)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUploadedFiles(prev => [...prev, ...data.uploadedFiles])
        setSelectedFiles([])
        onUploadComplete?.(data.uploadedFiles)
        
        if (data.errors.length > 0) {
          setErrors(data.errors.map((err: any) => `${err.fileName}: ${err.error}`))
        }
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setErrors([errorMessage])
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // Remove uploaded file
  const removeUploadedFile = async (fileName: string) => {
    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, fileName })
      })

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.fileName !== fileName))
      }
    } catch (error) {
      console.error('Error removing file:', error)
    }
  }

  // Calculate total size
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
  const canUpload = selectedFiles.length > 0 && !uploading && !disabled

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          <div className="text-4xl mb-4">📎</div>
          <div className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? 'Drop files here' : 'Upload Documents'}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
            >
              browse
            </button>
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported formats: PDF, DOC, DOCX, TXT</p>
            <p>Maximum file size: {formatFileSize(DEFAULT_FILE_CONFIG.maxSize)}</p>
            <p>Maximum {maxFiles} files per submission</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-400 mr-2">⚠️</div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">Upload Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <div className="text-xs text-gray-500">
              Total: {formatFileSize(totalSize)}
            </div>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const preview = generateFilePreview(file)
              return (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-lg mr-3">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {preview.size} • {preview.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="ml-3 text-red-600 hover:text-red-800 disabled:text-gray-400"
                  >
                    ❌
                  </button>
                </div>
              )
            })}
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadFiles}
            disabled={!canUpload}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              canUpload
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}...
              </div>
            ) : (
              `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-green-800">
            ✅ Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-lg mr-3">{getFileIcon(file.originalName)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-green-700">
                      {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📥 View
                  </a>
                  <button
                    onClick={() => removeUploadedFile(file.fileName)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
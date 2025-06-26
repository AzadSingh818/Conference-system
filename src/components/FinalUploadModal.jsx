// src/components/FinalUploadModal.jsx
// STEP 2B: Final Upload Component for Post-Approval Workflow

'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth-utils';

const FinalUploadModal = ({ abstract, isOpen, onClose, onUploadComplete }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileInfo, setCurrentFileInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Fetch current file status when modal opens
    if (isOpen && abstract && currentUser) {
      fetchUploadStatus();
    }
  }, [isOpen, abstract]);

  const fetchUploadStatus = async () => {
    try {
      const response = await fetch(
        `/api/abstracts/final-upload?abstractId=${abstract.id}&userId=${user.id}`
      );
      const result = await response.json();
      
      if (result.success) {
        setCurrentFileInfo(result.data.finalFile);
      }
    } catch (error) {
      console.error('Error fetching upload status:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
      
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setMessage('❌ File size too large. Maximum size is 10MB.');
        setSelectedFile(null);
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        setMessage('❌ Invalid file type. Only PDF, PowerPoint, and Word documents are allowed.');
        setSelectedFile(null);
        return;
      }

      setMessage(`✅ File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setMessage('❌ Please select a file first');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setMessage('🔄 Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('abstractId', abstract.id);
      formData.append('userId', user.id);
      formData.append('uploadType', 'final_presentation');

      const response = await fetch('/api/abstracts/final-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('success');
        setUploadProgress(100);
        setMessage(`✅ Upload successful! File: ${result.data.fileName}`);
        setCurrentFileInfo({
          name: result.data.fileName,
          size: result.data.fileSize,
          url: result.data.filePath,
          uploadDate: result.data.uploadDate
        });
        
        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
        
        // Clear selected file
        setSelectedFile(null);
        
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setMessage(`❌ Upload failed: ${error.message}`);
    }
  };

  const handleRemoveFile = async () => {
    const confirmed = confirm('Are you sure you want to remove the uploaded file? You can upload a new one afterwards.');
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/abstracts/final-upload?abstractId=${abstract.id}&userId=${user.id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      
      if (result.success) {
        setCurrentFileInfo(null);
        setMessage('✅ File removed successfully. You can now upload a new file.');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setMessage(`❌ Failed to remove file: ${error.message}`);
    }
  };

  const downloadTemplate = () => {
    // In a real implementation, you would provide actual template files
    alert('📥 Template download would be implemented here.\n\nPlease use the conference presentation template provided in your approval email.');
  };

  if (!isOpen || !abstract) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              📤 Final Abstract Upload
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Abstract Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ Abstract Approved: {abstract.title}
              </h3>
              <p className="text-green-700 text-sm">
                Congratulations! Your abstract has been approved. Please upload your final presentation file below.
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">📋 Upload Guidelines</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>File Types:</strong> PDF, PowerPoint (.ppt, .pptx), Word (.doc, .docx)</li>
                <li>• <strong>Maximum Size:</strong> 10MB</li>
                <li>• <strong>Content:</strong> Final presentation ready for conference</li>
                <li>• <strong>Naming:</strong> Use clear, descriptive filenames</li>
              </ul>
            </div>

            {/* Current File Status */}
            {currentFileInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">📄 Currently Uploaded File</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{currentFileInfo.name}</p>
                    <p className="text-sm text-gray-600">
                      {currentFileInfo.size ? `${(currentFileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                      {currentFileInfo.uploadDate && (
                        <span> • Uploaded {new Date(currentFileInfo.uploadDate).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {currentFileInfo.url && (
                      <a
                        href={currentFileInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        📥 Download
                      </a>
                    )}
                    <button
                      onClick={handleRemoveFile}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Template Download */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">📋 Presentation Template</h4>
                <p className="text-sm text-gray-600">Download the official conference template</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                📥 Download Template
              </button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">
                📤 {currentFileInfo ? 'Replace File' : 'Upload New File'}
              </h4>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  className="hidden"
                  id="final-file-upload"
                  disabled={uploadStatus === 'uploading'}
                />
                <label
                  htmlFor="final-file-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-600">
                    Click to select file or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, PowerPoint, Word (Max 10MB)
                  </p>
                </label>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-sm text-blue-700">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  uploadStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  uploadStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploadStatus === 'uploading' ? '⏳ Uploading...' : '📤 Upload File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalUploadModal;
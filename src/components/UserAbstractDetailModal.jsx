'use client';

import React from 'react';
import { X, FileText, User, Calendar, Building, Award, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function UserAbstractDetailModal({ abstract, isOpen, onClose }) {
  if (!isOpen || !abstract) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Abstract Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(abstract.status)}`}>
            {getStatusIcon(abstract.status)}
            <span className="ml-2">{abstract.status.toUpperCase()}</span>
          </div>

          {/* Abstract Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{abstract.title}</h2>
            <div className="text-sm text-gray-500">
              Abstract ID: {abstract.id} • Submitted: {new Date(abstract.submission_date).toLocaleDateString()}
            </div>
          </div>

          {/* Abstract Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Presenter</label>
                  <p className="mt-1 text-sm text-gray-900">{abstract.presenter_name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution</label>
                  <p className="mt-1 text-sm text-gray-900">{abstract.institution_name || abstract.institution}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Presentation Type</label>
                  <p className="mt-1 text-sm text-gray-900">{abstract.presentation_type}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{abstract.category || 'Hematology'}</p>
                </div>
              </div>

              {abstract.co_authors && (
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Co-authors</label>
                    <p className="mt-1 text-sm text-gray-900">{abstract.co_authors}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* File Attachments */}
              {abstract.file_url && (
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted File</label>
                    <button className="mt-1 flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4 mr-1" />
                      Download File
                    </button>
                  </div>
                </div>
              )}

              {/* Final File (if approved) */}
              {abstract.final_file_url && (
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Final Presentation</label>
                    <button className="mt-1 flex items-center text-sm text-green-600 hover:text-green-800">
                      <Download className="w-4 h-4 mr-1" />
                      Download Final
                    </button>
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(abstract.updated_at || abstract.submission_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abstract Content</label>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-900 max-h-60 overflow-y-auto">
              {abstract.abstract_content || abstract.abstract || 'No content available'}
            </div>
          </div>

          {/* Review Comments (if rejected) */}
          {abstract.status === 'rejected' && abstract.reviewer_comments && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Reviewer Comments</h4>
              <p className="text-sm text-red-700">{abstract.reviewer_comments}</p>
            </div>
          )}

          {/* Approval Message (if approved) */}
          {abstract.status === 'approved' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">�� Congratulations!</h4>
              <p className="text-sm text-green-700">
                Your abstract has been approved for presentation at APBMT 2025. 
                {!abstract.final_file_url && ' Please upload your final presentation when ready.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
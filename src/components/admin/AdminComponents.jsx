// src/components/admin/AdminComponents.jsx - COMPLETE FIXED VERSION
'use client';

import { useState } from 'react';

// 🎯 ENHANCED TOAST NOTIFICATION SYSTEM
const showToast = (message, type = 'success', duration = 8000) => {
  // Remove any existing toasts first
  const existingToasts = document.querySelectorAll('.custom-toast');
  existingToasts.forEach(toast => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  });

  const toast = document.createElement('div');
  toast.className = 'custom-toast fixed top-4 right-4 z-50 max-w-md animate-bounce';
  
  const bgColor = {
    'success': 'bg-green-500',
    'error': 'bg-red-500',
    'warning': 'bg-yellow-500',
    'info': 'bg-blue-500'
  }[type] || 'bg-green-500';

  toast.innerHTML = `
    <div class="${bgColor} text-white p-6 rounded-lg shadow-2xl border-l-4 border-white">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-bold mb-2">
            ${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : type === 'warning' ? 'Warning!' : 'Info'}
          </div>
          <div class="text-sm whitespace-pre-wrap">${message}</div>
        </div>
        <button 
          onclick="this.closest('.custom-toast').remove()" 
          class="text-white hover:text-gray-200 text-xl font-bold ml-4 flex-shrink-0"
          title="Close"
        >
          ×
        </button>
      </div>
      <div class="mt-4 flex justify-end">
        <button 
          onclick="this.closest('.custom-toast').remove()" 
          class="${bgColor} hover:opacity-80 text-white px-4 py-2 rounded font-medium text-sm border border-white border-opacity-30"
        >
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.transition = 'all 0.5s ease-out';
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 500);
    }
  }, duration);

  return toast;
};

// 🚀 FIXED EMAIL INTEGRATION
export const EmailIntegration = {
  sendEmail: async (abstract, emailType = 'status_update') => {
    try {
      console.log('🔄 Sending email to:', abstract.email, 'Type:', emailType);
      
      const response = await fetch('/api/abstracts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          data: {
            email: abstract.email || abstract.mobile_no,
            name: abstract.author || abstract.presenter_name,
            title: abstract.title || abstract.abstract_title,
            abstractId: abstract.id,
            status: abstract.status,
            category: abstract.category || abstract.presentation_type,
            institution: abstract.affiliation || abstract.institution_name,
            submissionId: abstract.abstract_number || abstract.id,
            reviewDate: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`✅ Email sent successfully to ${abstract.email}!\n\nType: ${emailType}\nSubject: Abstract ${abstract.status.toUpperCase()}`, 'success');
        return true;
      } else {
        showToast(`❌ Email failed: ${result.error}\n\nEmail: ${abstract.email}\nCheck email configuration.`, 'error');
        return false;
      }
    } catch (error) {
      console.error('Email error:', error);
      showToast(`❌ Email error: ${error.message}\n\nCheck:\n1. Email API endpoint\n2. Internet connection\n3. Email configuration`, 'error');
      return false;
    }
  },

  sendApprovalEmail: async (abstract) => {
    try {
      console.log('🔄 Sending approval email to:', abstract.email);
      
      const response = await fetch('/api/abstracts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_update',
          data: {
            email: abstract.email || abstract.mobile_no,
            name: abstract.author || abstract.presenter_name,
            title: abstract.title || abstract.abstract_title,
            abstractId: abstract.id,
            status: 'approved',
            category: abstract.category || abstract.presentation_type,
            institution: abstract.affiliation || abstract.institution_name,
            submissionId: abstract.abstract_number || abstract.id,
            reviewDate: new Date().toISOString(),
            comments: 'Your abstract has been approved for presentation.'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`✅ Approval email sent successfully!\n\nTo: ${abstract.email}\nAbstract: ${abstract.title}`, 'success');
        return true;
      } else {
        showToast(`❌ Approval email failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      showToast(`❌ Approval email error: ${error.message}`, 'error');
      return false;
    }
  },

  sendRejectionEmail: async (abstract, comments = '') => {
    try {
      console.log('🔄 Sending rejection email to:', abstract.email);
      
      const response = await fetch('/api/abstracts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_update',
          data: {
            email: abstract.email || abstract.mobile_no,
            name: abstract.author || abstract.presenter_name,
            title: abstract.title || abstract.abstract_title,
            abstractId: abstract.id,
            status: 'rejected',
            category: abstract.category || abstract.presentation_type,
            institution: abstract.affiliation || abstract.institution_name,
            submissionId: abstract.abstract_number || abstract.id,
            reviewDate: new Date().toISOString(),
            comments: comments || 'Please review and improve your abstract for future submissions.'
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`✅ Rejection email sent!\n\nTo: ${abstract.email}\nComments included: ${comments ? 'Yes' : 'Standard message'}`, 'success');
        return true;
      } else {
        showToast(`❌ Rejection email failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      showToast(`❌ Rejection email error: ${error.message}`, 'error');
      return false;
    }
  }
};

// EMAIL ACTION BUTTON COMPONENT
export const EmailActionButton = ({ abstract, buttonType = 'default', className = '' }) => {
  const handleEmailClick = async (e) => {
    e.stopPropagation();
    
    switch (buttonType) {
      case 'approval':
        await EmailIntegration.sendApprovalEmail(abstract);
        break;
      case 'rejection':
        const comments = prompt('Enter rejection comments (optional):');
        await EmailIntegration.sendRejectionEmail(abstract, comments);
        break;
      case 'status':
        await EmailIntegration.sendEmail(abstract, 'status_update');
        break;
      default:
        await EmailIntegration.sendEmail(abstract, 'general');
    }
  };

  const getButtonText = () => {
    switch (buttonType) {
      case 'approval': return '✅ Approve';
      case 'rejection': return '❌ Reject';
      case 'status': return '📧 Email';
      default: return '📧 Email';
    }
  };

  const getButtonColor = () => {
    switch (buttonType) {
      case 'approval': return 'bg-green-600 hover:bg-green-700';
      case 'rejection': return 'bg-red-600 hover:bg-red-700';
      case 'status': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-orange-600 hover:bg-orange-700';
    }
  };

  return (
    <button
      onClick={handleEmailClick}
      className={`${getButtonColor()} text-white px-2 py-1 rounded text-xs transition-colors ${className}`}
      title={`Send ${buttonType} email to ${abstract.email}`}
    >
      {getButtonText()}
    </button>
  );
};

// 1. STATISTICS TABLE COMPONENT
export const CategoryWiseStatisticsTable = ({ stats, categoryStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 Real-time Statistics Table</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Category</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Received</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Pending</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Approved</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Rejected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium">Free Paper Presentation</td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50 font-semibold text-blue-800">
                {categoryStats?.freePaper?.total || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-yellow-50 text-yellow-800">
                {categoryStats?.freePaper?.pending || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-green-50 text-green-800">
                {categoryStats?.freePaper?.approved || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-red-50 text-red-800">
                {categoryStats?.freePaper?.rejected || 0}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium">Award Paper Presentation</td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50 font-semibold text-blue-800">
                {categoryStats?.awardPaper?.total || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-yellow-50 text-yellow-800">
                {categoryStats?.awardPaper?.pending || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-green-50 text-green-800">
                {categoryStats?.awardPaper?.approved || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-red-50 text-red-800">
                {categoryStats?.awardPaper?.rejected || 0}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium">Poster Presentation</td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50 font-semibold text-blue-800">
                {categoryStats?.poster?.total || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-yellow-50 text-yellow-800">
                {categoryStats?.poster?.pending || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-green-50 text-green-800">
                {categoryStats?.poster?.approved || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-red-50 text-red-800">
                {categoryStats?.poster?.rejected || 0}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-medium">E-Poster Presentation</td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-blue-50 font-semibold text-blue-800">
                {categoryStats?.ePoster?.total || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-yellow-50 text-yellow-800">
                {categoryStats?.ePoster?.pending || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-green-50 text-green-800">
                {categoryStats?.ePoster?.approved || 0}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center bg-red-50 text-red-800">
                {categoryStats?.ePoster?.rejected || 0}
              </td>
            </tr>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Total</td>
              <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-900">
                {stats.total}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-bold text-yellow-900">
                {stats.pending}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-900">
                {stats.approved}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center font-bold text-red-900">
                {stats.rejected}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. ENHANCED ABSTRACT TABLE COMPONENT
export const EnhancedAbstractTable = ({ 
  abstracts, 
  onSelectAbstract, 
  onUpdateStatus, 
  onSendEmail, 
  onDownload, 
  onApprove,
  onReject,
  handleBulkStatusUpdate,
  updatingStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAbstracts, setSelectedAbstracts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const filteredAbstracts = getFilteredAbstracts();
      setSelectedAbstracts(filteredAbstracts.map(abstract => abstract.id));
    } else {
      setSelectedAbstracts([]);
    }
  };

  const handleSelectAbstract = (abstractId) => {
    setSelectedAbstracts(prev => {
      if (prev.includes(abstractId)) {
        const updated = prev.filter(id => id !== abstractId);
        setSelectAll(false);
        return updated;
      } else {
        const updated = [...prev, abstractId];
        const filteredAbstracts = getFilteredAbstracts();
        if (updated.length === filteredAbstracts.length) {
          setSelectAll(true);
        }
        return updated;
      }
    });
  };

  const getFilteredAbstracts = () => {
    return abstracts.filter(abstract => {
      const matchesSearch = abstract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          abstract.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          abstract.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || abstract.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || abstract.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // BULK EXPORT FUNCTION - COMPLETE
  const handleBulkExport = async () => {
    const selected = abstracts.filter(abstract => selectedAbstracts.includes(abstract.id));
    
    if (selected.length === 0) {
      showToast('❌ No abstracts selected for export', 'error');
      return;
    }

    try {
      showToast(
        `🔄 Preparing export for ${selected.length} abstracts...\n\nPlease wait...`,
        'info',
        5000
      );

      const exportData = selected.map((abstract, index) => ({
        'Abstract No': abstract.abstract_number || `ABST-${String(index + 1).padStart(3, '0')}`,
        'Submission Date': formatDate(abstract.submission_date || abstract.submissionDate),
        'Presenter Name': abstract.presenter_name || abstract.author,
        'Email ID': abstract.email,
        'Mobile No': abstract.mobile || 'N/A',
        'Abstract Title': abstract.title,
        'Co-Author Name': abstract.co_authors || abstract.coAuthors || 'N/A',
        'Institution Name': abstract.institution || abstract.affiliation,
        'Registration ID': abstract.registration_number || abstract.registrationId || 'N/A',
        'Status': (abstract.status || 'pending').toUpperCase(),
        'Category': abstract.presentation_type || abstract.category,
        'Abstract Content': abstract.abstract_content || abstract.abstract || 'N/A'
      }));

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header]?.toString() || '';
            return value.includes(',') || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `APBMT_Selected_Abstracts_${timestamp}_${selected.length}items.csv`;
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast(
        `✅ Export completed successfully!\n\n📊 Exported: ${selected.length} abstracts\n📁 File: ${filename}\n💾 Check your Downloads folder`,
        'success'
      );

    } catch (error) {
      console.error('Export error:', error);
      showToast(`❌ Export failed: ${error.message}`, 'error');
    }
  };

  const filteredAbstracts = getFilteredAbstracts();

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Abstract Review Interface</h3>
          
          {/* BULK ACTIONS */}
          {selectedAbstracts.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate && handleBulkStatusUpdate('approved')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Bulk Approve ({selectedAbstracts.length})
              </button>
              <button
                onClick={() => handleBulkStatusUpdate && handleBulkStatusUpdate('rejected')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Bulk Reject ({selectedAbstracts.length})
              </button>
              <button
                onClick={handleBulkExport}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Export Selected
              </button>
            </div>
          )}
        </div>
        
        {/* SEARCH AND FILTERS */}
        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Search abstracts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="Free Paper">Free Paper Presentation</option>
            <option value="Award Paper">Award Paper Presentation</option>
            <option value="Poster">Poster Presentation</option>
            <option value="E-Poster">E-Poster Presentation</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {/* ABSTRACTS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abstract No
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Presenter Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile No
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abstract Title
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Co-Author Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Institution Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action Buttons
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAbstracts.map((abstract, index) => (
              <tr 
                key={abstract.id} 
                className="hover:bg-gray-50"
              >
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAbstracts.includes(abstract.id)}
                    onChange={() => handleSelectAbstract(abstract.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {abstract.abstractNumber || `ABST-${String(index + 1).padStart(3, '0')}`}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(abstract.submissionDate)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {abstract.author}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {abstract.email}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {abstract.mobile || 'N/A'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {abstract.title}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {abstract.coAuthors || 'N/A'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {abstract.affiliation}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {abstract.registrationId || 'N/A'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(abstract.status)}`}>
                    {abstract.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onSelectAbstract(abstract)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDownload && onDownload(abstract)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      Download
                    </button>
                    
                    {abstract.status !== 'approved' && (
                      <button
                        onClick={() => onApprove && onApprove(abstract.id)}
                        disabled={updatingStatus === abstract.id}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingStatus === abstract.id ? '⏳' : 'Approve'}
                      </button>
                    )}

                    {abstract.status !== 'rejected' && (
                      <button
                        onClick={() => onReject && onReject(abstract.id)}
                        disabled={updatingStatus === abstract.id}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {updatingStatus === abstract.id ? '⏳' : 'Reject'}
                      </button>
                    )}
                    
                    <EmailActionButton 
                      abstract={abstract} 
                      buttonType="status"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredAbstracts.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No abstracts found</h3>
          <p className="text-gray-600">No abstracts match your current filters.</p>
        </div>
      )}
    </div>
  );
};

// 3. ABSTRACT REVIEW MODAL COMPONENT
export const AbstractReviewModal = ({ abstract, isOpen, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(abstract?.status || 'pending');
  const [presentationType, setPresentationType] = useState(abstract?.category || 'Free Paper');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [reviewerComments, setReviewerComments] = useState('');

  if (!isOpen || !abstract) return null;

  const handleSaveReview = async () => {
    if (onUpdateStatus) {
      onUpdateStatus({
        id: abstract.id,
        status: selectedStatus,
        presentationType,
        comments: reviewerComments,
        sendEmail: sendEmailNotification
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Abstract Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Abstract Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Abstract Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{abstract.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <p className="mt-1 text-sm text-gray-900">{abstract.author}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Institution</label>
                <p className="mt-1 text-sm text-gray-900">{abstract.affiliation}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{abstract.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Abstract Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900 max-h-40 overflow-y-auto">
                  {abstract.abstract || 'No content available'}
                </div>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Review Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Presentation Type</label>
                <select
                  value={presentationType}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Free Paper">Free Paper Presentation</option>
                  <option value="Award Paper">Award Paper Presentation</option>
                  <option value="Poster">Poster Presentation</option>
                  <option value="E-Poster">E-Poster Presentation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reviewer Comments</label>
                <textarea
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your review comments..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
                  Send email notification
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveReview}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Review
          </button>
        </div>
      </div>
    </div>
  );
};

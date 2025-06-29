'use client'
// src/app/admin/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryWiseStatisticsTable, EnhancedAbstractTable, AbstractReviewModal } from '@/components/admin/AdminComponents'

interface Abstract {
  id: string
  title: string
  author: string
  email: string
  affiliation: string
  category: string
  submissionDate: string
  status: 'pending' | 'approved' | 'rejected'
  abstract: string
  mobile?: string
  coAuthors?: string
  registrationId?: string
  abstractNumber?: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

interface CategoryStats {
  freePaper: { total: number; pending: number; approved: number; rejected: number }
  awardPaper: { total: number; pending: number; approved: number; rejected: number }
  poster: { total: number; pending: number; approved: number; rejected: number }
  ePoster: { total: number; pending: number; approved: number; rejected: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    freePaper: { total: 0, pending: 0, approved: 0, rejected: 0 },
    awardPaper: { total: 0, pending: 0, approved: 0, rejected: 0 },
    poster: { total: 0, pending: 0, approved: 0, rejected: 0 },
    ePoster: { total: 0, pending: 0, approved: 0, rejected: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null)
  const [filter, setFilter] = useState('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [showEmailTester, setShowEmailTester] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  useEffect(() => {
    fetchAbstracts()
  }, [filter])

  // Calculate category stats from abstracts
  const calculateCategoryStats = (abstractsList: Abstract[]) => {
    const stats = {
      freePaper: { total: 0, pending: 0, approved: 0, rejected: 0 },
      awardPaper: { total: 0, pending: 0, approved: 0, rejected: 0 },
      poster: { total: 0, pending: 0, approved: 0, rejected: 0 },
      ePoster: { total: 0, pending: 0, approved: 0, rejected: 0 }
    }

    abstractsList.forEach(abstract => {
      let category = 'freePaper'
      if (abstract.category.toLowerCase().includes('award')) category = 'awardPaper'
      else if (abstract.category.toLowerCase().includes('e-poster')) category = 'ePoster'
      else if (abstract.category.toLowerCase().includes('poster')) category = 'poster'

      stats[category].total++
      if (abstract.status === 'pending') stats[category].pending++
      else if (abstract.status === 'approved') stats[category].approved++
      else if (abstract.status === 'rejected') stats[category].rejected++
    })

    return stats
  }

  const fetchAbstracts = async () => {
    try {
      const url = filter === 'all' ? '/api/abstracts' : `/api/abstracts?status=${filter}`
      const response = await fetch(url)
      
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setAbstracts(data.abstracts)
        setStats(data.stats)
        
        // Calculate category stats
        const calculatedCategoryStats = calculateCategoryStats(data.abstracts)
        setCategoryStats(calculatedCategoryStats)
      }
    } catch (error) {
      console.error('Error fetching abstracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingStatus(id)
    try {
      const response = await fetch('/api/abstracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        setAbstracts(prev => 
          prev.map(abstract => 
            abstract.id === id ? { ...abstract, status } : abstract
          )
        )
        
        setStats(prev => {
          const newStats = { ...prev }
          const oldAbstract = abstracts.find(a => a.id === id)
          if (oldAbstract) {
            if (oldAbstract.status === 'pending') newStats.pending--
            else if (oldAbstract.status === 'approved') newStats.approved--
            else if (oldAbstract.status === 'rejected') newStats.rejected--
            
            if (status === 'approved') newStats.approved++
            else if (status === 'rejected') newStats.rejected++
          }
          return newStats
        })
        
        setSelectedAbstract(null)
        setShowReviewModal(false)
        
        // Recalculate category stats
        const updatedAbstracts = abstracts.map(abstract => 
          abstract.id === id ? { ...abstract, status } : abstract
        )
        const calculatedCategoryStats = calculateCategoryStats(updatedAbstracts)
        setCategoryStats(calculatedCategoryStats)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleReviewUpdate = (reviewData: any) => {
    console.log('Review update:', reviewData)
    updateStatus(reviewData.abstractId, reviewData.status)
  }

  const handleSelectAbstract = (abstract: Abstract) => {
    setSelectedAbstract(abstract)
    setShowReviewModal(true)
  }

  const handleLogout = () => {
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/admin/login')
  }

  const handleExportExcel = async (exportFilter: string = 'all') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: 'excel',
        status: exportFilter === 'current' ? filter : 'all',
        category: 'all',
        includeStats: 'true'
      })

      const response = await fetch(`/api/export?${params}`)
      
      if (response.ok) {
        const contentDisposition = response.headers.get('content-disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `APBMT_Abstracts_${new Date().toISOString().split('T')[0]}.xlsx`

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        console.log(`✅ Excel exported: ${filename}`)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // BULK UPDATE FUNCTION
  const handleBulkStatusUpdate = async (abstractIds: any, status: string, comments: string = '') => {
    try {
      console.log('🔍 Debug - Input parameters:', { abstractIds, status, comments });
      
      if (!abstractIds) {
        console.error('❌ abstractIds is undefined or null');
        alert('❌ Error: No abstracts selected. Please select abstracts first.');
        return { success: false, error: 'No abstracts selected' };
      }

      if (!status) {
        console.error('❌ status is undefined or null');
        alert('❌ Error: Status is required');
        return { success: false, error: 'Status is required' };
      }

      let idsArray: string[] = [];
      
      if (typeof abstractIds === 'string') {
        idsArray = [abstractIds];
      } else if (Array.isArray(abstractIds)) {
        idsArray = abstractIds.filter(id => id != null && id !== '');
      } else {
        console.error('❌ Invalid abstractIds type:', typeof abstractIds);
        alert('❌ Error: Invalid selection format');
        return { success: false, error: 'Invalid selection format' };
      }

      if (idsArray.length === 0) {
        console.error('❌ No valid abstract IDs found');
        alert('❌ Error: No valid abstracts selected. Please select abstracts first.');
        return { success: false, error: 'No valid abstracts selected' };
      }

      console.log('✅ Valid IDs array:', idsArray);
      
      setLoading(true);
      
      const requestBody = {
        abstractIds: idsArray,
        status,
        updatedBy: 'admin',
        comments: comments || '',
        bulkOperation: true
      };

      console.log('📤 Request body:', requestBody);
      
      const response = await fetch('/api/abstracts/bulk-update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Bulk update response:', data);

      const successful = data?.successful || data?.data?.successful || 0;
      const failed = data?.failed || data?.data?.failed || 0;
      const results = data?.results || data?.data?.results || [];
      const success = data?.success !== false && (successful > 0 || data?.success === true);

      console.log('📈 Processing results:', { successful, failed, success });

      if (success && successful > 0) {
        console.log(`✅ Successfully updated ${successful} abstracts`);
        
        alert(`✅ Bulk Update Successful!

📊 Results:
• Updated: ${successful} out of ${idsArray.length} abstracts
• Status: ${status.toUpperCase()}
• Failed: ${failed}
${comments ? `• Comments: ${comments}` : ''}

The page will refresh to show updated data.`);
        
        await fetchAbstracts();
        
        return { success: true, successful, failed };
        
      } else {
        const errorMsg = data?.message || data?.error || `Update failed. Expected: ${idsArray.length}, Successful: ${successful}`;
        console.error('❌ Update failed:', errorMsg);
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('❌ Bulk update error:', error);
      
      alert(`❌ Bulk Update Failed!

Error Details:
${error.message}

Debug Information:
• Selected IDs: ${JSON.stringify(abstractIds)}
• Status: ${status}
• Comments: ${comments || 'None'}

Troubleshooting:
1. Check internet connection
2. Verify server is running
3. Check browser console for details
4. Try refreshing the page

Contact administrator if problem persists.`);
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async (selectedIds: string[]) => {
    console.log('🔍 handleBulkApprove called with:', selectedIds);
    
    if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
      alert('⚠️ Please select abstracts to approve\n\nHow to select:\n1. Use checkboxes in the abstract list\n2. Select one or more abstracts\n3. Try the bulk approve action');
      return;
    }
    
    const comments = prompt('Enter approval comments (optional):') || 'Bulk approved by admin';
    
    if (confirm(`Approve ${Array.isArray(selectedIds) ? selectedIds.length : 1} selected abstracts?`)) {
      return await handleBulkStatusUpdate(selectedIds, 'approved', comments);
    }
  };

  const handleBulkReject = async (selectedIds: string[]) => {
    console.log('🔍 handleBulkReject called with:', selectedIds);
    
    if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
      alert('⚠️ Please select abstracts to reject\n\nHow to select:\n1. Use checkboxes in the abstract list\n2. Select one or more abstracts\n3. Try the bulk reject action');
      return;
    }
    
    const comments = prompt('Enter rejection reason (required):');
    
    if (!comments) {
      alert('❌ Rejection reason is required\n\nPlease provide a reason for rejection to help authors understand the decision.');
      return;
    }
    
    if (confirm(`Reject ${Array.isArray(selectedIds) ? selectedIds.length : 1} selected abstracts?`)) {
      return await handleBulkStatusUpdate(selectedIds, 'rejected', comments);
    }
  };

  const handleBulkPending = async (selectedIds: string[]) => {
    console.log('🔍 handleBulkPending called with:', selectedIds);
    
    if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
      alert('⚠️ Please select abstracts to mark as pending\n\nHow to select:\n1. Use checkboxes in the abstract list\n2. Select one or more abstracts\n3. Try the bulk pending action');
      return;
    }
    
    const comments = prompt('Enter comments (optional):') || 'Marked as pending by admin';
    
    if (confirm(`Mark ${Array.isArray(selectedIds) ? selectedIds.length : 1} selected abstracts as pending?`)) {
      return await handleBulkStatusUpdate(selectedIds, 'pending', comments);
    }
  };

  const handleIndividualApprove = async (abstractId: string, comments: string = '') => {
    console.log('🔍 Individual approve called for:', abstractId);
    
    try {
      setUpdatingStatus(abstractId);
      
      const finalComments = comments || prompt('Enter approval comments (optional):') || 'Approved by admin';
      
      if (confirm(`Approve this abstract?`)) {
        const result = await handleBulkStatusUpdate([abstractId], 'approved', finalComments);
        
        if (result && result.success) {
          console.log('✅ Individual approve successful');
        }
      }
    } catch (error) {
      console.error('❌ Individual approve failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleIndividualReject = async (abstractId: string, comments: string = '') => {
    console.log('🔍 Individual reject called for:', abstractId);
    
    try {
      setUpdatingStatus(abstractId);
      
      const finalComments = comments || prompt('Enter rejection reason (required):');
      
      if (!finalComments) {
        alert('❌ Rejection reason is required\n\nPlease provide a reason for rejection.');
        setUpdatingStatus(null);
        return;
      }
      
      if (confirm(`Reject this abstract?\n\nReason: ${finalComments}`)) {
        const result = await handleBulkStatusUpdate([abstractId], 'rejected', finalComments);
        
        if (result && result.success) {
          console.log('✅ Individual reject successful');
        }
      }
    } catch (error) {
      console.error('❌ Individual reject failed:', error);
      alert('Rejection failed. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleIndividualEmail = async (abstract: Abstract, emailType: string = 'custom') => {
    console.log('📧 Individual email called for:', abstract.id, emailType);
    
    try {
      let emailData = {
        to: abstract.email,
        abstractId: abstract.id,
        type: emailType,
        abstract: {
          title: abstract.title,
          author: abstract.author,
          status: abstract.status,
          abstractNumber: abstract.abstractNumber || `ABST-${abstract.id}`
        }
      };

      if (emailType === 'custom') {
        const subject = prompt('Email Subject:', `Regarding your abstract: ${abstract.title}`);
        const message = prompt('Email Message:', 'Dear Author,\n\nRegarding your abstract submission...\n\nBest regards,\nAPBMT 2025 Team');
        
        if (!subject || !message) {
          alert('Email cancelled - Subject and message are required');
          return;
        }
        
        emailData = {
          ...emailData,
          subject,
          message
        };
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Email sent successfully to ${abstract.email}`);
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
      
    } catch (error: any) {
      console.error('📧 Email error:', error);
      alert(`❌ Email failed: ${error.message}\n\nPlease check email configuration.`);
    }
  };

  // ✅ ENHANCED DOWNLOAD FUNCTION
  const handleIndividualDownload = async (abstract: Abstract) => {
    console.log('📥 Individual download called for:', abstract.id);
    
    try {
      if (!abstract.abstractNumber && !abstract.id) {
        alert('❌ Cannot download: Abstract ID missing');
        return;
      }

      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3B82F6; color: white; padding: 15px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>Downloading abstract...</div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingToast);

      // Try the download API
      const response = await fetch(`/api/abstracts/download/${abstract.id}`);
      
      // Remove loading toast
      document.body.removeChild(loadingToast);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          
          alert(`📄 Download Info:

Abstract ID: ${abstract.id}
Title: ${abstract.title}
Author: ${abstract.author}

❌ Error: ${errorData.error}

${errorData.details ? `Details: ${errorData.details}` : ''}

${errorData.available_files ? `Available files in system:
${JSON.stringify(errorData.available_files, null, 2)}` : ''}

Please contact administrator if file should be available.`);
          return;
        }
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Abstract_${abstract.id}_${abstract.title.substring(0, 30)}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 15px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div>✅</div>
            <div>
              <div style="font-weight: bold;">Download Successful!</div>
              <div style="font-size: 14px; opacity: 0.9;">File: ${filename}</div>
            </div>
            <button onclick="this.closest('div').parentNode.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
          </div>
        </div>
      `;
      document.body.appendChild(successToast);
      
      // Auto remove success toast
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 5000);
      
      console.log('✅ Download successful');
      
    } catch (error: any) {
      console.error('📥 Download error:', error);
      
      alert(`❌ Download Failed!

Error: ${error.message}

Abstract Information:
• ID: ${abstract.id}
• Title: ${abstract.title}
• Author: ${abstract.author}

Troubleshooting:
1. Check if file was uploaded with the abstract
2. Verify file exists in uploads folder
3. Check server logs for detailed error
4. Contact administrator if problem persists

Technical Details:
${error.stack ? `Stack: ${error.stack.substring(0, 200)}...` : 'No additional details available'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">PHOCON 2025 - Conference Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowEmailTester(!showEmailTester)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📧 Email System
              </button>
              <div className="relative">
                <button
                  onClick={() => handleExportExcel('all')}
                  disabled={exporting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {exporting ? '⏳ Exporting...' : '📊 Export Excel'}
                </button>
              </div>
              <span className="text-sm text-gray-500">
                📊 Total: {stats.total} submissions
              </span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white bg-black hover:bg-gray-800"
              >
                🏠 Main Site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Tester */}
        {showEmailTester && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">📧 Email System Tester</h3>
            <EmailTestComponent />
          </div>
        )}

        {/* Statistics Table */}
        <CategoryWiseStatisticsTable stats={stats} categoryStats={categoryStats} />

        {/* Abstract Review Interface */}
        <EnhancedAbstractTable 
          abstracts={abstracts}
          onSelectAbstract={handleSelectAbstract}
          onUpdateStatus={updateStatus}
          onSendEmail={handleIndividualEmail}
          onDownload={handleIndividualDownload}
          onApprove={handleIndividualApprove}
          onReject={handleIndividualReject}
          handleBulkStatusUpdate={handleBulkStatusUpdate}
          updatingStatus={updatingStatus}
        />

        {/* Abstract Review Modal */}
        <AbstractReviewModal
          abstract={selectedAbstract}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedAbstract(null)
          }}
          onUpdateStatus={handleReviewUpdate}
        />
      </div>
    </div>
  )
}

// Email Test Component
function EmailTestComponent() {
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState('')
  const [emailConfig, setEmailConfig] = useState<any>(null)

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/api/email?action=status')
      const data = await response.json()
      setEmailConfig(data)
    } catch (error) {
      console.error('Config check failed:', error)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      setResult('❌ Please enter an email address')
      return
    }

    setTesting(true)
    setResult('📤 Sending test email...')

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          data: { email: testEmail }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult('✅ Test email sent successfully! Check your inbox.')
      } else {
        setResult(`❌ Test email failed: ${data.error}`)
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    checkEmailConfig()
  }, [])

  return (
    <div className="space-y-4">
      {emailConfig && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Email Configuration Status:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Service: <span className={emailConfig.configuration?.service !== 'Not configured' ? 'text-green-600' : 'text-red-600'}>{emailConfig.configuration?.service || 'Not configured'}</span></div>
            <div>User: <span className={emailConfig.configuration?.user === 'Configured' ? 'text-green-600' : 'text-red-600'}>{emailConfig.configuration?.user || 'Not configured'}</span></div>
          </div>
          <div className="mt-2">
            <span className={`font-medium ${emailConfig.ready ? 'text-green-600' : 'text-red-600'}`}>
              {emailConfig.ready ? '✅ Email system ready' : '❌ Email system not configured'}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Email Address:
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email address"
        />
      </div>

      <button
        onClick={sendTestEmail}
        disabled={testing || !testEmail}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {testing ? '📤 Sending...' : '📧 Send Test Email'}
      </button>

      {result && (
        <div className={`p-3 rounded-lg text-sm ${
          result.includes('✅') ? 'bg-green-100 text-green-700' : 
          result.includes('❌') ? 'bg-red-100 text-red-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {result}
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">📋 Quick Setup Guide:</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>1. Add email settings to <code>.env.local</code></p>
          <p>2. For Gmail: Enable 2FA and create App Password</p>
          <p>3. Set EMAIL_USER and EMAIL_PASS variables</p>
          <p>4. Test the email system above</p>
        </div>
      </div>
    </div>
  )
}
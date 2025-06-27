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

  // 🔧 FIXED BULK UPDATE FUNCTION - All Error Handling Added
  const handleBulkStatusUpdate = async (abstractIds: any, status: string, comments: string = '') => {
    try {
      console.log('🔍 Debug - Input parameters:', { abstractIds, status, comments });
      
      // 🔧 SAFE CHECK: Validate input parameters
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

      // 🔧 SAFE ARRAY CONVERSION: Handle all possible input types
      let idsArray: string[] = [];
      
      if (typeof abstractIds === 'string') {
        // Single ID as string
        idsArray = [abstractIds];
      } else if (Array.isArray(abstractIds)) {
        // Already an array
        idsArray = abstractIds.filter(id => id != null && id !== ''); // Remove null/undefined/empty
      } else {
        // Unexpected type
        console.error('❌ Invalid abstractIds type:', typeof abstractIds);
        alert('❌ Error: Invalid selection format');
        return { success: false, error: 'Invalid selection format' };
      }

      // 🔧 VALIDATE ARRAY: Check if we have valid IDs
      if (idsArray.length === 0) {
        console.error('❌ No valid abstract IDs found');
        alert('❌ Error: No valid abstracts selected. Please select abstracts first.');
        return { success: false, error: 'No valid abstracts selected' };
      }

      console.log('✅ Valid IDs array:', idsArray);
      
      // Show loading state
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

      // Handle multiple response formats with safe access
      const successful = data?.successful || data?.data?.successful || 0;
      const failed = data?.failed || data?.data?.failed || 0;
      const results = data?.results || data?.data?.results || [];
      const success = data?.success !== false && (successful > 0 || data?.success === true);

      console.log('📈 Processing results:', { successful, failed, success });

      if (success && successful > 0) {
        console.log(`✅ Successfully updated ${successful} abstracts`);
        
        // Show detailed success notification
        alert(`✅ Bulk Update Successful!

📊 Results:
• Updated: ${successful} out of ${idsArray.length} abstracts
• Status: ${status.toUpperCase()}
• Failed: ${failed}
${comments ? `• Comments: ${comments}` : ''}

The page will refresh to show updated data.`);
        
        // Refresh the data
        await fetchAbstracts();
        
        return { success: true, successful, failed };
        
      } else {
        const errorMsg = data?.message || data?.error || `Update failed. Expected: ${idsArray.length}, Successful: ${successful}`;
        console.error('❌ Update failed:', errorMsg);
        throw new Error(errorMsg);
      }

    } catch (error: any) {
      console.error('❌ Bulk update error:', error);
      
      // Show detailed error information
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

  // 🔧 UPDATED HELPER FUNCTIONS WITH BETTER ERROR HANDLING
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

  // 🔧 INDIVIDUAL APPROVE FUNCTION
  const handleIndividualApprove = async (abstractId: string, comments: string = '') => {
    console.log('🔍 Individual approve called for:', abstractId);
    
    try {
      setUpdatingStatus(abstractId);
      
      const finalComments = comments || prompt('Enter approval comments (optional):') || 'Approved by admin';
      
      if (confirm(`Approve this abstract?`)) {
        const result = await handleBulkStatusUpdate([abstractId], 'approved', finalComments);
        
        if (result && result.success) {
          console.log('✅ Individual approve successful');
          // Auto refresh will happen in handleBulkStatusUpdate
        }
      }
    } catch (error) {
      console.error('❌ Individual approve failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

 // 🔧 UPDATED: Enhanced Individual Download Function
const handleIndividualDownload = async (abstract: Abstract) => {
  console.log('📥 Individual download called for:', abstract.id);
  
  if (!abstract.id) {
    alert('❌ Cannot download: Abstract ID missing');
    return;
  }
  
  try {
    setLoading(true);
    
    // Call the download API
    const response = await fetch(`/api/abstracts/download/${abstract.id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        // Show detailed error information
        const errorMsg = errorData.error || 'File not found';
        alert(`📄 Download Failed\n\nAbstract ID: ${abstract.id}\nTitle: ${abstract.title}\nAuthor: ${abstract.author}\n\nError: ${errorMsg}\n\nPossible causes:\n• File was not uploaded\n• File was deleted\n• Download API not configured\n\nPlease check the server logs for more details.`);
        
        // Log detailed error for debugging
        console.error('📥 Download failed - Details:', {
          abstractId: abstract.id,
          title: abstract.title,
          errorData,
          responseStatus: response.status
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
      return;
    }
    
    // Process successful download
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = `Abstract_${abstract.id}.pdf`;
    
    // Extract filename from response headers
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match) fileName = match[1];
    }
    
    // Create and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    console.log('✅ Download successful:', fileName);
    
    // Show success message (optional)
    // alert(`✅ Downloaded: ${fileName}`);
    
  } catch (error: any) {
    console.error('📥 Download error:', error);
    alert(`❌ Download Failed: ${error.message}\n\nPlease contact administrator if the problem persists.`);
  } finally {
    setLoading(false);
  }
};

  // 🧪 DEBUG FUNCTION - Add this for testing
  const debugBulkUpdate = async () => {
    console.log('🧪 Running debug test...');
    
    // Test with the actual abstract ID from your console output
    const testId = "17486939990261rjsh8yx3";
    
    console.log('Testing with ID:', testId);
    
    try {
      const result = await handleBulkStatusUpdate([testId], 'approved', 'Debug test approval');
      console.log('✅ Debug test result:', result);
    } catch (error) {
      console.error('❌ Debug test failed:', error);
    }
  };

  // 🎯 MAKE DEBUG FUNCTION AVAILABLE GLOBALLY
  if (typeof window !== 'undefined') {
    (window as any).debugBulkUpdate = debugBulkUpdate;
    (window as any).handleBulkStatusUpdate = handleBulkStatusUpdate;
    (window as any).testIndividualApprove = (id: string) => handleIndividualApprove(id, 'Test approval');
    (window as any).testIndividualReject = (id: string) => handleIndividualReject(id, 'Test rejection');
    (window as any).testIndividualEmail = (abstract: Abstract) => handleIndividualEmail(abstract, 'test');
    (window as any).testIndividualDownload = (abstract: Abstract) => handleIndividualDownload(abstract);
  }

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
              <p className="text-gray-600">APBMT 2025 - PRD Compliant Conference Management System</p>
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
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

        {/* 🧪 DEBUG PANEL - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-yellow-800">🧪 Debug Panel</h3>
            <div className="space-y-2">
              <button
                onClick={debugBulkUpdate}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                🧪 Test Bulk Update
              </button>
              <p className="text-sm text-yellow-700">
                This panel is only visible in development mode. Use the test button to verify bulk update functionality.
              </p>
            </div>
          </div>
        )}

        {/* PRD SECTION 3.4.2 - Real-time Statistics Table */}
        <CategoryWiseStatisticsTable stats={stats} categoryStats={categoryStats} />

        {/* PRD SECTION 3.4.3 - Enhanced Abstract Review Interface */}
        <EnhancedAbstractTable 
          abstracts={abstracts}
          onSelectAbstract={handleSelectAbstract}
          onUpdateStatus={updateStatus}
          onSendEmail={handleIndividualEmail}           // ✅ Fixed
          onDownload={handleIndividualDownload}         // ✅ Fixed
          onApprove={handleIndividualApprove}           // ✅ New
          onReject={handleIndividualReject}             // ✅ New
          handleBulkStatusUpdate={handleBulkStatusUpdate}
          updatingStatus={updatingStatus}              // ✅ Pass loading state
        />

        {/* PRD SECTION 3.4.4 - Abstract Review Modal */}
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

// Keep existing Email Test Component
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

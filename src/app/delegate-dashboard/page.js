'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Lock, Eye, EyeOff, CheckCircle, Clock, FileText, 
  Download, Upload, Award, LogOut, Settings, Bell, Calendar, 
  Hotel, Users, CreditCard, UserCheck, Edit, Search, Filter,
  Plus, Eye as ViewIcon, Upload as UploadIcon, FileDown,
  X, AlertCircle, CheckCircle2, Home, ChevronRight, ExternalLink,
  RefreshCw, Wifi, WifiOff, Save, ArrowLeft
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '@/lib/auth-utils';
import FinalUploadModal from '@/components/FinalUploadModal';
import ValidatedTextArea from '@/components/ValidatedTextArea';

export default function DelegateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showFinalUpload, setShowFinalUpload] = useState(false);
  const [selectedAbstract, setSelectedAbstract] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetched, setLastFetched] = useState(null);

  // 🚀 NEW: Edit functionality states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAbstract, setEditingAbstract] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [wordCountValid, setWordCountValid] = useState(true);

  // Authentication check
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('❌ No authenticated user found, redirecting to login');
      router.push('/delegate-login');
      return;
    }
    console.log('✅ Authenticated user:', currentUser.name);
    setUser(currentUser);
    fetchUserAbstracts();
  }, [router]);

  // PRODUCTION API CALL - Real backend integration
  const fetchUserAbstracts = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoading(true);
      setApiError(null);

      // Check for authentication token
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        setApiError('Authentication token missing. Please login again.');
        setTimeout(() => router.push('/delegate-login'), 2000);
        return;
      }

      console.log('🔍 Making API call to fetch user abstracts...');
      console.log('📱 Token preview:', token.substring(0, 20) + '...');

      const response = await fetch('/api/abstracts/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // Always fetch fresh data
      });

      console.log('📡 API Response Status:', response.status);

      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ Authentication failed - token expired or invalid');
        setApiError('Session expired. Please login again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        setTimeout(() => router.push('/delegate-login'), 2000);
        return;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response Data:', data);

      if (data.success) {
        const userAbstracts = data.abstracts || [];
        setAbstracts(userAbstracts);
        setLastFetched(new Date());
        setRetryCount(0); // Reset retry count on success
        
        console.log(`✅ Successfully loaded ${userAbstracts.length} abstracts for user`);
        
        if (userAbstracts.length > 0) {
          console.log('📝 Abstract titles:', userAbstracts.map(a => a.title));
        } else {
          console.log('📝 No abstracts found for this user');
        }
      } else {
        throw new Error(data.error || 'API returned success: false');
      }

    } catch (error) {
      console.error('❌ Error fetching user abstracts:', error);
      setApiError(`Failed to load abstracts: ${error.message}`);
      setAbstracts([]); // Clear abstracts on error
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    // Auto-refresh every 30 seconds if user is on dashboard/abstract sections
    const interval = setInterval(() => {
      if ((activeSection === 'dashboard' || activeSection === 'abstract') && !loading) {
        console.log('🔄 Auto-refreshing abstracts data...');
        fetchUserAbstracts(false); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeSection, loading]);

  // Handle logout with cleanup
  const handleLogout = () => {
    console.log('🚪 Logging out user');
    logoutUser();
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/delegate-login');
  };

  // Handle final upload
  const handleFinalUpload = (abstract) => {
    console.log('📤 Opening final upload modal for:', abstract.title);
    setSelectedAbstract(abstract);
    setShowFinalUpload(true);
  };

  // Close final upload modal and refresh data
  const closeFinalUpload = () => {
    console.log('❌ Closing final upload modal');
    setShowFinalUpload(false);
    setSelectedAbstract(null);
    fetchUserAbstracts(); // Refresh data after upload
  };

  // 🚀 NEW: Handle edit abstract
  const handleEditAbstract = (abstract) => {
    console.log('✏️ Opening edit modal for:', abstract.title);
    setEditingAbstract({
      id: abstract.id,
      title: abstract.title,
      presenter_name: abstract.presenter_name,
      institution_name: abstract.institution_name || abstract.institution,
      presentation_type: abstract.presentation_type,
      category: abstract.category || 'Hematology', // 🚀 NEW: Include category
      abstract_content: abstract.abstract_content || abstract.abstract,
      co_authors: abstract.co_authors || ''
    });
    setEditMessage('');
    setWordCountValid(true);
    setShowEditModal(true);
  };

  // 🚀 NEW: Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage('');

    if (!wordCountValid) {
      setEditMessage('❌ Please ensure your abstract meets the word limit requirements (300 words maximum).');
      setEditLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        setEditMessage('❌ Authentication token missing. Please login again.');
        setEditLoading(false);
        return;
      }

      console.log('🔄 Updating abstract:', editingAbstract.id);

      const response = await fetch('/api/abstracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingAbstract.id,
          title: editingAbstract.title,
          presenter_name: editingAbstract.presenter_name,
          institution_name: editingAbstract.institution_name,
          presentation_type: editingAbstract.presentation_type,
          category: editingAbstract.category, // 🚀 NEW: Include category in update
          abstract_content: editingAbstract.abstract_content,
          co_authors: editingAbstract.co_authors
        })
      });

      const result = await response.json();
      console.log('📊 Edit API Response:', result);

      if (response.ok && result.success) {
        setEditMessage('✅ Abstract updated successfully!');
        
        // Refresh abstracts list
        await fetchUserAbstracts();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowEditModal(false);
          setEditingAbstract(null);
          setEditMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || result.message || 'Update failed');
      }

    } catch (error) {
      console.error('❌ Edit submission error:', error);
      setEditMessage(`❌ Update failed: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // 🚀 NEW: Handle word count validation for edit
  const handleEditWordCountValidation = (validation) => {
    setWordCountValid(validation.isValid);
    console.log('📝 Edit word count validation:', validation);
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered by user');
    fetchUserAbstracts(true);
  };

  // Navigation menu items (PRD Section 3.3.1)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview and quick stats' },
    { id: 'abstract', label: 'Abstract', icon: FileText, description: 'Submission and management' },
    { id: 'schedule', label: 'Scientific Schedule', icon: Calendar, description: 'Conference program' },
    { id: 'hotels', label: 'Hotel List', icon: Hotel, description: 'Accommodation options' },
    { id: 'faculty', label: 'Faculty', icon: Users, description: 'Speaker information' },
    { id: 'invoice', label: 'Invoice', icon: CreditCard, description: 'Payment and billing' },
    { id: 'registration', label: 'Registration', icon: UserCheck, description: 'Profile and registration details' }
  ];

  // Get status badge with enhanced styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
        icon: Clock, 
        text: 'Pending Review' 
      },
      'approved': { 
        color: 'bg-green-100 text-green-800 border-green-300', 
        icon: CheckCircle, 
        text: 'Approved' 
      },
      'rejected': { 
        color: 'bg-red-100 text-red-800 border-red-300', 
        icon: X, 
        text: 'Rejected' 
      },
      'final_submitted': { 
        color: 'bg-blue-100 text-blue-800 border-blue-300', 
        icon: CheckCircle2, 
        text: 'Final Submitted' 
      },
      'under_review': { 
        color: 'bg-orange-100 text-orange-800 border-orange-300', 
        icon: Clock, 
        text: 'Under Review' 
      }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  // 🚀 NEW: Get category badge
  const getCategoryBadge = (category) => {
    const categoryConfig = {
      'Hematology': { color: 'bg-red-100 text-red-700 border-red-300' },
      'Oncology': { color: 'bg-purple-100 text-purple-700 border-purple-300' },
      'InPHOG': { color: 'bg-blue-100 text-blue-700 border-blue-300' },
      'Nursing': { color: 'bg-green-100 text-green-700 border-green-300' },
      'HSCT': { color: 'bg-orange-100 text-orange-700 border-orange-300' }
    };
    
    const config = categoryConfig[category] || categoryConfig['Hematology'];
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
        🏷️ {category}
      </span>
    );
  };

  // Enhanced Abstract Management Component (PRD Section 3.3.2)
  const AbstractManagement = () => (
    <div className="space-y-6">
      {/* Connection Status & Refresh Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {apiError ? (
                <WifiOff className="w-4 h-4 text-red-500 mr-2" />
              ) : (
                <Wifi className="w-4 h-4 text-green-500 mr-2" />
              )}
              <span className="text-sm text-gray-600">
                {apiError ? 'Connection Error' : 'Connected'}
              </span>
            </div>
            {lastFetched && (
              <span className="text-xs text-gray-500">
                Last updated: {lastFetched.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Abstract Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-green-700">Abstract Management Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Submit Abstract Button */}
          <button
            onClick={() => router.push('/submit')}
            className="flex items-center justify-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <Plus className="w-5 h-5 text-blue-600 mr-2" />
            <div className="text-left">
              <span className="text-blue-700 font-medium block">Submit Abstract</span>
              <span className="text-blue-500 text-xs">New submission form</span>
            </div>
          </button>

          {/* View Status Button */}
          <button
            onClick={() => setActiveSection('abstract')}
            className="flex items-center justify-center p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <ViewIcon className="w-5 h-5 text-green-600 mr-2" />
            <div className="text-left">
              <span className="text-green-700 font-medium block">View Status</span>
              <span className="text-green-500 text-xs">Track review progress</span>
            </div>
          </button>

          {/* Download Template Button */}
          <button
            onClick={() => window.open('/templates/abstract-template.docx', '_blank')}
            className="flex items-center justify-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <FileDown className="w-5 h-5 text-purple-600 mr-2" />
            <div className="text-left">
              <span className="text-purple-700 font-medium block">Preset Template</span>
              <span className="text-purple-500 text-xs">Download format</span>
            </div>
          </button>
        </div>
      </div>

      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Connection Error</h4>
              <p className="text-red-700 text-sm mt-1">{apiError}</p>
              <p className="text-red-600 text-xs mt-2">
                Retry attempt: {retryCount}/3
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Retrying...' : 'Retry Now'}
                </button>
                <button
                  onClick={() => router.push('/delegate-login')}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Re-login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Abstracts List - REAL DATA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Your Submitted Abstracts</h3>
            <span className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${abstracts.length} abstract${abstracts.length !== 1 ? 's' : ''} found`}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your abstracts from server...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          ) : abstracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {apiError ? 'Unable to Load Abstracts' : 'No Abstracts Found'}
              </h4>
              <p className="text-gray-600 mb-4">
                {apiError 
                  ? 'There was an issue connecting to the server. Please check your connection and try again.'
                  : 'You haven\'t submitted any abstracts yet for APBMT 2025. Get started by submitting your first research abstract.'
                }
              </p>
              <div className="flex justify-center space-x-3">
                {apiError ? (
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Retrying...' : 'Retry Loading'}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/submit')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Submit Your First Abstract
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {abstracts.map((abstract) => (
                <div key={abstract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{abstract.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>ID:</strong> {abstract.id} • 
                          <strong> Submitted:</strong> {new Date(abstract.submission_date).toLocaleDateString()} • 
                          <strong> Type:</strong> {abstract.presentation_type}
                        </p>
                        {/* 🚀 NEW: Display category */}
                        <p>
                          <strong>Category:</strong> {abstract.category || 'Hematology'} • 
                          <strong> Presenter:</strong> {abstract.presenter_name}
                        </p>
                        <p>
                          <strong>Institution:</strong> {abstract.institution_name || abstract.institution}
                        </p>
                        {abstract.co_authors && (
                          <p><strong>Co-authors:</strong> {abstract.co_authors}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {getStatusBadge(abstract.status)}
                      {/* 🚀 NEW: Category badge */}
                      {getCategoryBadge(abstract.category || 'Hematology')}
                    </div>
                  </div>

                  {/* Action Buttons based on Status */}
                  <div className="flex flex-wrap gap-2">
                    {/* 🚀 UPDATED: Edit Abstract - Only for pending */}
                    {abstract.status === 'pending' && (
                      <button 
                        onClick={() => handleEditAbstract(abstract)}
                        className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition-colors"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Abstract
                      </button>
                    )}

                    {/* View Abstract Details */}
                    <button className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                      <ViewIcon className="w-3 h-3 mr-1" />
                      View Details
                    </button>

                    {/* Download Submitted File */}
                    {abstract.file_url && (
                      <button className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                        <Download className="w-3 h-3 mr-1" />
                        Download File
                      </button>
                    )}

                    {/* Final Upload - Only for approved abstracts */}
                    {abstract.status === 'approved' && !abstract.final_file_url && (
                      <button
                        onClick={() => handleFinalUpload(abstract)}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                      >
                        <UploadIcon className="w-3 h-3 mr-1" />
                        Upload Final Abstract
                      </button>
                    )}

                    {/* Download Certificate - For approved abstracts */}
                    {abstract.status === 'approved' && (
                      <button className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors">
                        <Award className="w-3 h-3 mr-1" />
                        Download Certificate
                      </button>
                    )}

                    {/* Final Submitted Status */}
                    {abstract.status === 'final_submitted' && (
                      <span className="flex items-center px-3 py-1 bg-green-50 text-green-600 rounded text-sm border border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Final Submitted ✓
                      </span>
                    )}
                  </div>

                  {/* Reviewer Comments - For rejected abstracts */}
                  {abstract.status === 'rejected' && abstract.reviewer_comments && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Reviewer Comments:</strong> {abstract.reviewer_comments}
                      </p>
                    </div>
                  )}

                  {/* Additional Info for Approved Abstracts */}
                  {abstract.status === 'approved' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">
                        🎉 <strong>Congratulations!</strong> Your abstract has been approved for presentation at APBMT 2025.
                      </p>
                      {!abstract.final_file_url && (
                        <p className="text-xs text-green-600 mt-1">
                          Please upload your final presentation using the "Upload Final Abstract" button above.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Enhanced Dashboard Overview Component with Real-time Data
  const DashboardOverview = () => {
    const stats = {
      total: abstracts.length,
      pending: abstracts.filter(a => a.status === 'pending').length,
      approved: abstracts.filter(a => a.status === 'approved').length,
      rejected: abstracts.filter(a => a.status === 'rejected').length,
      finalSubmitted: abstracts.filter(a => a.status === 'final_submitted').length,
      underReview: abstracts.filter(a => a.status === 'under_review').length,
      
      // 🚀 NEW: Category-wise stats
      byCategory: {
        hematology: abstracts.filter(a => (a.category || 'Hematology').toLowerCase() === 'hematology').length,
        oncology: abstracts.filter(a => (a.category || 'Hematology').toLowerCase() === 'oncology').length,
        inphog: abstracts.filter(a => (a.category || 'Hematology').toLowerCase() === 'inphog').length,
        nursing: abstracts.filter(a => (a.category || 'Hematology').toLowerCase() === 'nursing').length,
        hsct: abstracts.filter(a => (a.category || 'Hematology').toLowerCase() === 'hsct').length
      }
    };

    return (
      <div className="space-y-6">
        {/* Enhanced Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-blue-100 mb-4">APBMT 2025 Conference Management System</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              ID: {user?.registration_id || 'Not assigned'}
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {user?.email}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Conference: March 15-17, 2025
            </div>
          </div>
        </div>

        {/* Real-time Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600 text-sm">Total Abstracts</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-gray-600 text-sm">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                <p className="text-gray-600 text-sm">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <X className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-gray-600 text-sm">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.finalSubmitted}</p>
                <p className="text-gray-600 text-sm">Final Submitted</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 NEW: Category Statistics */}
        {stats.total > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Your Abstracts by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.byCategory.hematology}</div>
                <div className="text-sm text-red-700">Hematology</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.byCategory.oncology}</div>
                <div className="text-sm text-purple-700">Oncology</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.byCategory.inphog}</div>
                <div className="text-sm text-blue-700">InPHOG</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.byCategory.nursing}</div>
                <div className="text-sm text-green-700">Nursing</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.byCategory.hsct}</div>
                <div className="text-sm text-orange-700">HSCT</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/submit')}
              className="flex items-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <Plus className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">Submit New Abstract</div>
                <div className="text-xs text-blue-500">Create and submit research</div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveSection('abstract')}
              className="flex items-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
            >
              <ViewIcon className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="text-sm font-medium text-green-600 group-hover:text-green-700">Manage Abstracts</div>
                <div className="text-xs text-green-500">View status & edit submissions</div>
              </div>
            </button>
            
            <button 
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group disabled:opacity-50"
            >
              <RefreshCw className={`h-6 w-6 text-purple-600 mr-3 ${loading ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </div>
                <div className="text-xs text-purple-500">Get latest updates</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Abstracts - Real Data from Backend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button 
                onClick={() => setActiveSection('abstract')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading recent activity...</p>
              </div>
            ) : abstracts.length > 0 ? (
              abstracts.slice(0, 3).map((abstract) => (
                <div key={abstract.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{abstract.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {abstract.id} • {abstract.presentation_type} • Category: {abstract.category || 'Hematology'} • Submitted: {new Date(abstract.submission_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Institution: {abstract.institution_name || abstract.institution}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col space-y-1">
                      {getStatusBadge(abstract.status)}
                      {getCategoryBadge(abstract.category || 'Hematology')}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Last updated: {new Date(abstract.updated_at || abstract.submission_date).toLocaleDateString()}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View Details</button>
                      {abstract.status === 'pending' && (
                        <button 
                          onClick={() => handleEditAbstract(abstract)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {abstract.status === 'approved' && !abstract.final_file_url && (
                        <button 
                          onClick={() => handleFinalUpload(abstract)}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Final
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No abstracts found</p>
                {!apiError && (
                  <button
                    onClick={() => router.push('/submit')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Submit your first abstract
                  </button>
                )}
                {apiError && (
                  <button
                    onClick={handleManualRefresh}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Retry loading
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {apiError ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-red-600">Connection Error</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                )}
              </div>
              {lastFetched && (
                <span className="text-xs text-gray-500">
                  Last sync: {lastFetched.toLocaleTimeString()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              Production Ready v2.0 • Real-time Data • Edit Support
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Placeholder components for other sections
  const PlaceholderSection = ({ title, icon: Icon, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
        Coming Soon
      </span>
    </div>
  );

  // Registration Details Component
  const RegistrationDetails = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-6 text-green-700">Registration Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-sm text-gray-900 font-medium">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Institution</label>
            <p className="mt-1 text-sm text-gray-900">{user?.institution || 'Not provided'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
              {user?.registration_id || 'Not assigned'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          </div>
        </div>
      </div>
      <div className="pt-6 border-t border-gray-200 mt-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
          Update Profile Information
        </button>
      </div>
    </div>
  );

  // 🚀 NEW: Edit Abstract Modal Component
  const EditAbstractModal = () => {
    if (!showEditModal || !editingAbstract) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Edit Abstract</h3>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingAbstract(null);
                setEditMessage('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Edit Message */}
            {editMessage && (
              <div className={`p-4 rounded-lg mb-6 ${
                editMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {editMessage}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abstract Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAbstract.title}
                    onChange={(e) => setEditingAbstract({...editingAbstract, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editLoading}
                  />
                </div>

                {/* Presenter Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presenter Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAbstract.presenter_name}
                    onChange={(e) => setEditingAbstract({...editingAbstract, presenter_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editLoading}
                  />
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAbstract.institution_name}
                    onChange={(e) => setEditingAbstract({...editingAbstract, institution_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editLoading}
                  />
                </div>

                {/* Presentation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presentation Type *
                  </label>
                  <select
                    required
                    value={editingAbstract.presentation_type}
                    onChange={(e) => setEditingAbstract({...editingAbstract, presentation_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editLoading}
                  >
                    {/* <option value="Free Paper">Free Paper</option> */}
                    <option value="Poster">Poster Presentation</option>
                    {/* <option value="E-Poster">E-Poster</option>
                    <option value="Award Paper">Award Paper</option> */}
                    <option value="Oral">Oral Presentation</option>
                  </select>
                </div>

                {/* 🚀 NEW: Category Field in Edit Modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={editingAbstract.category}
                    onChange={(e) => setEditingAbstract({...editingAbstract, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={editLoading}
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="InPHOG">InPHOG</option>
                    <option value="Nursing">Nursing</option>
                    <option value="HSCT">HSCT</option>
                  </select>
                </div>

                {/* Co-Authors */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Co-Authors
                  </label>
                  <input
                    type="text"
                    value={editingAbstract.co_authors}
                    onChange={(e) => setEditingAbstract({...editingAbstract, co_authors: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comma-separated co-author names"
                    disabled={editLoading}
                  />
                </div>
              </div>

              {/* Abstract Content with Validation */}
              <div>
                <ValidatedTextArea
                  value={editingAbstract.abstract_content}
                  onChange={(content) => setEditingAbstract({...editingAbstract, abstract_content: content})}
                  presentationType={editingAbstract.presentation_type}
                  onValidationChange={handleEditWordCountValidation}
                  disabled={editLoading}
                  required={true}
                  placeholder="Enter your complete abstract here... (300 words maximum)"
                  label="Abstract Content (Edit Mode)"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAbstract(null);
                    setEditMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={editLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-1 inline" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !wordCountValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : !wordCountValid ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Fix Word Count
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'abstract':
        return <AbstractManagement />;
      case 'schedule':
        return <PlaceholderSection 
          title="Scientific Schedule" 
          description="View conference sessions, presentation timings, and speaker schedules for APBMT 2025"
          icon={Calendar}
        />;
      case 'hotels':
        return <PlaceholderSection 
          title="Hotel Accommodations" 
          description="Browse recommended hotels and accommodations near the conference venue"
          icon={Hotel}
        />;
      case 'faculty':
        return <PlaceholderSection 
          title="Faculty & Speakers" 
          description="Meet the distinguished faculty members and keynote speakers for APBMT 2025"
          icon={Users}
        />;
      case 'invoice':
        return <PlaceholderSection 
          title="Invoice & Payments" 
          description="View and download your conference registration invoices and payment receipts"
          icon={CreditCard}
        />;
      case 'registration':
        return <RegistrationDetails />;
      default:
        return <DashboardOverview />;
    }
  };

  // Loading screen
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading APBMT Dashboard...</p>
          <p className="text-gray-500 text-sm mt-1">Connecting to production server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">APBMT 2025</h1>
                <p className="text-xs text-gray-500">Production Environment • Edit Enabled</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center">
                {apiError ? (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span className="text-xs">Offline</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span className="text-xs">Online</span>
                  </div>
                )}
              </div>
              
              <Bell className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Enhanced Sidebar Navigation */}
        <nav className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-gray-200 md:min-h-screen">
          <div className="flex-1 px-4 py-6">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center w-full px-3 py-3 rounded-md text-sm font-medium transition-colors group ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div>{item.label}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-600">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* User info in sidebar */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <div className="flex items-center">
                    <Home className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-sm font-medium text-gray-500">Delegate Portal</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Page Content */}
          {renderContent()}
        </main>
      </div>

      {/* Final Upload Modal */}
      {showFinalUpload && selectedAbstract && (
        <FinalUploadModal
          abstract={selectedAbstract}
          onClose={closeFinalUpload}
        />
      )}

      {/* 🚀 NEW: Edit Abstract Modal */}
      <EditAbstractModal />
    </div>
  );
}
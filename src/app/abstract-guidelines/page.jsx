'use client';
import React from 'react';
import { 
  AlertCircle, Clock, FileText, CheckCircle, ArrowRight, Users, 
  Calendar, Award, Download, ExternalLink, ArrowLeft, Shield,
  Eye, Upload, Palette, Image, Monitor, Type, Zap
} from 'lucide-react';

export default function AbstractGuidelines() {

  const handleProceedToSubmit = () => {
    window.location.href = '/delegate-login';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToHome}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
            
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Abstract Submission Guidelines
              </h1>
              <p className="text-lg text-gray-600">
                APBMT 2025 - Asia-Pacific Blood and Marrow Transplantation Conference
              </p>
            </div>
            
            <div className="w-20"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Alert Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Important Notice</h3>
              <p className="text-red-700 text-sm">
                Abstract submission deadline has been extended to <strong>July 10th, 2025</strong>. 
                All guidelines below must be followed for successful submission.
              </p>
            </div>
          </div>
        </div>

        {/* Main Guidelines Panel */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">
              INSTRUCTIONS FOR ABSTRACT SUBMISSION
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-800 font-semibold text-lg">
              FOR FREE ORAL PAPER AND E-POSTER PRESENTATIONS
            </p>
            <p className="text-red-600 text-sm mt-1">
              This should be visible on the abstract submission page
            </p>
          </div>

          {/* Core Requirements Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Left Column - Essential Requirements */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Essential Requirements</h3>
              
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-800">Prior Registration Mandatory</p>
                    <p className="text-blue-700 text-sm">Conference registration is required for presentation</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Online Submission Only</p>
                    <p className="text-green-700 text-sm">Submit to conference website only. Include presenter details with abstract.</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-red-50 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">Submission Deadline</p>
                    <p className="text-red-700 font-medium">Extended to 10th July 2025</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-purple-50 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-purple-800">Original Work Only</p>
                    <p className="text-purple-700 text-sm">Previously published/presented abstracts at National/International forums not permitted</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Word Limits & Time Allocation */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Specifications</h3>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Word Limits
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">Oral Paper:</span>
                    <span className="font-bold text-blue-700">300 words</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">Poster Presentation:</span>
                    <span className="font-bold text-blue-700">300 words</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">E-Poster:</span>
                    <span className="font-bold text-blue-700">300 words</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Time Allocation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">Oral Paper:</span>
                    <span className="font-bold text-green-700">6 min + 2 min discussion</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="text-sm font-medium">E-Poster:</span>
                    <span className="font-bold text-green-700">5 min + 2 min discussion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Structure Requirements */}
          <div className="bg-yellow-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Required Abstract Structure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-yellow-700 mb-3">For Original Study (Paper/Poster):</h4>
                <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                  <li>Background</li>
                  <li>Methodology</li>
                  <li>Results</li>
                  <li>Conclusion</li>
                </ol>
              </div>
              <div className="bg-white p-4 rounded">
                <h4 className="font-medium text-yellow-700 mb-3">For Case Report (Poster):</h4>
                <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                  <li>Background</li>
                  <li>Case Report</li>
                  <li>Conclusion</li>
                </ol>
              </div>
            </div>
          </div>

          {/* E-Poster Specific Guidelines */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-purple-800 mb-6 flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Instructions for E-Poster Presentation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <Image className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-800">Format & Layout</h4>
                </div>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Create only ONE slide image</li>
                  <li>• Landscape layout (16:9)</li>
                  <li>• PowerPoint format</li>
                  <li>• Save as JPG image format</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <Type className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-800">Typography</h4>
                </div>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Font: Arial or Calibri only</li>
                  <li>• Font size: ≥11 points</li>
                  <li>• Avoid light colors</li>
                  <li>• Ensure readability</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <Zap className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-800">Technical Specs</h4>
                </div>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Images: ≥200 DPI</li>
                  <li>• File size: ≤5 MB</li>
                  <li>• No animations/GIFs</li>
                  <li>• No embedded videos</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-100 border border-purple-300 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Prohibited Elements:</h4>
              <p className="text-sm text-purple-700">
                <strong>Do NOT include:</strong> Hyperlinks, Animated Images, Animations, GIFs, 
                Embedded Documents, Videos. Use e-poster template provided on website.
              </p>
            </div>

            <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">File Naming:</h4>
              <p className="text-sm text-purple-700">
                Avoid symbols or special characters (e.g., +@/) while naming the file. 
                Use simple names like: <code className="bg-gray-100 px-2 py-1 rounded">AbstractTitle_AuthorName.jpg</code>
              </p>
            </div>
          </div>

          {/* Review Process */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Review Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700">APBMT Scientific Committee will review all abstracts</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700">Acceptance will be communicated to presenter</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700">Selection is at sole discretion of Scientific Committee</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700">Committee may change presentation type after review</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700">Abstract may be considered for free paper or e-poster</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-red-500 mr-2 mt-1" />
                  <p className="text-sm text-gray-700"><strong>Spot registrations NOT allowed for presenters</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-red-100 border border-red-300 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-red-800 mb-4">⚠️ Important Reminders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-red-700 space-y-2">
                <li>• Guidelines are dynamic and may change from conference to conference</li>
                <li>• Ensure all presenter details are mentioned along with abstract</li>
                <li>• Conference registration is mandatory for participation</li>
              </ul>
              <ul className="text-sm text-red-700 space-y-2">
                <li>• Follow word limits strictly for successful submission</li>
                <li>• Use only approved file formats for uploads</li>
                <li>• Submit before deadline - no extensions after July 10, 2025</li>
              </ul>
            </div>
          </div>

          {/* Sample Abstract Reference */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Sample Abstract Format
            </h3>
            <p className="text-blue-700 mb-4">
              Download sample abstract format for reference before submission:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Download Sample Format
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Download E-Poster Template
              </button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Submit Your Abstract?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Please ensure you have read and understood all guidelines above. 
              You must be registered for the conference to proceed with abstract submission.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Before proceeding:</strong> Make sure you have your conference registration credentials ready. 
                If not registered yet, you can register first and then submit your abstract.
              </p>
            </div>
            
            <button
              onClick={handleProceedToSubmit}
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-lg shadow-md"
            >
              <Upload className="h-5 w-5 mr-2" />
              Click Here for Online Submission
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              You will be redirected to the delegate login page to authenticate your conference registration.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            <strong>Note:</strong> Guidelines are dynamic and may change from conference to conference
          </p>
          <p className="text-xs mt-2">
            © APBMT 2025 - Asia-Pacific Blood and Marrow Transplantation Conference | 
            For queries: <a href="mailto:abstracts@apbmt2025.org" className="text-blue-600 hover:underline">abstracts@apbmt2025.org</a>
          </p>
        </div>
      </div>
    </div>
  );
}
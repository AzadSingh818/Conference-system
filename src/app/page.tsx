'use client';

import React, { useState } from 'react';
import { 
  Calendar, MapPin, Users, Award, FileText, Clock, 
  CheckCircle, ArrowRight, Mail, Phone, Globe, 
  Building, Heart, Microscope, User, UserPlus,
  Download, ExternalLink, Bell, Star, Target,
  Stethoscope, Activity, Brain, Shield
} from 'lucide-react';

export default function APBMTHomepage() {
  const [activeTab, setActiveTab] = useState('overview');

  const handleAbstractSubmission = () => {
    window.location.href = '/abstract-guidelines'; // ✅ Correct flow
  };

  const handleLogin = () => {
    window.location.href = '/delegate-login';
  };

  const handleRegister = () => {
    window.location.href = '/delegate-register';
  };

  const conferenceStats = [
    { icon: Users, label: 'Expected Attendees', value: '500+', color: 'blue' },
    { icon: FileText, label: 'Abstract Categories', value: '2', color: 'green' },
    { icon: Award, label: 'Keynote Speakers', value: '15', color: 'purple' },
    { icon: Calendar, label: 'Conference Days', value: '2', color: 'orange' }
  ];

  const importantDates = [
    { event: 'Abstract Submission Deadline', date: 'September 1,2025(midnight 1st)', status: 'extended', color: 'red' },
    { event: 'Early Bird Registration', date: 'July 1,2025', status: 'open', color: 'green' },
    { event: 'Abstact Notification', date: 'October 1,2025', status: 'upcoming', color: 'blue' },
    { event: 'Conference Dates', date: '29th-30th Nov,2025', status: 'confirmed', color: 'purple' }
  ];

  const abstractCategories = [
    // { 
    //   title: 'Free Paper Presentation', 
    //   duration: '6+2 minutes', 
    //   wordLimit: '250 words',
    //   icon: Microscope,
    //   description: 'Original research presentations with discussion'
    // },
    { 
      title: 'Poster Presentation', 
      duration: 'Display', 
      wordLimit: '300 words',
      icon: FileText,
      description: 'Visual presentation of research findings'
    },
    // { 
    //   title: 'E-Poster Presentation', 
    //   duration: '5+2 minutes', 
    //   wordLimit: '200 words',
    //   icon: Activity,
    //   description: 'Electronic poster with presentation slot'
    // },
    { 
      title: 'Oral Presentation', 
      duration: '8+2 minutes', 
      wordLimit: '300 words',
      icon: Activity,
      description: 'Competitive presentations for Oral session'
    }
  ];

  const keynoteSpeakers = [
    { name: 'Dr. Sarah Johnson', title: 'Pediatric BMT Expert', institution: 'Harvard Medical School' },
    { name: 'Prof. Michael Chen', title: 'Stem Cell Research', institution: 'Tokyo University' },
    { name: 'Dr. Priya Sharma', title: 'Immunotherapy Specialist', institution: 'AIIMS Delhi' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">PHOCON-2025</h1>
                <p className="text-xs text-gray-500">28th Annual Pediatric Hematology Oncology Conference</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('program')}
                className={`text-sm font-medium transition-colors ${activeTab === 'program' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Program
              </button>
              <button 
                onClick={() => setActiveTab('speakers')}
                className={`text-sm font-medium transition-colors ${activeTab === 'speakers' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Faculty
              </button>
              <button 
                onClick={() => setActiveTab('registration')}
                className={`text-sm font-medium transition-colors ${activeTab === 'registration' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Registration
              </button>
            </nav>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Login
              </button>
              <button
                onClick={handleRegister}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 mb-6">
            <Bell className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Abstract Submission Extended to September 1,2025(midnight 1st)</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6">
            PHOCON 2025 Annual Conference
          </h1>
          <p className="text-xl text-blue-100 mb-4 max-w-3xl mx-auto">
            PHOCON 28th Annual Pediatric Hematology Oncology Conference
          </p>
          <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
            Department of Pediatric Oncology Kasturba Medical College, Manipal University, Manipal
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <div className="flex items-center text-blue-100">
              <Calendar className="h-5 w-5 mr-2" />
              <span>29th - 30th Nov, 2025</span>
            </div>
            <div className="flex items-center text-blue-100">
              <MapPin className="h-5 w-5 mr-2" />
              <span>Dr TMA Pai Halls, KMC, Manipal</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Users className="h-5 w-5 mr-2" />
              <span>500+ Expected Attendees</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAbstractSubmission}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              <FileText className="h-5 w-5 mr-2" />
              Submit Abstract
            </button>
            <button
              onClick={handleRegister}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Register Now
            </button>
          </div>
        </div>
      </section>

      {/* System Status - Keep Original */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-600 bg-white">
              <Star className="h-5 w-5 mr-2 text-blue-600" />
              System Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold text-green-700">Database</div>
                <div className="text-sm text-green-600">Connected</div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🔐</div>
                <div className="font-semibold text-blue-700">Auth APIs</div>
                <div className="text-sm text-blue-600">Ready</div>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="font-semibold text-purple-700">Forms</div>
                <div className="text-sm text-purple-600">Active</div>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-semibold text-orange-700">Turbopack</div>
                <div className="text-sm text-orange-600">Enabled</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Enhanced */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-green-600 bg-white">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={handleAbstractSubmission}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors flex items-center justify-center"
              >
                <FileText className="h-5 w-5 mr-2" />
                📝 Submit Abstract
              </button>
              <button
                onClick={handleRegister}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                👤 New User
              </button>
              <button
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <User className="h-5 w-5 mr-2" />
                🔑 Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Conference Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Conference Overview</h2>
            <p className="text-lg text-gray-600">
              Join the PHOCON 28th Annual Pediatric Hematology Oncology Conference
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {conferenceStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${stat.color}-100 mb-4`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Dates & Abstract Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Important Dates */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Important Dates
              </h3>
              <div className="space-y-4">
                {importantDates.map((date, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{date.event}</div>
                      <div className="text-sm text-gray-600">{date.date}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      date.status === 'extended' ? 'bg-red-100 text-red-700' :
                      date.status === 'open' ? 'bg-green-100 text-green-700' :
                      date.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {date.status.charAt(0).toUpperCase() + date.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Abstract Categories */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Abstract Categories
              </h3>
              <div className="space-y-4">
                {abstractCategories.map((category, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <category.icon className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{category.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{category.description}</div>
                        <div className="flex space-x-4 text-xs text-gray-500">
                          <span>Duration: {category.duration}</span>
                          <span>Limit: {category.wordLimit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join PHOCON 2025?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Submit your research abstract and be part of the premier PHOCON 28th Annual Pediatric Hematology Oncology Conference
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAbstractSubmission}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              <FileText className="h-5 w-5 mr-2" />
              Submit Your Abstract
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <button
              onClick={() => window.open('mailto:info@apbmt2025.org', '_blank')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              <Mail className="h-5 w-5 mr-2" />
              Contact Organizers
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">PHOCON 2025</span>
              </div>
              <p className="text-gray-400 text-sm">
                PHOCON 28th Annual Pediatric Hematology Oncology Conference
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={handleAbstractSubmission} className="hover:text-white transition-colors">Submit Abstract</button></li>
                <li><button onClick={handleRegister} className="hover:text-white transition-colors">Registration</button></li>
                <li><button className="hover:text-white transition-colors">Scientific Program</button></li>
                <li><button className="hover:text-white transition-colors">Accommodation</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Abstract Deadline: September 1, 2025 (midnight 1st)</li>
                <li>Early Registration: July 1, 2025</li>
                <li>Conference: 29th-30th Nov, 2025</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>abstracts@phocon2025.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+916364690353</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Dr TMA Pai Halls, KMC, Manipal</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; PHOCON 28th Annual Pediatric Hematology Oncology Conference.All rights reserved.</p>
            {/* <p className="mt-2">🚀 Built with Next.js 15 + Turbopack + TypeScript + Tailwind CSS</p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
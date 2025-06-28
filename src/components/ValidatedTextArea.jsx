// src/components/ValidatedTextArea.jsx
'use client';

import React, { useState, useEffect } from 'react';
import WordCounter from './WordCounter';
import { validateWordCount } from '../lib/word-count-utils';

const ValidatedTextArea = ({
  value = '',
  onChange,
  presentationType = 'Poster', // Default to 'Poster'
  placeholder = 'Enter your abstract content here... (300 words maximum)',
  label = 'Abstract Content',
  required = true,
  className = '',
  rows = 8,
  disabled = false,
  showWordCount = true,
  onValidationChange = null
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Validate and notify parent component
  useEffect(() => {
    const validation = validateWordCount(value, presentationType);
    setHasContent(value.trim().length > 0);
    
    if (onValidationChange) {
      onValidationChange(validation);
    }
  }, [value, presentationType, onValidationChange]);

  const validation = validateWordCount(value, presentationType);
  
  // Get border color based on validation
  const getBorderClass = () => {
    if (!hasContent) return 'border-gray-300 focus:border-blue-500';
    if (validation.isValid) {
      if (validation.percentage <= 70) return 'border-green-400 focus:border-green-500';
      if (validation.percentage <= 90) return 'border-yellow-400 focus:border-yellow-500';
      return 'border-orange-400 focus:border-orange-500';
    }
    return 'border-red-400 focus:border-red-500';
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {/* 🚀 UPDATED: Show 300 word limit in label */}
        <span className="text-gray-500 text-xs ml-2">(Maximum 300 words)</span>
      </label>

      {/* Abstract Structure Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="font-medium text-blue-900 mb-1">Required Structure:</p>
        <p className="text-blue-800">
          <strong>Background:</strong> Research context and objectives • {' '}
          <strong>Methodology:</strong> Study design and methods • {' '}
          <strong>Results:</strong> Key findings and data • {' '}
          <strong>Conclusion:</strong> Clinical implications
        </p>
        {/* 🚀 NEW: Added word limit reminder */}
        <p className="text-blue-700 text-xs mt-2 font-medium">
          📝 Word Limit: 300 words for all presentation types
        </p>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:bg-gray-50 disabled:text-gray-500
            resize-none
            ${getBorderClass()}
            ${isFocused ? 'shadow-lg' : 'shadow-sm'}
          `}
          style={{
            minHeight: `${rows * 1.5}rem`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}
        />
        
        {/* Character feedback overlay */}
        {isFocused && hasContent && (
          <div className="absolute top-2 right-2 opacity-75">
            <div className={`
              text-xs px-2 py-1 rounded-full
              ${validation.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            `}>
              {validation.wordCount}w / 300w
            </div>
          </div>
        )}
      </div>

      {/* Word Counter */}
      {showWordCount && (
        <WordCounter 
          text={value}
          presentationType={presentationType}
          showProgress={true}
          showMessage={true}
        />
      )}

      {/* 🚀 UPDATED: Validation Error Message with 300 word limit */}
      {!validation.isValid && hasContent && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Word limit exceeded
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Your abstract is {Math.abs(validation.remaining)} words over the {validation.limit}-word limit for {presentationType}. 
                  Please reduce the content to meet submission requirements.
                </p>
                {/* 🚀 NEW: Additional helpful message */}
                <p className="mt-1 text-xs">
                  💡 Tip: Focus on the most essential findings and conclusions to stay within the 300-word limit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helpful tips when near limit */}
      {validation.isValid && validation.percentage > 85 && hasContent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Almost at limit:</strong> You have {validation.remaining} words remaining out of 300. 
                Consider reviewing for conciseness while maintaining scientific accuracy.
              </p>
              {/* 🚀 NEW: Additional guidance */}
              <p className="text-xs text-yellow-600 mt-1">
                💡 Consider using shorter sentences and removing unnecessary adjectives or adverbs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 NEW: Success message when word count is optimal */}
      {validation.isValid && validation.percentage >= 50 && validation.percentage <= 85 && hasContent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-sm text-green-700">
                <strong>Good length:</strong> {validation.wordCount} words used ({validation.remaining} remaining).
                Your abstract is at an optimal length for comprehensive review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 NEW: Guidance for very short abstracts */}
      {validation.isValid && validation.percentage < 50 && hasContent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-sm text-blue-700">
                <strong>Consider expanding:</strong> You have {validation.remaining} more words available. 
                Consider adding more detail to your methodology, results, or clinical implications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatedTextArea;
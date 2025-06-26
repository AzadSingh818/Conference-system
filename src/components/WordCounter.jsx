// src/components/WordCounter.jsx
'use client';

import React from 'react';
import { 
  validateWordCount, 
  getWordCountStatus, 
  getProgressColor, 
  getWordCountMessage 
} from '../lib/word-count-utils';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const WordCounter = ({ 
  text = '', 
  presentationType = 'Free Paper',
  className = '',
  showProgress = true,
  showMessage = true 
}) => {
  const validation = validateWordCount(text, presentationType);
  const status = getWordCountStatus(validation.wordCount, validation.limit);
  const progressColor = getProgressColor(validation.percentage);
  const message = getWordCountMessage(validation.wordCount, validation.limit, presentationType);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'near-limit':
        return <AlertTriangle className="h-4 w-4" />;
      case 'over-limit':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Word Count Summary */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
        <div className="flex items-center space-x-2">
          <span className={status.color}>
            {getStatusIcon()}
          </span>
          <span className={`text-sm font-medium ${status.color}`}>
            {validation.wordCount} / {validation.limit} words
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${status.color}`}>
            {Math.round(validation.percentage)}%
          </span>
          {validation.remaining < 0 && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
              Over by {Math.abs(validation.remaining)}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(validation.percentage, 100)}%` }}
          />
          {validation.percentage > 100 && (
            <div 
              className="h-2 bg-red-600 rounded-full transition-all duration-300 absolute"
              style={{ 
                width: `${validation.percentage - 100}%`,
                marginTop: '-8px',
                marginLeft: '100%'
              }}
            />
          )}
        </div>
      )}

      {/* Status Message */}
      {showMessage && (
        <p className={`text-sm ${status.color}`}>
          {message}
        </p>
      )}

      {/* Presentation Type Info */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Type: {presentationType}</span>
        <span>Limit: {validation.limit} words</span>
      </div>
    </div>
  );
};

export default WordCounter;
// src/lib/word-count-utils.js

// PRD defined word limits
export const WORD_LIMITS = {
    'Free Paper': 250,
    'Poster': 200,
    'E-Poster': 200,
    'Award Paper': 250,
    'Oral': 250, // Alternative naming
    'Poster Presentation': 200,
    'E-Poster Presentation': 200
  };
  
  /**
   * Count words in text (medical abstract optimized)
   * Handles medical terminology, abbreviations, numbers
   */
  export const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    
    // Remove extra whitespace and trim
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    // If empty after cleaning, return 0
    if (!cleanText) return 0;
    
    // Split by spaces and filter out empty strings
    const words = cleanText.split(' ').filter(word => word.length > 0);
    
    return words.length;
  };
  
  /**
   * Get word limit for presentation type
   */
  export const getWordLimit = (presentationType) => {
    if (!presentationType) return 250; // Default limit
    
    // Normalize presentation type
    const normalizedType = presentationType.toString().trim();
    
    return WORD_LIMITS[normalizedType] || 250;
  };
  
  /**
   * Validate word count against limit
   */
  export const validateWordCount = (text, presentationType) => {
    const wordCount = countWords(text);
    const limit = getWordLimit(presentationType);
    
    return {
      wordCount,
      limit,
      isValid: wordCount <= limit,
      remaining: limit - wordCount,
      percentage: Math.min((wordCount / limit) * 100, 100)
    };
  };
  
  /**
   * Get status color based on word count
   */
  export const getWordCountStatus = (wordCount, limit) => {
    const percentage = (wordCount / limit) * 100;
    
    if (percentage <= 70) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        status: 'good'
      };
    } else if (percentage <= 90) {
      return {
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-300',
        status: 'warning'
      };
    } else if (percentage <= 100) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100', 
        borderColor: 'border-orange-300',
        status: 'near-limit'
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300', 
        status: 'over-limit'
      };
    }
  };
  
  /**
   * Get progress bar color
   */
  export const getProgressColor = (percentage) => {
    if (percentage <= 70) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  /**
   * Format word count message
   */
  export const getWordCountMessage = (wordCount, limit, presentationType) => {
    const remaining = limit - wordCount;
    
    if (wordCount === 0) {
      return `Start typing your ${presentationType} abstract (${limit} words maximum)`;
    }
    
    if (remaining > 0) {
      return `${wordCount} of ${limit} words used (${remaining} remaining)`;
    } else if (remaining === 0) {
      return `Perfect! Exactly ${limit} words used`;
    } else {
      return `Over limit by ${Math.abs(remaining)} words. Please reduce to ${limit} words maximum.`;
    }
  };
  
  /**
   * Extract words for preview (first N words)
   */
  export const getWordPreview = (text, maxWords = 50) => {
    const words = text.trim().split(/\s+/).slice(0, maxWords);
    return words.join(' ') + (countWords(text) > maxWords ? '...' : '');
  };
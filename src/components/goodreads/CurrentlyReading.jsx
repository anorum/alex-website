import React, { useState, useEffect } from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

export default function CurrentlyReading({ currentlyReading = [] }) {
  const [books, setBooks] = useState(currentlyReading);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.currentlyReading) {
          setBooks(event.detail.currentlyReading);
        }
      };
      
      document.addEventListener('books-data-ready', handleDataReady);
      return () => document.removeEventListener('books-data-ready', handleDataReady);
    }
  }, []);
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // The date format in the JSON is YYYY/MM/DD, so we just need to replace / with -
    const date = new Date(dateStr.replace(/\//g, '-'));
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Generate a book cover or placeholder if no cover URL is available
  const renderBookCover = (book) => {
    if (book.cover_url) {
      return (
        <img 
          src={book.cover_url} 
          alt={`Cover of ${book.title}`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.parentNode.replaceChild(generateCoverPlaceholder(book.title, book.author), e.target);
          }}
        />
      );
    } else {
      return generateCoverPlaceholder(book.title, book.author);
    }
  };
  
  // Generate a book cover placeholder with title and author
  const generateCoverPlaceholder = (title, author) => {
    // Extract first letter of each word in title for the placeholder
    const titleInitials = title
      .split(' ')
      .slice(0, 3)
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    // Generate a consistent color based on the title
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-yellow-600', 
      'bg-red-600', 'bg-purple-600', 'bg-pink-600',
      'bg-indigo-600', 'bg-teal-600', 'bg-orange-600'
    ];
    
    const colorIndex = title
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return (
      <div className={`${colors[colorIndex]} text-white flex flex-col items-center justify-center p-2 rounded-md h-full`}>
        <div className="text-2xl font-bold">{titleInitials}</div>
        <div className="text-xs mt-2 text-center line-clamp-2">{title}</div>
        <div className="text-xs mt-1 opacity-80 text-center line-clamp-1">{author}</div>
      </div>
    );
  };
  
  if (!books || books.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <BookOpenIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
          Currently Reading
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No books currently being read</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <BookOpenIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
        Currently Reading
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {books.map((book, index) => (
          <div key={index} className="bg-white/10 dark:bg-gray-800/30 shadow-sm rounded-lg overflow-hidden">
            <div className="aspect-[2/3] w-full">
              {renderBookCover(book)}
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h4>
              <p className="text-xs text-gray-300 mb-2">{book.author}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Added: {formatDate(book.date_added)}</span>
                {book.average_rating > 0 && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {book.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

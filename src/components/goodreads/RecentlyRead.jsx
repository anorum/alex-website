import React, { useState, useEffect } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';

export default function RecentlyRead({ recentlyRead = [] }) {
  const [books, setBooks] = useState(recentlyRead);
  
  // Listen for data updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleDataReady = (event) => {
        if (event.detail?.recentlyRead) {
          setBooks(event.detail.recentlyRead);
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
  
  // Generate star rating display
  const renderStarRating = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        ))}
      </div>
    );
  };
  
  if (!books || books.length === 0) {
    return (
      <div className="stats-card p-2 sm:p-4">
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <BookmarkIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
          Recently Read
        </h3>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recently read books</p>
      </div>
    );
  }
  
  return (
    <div className="stats-card p-2 sm:p-4">
      <h3 className="text-lg font-semibold flex items-center mb-4">
        <BookmarkIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
        Recently Read
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/10 dark:bg-gray-700">
            <tr>
              <th className="p-2 text-left">Book</th>
              <th className="p-2 text-left hidden md:table-cell">Author</th>
              <th className="p-2 text-left hidden md:table-cell">Published</th>
              <th className="p-2 text-left">Rating</th>
              <th className="p-2 text-left hidden sm:table-cell">Date Read</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book, index) => (
              <tr key={index} className="border-b border-white/10 dark:border-gray-700 hover:bg-white/5 dark:hover:bg-gray-800">
                <td className="p-2">
                  <div className="flex items-center">
                    <div className="w-10 h-14 mr-3 rounded overflow-hidden flex-shrink-0">
                      {renderBookCover(book)}
                    </div>
                    <span className="font-medium text-sm line-clamp-2">{book.title}</span>
                  </div>
                </td>
                <td className="p-2 hidden md:table-cell">
                  {book.author}
                </td>
                <td className="p-2 hidden md:table-cell">
                  {book.original_publication_year || book.year_published}
                </td>
                <td className="p-2">
                  {book.my_rating > 0 ? renderStarRating(book.my_rating) : '-'}
                </td>
                <td className="p-2 hidden sm:table-cell">
                  {formatDate(book.date_read)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function FullScreenChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Listen for the custom event to open the chatbot
    const handleOpenChatbot = () => {
      setIsOpen(true);
      // Add a class to the body to prevent scrolling when the chatbot is open
      document.body.classList.add('chatbot-open');
    };
    
    document.addEventListener('open-fullscreen-chatbot', handleOpenChatbot);
    
    return () => {
      document.removeEventListener('open-fullscreen-chatbot', handleOpenChatbot);
    };
  }, []);
  
  useEffect(() => {
    // When the component mounts or isOpen changes
    if (isOpen) {
      // Hide the original chatbot button
      const originalChatbot = document.querySelector('#chainlit-copilot');
      if (originalChatbot) {
        originalChatbot.style.display = 'none';
      }
      
      // Set a timeout to show loading spinner for a short time
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // Show the original chatbot button when this is closed
      const originalChatbot = document.querySelector('#chainlit-copilot');
      if (originalChatbot) {
        originalChatbot.style.display = 'block';
      }
      // Remove the class from the body to allow scrolling again
      document.body.classList.remove('chatbot-open');
      setIsLoaded(false);
    }
  }, [isOpen]);
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="/mara_logo.png" alt="Mara" className="w-12 h-12 rounded-full border-2 border-blue-500 mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chat with Mara</h2>
              <p className="text-gray-600 dark:text-gray-400">Alex's AI assistant</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Website
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)]">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          <iframe 
            src="http://localhost:8000" 
            className={`w-full h-full rounded-xl ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            title="Mara Chatbot"
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Mara is an AI assistant trained on Alex's data. Feel free to ask questions about Alex's experience, skills, or interests.
          </p>
        </div>
      </div>
    </div>
  );
}

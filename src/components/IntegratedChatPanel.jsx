import { useState, useEffect } from 'react';

export default function IntegratedChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    // Listen for the custom event to open the chatbot
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    
    document.addEventListener('open-integrated-chat', handleOpenChatbot);
    
    return () => {
      document.removeEventListener('open-integrated-chat', handleOpenChatbot);
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
      setIsLoaded(false);
    }
  }, [isOpen]);
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={`fixed bottom-0 right-0 z-30 transition-all duration-300 ease-in-out ${isMinimized ? 'w-72 h-16' : 'w-full md:w-1/2 lg:w-2/5 h-[70vh]'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-tl-xl shadow-2xl w-full h-full flex flex-col border-t border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tl-xl">
          <div className="flex items-center">
            <img src="/mara_logo.png" alt="Mara" className="w-8 h-8 rounded-full mr-3 border-2 border-white" />
            <h2 className="text-lg font-semibold">Chat with Mara</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleMinimize}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </button>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="flex-1 relative">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            <iframe 
              src="http://localhost:8000" 
              className={`w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              title="Mara Chatbot"
            />
          </div>
        )}
      </div>
    </div>
  );
}

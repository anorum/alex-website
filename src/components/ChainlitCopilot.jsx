import { useEffect } from 'react';

export default function ChainlitCopilot() {
  useEffect(() => {
    // Inject external script first
    const script = document.createElement('script');
    script.src = "http://localhost:8000/copilot/index.js";
    script.async = true;
    document.body.appendChild(script);

    // Once loaded, configure chainlit
    script.onload = () => {
      window.addEventListener("chainlit-call-fn", (e) => {
        const { name, args, callback } = e.detail;
        callback("You sent: " + args.msg);
      });
      
      // Function to determine current theme
      const getCurrentTheme = () => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      };
      
      // Function to mount Chainlit with current theme
      const mountChainlit = () => {
        const currentTheme = getCurrentTheme();
        
        // Configure the Chainlit widget with custom CSS
        window.mountChainlitWidget({
          chainlitServer: "http://localhost:8000",
          theme: "dark", // Always use dark theme for Chainlit's internal styling
          customCssUrl: "/chainlit-custom.css",
          button: {
            imageUrl: "/mara_logo.png",
            position: "bottom-right",
            text: "Chat with Mara",
            tooltip: "Chat with Mara, Alex's AI Assistant",
            className: `border-2 ${currentTheme === 'dark' ? 'border-[#8fb996]' : 'border-[#0c6b4e]'} rounded-full p-4 transition-all duration-300 shadow-md hover:shadow-lg`
          }
        });
      };
      
      // Initial mount
      mountChainlit();
      
      // Listen for theme changes
      const themeToggleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && 
              mutation.target === document.documentElement) {
            // Instead of remounting, just update the theme class on the document
            const currentTheme = getCurrentTheme();
            
            // Update button border color
            const button = document.querySelector("#chainlit-copilot-button");
            if (button) {
              button.classList.remove('border-[#8fb996]', 'border-[#0c6b4e]');
              button.classList.add(currentTheme === 'dark' ? 'border-[#8fb996]' : 'border-[#0c6b4e]');
            }
            
            // Dispatch a custom event that our CSS can react to
            const themeChangeEvent = new CustomEvent('chainlit-theme-changed', { 
              detail: { theme: currentTheme } 
            });
            document.dispatchEvent(themeChangeEvent);
          }
        });
      });
      
      // Start observing theme changes
      themeToggleObserver.observe(document.documentElement, { attributes: true });

      // Watermark removal and customization logic
      const setupCustomizations = () => {
        const host = document.getElementById("chainlit-copilot");
        const shadowRoot = host?.shadowRoot;

        if (!shadowRoot) {
          console.warn("No shadow root found.");
          return;
        }

        const applyCustomizations = () => {
          // Remove watermark
          const watermark = shadowRoot.querySelector("a.watermark");
          if (watermark) {
            watermark.style.display = "none";
          }
          
          // Add title attribute to button for tooltip
          const button = shadowRoot.querySelector("#chainlit-copilot-button");
          if (button) {
            button.setAttribute("title", "Chat with Mara, Alex's AI Assistant");
          }
          
          // Add a class to the host element to help with CSS targeting
          host.classList.add('chainlit-host');
          
          // Add a class based on the current theme
          const currentTheme = getCurrentTheme();
          host.setAttribute('data-theme', currentTheme);
          
          // Add a style element for theme-specific styles
          const existingStyle = shadowRoot.querySelector('#chainlit-theme-styles');
          if (!existingStyle) {
            const styleElement = document.createElement('style');
            styleElement.id = 'chainlit-theme-styles';
            shadowRoot.appendChild(styleElement);
          }
        };

        applyCustomizations();

        // Listen for our custom theme change event
        document.addEventListener('chainlit-theme-changed', (e) => {
          host.setAttribute('data-theme', e.detail.theme);
        });

        // Set up an observer to maintain our customizations
        const observer = new MutationObserver(() => applyCustomizations());
        observer.observe(shadowRoot, { childList: true, subtree: true });
      };

      const waitForHost = setInterval(() => {
        const host = document.getElementById("chainlit-copilot");
        if (host && host.shadowRoot) {
          clearInterval(waitForHost);
          setupCustomizations();
        }
      }, 300);
    };
  }, []);

  return null;
}

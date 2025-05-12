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
      
      // Configure the Chainlit widget with custom CSS
      window.mountChainlitWidget({
        chainlitServer: "http://localhost:8000",
        theme: "dark",
        customCssUrl: "/chainlit-custom.css",
        button: {
          imageUrl: "/mara_logo.png",
          position: "bottom-right",
          text: "Chat with Mara",
          tooltip: "Chat with Mara, Alex's AI Assistant",
          className: "border-2 border-[#8fb996] rounded-full p-4"
        }
      });

      // Watermark removal logic
      const setupWatermarkHider = () => {
        const host = document.getElementById("chainlit-copilot");
        const shadowRoot = host?.shadowRoot;

        if (!shadowRoot) {
          console.warn("No shadow root found.");
          return;
        }

        const hide = () => {
          const watermark = shadowRoot.querySelector("a.watermark");
          if (watermark) {
            watermark.style.display = "none";
          }
          
          // Add title attribute to button for tooltip
          const button = shadowRoot.querySelector("#chainlit-copilot-button");
          if (button) {
            button.setAttribute("title", "Chat with Mara, Alex's AI Assistant");
          }
        };

        hide();

        const observer = new MutationObserver(() => hide());
        observer.observe(shadowRoot, { childList: true, subtree: true });
      };

      const waitForHost = setInterval(() => {
        const host = document.getElementById("chainlit-copilot");
        if (host && host.shadowRoot) {
          clearInterval(waitForHost);
          setupWatermarkHider();
        }
      }, 300);
    };
  }, []);

  return null;
}

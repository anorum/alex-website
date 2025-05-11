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
      
      // Configure the Chainlit widget with styling that matches the website
      window.mountChainlitWidget({
        chainlitServer: "http://localhost:8000",
        theme: "dark",
        button: {
          imageUrl: "/mara_logo.png",
          // Use button-compatible Tailwind classes that match the website's updated color scheme
          className: "bg-opacity-10 bg-white hover:bg-[#77647b] border border-white/10 hover:border-[#8fb996] rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
            console.log("Watermark hidden");
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

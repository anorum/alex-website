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

      window.mountChainlitWidget({
        chainlitServer: "http://localhost:8000",
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
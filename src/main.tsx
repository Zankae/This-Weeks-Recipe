import { createRoot } from "react-dom/client";
import { useRegisterSW } from "virtual:pwa-register/react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import App from "./App";
import "./styles.css";

function Root() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration)
        setInterval(
          () => registration.update().catch(() => {}),
          60 * 60 * 1000,
        );
    },
  });
  return (
    <>
      <App />
      {needRefresh && (
        <div className="update-bar" role="status">
          <span>New version ready</span>
          <button onClick={() => void updateServiceWorker(true)}>Reload</button>
          <button
            aria-label="Dismiss update"
            onClick={() => setNeedRefresh(false)}
          >
            Later
          </button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Root />);

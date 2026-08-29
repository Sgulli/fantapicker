import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <HotkeysProvider
      defaultOptions={{
        hotkey: { ignoreInputs: true, requireReset: true },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HotkeysProvider>
  </StrictMode>,
);

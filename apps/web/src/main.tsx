import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./index.css";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("新しいバージョンがあります。今すぐ更新する？")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("[mochi UV] オフラインでも使えます🌸");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

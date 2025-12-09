import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/**
 * Bootstraps the React application and renders it
 * into the root DOM element.
 *
 * This is the Vite entry point.
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
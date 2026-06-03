import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthContextProvider from "./context/AuthContext";
import NotificationContextProvider from "./context/NotificationContext";
import "./index.css";
import "./components/page.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <NotificationContextProvider>
          <App />
        </NotificationContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);

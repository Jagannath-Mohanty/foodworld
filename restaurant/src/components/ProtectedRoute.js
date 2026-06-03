import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Requires a logged-in restaurant. When `requireOnboarded` is set, also bounces
// to /onboarding until the listing has been completed.
const ProtectedRoute = ({ children, requireOnboarded = false }) => {
  const { isAuthed, isOnboarded } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (requireOnboarded && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

export default ProtectedRoute;

/**
 * Auth Callback Component
 * Handles OAuth callback and stores JWT token
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // If Google returned an error or token missing
    if (error || !token) {
      navigate("/login", { replace: true });
      return;
    }

    // Save token
    localStorage.setItem("authToken", token);

    // Update auth context (DO NOT fetch user here)
    login(token);

    // Redirect to home
    navigate("/", { replace: true });
  }, [searchParams, navigate, login]);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Signing you in…</h2>
    </div>
  );
};

export default AuthCallback;

import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("ltf_user");
    const token = localStorage.getItem("ltf_token");
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)); connectSocket(); } catch { localStorage.removeItem("ltf_user"); localStorage.removeItem("ltf_token"); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectSocket(); setUser(null); localStorage.removeItem("ltf_user"); localStorage.removeItem("ltf_token");
    };
    window.addEventListener("ltf:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ltf:unauthorized", handleUnauthorized);
  }, []);

  const persist = (nextUser, token) => {
    setUser(nextUser);
    localStorage.setItem("ltf_user", JSON.stringify(nextUser));
    if (token) localStorage.setItem("ltf_token", token);
    connectSocket();
  };

  const login = async (email, password) => { const { user: loggedInUser, token } = await api.login({ email, password }); persist(loggedInUser, token); return loggedInUser; };
  const signup = async (email, password) => api.signup({ email, password });
  const loginWithGoogle = async (credential) => { const { user: googleUser, token } = await api.loginWithGoogle(credential); persist(googleUser, token); return googleUser; };
  const logout = () => { disconnectSocket(); setUser(null); localStorage.removeItem("ltf_user"); localStorage.removeItem("ltf_token"); };
  const updateUser = (partialUpdates) => setUser((prev) => { const next = { ...prev, ...partialUpdates }; localStorage.setItem("ltf_user", JSON.stringify(next)); return next; });

  return <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, isAdmin: user?.role === "admin", login, signup, loginWithGoogle, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within an AuthProvider"); return context; }

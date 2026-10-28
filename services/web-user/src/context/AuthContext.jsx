import { createContext, useContext, useState } from "react";
import { api } from "../api/axios";

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("skipq_user") || "null")
  );

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.user.role !== "USER")
      throw new Error("This app is for students. Use the canteen app.");
    localStorage.setItem("skipq_token", data.token);
    localStorage.setItem("skipq_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    await api.post("/auth/register", payload);
    return login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem("skipq_token");
    localStorage.removeItem("skipq_user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

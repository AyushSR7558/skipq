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
    if (data.user.role !== "STAFF" && data.user.role !== "ADMIN")
      throw new Error("Staff only. Use the student app.");
    localStorage.setItem("skipq_token", data.token);
    localStorage.setItem("skipq_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("skipq_token");
    localStorage.removeItem("skipq_user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

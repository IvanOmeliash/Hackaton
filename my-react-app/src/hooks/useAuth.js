import { useState } from "react";

export function useAuth() {
  const getToken = () => localStorage.getItem("jwt_token");
  const [token, setToken] = useState(getToken);

  const login = (jwt) => {
    localStorage.setItem("jwt_token", jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
  };

  return { token, login, logout };
}

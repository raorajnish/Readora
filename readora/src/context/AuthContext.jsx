import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('readora_token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('readora_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    const { token, user: userData } = res.data;
    localStorage.setItem('readora_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    const { token, user: userData } = res.data;
    localStorage.setItem('readora_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('readora_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

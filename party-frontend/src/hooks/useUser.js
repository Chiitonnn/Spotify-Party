import { useState, useEffect } from 'react';

export const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('spotify_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const saveUser = (userData) => {
    localStorage.setItem('spotify_user', JSON.stringify(userData));
    setUser(userData);
  };

  const clearUser = () => {
    localStorage.removeItem('spotify_user');
    setUser(null);
  };

  return { user, saveUser, clearUser };
};
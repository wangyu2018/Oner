import React, { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useCustomTheme } from './hooks/useCustomTheme';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import BoardPage from './pages/BoardPage';
import ErrorBoundary from './components/ErrorBoundary';
import ViewNote from './pages/ViewNote';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuthGuard from './components/AuthGuard';

const ThemeContext = createContext();
const AuthContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export default function App() {
  const theme = useTheme();
  const customTheme = useCustomTheme(theme.isDark);
  const auth = useAuth();

  return (
    <ThemeContext.Provider value={{ ...theme, customTheme }}>
      <AuthContext.Provider value={auth}>
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 需要登录的路由 */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <ErrorBoundary>
                    <Home />
                  </ErrorBoundary>
                </AuthGuard>
              }
            />
            <Route
              path="/board"
              element={
                <AuthGuard>
                  <ErrorBoundary>
                    <BoardPage />
                  </ErrorBoundary>
                </AuthGuard>
              }
            />
            <Route
              path="/note/:id"
              element={
                <AuthGuard>
                  <ViewNote />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

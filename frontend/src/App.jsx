import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useCustomTheme } from './hooks/useCustomTheme';
import { useAuth } from './hooks/useAuth';
import useShortcuts from './hooks/useShortcuts';
import Home from './pages/Home';
import BoardPage from './pages/BoardPage';
import ErrorBoundary from './components/ErrorBoundary';
import ViewNote from './pages/ViewNote';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PasswordVault from './pages/PasswordVault';
import AIChat from './pages/AIChat';
import AuthGuard from './components/AuthGuard';
import BottomNav from './components/BottomNav';
import CommandPalette from './components/CommandPalette';
import VoiceInput from './components/VoiceInput';
import FloatingQuickEntry from './components/FloatingQuickEntry';
import { api } from './utils/api';

const ThemeContext = createContext();
const AuthContext = createContext();
const CommandPaletteContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export default function App() {
  const theme = useTheme();
  const customTheme = useCustomTheme(theme.isDark);
  const auth = useAuth();

  // 命令面板状态
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // 语音输入状态
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  // 快捷键
  const paletteShortcuts = useCallback(() => setPaletteOpen(true), []);
  useShortcuts({
    commandPalette: paletteShortcuts,
  });

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // 命令面板创建笔记
  const handlePaletteCreate = useCallback(async (noteData) => {
    try {
      await api.notes.create(noteData);
    } catch (err) {
      console.error('Quick create error:', err);
    }
  }, []);

  // 浮动输入框创建笔记
  const handleFloatingCreate = useCallback(async (noteData) => {
    try {
      await api.notes.create(noteData);
    } catch (err) {
      console.error('Floating create error:', err);
    }
  }, []);

  // 语音录入 - 保存录音内容为笔记
  const handleVoiceSave = useCallback(async (noteData) => {
    try {
      await api.notes.create(noteData);
    } catch (err) {
      console.error('Voice create error:', err);
    }
    setShowVoiceInput(false);
  }, []);

  const handleOpenVoiceInput = useCallback(() => setShowVoiceInput(true), []);

  const isLoggedIn = !!auth.user;

  return (
    <ThemeContext.Provider value={{ ...theme, customTheme }}>
      <AuthContext.Provider value={auth}>
        <CommandPaletteContext.Provider value={{ openPalette, closePalette, setCategories }}>
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
                      <Home
                        categories={categories}
                        onVoiceInput={handleOpenVoiceInput}
                      />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/board"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <BoardPage onVoiceInput={handleOpenVoiceInput} />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/note/:id"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <ViewNote />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <Profile />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/passwords"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PasswordVault />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/ai"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <AIChat />
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
            </Routes>

            {/* 全局命令面板 */}
            <CommandPalette
              isOpen={paletteOpen}
              onClose={closePalette}
              categories={categories}
              onCreateNote={handlePaletteCreate}
            />

            {/* 语音输入 */}
            {showVoiceInput && (
              <VoiceInput
                onClose={() => setShowVoiceInput(false)}
                onSave={handleVoiceSave}
              />
            )}

            {/* 全局浮动输入框 */}
            {isLoggedIn && (
              <FloatingQuickEntry
                onCreateNote={handleFloatingCreate}
                onVoiceInput={handleOpenVoiceInput}
              />
            )}

            {/* 移动端底部导航 */}
            {isLoggedIn && <BottomNav />}
          </BrowserRouter>
        </CommandPaletteContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

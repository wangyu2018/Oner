import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useCustomTheme } from './hooks/useCustomTheme';
import { useAuth } from './hooks/useAuth';
import useShortcuts from './hooks/useShortcuts';
import { usePluginManager } from './plugins/usePluginManager';
import Home from './pages/Home';
import { api } from './utils/api';
import ErrorBoundary from './components/ErrorBoundary';
import ViewNote from './pages/ViewNote';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MemosPage from './pages/MemosPage';
import OverduePage from './pages/OverduePage';
import WeeklyPage from './pages/WeeklyPage';
import AssociationsPage from './pages/AssociationsPage';
import MindChainPage from './pages/MindChainPage';
import AuthGuard from './components/AuthGuard';
import BottomNav from './components/BottomNav';
import CommandPalette from './components/CommandPalette';
import VoiceInput from './components/VoiceInput';
import FloatingQuickEntry from './components/FloatingQuickEntry';
import ToastContainer from './components/ToastContainer';
import PageTransition from './components/PageTransition';
import { useToast } from './hooks/useToast';

const ThemeContext = createContext();
const AuthContext = createContext();
const CommandPaletteContext = createContext();
const PluginManagerContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function usePluginManagerContext() {
  return useContext(PluginManagerContext);
}

export default function App() {
  const theme = useTheme();
  const customTheme = useCustomTheme(theme.isDark);
  const auth = useAuth();

  // 插件系统
  const {
    pluginManager,
    routes: pluginRoutes,
    sidebarItems,
    commands: pluginCommands,
    plugins,
    isReady: pluginsReady,
  } = usePluginManager();

  // 命令面板状态
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // 语音输入状态
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  // Toast 通知
  const { toasts, addToast, removeToast } = useToast();

  // 快捷键
  const paletteShortcuts = useCallback(() => setPaletteOpen(true), []);
  useShortcuts({
    commandPalette: paletteShortcuts,
  });

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // 加载分类
  useEffect(() => {
    if (!auth.user) return;
    api.categories.list().then(res => {
      if (res?.data?.categories) {
        setCategories(res.data.categories);
      }
    }).catch(err => console.error('Failed to load categories:', err));
  }, [auth.user]);

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

  // 插件状态查询（稳定引用）
  const isPluginActive = useCallback((pluginId) => {
    return plugins.some(p => p.id === pluginId && p.status === 'active');
  }, [plugins]);

  return (
    <ThemeContext.Provider value={{ ...theme, customTheme }}>
      <AuthContext.Provider value={auth}>
        <CommandPaletteContext.Provider value={{ openPalette, closePalette, setCategories }}>
          <PluginManagerContext.Provider value={{ pluginManager, plugins, sidebarItems, pluginCommands, isPluginActive }}>
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
                      <PageTransition>
                        <Home
                          categories={categories}
                          onVoiceInput={handleOpenVoiceInput}
                        />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              {/* 插件动态注册路由：/board(看板)、/passwords(密码)、/notes(笔记)、/ai(AI) */}
              <Route
                path="/note/:id"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <ViewNote />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <Profile />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/memos"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <MemosPage />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              {isPluginActive('oner.plugin.ai') && (
                <>
              <Route
                path="/ai/overdue"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <OverduePage />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/ai/weekly"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <WeeklyPage />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/ai/associations"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <AssociationsPage />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
              <Route
                path="/ai/chain"
                element={
                  <AuthGuard>
                    <ErrorBoundary>
                      <PageTransition>
                        <MindChainPage />
                      </PageTransition>
                    </ErrorBoundary>
                  </AuthGuard>
                }
              />
                </>
              )}

              {/* 插件动态路由 */}
              {pluginRoutes.map((route) => {
                const Component = route.component;
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    exact={route.exact}
                    element={
                      <AuthGuard>
                        <ErrorBoundary>
                          <PageTransition>
                            <Component />
                          </PageTransition>
                        </ErrorBoundary>
                      </AuthGuard>
                    }
                  />
                );
              })}
            </Routes>

            {/* 全局Toast容器 */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

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
                categories={categories}
              />
            )}

            {/* 移动端底部导航 */}
            {isLoggedIn && <BottomNav />}

            {/* 插件状态指示器 */}
            {pluginsReady && plugins.length > 0 && (
              <div className="fixed bottom-20 left-2 z-10">
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {plugins.filter(p => p.status === 'active').length} 插件已加载
                </span>
              </div>
            )}
          </BrowserRouter>
        </PluginManagerContext.Provider>
      </CommandPaletteContext.Provider>
    </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

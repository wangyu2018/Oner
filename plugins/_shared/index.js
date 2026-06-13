/**
 * @oner/plugin-sdk — 插件开发工具包
 *
 * 提供：
 * - 插件开发所需的常量
 * - 通用工具函数
 * - 共享 UI 组件
 * - 类型定义（TypeScript-style JSDoc）
 */

// 常量
export * from './constants';

// 工具函数
export * from './utils/date';
export * from './utils/string';
export * from './utils/dict-recognition';
export * from './utils/chain-builder';
export * from './utils/api-client';

// 共享 UI 组件
export { default as Button } from './components/Button';
export { default as Input } from './components/Input';
export { default as Card } from './components/Card';
export { default as Modal } from './components/Modal';
export { default as Badge } from './components/Badge';
export { default as EmptyState } from './components/EmptyState';
export { default as Skeleton } from './components/Skeleton';
export { default as Toast } from './components/Toast';
export { default as FloatingBall } from './components/FloatingBall';

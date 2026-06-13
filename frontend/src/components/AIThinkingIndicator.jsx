import React, { useState, useEffect } from 'react';

/**
 * AIThinkingIndicator — AI 思考可视化组件
 *
 * 在 AI 响应前展示思考过程的动画效果：
 * - 脉冲光环动画
 * - 思考阶段文字（分析中 → 检索中 → 生成中）
 * - 打字机光标
 */
const THINKING_STAGES = [
  { text: '分析你的问题', icon: '🧠' },
  { text: '检索相关笔记', icon: '🔍' },
  { text: '组织回答', icon: '✍️' },
];

export default function AIThinkingIndicator({ elapsed = 0 }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // 阶段轮转（每 2 秒切换）
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % THINKING_STAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 打字机点动画
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const stage = THINKING_STAGES[stageIndex];

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 bg-white dark:bg-gray-800 shadow-sm rounded-bl-md border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* 脉冲光环 */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
            <div className="absolute inset-1 rounded-full bg-accent/30 animate-pulse" />
            <div className="relative text-lg">{stage.icon}</div>
          </div>

          {/* 思考文字 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stage.text}{dots}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              AI 正在思考
              {elapsed > 0 && ` · ${Math.round(elapsed / 1000)}s`}
            </span>
          </div>

          {/* 脉冲条 */}
          <div className="flex gap-0.5 ml-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-accent/60"
                style={{
                  height: `${8 + Math.sin(Date.now() / 300 + i) * 6}px`,
                  animation: `pulse 0.8s ease-in-out ${i * 0.2}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

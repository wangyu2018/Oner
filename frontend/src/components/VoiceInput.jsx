import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, X, ArrowRight, FileText, Circle } from 'lucide-react';

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const STATUS_OPTIONS = [
  { id: 'note', label: '备忘', icon: FileText, color: 'text-blue-500' },
  { id: 'todo', label: '待办', icon: Circle, color: 'text-orange-500' },
];

export default function VoiceInput({ onSave, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [targetStatus, setTargetStatus] = useState('note');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const restartTimeout = useRef(null);

  const supported = !!SpeechRecognitionAPI;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current);
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (restartTimeout.current) {
      clearTimeout(restartTimeout.current);
      restartTimeout.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('您的浏览器不支持语音识别，请使用 Chrome 或 Safari。');
      return;
    }

    setError(null);
    stopListening();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Silently restart
        restartTimeout.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {}
          }
        }, 300);
        return;
      }
      if (event.error === 'aborted') return;
      setError(`语音识别错误: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if still listening
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      setError('无法启动语音识别');
    }
  }, [stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Parse natural language command
  const parseCommand = useCallback((text) => {
    const trimmed = text.trim();
    let status = targetStatus;
    let content = trimmed;

    // Detect commands like "备忘 xxx", "待办 xxx", "增加备忘 xxx", "创建待办 xxx"
    const patterns = [
      { match: /^(?:增加|创建|写个|记个|加个)\s*(备忘|笔记|note)\s*[：:，,]\s*(.+)/i, status: 'note' },
      { match: /^(?:增加|创建|写个|记个|加个)\s*(待办|任务|todo)\s*[：:，,]\s*(.+)/i, status: 'todo' },
      { match: /^备忘\s*[：:，,]\s*(.+)/i, status: 'note' },
      { match: /^待办\s*[：:，,]\s*(.+)/i, status: 'todo' },
      { match: /^note\s*[：:，,]\s*(.+)/i, status: 'note' },
      { match: /^todo\s*[：:，,]\s*(.+)/i, status: 'todo' },
    ];

    for (const { match, status: s } of patterns) {
      const m = trimmed.match(match);
      if (m) {
        status = s;
        content = m[m.length - 1].trim();
        break;
      }
    }

    // If starts with known command word without colon
    if (/^(备忘|待办|增加|创建|写个|记个|加个)/.test(trimmed)) {
      // Try simpler extraction
      const simpleMatch = trimmed.match(/^(?:增加|创建|写个|记个|加个)\s*(备忘|待办)\s*(.+)/);
      if (simpleMatch) {
        status = simpleMatch[1] === '待办' ? 'todo' : 'note';
        content = simpleMatch[2].trim();
      } else {
        const directMatch = trimmed.match(/^(备忘|待办)\s*(.+)/);
        if (directMatch) {
          status = directMatch[1] === '待办' ? 'todo' : 'note';
          content = directMatch[2].trim();
        }
      }
    }

    return { status, content };
  }, [targetStatus]);

  const handleSave = useCallback(() => {
    if (!transcript.trim()) return;

    const { status, content } = parseCommand(transcript);
    onSave({
      content: content || transcript.trim(),
      status,
    });
    onClose();
  }, [transcript, parseCommand, onSave, onClose]);

  const displayText = transcript + (interimText ? ` ${interimText}` : '');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl
          shadow-2xl flex flex-col overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">语音录入</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {!supported ? (
          <div className="p-8 text-center">
            <MicOff size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 dark:text-gray-400">
              您的浏览器不支持语音识别。请使用 Chrome 或 Safari 浏览器。
            </p>
          </div>
        ) : (
          <>
            {/* Status selector */}
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-500 dark:text-gray-400">保存为：</span>
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = targetStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTargetStatus(opt.id)}
                    disabled={isListening}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    } ${isListening ? 'opacity-50' : ''}`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Transcript area */}
            <div className="flex-1 p-5 min-h-[160px]">
              {displayText ? (
                <textarea
                  value={displayText}
                  onChange={(e) => {
                    if (!isListening) {
                      setTranscript(e.target.value);
                      setInterimText('');
                    }
                  }}
                  placeholder="语音识别内容将显示在这里..."
                  className="w-full h-full min-h-[100px] bg-transparent outline-none resize-none
                    text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base leading-relaxed"
                  readOnly={isListening}
                  autoFocus={!isListening}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
                    isListening
                      ? 'bg-red-100 dark:bg-red-900/30 scale-110'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Mic size={28} className={isListening ? 'text-red-500' : 'text-gray-400'} />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    {isListening ? '正在聆听...' : '点击下方麦克风按钮开始语音输入'}
                  </p>
                  <p className="text-gray-400 dark:text-gray-400 text-xs mt-2">
                    支持自然语言：说"备忘 买牛奶"或"待办 完成报告"
                  </p>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="px-5 pb-2">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            {/* Bottom controls */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={toggleListening}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center transition-all
                  shadow-lg active:scale-90
                  ${isListening
                    ? 'bg-red-500 text-white shadow-red-500/40 animate-pulse'
                    : 'bg-accent text-white shadow-accent/30'
                  }
                `}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <div className="flex items-center gap-2">
                {transcript.trim() && (
                  <p className="text-xs text-gray-400 mr-2">
                    {transcript.length} 字
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={!transcript.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white
                    rounded-xl hover:bg-accent-600 transition-colors font-medium
                    disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  快速保存
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

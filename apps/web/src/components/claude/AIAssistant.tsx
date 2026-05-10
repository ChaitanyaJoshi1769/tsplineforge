'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Check, Sparkles, Copy } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  filePath: string;
  language: string;
  currentCode: string;
  onAcceptChange?: (newCode: string) => void;
  onClose?: () => void;
}

export function AIAssistant({
  filePath,
  language,
  currentCode,
  onAcceptChange,
  onClose,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [modifiedCode, setModifiedCode] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/claude/conversation/start`,
          {
            filePath,
            language,
            currentCode,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setSessionId(response.data.sessionId);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initConversation();
  }, [filePath, language, currentCode]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/claude/conversation/message/${sessionId}`,
        { message: inputValue },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.modifiedCode) {
        setModifiedCode(response.data.modifiedCode);
      }

      if (response.data.changes) {
        setSuggestions(response.data.changes);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold">Claude AI Assistant</h3>
            <p className="text-xs text-muted-foreground">{filePath}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles size={32} className="mb-2 opacity-50" />
            <p>Ask me to modify this code</p>
            <p className="text-xs mt-1">Describe what you want to change</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modified Code Preview */}
      {modifiedCode && (
        <div className="border-t border-border p-4 bg-background/50 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">PROPOSED CHANGES</p>
            <button
              onClick={() => copyToClipboard(modifiedCode)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="text-xs overflow-hidden text-muted-foreground">
            <code>{modifiedCode.substring(0, 300)}...</code>
          </pre>

          {suggestions.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Changes:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {suggestions.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {onAcceptChange && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onAcceptChange(modifiedCode)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors text-sm font-medium"
              >
                <Check size={16} />
                Accept Changes
              </button>
              <button
                onClick={() => {
                  setModifiedCode(null);
                  setSuggestions([]);
                }}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg hover:bg-background/80 transition-colors text-sm font-medium"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the changes you want..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tips: Be specific about what you want to change. You can ask for multiple modifications in one message.
        </p>
      </form>
    </div>
  );
}

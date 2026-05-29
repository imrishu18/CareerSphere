"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Edit3,
  Loader2,
  MessageSquareText,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
  UserRound,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const starterPrompts = [
  "Create a 30-day roadmap for my target job role.",
  "Suggest resume improvements for campus placements.",
  "Help me prepare for a technical interview this week.",
  "Which skills should I learn next for my industry?",
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I am **CareerNavigator AI**. Ask me for career roadmaps, resume advice, interview preparation, skill recommendations, or job-readiness guidance.",
  createdAt: new Date(0).toISOString(),
};

const STORAGE_KEY = "careersphere.career-navigator.sessions";
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();

const createSession = () => ({
  id: createId(),
  title: "New career chat",
  createdAt: nowIso(),
  updatedAt: nowIso(),
  messages: [{ ...welcomeMessage, createdAt: nowIso() }],
});

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatSessionTime = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getSessionPreview = (session) =>
  [...(session.messages || [])]
    .reverse()
    .find((message) => message.role === "user" && message.content)?.content ||
  "No questions yet";

export default function CareerNavigatorPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [input, setInput] = useState("");
  const [suggestedPrompts, setSuggestedPrompts] = useState(starterPrompts.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored) && stored.length) {
        setSessions(stored);
        setActiveSessionId(stored[0].id);
        return;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    const session = createSession();
    setSessions([session]);
    setActiveSessionId(session.id);
  }, []);

  useEffect(() => {
    if (sessions.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 8)));
    }
  }, [sessions]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    shouldAutoScrollRef.current = false;
  }, [messages, loading]);

  const updateActiveSession = (updater) => {
    setSessions((currentSessions) =>
      currentSessions.map((session) => {
        if (session.id !== activeSessionId) return session;
        const updatedSession = updater(session);
        return { ...updatedSession, updatedAt: nowIso() };
      })
    );
  };

  const createNewSession = () => {
    const session = createSession();
    setSessions((current) => [session, ...current].slice(0, 8));
    setActiveSessionId(session.id);
    setInput("");
    setError("");
    setEditingId("");
  };

  const deleteSession = (sessionId) => {
    setSessions((current) => {
      const nextSessions = current.filter((session) => session.id !== sessionId);
      if (!nextSessions.length) {
        const freshSession = createSession();
        setActiveSessionId(freshSession.id);
        return [freshSession];
      }
      if (sessionId === activeSessionId) {
        setActiveSessionId(nextSessions[0].id);
      }
      return nextSessions;
    });
    setEditingId("");
    setError("");
  };

  const clearHistory = () => {
    const session = createSession();
    setSessions([session]);
    setActiveSessionId(session.id);
    setInput("");
    setEditingId("");
    setError("");
  };

  const requestReply = async (nextMessages) => {
    shouldAutoScrollRef.current = true;
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/career-navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "CareerNavigator AI could not respond.");
      }
      const assistantMessage = {
        id: createId(),
        role: "assistant",
        content: data.reply,
        createdAt: nowIso(),
      };
      updateActiveSession((session) => ({
        ...session,
        messages: [...nextMessages, assistantMessage],
      }));
      setSuggestedPrompts(data.suggestedPrompts?.length ? data.suggestedPrompts : starterPrompts.slice(0, 3));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (value = input) => {
    const trimmed = value.trim();
    if (!trimmed || loading || !activeSession) return;

    const userMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: nowIso(),
    };
    const nextMessages = [...messages, userMessage];
    updateActiveSession((session) => ({
      ...session,
      title:
        session.title === "New career chat"
          ? trimmed.slice(0, 52)
          : session.title,
      messages: nextMessages,
    }));
    setInput("");
    await requestReply(nextMessages);
  };

  const startEditing = (message) => {
    setEditingId(message.id);
    setEditingText(message.content);
  };

  const cancelEditing = () => {
    setEditingId("");
    setEditingText("");
  };

  const saveEditedMessage = async (messageId) => {
    const trimmed = editingText.trim();
    if (!trimmed || loading) return;
    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) return;

    const nextMessages = messages.slice(0, index + 1).map((message) =>
      message.id === messageId
        ? { ...message, content: trimmed, editedAt: nowIso() }
        : message
    );

    updateActiveSession((session) => ({
      ...session,
      title: trimmed.slice(0, 52),
      messages: nextMessages,
    }));
    cancelEditing();
    await requestReply(nextMessages);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.95)] lg:flex-row">
      {/* Collapsible Left Sidebar */}
      {isSidebarOpen && (
        <div className="flex w-full shrink-0 flex-col border-r border-white/10 bg-slate-950/55 shadow-[18px_0_54px_-58px_rgba(15,23,42,0.95)] transition-all duration-300 lg:w-[260px]">
          <div className="p-3.5">
            <Button
              className="h-10 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/[0.035] font-semibold text-slate-100 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.95)] hover:border-cyan-300/15 hover:bg-white/[0.055]"
              onClick={createNewSession}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-2">
            <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recent History</div>
            <div className="space-y-1.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] shadow-sm transition-colors ${
                    session.id === activeSessionId
                      ? "border-white/10 bg-white/[0.045] font-medium text-slate-100 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.9)]"
                      : "border-white/[0.035] bg-white/[0.02] text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 truncate text-left"
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setEditingId("");
                      setError("");
                    }}
                  >
                    {session.title}
                  </button>
                  {session.id !== activeSessionId && (
                    <button
                      type="button"
                      className="absolute right-2 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                      onClick={() => deleteSession(session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 bg-slate-950/35 p-3.5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 rounded-xl text-sm text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-100"
              onClick={clearHistory}
            >
              <Trash2 className="h-4 w-4" />
              Clear History
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.035),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.025),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)]">
        {/* Top Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-xl text-slate-500 hover:bg-white/10 hover:text-slate-200 ${isSidebarOpen ? "hidden lg:flex" : "flex"}`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-400/[0.055] text-cyan-200">
                <Bot className="h-3.5 w-3.5" />
              </span>
              CareerNavigator AI
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Context Badge Removed */}
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-[680px] flex-col space-y-6 pb-3">
            {messages.map((message, index) => {
              if (message.id === "welcome" && messages.length === 1) {
                return (
                  <div key={message.id} className="mt-8 flex flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] text-cyan-200 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.03]">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h1 className="mb-2.5 text-3xl font-semibold tracking-tight text-slate-50">
                      How can I help you today?
                    </h1>
                    <p className="mb-7 max-w-md text-[15px] leading-7 text-slate-400">
                      I'm your personal AI career coach. I can help with resumes, interview prep, skill roadmaps, and more.
                    </p>
                    
                    <div className="grid w-full max-w-[620px] grid-cols-1 gap-3 sm:grid-cols-2">
                      {suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          disabled={loading}
                          className="group flex min-h-[68px] items-center rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.018] transition-colors hover:border-cyan-300/18 hover:bg-white/[0.045]"
                        >
                          <span className="flex-1 text-[13px] font-medium leading-5 text-slate-300 group-hover:text-slate-100">{prompt}</span>
                          <span className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-500 transition-colors group-hover:border-cyan-300/18 group-hover:bg-cyan-400/[0.055] group-hover:text-cyan-200">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (message.id === "welcome") return null;

              const isUser = message.role === "user";

              return (
                <div key={message.id || index} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    <div className="flex max-w-[85%] flex-col items-end group">
                      <div className="rounded-3xl border border-cyan-300/14 bg-cyan-400/[0.055] px-5 py-3.5 text-[15px] leading-relaxed text-slate-100 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.95)] transition-colors group-hover:border-cyan-300/22 group-hover:bg-cyan-400/[0.075]">
                        {editingId === message.id ? (
                          <div className="flex w-[260px] flex-col gap-3 sm:w-[400px]">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[80px] border-cyan-500/40 bg-slate-950/80 text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                              <Button size="sm" onClick={() => saveEditedMessage(message.id)}>Send</Button>
                            </div>
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 pr-2 text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId !== message.id && (
                          <button onClick={() => startEditing(message)} className="flex items-center gap-1 hover:text-cyan-300">
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full gap-4 lg:gap-6 group">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/14 bg-cyan-400/[0.055] shadow-[0_12px_30px_-26px_rgba(15,23,42,0.95)]">
                        <Bot className="h-4 w-4 text-cyan-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 text-[15px] leading-relaxed text-slate-200 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.025]">
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="mb-4 mt-2 text-xl font-semibold tracking-tight text-slate-100 flex items-center gap-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="mb-3 mt-6 text-lg font-medium tracking-tight text-slate-100 flex items-center gap-1.5" {...props} />,
                              h3: ({node, ...props}) => <h3 className="mb-2 mt-4 text-[15px] font-medium text-slate-200 flex items-center gap-1.5" {...props} />,
                              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                              ul: ({node, ...props}) => <ul className="mb-4 list-outside list-disc space-y-2 pl-5 text-slate-300" {...props} />,
                              ol: ({node, ...props}) => <ol className="mb-4 list-outside list-decimal space-y-2 pl-5 text-slate-300" {...props} />,
                              li: ({node, ...props}) => <li className="pl-1" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-slate-100" {...props} />,
                              a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Response Action Bar */}
                        <div className="mt-2 flex items-center gap-1 text-muted-foreground opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100 pl-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-slate-200">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-slate-200">
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-slate-200">
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-slate-200" onClick={() => requestReply(messages.slice(0, index))}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <div className="ml-2 flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {message.createdAt ? formatMessageTime(message.createdAt) : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex w-full gap-4 lg:gap-6">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-400/10">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                </div>
                <div className="flex items-center text-[15px] font-medium text-slate-400 animate-pulse">
                  Analyzing profile and generating response...
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>

        {/* Sticky Input Area */}
        <div className="shrink-0 border-t border-white/10 bg-slate-950/40 p-3.5 pb-4 backdrop-blur-md">
          <div className="mx-auto max-w-[680px]">
            {error && (
              <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            <div className="relative flex items-end overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.025] transition-all focus-within:border-cyan-300/24 focus-within:bg-slate-950/65 focus-within:ring-2 focus-within:ring-cyan-400/[0.07]">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message CareerNavigator..."
                className="min-h-[56px] max-h-[200px] w-full resize-none border-0 bg-transparent py-4 pl-5 pr-14 text-[15px] leading-relaxed text-slate-100 shadow-none focus-visible:ring-0 placeholder:text-slate-500"
              />
              <Button
                size="icon"
                className={`absolute bottom-2 right-2 h-10 w-10 shrink-0 rounded-full transition-all duration-200 ${
                  input.trim() && !loading
                    ? "bg-cyan-400/90 text-slate-950 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.95)] hover:bg-cyan-300/90"
                    : "bg-white/10 text-slate-500 opacity-50"
                }`}
                disabled={!input.trim() || loading}
                onClick={() => sendMessage()}
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
            <div className="mt-2.5 text-center text-xs text-slate-600">
              CareerNavigator uses your profile to generate personalized insights. AI can make mistakes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

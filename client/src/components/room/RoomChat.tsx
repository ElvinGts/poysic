/**
 * client/src/components/room/RoomChat.tsx
 * Tujuan: Sembang bilik (Room Chat) masa nyata dan bar reaksi emoji serentak untuk PoySic.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../../types';

interface RoomChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  roomId?: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const QUICK_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Vibe' },
  { emoji: '🎵', label: 'Lagu Best' },
  { emoji: '✨', label: 'Magik' },
  { emoji: '🌙', label: 'Malam' },
  { emoji: '☕', label: 'Santai' },
  { emoji: '👏', label: 'Tepuk' },
  { emoji: '🎉', label: 'Meriah' },
];

export const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  currentUserId,
  roomId,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header Info Sembang */}
      {roomId && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Sembang Langsung:</span>
            <span className="font-mono font-bold text-white">#{roomId}</span>
          </div>
          <span className="text-[10px] text-slate-500">Mesej masa nyata</span>
        </div>
      )}

      {/* Bar Reaksi Cepat */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-slate-500 pl-1 shrink-0">
          Reaksi:
        </span>
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onSendReaction(r.emoji)}
              title={r.label}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:scale-125 rounded-lg text-sm transition transform shrink-0"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Ruang Mesej */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px] flex flex-col justify-end">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-semibold text-slate-400">Belum ada sembang dalam bilik ini.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Hantar mesej pertama atau reaksi emoji untuk memulakan perbualan bersama rakan pendengar!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center my-1.5 px-3 py-1 bg-slate-900/40 rounded-full text-[11px] text-emerald-400/90 italic border border-slate-800/50 w-fit mx-auto">
                  {msg.senderAvatar || '📢'} {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="text-base p-1.5 bg-slate-800 rounded-xl h-fit flex-shrink-0 border border-slate-700/60 shadow-sm" title={msg.senderName}>
                  {msg.senderAvatar || '🎧'}
                </div>

                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  isMe
                    ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={`text-[11px] font-bold truncate ${
                      isMe ? 'text-slate-950' : 'text-emerald-400'
                    }`}>
                      {msg.senderName || 'Rakan Pendengar'} {isMe && <span className="opacity-80 text-[9px]">(Anda)</span>}
                    </span>
                    <span className={`text-[9px] font-mono shrink-0 ${
                      isMe ? 'text-slate-900/70' : 'text-slate-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="break-words leading-relaxed text-xs">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Hantar Mesej */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          placeholder="Tulis mesej kepada rakan pendengar..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={200}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 px-3.5 py-2 rounded-xl transition flex items-center justify-center font-semibold"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

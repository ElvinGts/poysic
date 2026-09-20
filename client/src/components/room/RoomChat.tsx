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
        <div className="flex items-center justify-between px-3 py-2 bg-[#0C0C0C] border border-[#242424] rounded-none text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A8E6CF] animate-ping" />
            <span className="text-[#8E8E8A]">SEMBANG LANGSUNG:</span>
            <span className="font-mono font-bold text-[#F5F3EE]">#{roomId}</span>
          </div>
          <span className="text-[10px] text-[#8E8E8A]">MASA NYATA</span>
        </div>
      )}

      {/* Bar Reaksi Cepat */}
      <div className="bg-[#0C0C0C] border border-[#242424] rounded-none p-2 flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-[#8E8E8A] pl-1 shrink-0 font-mono">
          REAKSI:
        </span>
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onSendReaction(r.emoji)}
              title={r.label}
              aria-label={`Hantar reaksi emoji ${r.label}`}
              className="px-2 py-1 bg-[#171717] hover:bg-[#222222] border border-[#2A2A2A] active:scale-125 rounded-none text-sm transition transform shrink-0"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Ruang Mesej */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px] flex flex-col justify-end">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-[#8E8E8A] text-xs font-mono">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40 text-[#8E8E8A]" />
            <p className="font-semibold text-[#F5F3EE]">Belum ada sembang dalam bilik ini.</p>
            <p className="text-[11px] text-[#8E8E8A] mt-1">
              Hantar mesej pertama atau reaksi emoji untuk memulakan perbualan bersama rakan pendengar!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center my-1.5 px-3 py-1 bg-[#141414] rounded-none text-[11px] font-mono text-[#A8E6CF] italic border border-[#282828] w-fit mx-auto">
                  {msg.senderAvatar || '📢'} {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="text-base p-1.5 bg-[#171717] rounded-none h-fit flex-shrink-0 border border-[#2E2E2E]" title={msg.senderName}>
                  {msg.senderAvatar || '🎧'}
                </div>

                <div className={`max-w-[78%] rounded-none px-3 py-2 ${
                  isMe
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] font-medium'
                    : 'bg-[#141414] border border-[#242424] text-[#F5F3EE]'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={`text-[11px] font-bold truncate font-mono ${
                      isMe ? 'text-[#0A0A0A]' : 'text-[#A8E6CF]'
                    }`}>
                      {msg.senderName || 'Rakan Pendengar'} {isMe && <span className="opacity-80 text-[9px]">(Anda)</span>}
                    </span>
                    <span className={`text-[9px] font-mono shrink-0 ${
                      isMe ? 'text-[#0A0A0A]/80' : 'text-[#8E8E8A]'
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
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-[#222222]">
        <input
          type="text"
          placeholder="Tulis mesej kepada rakan pendengar..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={200}
          aria-label="Tulis mesej sembang"
          className="flex-1 bg-[#0A0A0A] border border-[#242424] focus:border-[#FF4D2E] focus:outline-none rounded-none px-3 py-2 text-xs font-mono text-[#F5F3EE] placeholder-[#666666]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Hantar mesej"
          className="bg-[#FF4D2E] hover:bg-[#ff6145] disabled:opacity-40 text-[#0A0A0A] px-3.5 py-2 rounded-none transition flex items-center justify-center font-bold"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

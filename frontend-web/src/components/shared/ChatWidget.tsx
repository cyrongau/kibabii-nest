'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, X, MessageCircle, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  mediaUrl?: string;
  senderId: string;
  sender: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
}

interface ChatWidgetProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  isAdminChat?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  conversationId, 
  otherUserId, 
  otherUserName, 
  otherUserAvatar,
  isAdminChat = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    // Fetch initial messages
    fetchMessages();

    // Initialize socket
    const token = localStorage.getItem('access_token');
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000', {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.emit('join_conversation', conversationId);

    socketRef.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('user_typing', (data: { userId: string, isTyping: boolean }) => {
      if (data.userId === otherUserId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/messages/conversation/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
      scrollToBottom();
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const messageData = {
      conversationId,
      receiverId: otherUserId,
      text: input.trim(),
      type: 'TEXT'
    };

    socketRef.current?.emit('send_message', messageData);
    setInput('');
    socketRef.current?.emit('typing', { conversationId, isTyping: false });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[100]"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 relative overflow-hidden">
            {otherUserAvatar ? <img src={otherUserAvatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-xs text-slate-500">{otherUserName[0]}</div>}
          </div>
          <div>
            <div className="text-sm font-black tracking-tight flex items-center gap-2">
              {otherUserName}
              {isAdminChat && <ShieldCheck size={14} className="text-blue-400" />}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {isTyping ? 'Typing...' : (isAdminChat ? 'Platform Overseer' : 'Online')}
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 custom-scrollbar"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const isAdmin = msg.sender.role === 'ADMIN';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                isMe 
                ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-blue-100' 
                : (isAdmin ? 'bg-slate-900 text-white rounded-tl-none shadow-lg shadow-slate-200' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none')
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${isMe || isAdmin ? 'text-white/50' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              socketRef.current?.emit('typing', { conversationId, isTyping: e.target.value.length > 0 });
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
          />
          <button 
            onClick={handleSend}
            className="w-11 h-11 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

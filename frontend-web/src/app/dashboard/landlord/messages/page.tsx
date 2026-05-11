'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Search, 
  Send, 
  User, 
  MoreVertical, 
  Phone, 
  Video, 
  Plus, 
  Image as ImageIcon,
  Smile,
  Paperclip,
  Loader2,
  Clock,
  MessageSquare
} from 'lucide-react';

export default function MessagesPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        setCurrentUser(JSON.parse(userStr) || {});
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    fetchContacts();

    // Initialize socket connection for real-time updates
    const token = localStorage.getItem('access_token');
    if (token) {
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000', {
        auth: { token },
        transports: ['websocket']
      });

      socketRef.current.on('new_message', (message: any) => {
        // Update messages if this is the active conversation
        if (activeContact && message.conversationId) {
          // Need to check if this message belongs to current conversation
          // For now, just refetch conversation
          fetchConversation(activeContact.id);
        }
        // Update contacts list to show new message
        fetchContacts();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchConversation(activeContact?.id);
      // Join the conversation room for real-time updates
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_conversation', activeContact.conversationId);
      }
    }
  }, [activeContact]);

  // Effect to ensure socket joins rooms when connection is ready
  useEffect(() => {
    if (socketRef.current?.connected && activeContact?.conversationId) {
      socketRef.current.emit('join_conversation', activeContact.conversationId);
    }
  }, [socketRef.current?.connected]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/messages/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const formattedContacts = data
          .filter((conv: any) => conv && conv.id)  // Filter out invalid conversations
          .map((conv: any) => ({
            conversationId: conv?.id,
            user: conv?.participants?.[0] || null,
            lastMessage: conv?.messages?.[0] || null,
          }))
          .filter((c: any) => c.user && c.user.id);  // Only include contacts with valid user
        setContacts(formattedContacts);
      } else {
        console.error('Invalid response format:', data);
        setContacts([]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async (userId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/messages/conversation/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // The endpoint returns a conversation object
        setMessages(data.messages || []);
        // Also set the active contact details if we're starting a new chat from search
        if (!activeContact || activeContact?.id !== userId) {
           const otherParticipant = data.participants?.[0];
           if (otherParticipant) setActiveContact(otherParticipant);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/messages/search-users?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const startNewChat = (user: any) => {
    setActiveContact(user);
    setSearchQuery('');
    setSearchResults([]);
    // Check if user is already in contacts, if not, we can either re-fetch or just let fetchConversation handle it
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeContact?.id,
          content: newMessage
        }),
      });

      if (response.ok) {
        const msg = await response.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        // Update contact last message
        setContacts(prev => prev.map(c => 
          c?.user?.id === activeContact?.id ? { ...c, lastMessage: msg } : c
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="h-[calc(100vh-64px)] p-8 lg:p-12 overflow-hidden bg-background">
      <div className="card-premium h-full shadow-soft-xl flex overflow-hidden backdrop-blur-xl border-border-subtle">
        
        {/* Contacts Sidebar */}
        <div className="w-96 border-r border-border-subtle flex flex-col bg-card/50">
          <div className="p-8">
            <h2 className="text-2xl font-black text-foreground mb-6 tracking-tight">Messages</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..." 
                className="w-full pl-12 pr-6 py-3.5 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground/40"
              />
              {(isSearching || searchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Loader2 className="animate-spin" size={14} /> Searching...
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={result?.id || index}
                        onClick={() => startNewChat(result)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                          {result?.avatar ? <img src={result.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-foreground truncate">{result?.name || 'Unknown'}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{result?.role}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest">Encrypting...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-20 px-8">
                <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary/40 mx-auto mb-6">
                  <MessageSquare size={40} />
                </div>
                <p className="text-lg font-black text-foreground">No Chat History</p>
                <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">Students will appear here once they message you about a booking.</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <button 
                  key={contact?.conversationId || index}
                  onClick={() => setActiveContact(contact?.user)}
                  className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all duration-300 group relative ${
                    activeContact?.id && activeContact?.id === contact?.user?.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 ${activeContact?.id && activeContact?.id === contact?.user?.id ? 'bg-white/20' : 'bg-muted'} rounded-2xl flex items-center justify-center overflow-hidden border-2 border-background/10 shadow-soft-sm`}>
                      {contact?.user?.avatar ? <img src={contact.user.avatar} className="w-full h-full object-cover" /> : <User size={28} className={activeContact?.id && activeContact?.id === contact?.user?.id ? 'text-white/60' : 'text-muted-foreground/40'} />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-card rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-sm truncate tracking-tight">{contact?.user?.name || 'Unknown User'}</span>
                      <span className={`text-[10px] font-bold shrink-0 ${activeContact?.id && activeContact?.id === contact?.user?.id ? 'text-white/60' : 'text-muted-foreground/40'}`}>
                        {contact?.lastMessage ? new Date(contact.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className={`text-xs truncate font-medium ${activeContact?.id && activeContact?.id === contact?.user?.id ? 'text-white/80' : 'text-muted-foreground/60'}`}>
                      {contact?.lastMessage?.text}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-background/50">
          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="p-8 bg-card/30 border-b border-border-subtle flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/40 overflow-hidden border border-border-subtle shadow-soft-sm">
                    {activeContact.avatar ? <img src={activeContact.avatar} className="w-full h-full object-cover" /> : <User size={28} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">{activeContact.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-3.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-2xl transition-all">
                    <Phone size={20} />
                  </button>
                  <button className="p-3.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-2xl transition-all">
                    <Video size={20} />
                  </button>
                  <button className="p-3.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-2xl transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide"
              >
                {messages.map((msg, idx) => {
                  const isMe = msg?.senderId === currentUser?.id;
                  return (
                    <div key={msg?.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[70%] space-y-2.5`}>
                         <div className={`px-7 py-4.5 rounded-[2rem] text-sm font-bold shadow-soft-sm leading-relaxed ${
                           isMe 
                           ? 'bg-primary text-white rounded-br-lg' 
                           : 'bg-card text-foreground rounded-bl-lg border border-border-subtle'
                         }`}>
                           {msg?.text}
                         </div>
                         <div className={`flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ${isMe ? 'justify-end mr-2' : 'justify-start ml-2'}`}>
                           <Clock size={10} />
                           {msg?.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-10 bg-card/30 border-t border-border-subtle backdrop-blur-md">
                <form 
                  onSubmit={handleSendMessage}
                  className="relative flex items-center gap-5"
                >
                  <button type="button" className="p-4 bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all shrink-0">
                    <Plus size={24} />
                  </button>
                  <div className="relative flex-1 group">
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full pl-7 pr-36 py-5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all text-foreground placeholder:text-muted-foreground/40"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                       <button type="button" className="p-2.5 text-muted-foreground/40 hover:text-primary transition-all">
                         <Smile size={20} />
                       </button>
                       <button type="button" className="p-2.5 text-muted-foreground/40 hover:text-primary transition-all">
                         <Paperclip size={20} />
                       </button>
                       <button type="button" className="p-2.5 text-muted-foreground/40 hover:text-primary transition-all">
                         <ImageIcon size={20} />
                       </button>
                    </div>
                  </div>
                  <button 
                    disabled={isSending || !newMessage.trim()}
                    className="bg-primary text-white p-5 rounded-3xl shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shrink-0 brand-shadow"
                  >
                    {isSending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-32 h-32 bg-primary/5 rounded-[3rem] flex items-center justify-center text-primary mb-8 shadow-soft-sm group hover:scale-110 transition-transform duration-500">
                 <MessageSquare size={56} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">Your Inbox</h3>
              <p className="text-muted-foreground max-w-sm mt-3 font-medium leading-relaxed">Choose a student from the sidebar to start chatting about bookings and inquiries.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}



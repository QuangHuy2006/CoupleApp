import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chatApi';

export interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  full_name: string;
  type?: 'text' | 'image' | 'voice';
  media_url?: string;
}

export interface CallData {
  from: string;
  callerName: string;
  type: 'voice' | 'video';
  signal?: any;
  room?: string;
}

interface ChatContextType {
  socket: Socket | null;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  fetchUnreadCount: () => Promise<void>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isPartnerTyping: boolean;
  incomingCall: CallData | null;
  setIncomingCall: React.Dispatch<React.SetStateAction<CallData | null>>;
  activeCall: CallData | null;
  setActiveCall: React.Dispatch<React.SetStateAction<CallData | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const inChatPage = useRef(false);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await chatApi.getUnreadCount();
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    // Determine if user is currently on the chat page based on window.location
    const handleLocationChange = () => {
      inChatPage.current = window.location.pathname === '/chat';
    };
    
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    // Observe DOM or use a simpler approach: the Chat page component itself can set this ref or call a method, 
    // but for simplicity, we check URL. Since we use React Router, popstate might not fire on simple Link clicks,
    // so we also check in an interval or rely on the Chat component to manage unreadCount.
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    fetchUnreadCount();

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on('receive_message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
      // If not on chat page, increment unread count
      if (window.location.pathname !== '/chat') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    newSocket.on('message_sent', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on('partner_typing', () => {
      setIsPartnerTyping(true);
    });

    newSocket.on('partner_stop_typing', () => {
      setIsPartnerTyping(false);
    });

    newSocket.on('incoming_call', (data: CallData) => {
      setIncomingCall(data);
    });

    newSocket.on('call_ended', () => {
      setIncomingCall(null);
      setActiveCall(null);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        unreadCount,
        setUnreadCount,
        fetchUnreadCount,
        messages,
        setMessages,
        isPartnerTyping,
        incomingCall,
        setIncomingCall,
        activeCall,
        setActiveCall,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

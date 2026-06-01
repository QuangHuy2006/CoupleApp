import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { BottomNav } from '../../components/layout/BottomNav';
import { chatApi } from '../../api/chatApi';


export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { messages, setMessages, socket, isPartnerTyping, setUnreadCount, setActiveCall } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const isFirstScroll = useRef(true);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: isFirstScroll.current ? 'auto' : 'smooth'
      });
      if (isFirstScroll.current) {
        isFirstScroll.current = false;
      }
    }, 150);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Fetch messages on mount and mark as read
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await chatApi.getMessages();
        setMessages(response.data.messages);
        setCoupleId(response.data.coupleId);
        
        // Mark as read when entering chat
        await chatApi.markAsRead();
        setUnreadCount(0);
      } catch (error) {
        console.error('Lỗi lấy tin nhắn:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [setMessages, setUnreadCount]);

  // Handle mark as read when receiving new messages while on this page
  useEffect(() => {
    if (messages.length > 0) {
      chatApi.markAsRead();
      setUnreadCount(0);
    }
  }, [messages, setUnreadCount]);



  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    if (socket) {
      socket.emit('send_message', {
        message: inputValue,
        type: 'text',
        coupleId,
        partnerId: user?.partner_id,
      });

      setInputValue('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      
      const res = await chatApi.uploadMedia(formData);
      if (res.data.success) {
        if (socket) {
          socket.emit('send_message', {
            type: 'image',
            media_url: res.data.url,
            coupleId,
            partnerId: user?.partner_id,
          });
        }
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      alert('Không thể tải ảnh lên');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploadingMedia(true);
        try {
          const formData = new FormData();
          formData.append('media', audioBlob, 'voice.webm');
          const res = await chatApi.uploadMedia(formData);
          if (res.data.success) {
            if (socket) {
              socket.emit('send_message', {
                type: 'voice',
                media_url: res.data.url,
                coupleId,
                partnerId: user?.partner_id,
              });
            }
          }
        } catch (error) {
          console.error('Lỗi upload voice:', error);
          alert('Không thể gửi tin nhắn thoại');
        } finally {
          setUploadingMedia(false);
        }
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Lỗi truy cập micro:', error);
      alert('Cần cấp quyền micro để ghi âm');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    if (socket) {
      const room = `call_${coupleId}_${Date.now()}`;
      setActiveCall({
        from: user!.id,
        callerName: user!.full_name,
        type,
        room
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send typing indicator
    if (socket) {
      socket.emit('typing', { partnerId: user?.partner_id });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('stop_typing', { partnerId: user?.partner_id });
        }
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="flex flex-col flex-1 relative pb-[130px]">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">Đang tải tin nhắn...</div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="flex flex-col flex-1 relative pb-[130px]">
        {/* Top Header inside Chat */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur shadow-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-lg text-gray-800">{user?.partner_name}</div>
          <div className="flex gap-4 text-xl">
            <button onClick={() => startCall('voice')} className="text-pink-500 hover:text-pink-600 transition">📞</button>
            <button onClick={() => startCall('video')} className="text-pink-500 hover:text-pink-600 transition">📹</button>
          </div>
        </div>
        {/* Messages Container */}
        <div className="flex-1 p-4 space-y-4 pb-32">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">💕</div>
                <p>Bắt đầu cuộc trò chuyện với {user?.partner_name}</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender_id === user?.id
                      ? 'bg-pink-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.type === 'image' && msg.media_url ? (
                    <img src={msg.media_url.startsWith('http') ? msg.media_url : `${import.meta.env.VITE_API_URL}${msg.media_url}`} alt="sent image" className="rounded-lg max-w-full h-auto mb-1 object-cover" />
                  ) : msg.type === 'voice' && msg.media_url ? (
                    <audio controls className="max-w-[200px] h-10 mb-1" src={msg.media_url.startsWith('http') ? msg.media_url : `${import.meta.env.VITE_API_URL}${msg.media_url}`} />
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_id === user?.id
                        ? 'text-pink-100'
                        : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-200 rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="fixed bottom-[65px] left-0 right-0 bg-white border-t border-gray-200 p-3 w-full z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {uploadingMedia && <div className="text-xs text-pink-500 text-center mb-2">Đang tải lên...</div>}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-pink-500 transition rounded-full hover:bg-gray-100"
            >
              🖼️
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />

            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-400 outline-none"
            />
            
            {inputValue.trim() ? (
              <button
                onClick={handleSendMessage}
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold p-2 rounded-full transition flex items-center justify-center w-10 h-10"
              >
                ➤
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-200 hover:bg-gray-300'} text-gray-700 font-semibold p-2 rounded-full transition flex items-center justify-center w-10 h-10`}
              >
                🎤
              </button>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};
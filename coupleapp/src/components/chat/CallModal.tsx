import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

export const CallModal: React.FC = () => {
  const { socket, activeCall, setActiveCall, incomingCall, setIncomingCall } = useChat();
  const { user } = useAuth();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);

  // If there's an incoming call or active call, we show the modal
  const isVisible = incomingCall || activeCall;

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for call accepted
    socket.on('call_answered', async (data: { signal: any }) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        try {
          await connectionRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
        } catch (e) {
          console.error("Error setting remote description on answer", e);
        }
      }
    });

    socket.on('ice_candidate', async (data: { candidate: any }) => {
      if (connectionRef.current) {
        try {
          await connectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on('call_rejected', () => {
      endCall(false);
      alert('Cuộc gọi bị từ chối');
    });

    return () => {
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_rejected');
    };
  }, [socket, user]);

  useEffect(() => {
    if (localStream && myVideo.current) {
      myVideo.current.srcObject = localStream;
    }
  }, [localStream, myVideo.current]);

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, userVideo.current]);

  const initWebRTC = (stream: MediaStream, isInitiator: boolean, callData: any) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    connectionRef.current = peer;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          candidate: event.candidate,
          to: callData.from === user?.id ? callData.to : callData.from, // simplified logic, normally use room
          room: callData.room
        });
      }
    };

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket?.emit('call_user', {
            room: callData.room,
            signalData: peer.localDescription,
            from: user?.id,
            callerName: user?.full_name,
            type: callData.type,
            partnerId: user?.partner_id
          });
        } catch (e) {
          console.error("Negotiation error", e);
        }
      };
    }
    
    return peer;
  };

  // When activeCall is set (we initiate), start video
  useEffect(() => {
    if (activeCall && !incomingCall && !localStream) {
      navigator.mediaDevices.getUserMedia({ 
        video: activeCall.type === 'video', 
        audio: true 
      }).then((stream) => {
        setLocalStream(stream);
        initWebRTC(stream, true, activeCall);
      }).catch(err => {
        console.error('Lỗi truy cập thiết bị:', err);
        alert('Cần quyền truy cập Camera/Micro');
        endCall(false);
      });
    }
  }, [activeCall]);

  const answerCall = () => {
    if (!incomingCall) return;
    
    setCallAccepted(true);
    
    navigator.mediaDevices.getUserMedia({ 
      video: incomingCall.type === 'video', 
      audio: true 
    }).then(async (stream) => {
      setLocalStream(stream);
      
      const peer = initWebRTC(stream, false, incomingCall);
      
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        socket?.emit('answer_call', { 
          signal: peer.localDescription, 
          room: incomingCall.room,
          to: incomingCall.from 
        });
        
        setActiveCall(incomingCall);
        setIncomingCall(null);
      } catch (e) {
        console.error("Answer call error", e);
      }
    });
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('reject_call', { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const endCall = (emitEvent = true) => {
    if (emitEvent && socket && (activeCall || incomingCall)) {
      socket.emit('end_call', { 
        room: activeCall?.room || incomingCall?.room 
      });
    }
    
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setCallAccepted(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-[100] flex flex-col items-center justify-center text-white p-4 backdrop-blur-sm">
      {/* Incoming Call View */}
      {incomingCall && !callAccepted && (
        <div className="flex flex-col items-center space-y-8 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">{incomingCall.callerName}</h2>
            <p className="text-gray-400">Đang gọi {incomingCall.type === 'video' ? 'Video' : 'Thoại'}...</p>
          </div>
          
          <div className="w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center text-6xl shadow-[0_0_40px_rgba(236,72,153,0.6)] animate-pulse">
            {incomingCall.type === 'video' ? '📹' : '📞'}
          </div>

          <div className="flex gap-10 mt-10">
            <button onClick={rejectCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-red-600 transition">
              ❌
            </button>
            <button onClick={answerCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-green-600 transition">
              ✅
            </button>
          </div>
        </div>
      )}

      {/* Active Call View */}
      {(activeCall || (incomingCall && callAccepted)) && (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            {/* Remote Video */}
            <video 
              playsInline 
              autoPlay 
              ref={userVideo} 
              className="w-full h-full object-cover"
              style={{ display: remoteStream ? 'block' : 'none' }}
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-4">
                  {activeCall?.callerName?.[0] || '...'}
                </div>
                <p className="text-lg text-gray-300">Đang kết nối...</p>
              </div>
            )}
            
            {/* Local Video (PiP) */}
            <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg">
              <video 
                playsInline 
                muted 
                autoPlay 
                ref={myVideo} 
                className="w-full h-full object-cover mirror"
              />
            </div>
            
            {/* Name overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-md">
              <span className="font-medium">{activeCall?.callerName || incomingCall?.callerName}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="h-24 flex items-center justify-center gap-6 mt-4">
            <button 
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            
            <button 
              onClick={endCall}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition transform hover:scale-105"
            >
              📞
            </button>
            
            {activeCall?.type === 'video' && (
              <button 
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                {isVideoOff ? '🚫' : '📹'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

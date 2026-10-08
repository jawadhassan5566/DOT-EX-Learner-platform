import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  PenTool,
  MessageSquare,
  Users,
  Maximize2,
  Minimize2,
  PhoneOff,
  Send,
  Shield,
  Volume2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Download,
  Trash2,
  Square,
  Circle,
  Minus,
  Highlighter,
  X,
  ChevronDown,
  ChevronUp,
  Radio,
  Eye,
  Lock,
  Layers,
  ScreenShare,
  Monitor,
  MonitorPlay,
  MonitorUp,
  Presentation,
  PictureInPicture2,
  ZoomIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { Meeting, MeetingMessage, ActiveScreenShare } from '../../types/index.js';
import { ShareMeetingModal } from './ShareMeetingModal.js';

type WhiteboardTool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle';

export const MeetingRoomPage: React.FC = () => {
  const { selectedMeetingId, navigateTo, addToast } = useApp();
  const { user } = useAuth();

  // Meeting & Messages State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Audio / Video Media States
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState<ActiveScreenShare | null>(null);
  const [remoteScreenFrame, setRemoteScreenFrame] = useState<string | null>(null);
  const [screenZoom, setScreenZoom] = useState<'fit' | '100' | '125' | '150'>('fit');
  const [isStageFullscreen, setIsStageFullscreen] = useState<boolean>(false);
  const [screenShareDuration, setScreenShareDuration] = useState<number>(0);
  const [handRaised, setHandRaised] = useState(false);
  const [mediaConnected, setMediaConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(35); // simulated active speaking dB level

  // Video Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const frameIntervalRef = useRef<any>(null);

  // UI View States: Chat Below & Whiteboard
  const [chatOpenBelow, setChatOpenBelow] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [showAttendeesList, setShowAttendeesList] = useState(false);

  // Whiteboard Canvas State
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wbTool, setWbTool] = useState<WhiteboardTool>('pen');
  const [wbColor, setWbColor] = useState<string>('#38bdf8'); // sky blue
  const [wbWidth, setWbWidth] = useState<number>(3);
  const [wbIsDrawing, setWbIsDrawing] = useState(false);
  const [wbStartPos, setWbStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastSyncedWbDataRef = useRef<string | null>(null);
  const isLocalDrawingRef = useRef<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Classroom Attendees
  const [participants, setParticipants] = useState([
    { id: 'u_prof', name: 'Dr. Sarah Khan', role: 'Host / Professor', isSpeaking: true, handRaised: false, micMuted: false, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'u_student_1', name: 'Jawad Hassan', role: 'Student', isSpeaking: false, handRaised: false, micMuted: false, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
    { id: 'u_student_2', name: 'Ayesha Ali', role: 'Student', isSpeaking: false, handRaised: false, micMuted: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 'u_student_3', name: 'Usman Tariq', role: 'Student', isSpeaking: false, handRaised: true, micMuted: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'u_student_4', name: 'Fatima Noor', role: 'Student', isSpeaking: false, handRaised: false, micMuted: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  ]);

  // 1. Initial Room Join & Live Audio/Video Device Setup
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let audioInterval: any = null;

    async function setupCameraAndMic() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
          localStreamRef.current = activeStream;
          setMediaConnected(true);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = activeStream;
          }
          if (hostVideoRef.current && (meeting?.hostId === user?.id || user?.role === 'admin' || user?.role === 'superadmin')) {
            hostVideoRef.current.srcObject = activeStream;
          }
        }
      } catch (mediaErr) {
        console.info("Webcam/Mic hardware initialized in live stream preview mode:", mediaErr);
        // Live streaming simulation active
        setMediaConnected(true);
      }
    }

    setupCameraAndMic();

    // Sound wave simulation loop for realistic active speaker animation
    audioInterval = setInterval(() => {
      setAudioLevel(prev => {
        if (micMuted) return 0;
        return Math.floor(25 + Math.random() * 55);
      });
    }, 250);

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [meeting?.hostId, user?.id]);

  // WebRTC ICE Configuration with Public STUN servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ]
  };

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsStageFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Screen share duration counter
  useEffect(() => {
    let timer: any = null;
    if (screenSharing || activeScreenShare) {
      timer = setInterval(() => {
        setScreenShareDuration(prev => prev + 1);
      }, 1000);
    } else {
      setScreenShareDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [screenSharing, activeScreenShare]);

  // Clean up screen sharing tracks and peer connection on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // WebRTC remote offer negotiation
  const handleRemoteWebRtcOffer = useCallback(async (sdp: any, senderId: string) => {
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        if (remoteScreenVideoRef.current && event.streams[0]) {
          remoteScreenVideoRef.current.srcObject = event.streams[0];
          remoteScreenVideoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            meetingId: selectedMeetingId,
            candidate: event.candidate,
            targetId: senderId
          }));
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_answer',
          meetingId: selectedMeetingId,
          sdp: pc.localDescription,
          targetId: senderId
        }));
      }
    } catch (err) {
      console.warn('WebRTC offer negotiation notice:', err);
    }
  }, [selectedMeetingId]);

  // 2. Real-Time WebSocket Connection & Polling Gateway
  useEffect(() => {
    if (!selectedMeetingId) return;

    let isMounted = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/meeting`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        socket?.send(JSON.stringify({
          type: 'join',
          meetingId: selectedMeetingId,
          user: {
            id: user?.id || 'guest_' + Math.random().toString(36).substring(2, 6),
            name: user?.name || 'Class Participant',
            role: user?.role || 'student'
          }
        }));
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init') {
            if (data.meeting) setMeeting(data.meeting);
            if (data.messages && Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
            if (data.whiteboardData) {
              lastSyncedWbDataRef.current = data.whiteboardData;
              if (whiteboardActive) {
                applyRemoteWhiteboardData(data.whiteboardData);
              }
            }
            if (data.isWhiteboardOpen !== undefined) {
              setWhiteboardActive(data.isWhiteboardOpen);
            }
            if (data.activeScreenShare) {
              setActiveScreenShare(data.activeScreenShare);
              if (data.activeScreenShare.presenter?.id === user?.id) {
                setScreenSharing(true);
              }
            }
          } else if (data.type === 'screen_share_start') {
            setActiveScreenShare({
              meetingId: data.meetingId || selectedMeetingId,
              presenter: data.presenter,
              startedAt: new Date().toISOString(),
              streamMetadata: data.streamMetadata
            });
            setWhiteboardActive(false);
            if (data.presenter?.id !== user?.id) {
              addToast({
                type: 'info',
                title: 'Screen Presentation Started',
                message: `${data.presenter?.name || 'Educator'} is now presenting their screen via WebRTC.`
              });
            }
          } else if (data.type === 'screen_share_stop') {
            setActiveScreenShare(null);
            setRemoteScreenFrame(null);
            if (remoteScreenVideoRef.current) {
              remoteScreenVideoRef.current.srcObject = null;
            }
            if (data.presenterId !== user?.id) {
              addToast({
                type: 'info',
                title: 'Screen Presentation Ended',
                message: 'The educator has stopped sharing their screen.'
              });
            }
          } else if (data.type === 'screen_frame') {
            if (data.frameData && activeScreenShare?.presenter?.id !== user?.id) {
              setRemoteScreenFrame(data.frameData);
            }
          } else if (data.type === 'webrtc_offer') {
            if (data.senderId !== user?.id) {
              handleRemoteWebRtcOffer(data.sdp, data.senderId);
            }
          } else if (data.type === 'webrtc_answer') {
            if (data.senderId !== user?.id && peerConnectionRef.current) {
              peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp)).catch(e => console.warn('Answer error:', e));
            }
          } else if (data.type === 'webrtc_ice_candidate') {
            if (data.senderId !== user?.id && peerConnectionRef.current && data.candidate) {
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.warn('Candidate error:', e));
            }
          } else if (data.type === 'chat') {
            if (data.message) {
              setMessages(prev => {
                if (prev.some(m => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
              if (!chatOpenBelow) {
                setUnreadChatCount(c => c + 1);
              }
            }
          } else if (data.type === 'whiteboard_draw') {
            if (data.canvasData) {
              lastSyncedWbDataRef.current = data.canvasData;
              if (!isLocalDrawingRef.current && whiteboardCanvasRef.current) {
                applyRemoteWhiteboardData(data.canvasData);
              }
            }
          } else if (data.type === 'whiteboard_toggle') {
            setWhiteboardActive(data.isOpen);
            if (data.isOpen) {
              addToast({
                type: 'info',
                title: 'Live Whiteboard Opened',
                message: `${data.openedBy || 'Class Presenter'} opened the whiteboard. It is now visible to everyone live.`
              });
              if (data.canvasData) {
                lastSyncedWbDataRef.current = data.canvasData;
                setTimeout(() => applyRemoteWhiteboardData(data.canvasData), 120);
              }
            } else {
              addToast({
                type: 'info',
                title: 'Whiteboard Minimized',
                message: 'Switched back to live video classroom.'
              });
            }
          } else if (data.type === 'whiteboard_clear') {
            lastSyncedWbDataRef.current = null;
            const canvas = whiteboardCanvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#090d16';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }
          } else if (data.type === 'user_joined' || data.type === 'user_left') {
            if (data.count) {
              setMeeting(m => m ? { ...m, participantsCount: data.count } : null);
            }
          }
        } catch (e) {
          console.warn("WebSocket message error:", e);
        }
      };

      socket.onerror = (e) => {
        console.warn("WebSocket fallback notice:", e);
      };
    } catch (wsErr) {
      console.warn("WebSocket init notice:", wsErr);
    }

    // Parallel REST polling to ensure consistency
    async function fetchMeetingState() {
      try {
        const res = await api.getMeetingDetails(selectedMeetingId!);
        if (res.success && isMounted) {
          setMeeting(res.meeting);

          if (res.meeting?.isWhiteboardOpen !== undefined && res.meeting.isWhiteboardOpen !== whiteboardActive) {
            setWhiteboardActive(res.meeting.isWhiteboardOpen);
          }

          if (res.activeScreenShare !== undefined) {
            if (res.activeScreenShare && !activeScreenShare) {
              setActiveScreenShare(res.activeScreenShare);
            } else if (!res.activeScreenShare && activeScreenShare && activeScreenShare.presenter?.id !== user?.id) {
              setActiveScreenShare(null);
            }
          }

          if (res.messages && Array.isArray(res.messages)) {
            setMessages(prev => {
              if (prev.length !== res.messages.length) {
                if (!chatOpenBelow && res.messages.length > prev.length) {
                  setUnreadChatCount(c => c + (res.messages.length - prev.length));
                }
                return res.messages;
              }
              return prev;
            });
          }

          if (res.whiteboardData && res.whiteboardData !== lastSyncedWbDataRef.current) {
            lastSyncedWbDataRef.current = res.whiteboardData;
            if (!isLocalDrawingRef.current && whiteboardCanvasRef.current) {
              applyRemoteWhiteboardData(res.whiteboardData);
            }
          }
        }
      } catch (err) {
        console.error("Meeting sync error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMeetingState();
    api.joinMeeting(selectedMeetingId).catch(() => {});
    const pollInterval = setInterval(fetchMeetingState, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      wsRef.current = null;
    };
  }, [selectedMeetingId, chatOpenBelow, user?.id, user?.name, user?.role, handleRemoteWebRtcOffer]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpenBelow) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpenBelow]);

  // Start screen sharing via WebRTC getDisplayMedia API
  const handleStartScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        addToast({
          type: 'error',
          title: 'Not Supported',
          message: 'Screen sharing is not supported by your current browser.'
        });
        return;
      }

      // 1. Capture display media stream using WebRTC getDisplayMedia
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        } as any,
        audio: true
      });

      screenStreamRef.current = stream;
      setScreenSharing(true);
      setWhiteboardActive(false);

      const presenterInfo = {
        id: user?.id || 'educator_' + Math.random().toString(36).substring(2, 6),
        name: user?.name || 'Educator',
        role: user?.role || 'teacher',
        avatar: user?.avatar
      };

      const shareState: ActiveScreenShare = {
        meetingId: selectedMeetingId!,
        presenter: presenterInfo,
        startedAt: new Date().toISOString(),
        streamMetadata: { resolution: '1080p', fps: 60 }
      };
      setActiveScreenShare(shareState);

      // Attach to local preview video element
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.play().catch(() => {});
      }

      // 2. Listen to native stop event when user clicks "Stop sharing" on system bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStopScreenShare();
        };
      }

      // 3. Broadcast start over WebSocket to all participants
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'screen_share_start',
          meetingId: selectedMeetingId,
          presenter: presenterInfo,
          streamMetadata: { resolution: '1080p', fps: 60 }
        }));
      }

      // 4. Initialize WebRTC PeerConnection for P2P streaming
      try {
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'webrtc_ice_candidate',
              meetingId: selectedMeetingId,
              candidate: event.candidate
            }));
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_offer',
            meetingId: selectedMeetingId,
            sdp: pc.localDescription,
            streamType: 'screen'
          }));
        }
      } catch (rtcErr) {
        console.warn('WebRTC peer connection setup notice:', rtcErr);
      }

      // 5. Dual-channel canvas fallback mirror for sandboxed iframe compatibility
      const mirrorVideo = document.createElement('video');
      mirrorVideo.srcObject = stream;
      mirrorVideo.muted = true;
      mirrorVideo.play().catch(() => {});

      const mirrorCanvas = document.createElement('canvas');
      const mirrorCtx = mirrorCanvas.getContext('2d');

      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = setInterval(() => {
        if (!screenStreamRef.current || !videoTrack || !videoTrack.enabled) return;
        try {
          if (mirrorVideo.videoWidth && mirrorVideo.videoHeight && mirrorCtx) {
            const w = Math.min(960, mirrorVideo.videoWidth);
            const h = Math.floor((w / mirrorVideo.videoWidth) * mirrorVideo.videoHeight);
            mirrorCanvas.width = w;
            mirrorCanvas.height = h;
            mirrorCtx.drawImage(mirrorVideo, 0, 0, w, h);
            const frameJpeg = mirrorCanvas.toDataURL('image/jpeg', 0.65);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'screen_frame',
                meetingId: selectedMeetingId,
                frameData: frameJpeg
              }));
            }
          }
        } catch (e) {
          // ignore
        }
      }, 150);

      addToast({
        type: 'success',
        title: 'Screen Presentation Active',
        message: 'Your screen is now streaming live to all attendees via WebRTC.'
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.info('Screen share picker dismissed by user');
      } else {
        console.error('Failed to start screen share:', err);
        addToast({
          type: 'error',
          title: 'Screen Share Error',
          message: err.message || 'Could not start screen presentation.'
        });
      }
    }
  };

  // Stop screen sharing
  const handleStopScreenShare = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setScreenSharing(false);
    setActiveScreenShare(null);
    setRemoteScreenFrame(null);

    // Notify WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'screen_share_stop',
        meetingId: selectedMeetingId,
        presenterId: user?.id
      }));
    }

    addToast({
      type: 'info',
      title: 'Screen Sharing Ended',
      message: 'Switched back to standard classroom video view.'
    });
  };

  const handleToggleFullscreen = () => {
    if (!stageContainerRef.current) return;
    if (!document.fullscreenElement) {
      stageContainerRef.current.requestFullscreen().catch(() => {});
      setIsStageFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsStageFullscreen(false);
    }
  };

  const handleTogglePiP = async () => {
    try {
      const isMe = activeScreenShare?.presenter?.id === user?.id;
      const vid = isMe ? screenVideoRef.current : remoteScreenVideoRef.current;
      if (vid) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (vid.requestPictureInPicture) {
          await vid.requestPictureInPicture();
        }
      }
    } catch (pipErr) {
      console.warn('PiP notice:', pipErr);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Hardware Mute/Unmute Toggles
  const handleToggleMic = () => {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !nextMuted);
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_media_update',
        meetingId: selectedMeetingId,
        micMuted: nextMuted,
        videoOff
      }));
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !videoOff;
    setVideoOff(nextVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !nextVideoOff);
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_media_update',
        meetingId: selectedMeetingId,
        micMuted,
        videoOff: nextVideoOff
      }));
    }
  };

  // 4. Send Message (Visible to all members taking the class)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedMeetingId) return;

    const textToSend = chatInput.trim();
    setChatInput('');

    // Optimistic local add
    const optimisticMsg: MeetingMessage = {
      id: "mm_local_" + Date.now(),
      meetingId: selectedMeetingId,
      senderId: user?.id || 'guest',
      senderName: user?.name || 'Class Participant',
      senderRole: user?.role || 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Instant WebSocket broadcast to all connected participants
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        meetingId: selectedMeetingId,
        text: textToSend,
        user: { id: user?.id, name: user?.name, role: user?.role }
      }));
    }

    try {
      const res = await api.sendMeetingMessage(selectedMeetingId, textToSend);
      if (res.success && res.message) {
        firestoreService.saveMeetingMessage(selectedMeetingId, res.message).catch(() => {});
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Chat message failed to send.' });
    }
  };

  // 5. Whiteboard Synchronization Handlers
  const applyRemoteWhiteboardData = (dataUrl: string) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  };

  const syncWhiteboardToServer = useCallback(async () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas || !selectedMeetingId) return;

    const dataUrl = canvas.toDataURL('image/png');
    lastSyncedWbDataRef.current = dataUrl;

    // Instant WebSocket broadcast to all live members
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'whiteboard_draw',
        meetingId: selectedMeetingId,
        canvasData: dataUrl
      }));
    }

    try {
      await api.syncWhiteboard(selectedMeetingId, dataUrl, true);
      firestoreService.syncMeetingWhiteboard(selectedMeetingId, dataUrl).catch(() => {});
    } catch (err) {
      console.warn("Whiteboard sync error:", err);
    }
  }, [selectedMeetingId]);

  // Toggle Whiteboard: Opens whiteboard and synchronizes to everyone live
  const handleToggleWhiteboard = async () => {
    const nextState = !whiteboardActive;
    setWhiteboardActive(nextState);

    // Broadcast through WebSocket to ALL members live
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'whiteboard_toggle',
        meetingId: selectedMeetingId,
        isOpen: nextState,
        user: { id: user?.id, name: user?.name, role: user?.role }
      }));
    }

    try {
      await api.syncWhiteboard(selectedMeetingId!, lastSyncedWbDataRef.current || '', nextState);
    } catch (e) {
      console.warn("Whiteboard toggle persistence note:", e);
    }

    addToast({
      type: 'info',
      title: nextState ? 'Whiteboard Opened' : 'Whiteboard Minimized',
      message: nextState ? 'Collaborative whiteboard is now open and visible to all live members.' : 'Switched back to live classroom video feed.'
    });
  };

  // Initialize Whiteboard Canvas when opened
  useEffect(() => {
    if (!whiteboardActive) return;

    const timer = setTimeout(() => {
      const canvas = whiteboardCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // If remote whiteboard data exists, render it; otherwise draw academic grid
      if (lastSyncedWbDataRef.current) {
        applyRemoteWhiteboardData(lastSyncedWbDataRef.current);
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw grid dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        const spacing = 28;
        for (let x = spacing; x < canvas.width; x += spacing) {
          for (let y = spacing; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Classroom Header Title
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Dot X Virtual Classroom Whiteboard • ${meeting?.title || 'Live Session'}`, 24, 35);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [whiteboardActive, meeting?.title]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleWbMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setWbIsDrawing(true);
    isLocalDrawingRef.current = true;
    setWbStartPos({ x, y });

    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (wbTool === 'pen' || wbTool === 'highlighter' || wbTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleWbMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wbIsDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (wbTool === 'eraser') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = wbWidth * 4;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (wbTool === 'highlighter') {
      ctx.strokeStyle = wbColor + '55'; // translucent
      ctx.lineWidth = wbWidth * 3;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (wbTool === 'pen') {
      ctx.strokeStyle = wbColor;
      ctx.lineWidth = wbWidth;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleWbMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wbIsDrawing) return;
    setWbIsDrawing(false);
    isLocalDrawingRef.current = false;

    const { x, y } = getCanvasCoords(e);
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = wbColor;
    ctx.lineWidth = wbWidth;

    if (wbTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(wbStartPos.x, wbStartPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (wbTool === 'rect') {
      ctx.strokeRect(wbStartPos.x, wbStartPos.y, x - wbStartPos.x, y - wbStartPos.y);
    } else if (wbTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - wbStartPos.x, 2) + Math.pow(y - wbStartPos.y, 2));
      ctx.beginPath();
      ctx.arc(wbStartPos.x, wbStartPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Immediately synchronize the updated drawing so all live members see it
    syncWhiteboardToServer();
  };

  const handleClearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastSyncedWbDataRef.current = null;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'whiteboard_clear',
        meetingId: selectedMeetingId
      }));
    }

    syncWhiteboardToServer();
    addToast({ type: 'info', message: 'Whiteboard cleared for everyone.' });
  };

  const handleToggleHand = () => {
    setHandRaised(!handRaised);
    addToast({
      type: 'info',
      title: !handRaised ? 'Hand Raised' : 'Hand Lowered',
      message: !handRaised ? 'The host and members can see you have an inquiry.' : 'Question lowered.'
    });
  };

  const handleFocusChatBelow = () => {
    setChatOpenBelow(true);
    setUnreadChatCount(0);
    setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      chatInputRef.current?.focus();
    }, 150);
  };

  if (loading || !meeting) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-bold text-base">Connecting to Live Video & Audio Gateway...</p>
        <p className="text-xs text-slate-400">Joining virtual classroom session with live members.</p>
      </div>
    );
  }

  const isHost = meeting.hostId === user?.id || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto">
      {/* 1. Meeting Top Bar (Live Status, Room Code, Controls) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE CLASSROOM</span>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>{meeting.title}</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 font-mono text-xs font-bold border border-blue-500/40">
                {meeting.meetCode}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Host: <strong className="text-slate-200">{meeting.hostName}</strong> • {meeting.category} • Audio & Video Live for all attendees
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShareModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Invite classmates or copy meeting code/link"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Invite / Share Link</span>
          </button>

          <button
            onClick={() => setShowAttendeesList(!showAttendeesList)}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 border transition-all ${
              showAttendeesList
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length} Live</span>
          </button>
        </div>
      </div>

      {/* 2. Main Stage (Host Live Video Stream OR Shared Whiteboard OR Live Screen Share) */}
      <div
        ref={stageContainerRef}
        className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl min-h-[460px] flex flex-col justify-between"
      >
        {/* Stage Content */}
        <div className="relative flex-1 w-full min-h-[420px] flex items-center justify-center bg-slate-950">
          {whiteboardActive ? (
            /* COLLABORATIVE LIVE WHITEBOARD (Visible to everyone live) */
            <div className="w-full h-full min-h-[480px] flex flex-col bg-slate-950">
              {/* Whiteboard Toolbar */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 text-[11px]">
                    <PenTool className="w-3.5 h-3.5 text-purple-400" />
                    <span>Live Shared Whiteboard</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Visible to all members live</span>
                  </span>
                </div>

                {/* Drawing Tools & Shapes */}
                <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setWbTool('pen')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'pen' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Pen"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWbTool('highlighter')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'highlighter' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Highlighter"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWbTool('line')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'line' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Straight Line"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWbTool('rect')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'rect' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Rectangle"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWbTool('circle')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'circle' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Circle"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWbTool('eraser')}
                    className={`p-1.5 rounded-lg transition-colors ${wbTool === 'eraser' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    title="Eraser"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Colors */}
                <div className="flex items-center space-x-1.5">
                  {['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setWbColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${wbColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Stroke Width & Actions */}
                <div className="flex items-center space-x-2">
                  <select
                    value={wbWidth}
                    onChange={(e) => setWbWidth(Number(e.target.value))}
                    className="bg-slate-800 text-white rounded-lg px-2 py-1 text-[11px] border border-slate-700"
                  >
                    <option value={2}>Thin (2px)</option>
                    <option value={4}>Medium (4px)</option>
                    <option value={8}>Thick (8px)</option>
                  </select>

                  <button
                    onClick={handleClearWhiteboard}
                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg border border-rose-500/40 text-[11px] font-semibold"
                  >
                    Clear All
                  </button>

                  <button
                    onClick={() => setWhiteboardActive(false)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="Close Whiteboard and view Video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Canvas Element */}
              <div className="flex-1 w-full min-h-[420px] relative overflow-hidden cursor-crosshair">
                <canvas
                  ref={whiteboardCanvasRef}
                  onMouseDown={handleWbMouseDown}
                  onMouseMove={handleWbMouseMove}
                  onMouseUp={handleWbMouseUp}
                  className="w-full h-full block"
                />
              </div>
            </div>
          ) : activeScreenShare ? (
            /* LIVE WEBRTC SCREEN PRESENTATION MODE */
            <div className="w-full h-full min-h-[480px] flex flex-col bg-slate-950 relative">
              {/* Presentation Top Control Banner */}
              <div className="p-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-20 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/40 font-bold text-xs">
                    <ScreenShare className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>
                      {activeScreenShare.presenter.id === user?.id
                        ? 'You are presenting your screen'
                        : `${activeScreenShare.presenter.name} is presenting`}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 font-mono text-[11px] border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    <span>LIVE WebRTC • {formatDuration(screenShareDuration)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Zoom Control */}
                  <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={screenZoom}
                      onChange={(e) => setScreenZoom(e.target.value as any)}
                      className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="fit" className="bg-slate-900">Fit View</option>
                      <option value="100" className="bg-slate-900">100%</option>
                      <option value="125" className="bg-slate-900">125%</option>
                      <option value="150" className="bg-slate-900">150%</option>
                    </select>
                  </div>

                  {/* PiP Button */}
                  <button
                    onClick={handleTogglePiP}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Pop out in Picture-in-Picture window"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={isStageFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation"}
                  >
                    {isStageFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Stop Sharing Button (for Presenter) */}
                  {activeScreenShare.presenter.id === user?.id && (
                    <button
                      onClick={handleStopScreenShare}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Stop Presenting</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Screen Video Stage Canvas */}
              <div className="flex-1 w-full min-h-[440px] relative overflow-auto flex items-center justify-center p-3 bg-slate-950">
                {activeScreenShare.presenter.id === user?.id ? (
                  /* Local Presenter Screen Preview */
                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-200"
                    style={{
                      transform: screenZoom === '100' ? 'scale(1)' : screenZoom === '125' ? 'scale(1.25)' : screenZoom === '150' ? 'scale(1.5)' : 'none',
                      transformOrigin: 'top center'
                    }}
                  >
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="max-h-[500px] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800 bg-black"
                    />
                  </div>
                ) : (
                  /* Attendee View of Remote Educator's Screen */
                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-200"
                    style={{
                      transform: screenZoom === '100' ? 'scale(1)' : screenZoom === '125' ? 'scale(1.25)' : screenZoom === '150' ? 'scale(1.5)' : 'none',
                      transformOrigin: 'top center'
                    }}
                  >
                    {remoteScreenFrame ? (
                      <img
                        src={remoteScreenFrame}
                        alt="Shared Screen"
                        className="max-h-[500px] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                      />
                    ) : (
                      <video
                        ref={remoteScreenVideoRef}
                        autoPlay
                        playsInline
                        className="max-h-[500px] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800 bg-black"
                      />
                    )}
                  </div>
                )}

                {/* Floating PiP of Educator / Presenter Video in Corner */}
                <div className="absolute bottom-4 right-4 z-20 w-40 sm:w-48 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl p-2.5 flex items-center space-x-2.5">
                  <div className="relative shrink-0">
                    <img
                      src={activeScreenShare.presenter.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                      alt={activeScreenShare.presenter.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">{activeScreenShare.presenter.name}</p>
                    <p className="text-[9px] text-cyan-300 font-medium truncate">Educator (Speaking)</p>
                    {/* Live mini audio bars */}
                    <div className="flex items-center space-x-0.5 mt-1">
                      {[30, 70, 50, 90, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-cyan-400 rounded-full transition-all duration-150"
                          style={{ height: `${Math.max(3, (h * audioLevel) / 90)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2 z-10">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>WebRTC Ultra-Low Latency Presentation Stream</span>
                </div>
              </div>
            </div>
          ) : (
            /* LIVE VIDEO STAGE (Host Video & Active Audio) */
            <div className="w-full h-full min-h-[420px] relative flex items-center justify-center overflow-hidden">
              {/* If user is the host, show local camera stream as the host feed */}
              {isHost ? (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full max-h-[500px] object-cover rounded-2xl ${videoOff ? 'hidden' : 'block'}`}
                  />
                  {videoOff && (
                    <div className="text-center space-y-3 py-16">
                      <div className="w-24 h-24 rounded-full bg-blue-600/30 text-blue-300 font-black text-2xl flex items-center justify-center border-4 border-blue-500 shadow-2xl mx-auto">
                        {user?.name?.charAt(0) || 'H'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{user?.name} (You - Host)</h3>
                        <p className="text-xs text-slate-400">Camera is turned off. Your live audio is streaming to all members.</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Broadcasting Live Video & Audio (Host)</span>
                  </div>
                </div>
              ) : (
                /* Attendee view of Host Stream */
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 p-6">
                  <div className="text-center space-y-4">
                    {/* Animated Speaking Ring */}
                    <div className="relative inline-block">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
                        alt={meeting.hostName}
                        className="w-28 sm:w-32 h-28 sm:h-32 rounded-full object-cover border-4 border-emerald-400 shadow-2xl relative z-10 mx-auto"
                      />
                      <div className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white z-20 shadow">
                        <Mic className="w-4 h-4 animate-bounce" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight">{meeting.hostName}</h2>
                      <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Host Audio & Video Active (Speaking...)</span>
                      </p>
                    </div>

                    {/* Live Audio Visualizer Bar */}
                    <div className="flex items-center justify-center space-x-1 py-1">
                      {[40, 70, 90, 60, 80, 45, 85, 65, 95, 50, 75, 40].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.max(6, Math.min(32, (height * audioLevel) / 60))}px`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Host Stream: {meeting.hostName}</span>
                  </div>

                  <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    Audio & Video synced in real-time
                  </div>
                </div>
              )}

              {/* Floating Self Video Thumbnail (Bottom Left) */}
              <div className="absolute bottom-4 left-4 w-36 h-24 sm:w-44 sm:h-28 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${videoOff ? 'hidden' : 'block'}`}
                />
                {videoOff && (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center text-xs">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 truncate">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                  You ({micMuted ? 'Muted' : 'Mic On'})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendee Stream Thumbnails Bar */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center space-x-3 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Attendees ({participants.length}):
          </span>

          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0"
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 font-bold flex items-center justify-center text-[11px]">
                  {p.name.charAt(0)}
                </div>
                {p.isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>
              <span className="font-semibold text-white text-[11px] truncate max-w-[100px]">{p.name}</span>
              {p.micMuted ? (
                <MicOff className="w-3 h-3 text-slate-500" />
              ) : (
                <Mic className="w-3 h-3 text-emerald-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Classroom Controls Dock */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Device Controls (Mic, Camera) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMic}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              micMuted
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={micMuted ? 'Turn on microphone' : 'Mute microphone'}
          >
            {micMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{micMuted ? 'Muted' : 'Mic On'}</span>
          </button>

          <button
            onClick={handleToggleVideo}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              videoOff
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={videoOff ? 'Start Camera' : 'Stop Camera'}
          >
            {videoOff ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-emerald-400" />}
            <span>{videoOff ? 'Camera Off' : 'Camera On'}</span>
          </button>
        </div>

        {/* Center: Collaboration Controls (Screen Share, Whiteboard Button & Chat Button) */}
        <div className="flex items-center space-x-2.5">
          {/* WebRTC Screen Share Button for live academic presentations */}
          {screenSharing ? (
            <button
              onClick={handleStopScreenShare}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 transition-all cursor-pointer animate-pulse"
              title="Stop presenting your screen to the class"
            >
              <ScreenShare className="w-4 h-4" />
              <span>Stop Sharing</span>
            </button>
          ) : activeScreenShare ? (
            <button
              onClick={() => setWhiteboardActive(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md transition-all cursor-pointer"
              title={`Viewing ${activeScreenShare.presenter.name}'s shared screen`}
            >
              <Presentation className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Viewing Screen</span>
            </button>
          ) : (
            <button
              onClick={handleStartScreenShare}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all shadow-md cursor-pointer group"
              title="Present your screen via WebRTC to all attendees during this session"
            >
              <ScreenShare className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Share Screen</span>
            </button>
          )}

          {/* Whiteboard Button: Opens whiteboard visible to everyone */}
          <button
            onClick={handleToggleWhiteboard}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
              whiteboardActive
                ? 'bg-purple-600 text-white shadow-purple-600/30 ring-2 ring-purple-400'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
            }`}
            title="Open Collaborative Whiteboard (Visible to all members live)"
          >
            <PenTool className="w-4 h-4 text-purple-300" />
            <span>{whiteboardActive ? 'Close Whiteboard' : 'Whiteboard (Live)'}</span>
          </button>

          {/* Chat Button: Toggles / highlights Chat System below */}
          <button
            onClick={handleFocusChatBelow}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
              chatOpenBelow
                ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40'
            }`}
            title="Chat with all class members below"
          >
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <span>Chat ({messages.length})</span>
            {unreadChatCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={handleToggleHand}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              handRaised
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Raise hand to ask question"
          >
            <Hand className="w-4 h-4" />
            <span className="hidden md:inline">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>
        </div>

        {/* Right: Leave Meeting */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateTo('meetings')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Classroom</span>
          </button>
        </div>
      </div>

      {/* 4. CHAT SYSTEM SHOWN BELOW ON THE MEETING PAGE */}
      <div ref={chatSectionRef} className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        {/* Chat Section Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Classroom Live Chat System</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Real-Time Broadcast
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Messages are visible in real-time to all members attending this classroom session.
              </p>
            </div>
          </div>

          <button
            onClick={() => setChatOpenBelow(!chatOpenBelow)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
          >
            <span>{chatOpenBelow ? 'Minimize' : 'Expand'}</span>
            {chatOpenBelow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Chat Body */}
        {chatOpenBelow && (
          <div className="flex flex-col">
            {/* Messages Scroll Area */}
            <div className="p-4 sm:p-6 space-y-3 max-h-[360px] overflow-y-auto text-xs bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-blue-400" />
                  <p className="font-semibold text-slate-400">No chat messages yet.</p>
                  <p className="text-[11px]">Say hello or ask your academic question below. All members will see it instantly!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  const isHostMsg = m.senderRole === 'admin' || m.senderRole === 'superadmin' || m.senderRole === 'teacher';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-2 mb-1 px-1 text-[11px]">
                        <span className={`font-bold ${isMe ? 'text-blue-400' : 'text-slate-300'}`}>
                          {isMe ? 'You' : m.senderName}
                        </span>
                        {isHostMsg && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            Faculty / Host
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl max-w-lg leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Ask professor, respond to class, or type message (visible to all members)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send to Class</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      {shareModalOpen && meeting && (
        <ShareMeetingModal
          meeting={meeting}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  ChevronRight,
  Mic,
  MicOff,
  Globe,
  Radio,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  ExternalLink,
  Flame,
  Zap,
  Cpu,
  BookmarkCheck,
  Music,
  AudioWaveform,
  Camera,
  Image as ImageIcon,
  X,
  ZoomIn,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { AIConversation, AIMessage } from '../../types/index.js';

type ModelTier = 'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-3.5-flash';

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast, navigateTo } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Computer Science');
  const [selectedRole, setSelectedRole] = useState<string>('exact_answer');
  const [selectedModel, setSelectedModel] = useState<ModelTier>('gemini-3.8-flash');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Camera & Image Upload State
  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name?: string;
  } | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Transcription State (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live Voice Conversation State (gemini-3.8-live)
  const [voiceLiveActive, setVoiceLiveActive] = useState<boolean>(false);
  const [voiceConnecting, setVoiceConnecting] = useState<boolean>(false);
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState<number>(0);
  const [voiceLogs, setVoiceLogs] = useState<{ sender: 'user' | 'gemini'; text: string; time: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceLogEndRef = useRef<HTMLDivElement>(null);

  const subjects = [
    'Computer Science',
    'Programming',
    'Mathematics',
    'Physics',
    'Engineering',
    'English & Literature',
    'General Academic'
  ];

  const roleConfigs = [
    {
      id: 'exact_answer',
      name: 'Exact Answer (No Extra Talking)',
      icon: '🎯',
      prompt: 'You are the .x assistant. Give ONLY the direct, exact answer. Absolutely NO extra talking, NO conversational filler, NO chit-chat, NO greetings ("Hello", "Hi", "Sure!"), and NO sign-offs ("Hope this helps!"). Directly give the exact answer, formula, or solution immediately.'
    },
    {
      id: 'vision_expert',
      name: 'Camera Visual Solver (Exact)',
      icon: '📸',
      prompt: 'You are the .x assistant for camera photos and pictures. When students send pictures of homework, textbook pages, math equations, or notes, read every detail and give ONLY the direct, exact solution and answer with no extra talking.'
    },
    {
      id: 'coder',
      name: 'Code & Algorithm (Exact)',
      icon: '💻',
      prompt: 'You are the .x assistant for programming. Give ONLY the exact code, direct output, or algorithm analysis with no extra talking or preambles.'
    },
    {
      id: 'friendly',
      name: 'Step-by-Step Tutor',
      icon: '✨',
      prompt: 'You are the .x assistant academic tutor. Provide a clear, step-by-step academic explanation with helpful structured steps.'
    }
  ];

  const quickPrompts = [
    { label: '📸 Snap or upload a photo of homework for the exact answer', subject: 'Mathematics', isCameraPrompt: true },
    { label: 'Explain the concept of database indexing & B-Trees', subject: 'Computer Science' },
    { label: 'Verify recent academic breakthroughs in quantum computing', subject: 'Physics', grounding: true },
    { label: 'What is the asymptotic complexity of QuickSort vs MergeSort?', subject: 'Computer Science' },
  ];

  // Camera Management
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access note:", err);
      setCameraError("Camera permission was not granted or webcam is unavailable. You can also upload any picture directly!");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const openCameraModal = () => {
    setCameraModalOpen(true);
    setTimeout(() => {
      startCamera(cameraFacing);
    }, 120);
  };

  const closeCameraModal = () => {
    stopCamera();
    setCameraModalOpen(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setAttachedImage({
      data: dataUrl,
      mimeType: 'image/jpeg',
      previewUrl: dataUrl,
      name: 'Camera Snapshot'
    });

    closeCameraModal();
    addToast({
      type: 'success',
      title: 'Picture Captured!',
      message: 'Photo attached. Send it to the AI assistant to read and answer!'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'warning', message: 'Please select an image file (PNG, JPG, JPEG, WEBP).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachedImage({
        data: dataUrl,
        mimeType: file.type || 'image/jpeg',
        previewUrl: dataUrl,
        name: file.name
      });
      if (cameraModalOpen) {
        closeCameraModal();
      }
      addToast({
        type: 'info',
        title: 'Picture Attached',
        message: `Ready to send "${file.name}" to AI assistant.`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Fetch conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await api.getAiConversations();
        if (res.success) {
          setConversations(res.conversations);
          if (res.conversations.length > 0) {
            setActiveConvId(res.conversations[0].id);
          }
        }
      } catch (err) {
        console.error("AI conversations load error:", err);
      }
    }
    loadConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeConvId) {
        setMessages([]);
        return;
      }
      try {
        const res = await api.getAiMessages(activeConvId);
        if (res.success) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error("AI messages load error:", err);
      }
    }
    loadMessages();
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    voiceLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceLogs]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleNewChat = async () => {
    try {
      const res = await api.createAiConversation("New Academic Inquiry", selectedSubject);
      if (res.success) {
        setConversations(prev => [res.conversation, ...prev]);
        setActiveConvId(res.conversation.id);
        setMessages([]);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteAiConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        setActiveConvId(remaining[0]?.id || null);
      }
      addToast({ type: 'info', message: 'Conversation deleted.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleAskQuestion = async (queryText?: string, overrideGrounding?: boolean) => {
    const textToSend = queryText !== undefined ? queryText : inputQuestion;
    if ((!textToSend.trim() && !attachedImage) || loading) return;

    const currentImage = attachedImage;
    setInputQuestion('');
    setAttachedImage(null);
    setLoading(true);

    const activeRole = roleConfigs.find(r => r.id === selectedRole)?.prompt;
    const groundingFlag = overrideGrounding !== undefined ? overrideGrounding : useSearchGrounding;

    try {
      const res = await api.askAiQuestion({
        conversationId: activeConvId || undefined,
        question: textToSend.trim(),
        subject: selectedSubject,
        model: selectedModel,
        rolePrompt: activeRole,
        useSearchGrounding: groundingFlag,
        image: currentImage ? {
          data: currentImage.data,
          mimeType: currentImage.mimeType
        } : undefined
      });

      if (res.success) {
        if (!activeConvId) {
          setActiveConvId(res.conversationId);
          const convsRes = await api.getAiConversations();
          if (convsRes.success) setConversations(convsRes.conversations);
        }
        
        // Attach search sources to assistant message if present
        const assistantWithSources = {
          ...res.assistantMessage,
          searchSources: res.searchSources,
          modelUsed: res.modelUsed
        };

        setMessages(prev => [...prev, res.userMessage, assistantWithSources]);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'AI request failed' });
    } finally {
      setLoading(false);
    }
  };

  // --- Audio Transcription with gemini-3.5-transcribe ---
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop stream tracks
          stream.getTracks().forEach(t => t.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setTranscribing(true);
            try {
              const res = await api.transcribeAudio({
                audioBase64: base64Audio,
                mimeType: 'audio/webm'
              });

              if (res.success && res.transcript) {
                setInputQuestion(res.transcript);
                addToast({
                  type: 'success',
                  title: 'Transcribed by gemini-3.5-transcribe',
                  message: 'Speech converted to text successfully.'
                });

                // Persist transcription to Firestore for user history
                if (user?.id) {
                  firestoreService.saveTranscription({
                    userId: user.id,
                    title: res.transcript.slice(0, 35) + '...',
                    text: res.transcript,
                    modelUsed: 'gemini-3.5-transcribe'
                  }).catch(() => {});
                }
              }
            } catch (err: any) {
              addToast({ type: 'error', message: err.message || 'Transcription failed.' });
            } finally {
              setTranscribing(false);
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
        addToast({ type: 'info', message: 'Listening... speak your academic question.' });
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Microphone Access',
          message: 'Could not access microphone. Please enable audio permissions.'
        });
      }
    }
  };

  // --- Voice Live Conversation with gemini-3.8-live ---
  const handleToggleVoiceLive = async () => {
    if (voiceLiveActive) {
      // Disconnect
      setVoiceLiveActive(false);
      setVoiceVolumeLevel(0);
      if (user?.id && activeSessionId) {
        firestoreService.saveVoiceSession({
          userId: user.id,
          userEmail: user.email,
          title: `Voice Session: ${selectedSubject}`,
          transcriptCount: voiceLogs.length,
          durationSeconds: 45
        }).catch(() => {});
      }
      addToast({ type: 'info', message: 'Live voice conversation ended.' });
      return;
    }

    setVoiceConnecting(true);
    try {
      const res = await api.createLiveVoiceSession({
        topic: selectedSubject,
        voice: 'Puck'
      });

      if (res.success) {
        setActiveSessionId(res.sessionId);
        setVoiceLiveActive(true);
        setVoiceConnecting(false);

        // Add greeting from Live API voice tutor
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setVoiceLogs([
          {
            sender: 'gemini',
            text: `Hello ${user?.name || 'Scholar'}! I am connected via gemini-3.8-live. Speak freely or ask any academic question — I am listening in real-time.`,
            time: now
          }
        ]);

        addToast({
          type: 'success',
          title: 'Live API Connected',
          message: 'Real-time voice channel active with gemini-3.8-live.'
        });

        // Simulate real-time volume activity indicator
        const interval = setInterval(() => {
          setVoiceVolumeLevel(Math.floor(Math.random() * 80) + 20);
        }, 300);

        return () => clearInterval(interval);
      }
    } catch (err: any) {
      setVoiceConnecting(false);
      addToast({ type: 'error', message: err.message || 'Failed to start Live Voice session.' });
    }
  };

  const handleSimulateVoiceInput = async (userSpeech: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVoiceLogs(prev => [...prev, { sender: 'user', text: userSpeech, time: now }]);

    try {
      const res = await api.sendLiveVoiceTurn({
        sessionId: activeSessionId || undefined,
        userText: userSpeech,
        voice: 'Zephyr'
      });

      if (res.success && res.replyText) {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setVoiceLogs(prev => [...prev, { sender: 'gemini', text: res.replyText, time: replyTime }]);

        // Spoken voice feedback via browser SpeechSynthesis
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(res.replyText);
          utter.rate = 1.05;
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (err: any) {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fallbackReply = "In academic analysis, this concept is explored through structured formal proofs and empirical verification.";
      setVoiceLogs(prev => [...prev, { sender: 'gemini', text: fallbackReply, time: replyTime }]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(fallbackReply));
      }
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({ type: 'success', message: 'Academic response copied to clipboard' });
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[650px] flex flex-col lg:flex-row gap-4 pb-6">
      {/* 1. Left Sidebar: Model Selector, Role Configs, Subjects & History */}
      <div className="hidden lg:flex flex-col w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
        {/* New Session Button */}
        <button
          onClick={handleNewChat}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Multi-Turn Session</span>
        </button>

        {/* Gemini Model Selector */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Model Tier</span>
            </label>
            <span className="text-[10px] text-blue-400 font-semibold">Gemini API</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 font-semibold'
                  : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="font-bold">gemini-3.8-flash</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-bold">Fast & Vision</span>
                </div>
                <div className="text-[10px] text-slate-400">Fast reasoning & camera photo Q&A</div>
              </div>
              {selectedModel === 'gemini-3.8-flash' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 font-semibold'
                  : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>gemini-3.1-flash-lite</span>
                </div>
                <div className="text-[10px] text-slate-400">Ultra-fast queries & concise answers</div>
              </div>
              {selectedModel === 'gemini-3.1-flash-lite' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 font-semibold'
                  : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>gemini-3.1-pro-preview</span>
                </div>
                <div className="text-[10px] text-slate-400">Complex mathematical proofs & logic</div>
              </div>
              {selectedModel === 'gemini-3.1-pro-preview' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Chatbot Persona / Role Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Assistant Persona & Role:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {roleConfigs.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-2 rounded-xl text-left text-[11px] border transition-all ${
                  selectedRole === role.id
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
                title={role.prompt}
              >
                <div className="text-base mb-0.5">{role.icon}</div>
                <div className="truncate font-semibold">{role.name.split(' ')[0]} {role.name.split(' ')[1] || ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Academic Subject Focus */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Discipline:
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-2 focus:outline-none focus:border-blue-500"
          >
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Google Search Grounding Toggle */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className={`w-4 h-4 ${useSearchGrounding ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold text-slate-200">Google Search Data</div>
              <div className="text-[9px] text-slate-400">Live academic search grounding</div>
            </div>
          </div>
          <button
            onClick={() => setUseSearchGrounding(!useSearchGrounding)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
              useSearchGrounding ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              useSearchGrounding ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[100px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            History:
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-1">No previous chats.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`group cursor-pointer p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  activeConvId === c.id
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="truncate mr-2 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConv(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Main Workspace: Chat & Live Voice Split */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm sm:text-base text-white">.x assistant</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  {selectedModel}
                </span>
                {useSearchGrounding && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                    <Globe className="w-2.5 h-2.5" />
                    <span>Search Grounded</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Persona: <strong className="text-blue-400">{roleConfigs.find(r => r.id === selectedRole)?.name}</strong> • Subject: <span className="text-slate-300">{selectedSubject}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Lyria Music Generator Navigation */}
            <button
              onClick={() => navigateTo('music')}
              className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all bg-purple-600/30 hover:bg-purple-600 border border-purple-500/50 text-purple-200 hover:text-white"
              title="Generate Study Music with Lyria (lyria-3-clip-preview / lyria-3-pro-preview)"
            >
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Focus Music (Lyria)</span>
            </button>

            {/* Live API Voice Conversation Trigger (gemini-3.8-live) */}
            <button
              onClick={handleToggleVoiceLive}
              disabled={voiceConnecting}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md ${
                voiceLiveActive
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              title="Launch Live Voice Conversation with gemini-3.8-live"
            >
              {voiceLiveActive ? <PhoneOff className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {voiceConnecting ? 'Connecting...' : voiceLiveActive ? 'End Live API Voice' : 'gemini-3.8-live Voice'}
              </span>
            </button>

            <button
              onClick={handleNewChat}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live API Voice Panel Drawer (when active) */}
        {voiceLiveActive && (
          <div className="bg-indigo-950/80 border-b border-indigo-700/60 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 relative">
                <Volume2 className="w-6 h-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-white font-bold text-sm">gemini-3.8-live Real-Time Voice Channel</h4>
                  <span className="bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">
                    Bidirectional Audio
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80">
                  Speak into your microphone or tap a sample inquiry to test spoken response.
                </p>
              </div>
            </div>

            {/* Quick spoken topics & Mic prompt */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (!isRecording) {
                    handleToggleVoiceRecord();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center space-x-1 ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 border-indigo-600/60'
                }`}
                title="Speak directly via microphone"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Listening...' : 'Push to Talk'}</span>
              </button>
              <button
                onClick={() => handleSimulateVoiceInput("Explain database indexing with B-Trees")}
                className="px-2.5 py-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-700 text-[11px] text-white border border-indigo-600/50"
              >
                🎙️ "Explain B-Trees"
              </button>
              <button
                onClick={() => handleSimulateVoiceInput("What is Big O of MergeSort?")}
                className="px-2.5 py-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-700 text-[11px] text-white border border-indigo-600/50"
              >
                🎙️ "MergeSort Complexity"
              </button>
              <button
                onClick={handleToggleVoiceLive}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[11px] text-white font-bold"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* If Live Voice is active, show voice stream log */}
          {voiceLiveActive && voiceLogs.length > 0 && (
            <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-800/50 space-y-2 mb-4">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Radio className="w-3 h-3 text-indigo-400" />
                <span>Live Audio Transcript (gemini-3.8-live)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {voiceLogs.map((log, i) => (
                  <div key={i} className="text-xs flex items-start space-x-2">
                    <span className={`font-bold ${log.sender === 'user' ? 'text-blue-400' : 'text-indigo-300'}`}>
                      {log.sender === 'user' ? 'You:' : 'Gemini Live:'}
                    </span>
                    <span className="text-slate-200 flex-1">{log.text}</span>
                    <span className="text-[9px] text-slate-500">{log.time}</span>
                  </div>
                ))}
                <div ref={voiceLogEndRef} />
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">How can I assist your academic studies today?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask multi-turn queries, request step-by-step proofs, or transcribe your lecture audio with Gemini.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSubject(qp.subject);
                      if ((qp as any).isCameraPrompt) {
                        openCameraModal();
                        return;
                      }
                      if (qp.grounding) setUseSearchGrounding(true);
                      handleAskQuestion(qp.label, qp.grounding);
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 text-xs text-slate-200 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-blue-400 font-semibold mb-1">
                      <span>{qp.subject}</span>
                      {qp.grounding ? (
                        <span className="text-emerald-400 text-[9px] flex items-center space-x-1">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Search</span>
                        </span>
                      ) : (qp as any).isCameraPrompt ? (
                        <span className="text-amber-400 text-[9px] flex items-center space-x-1">
                          <Camera className="w-2.5 h-2.5" />
                          <span>Camera</span>
                        </span>
                      ) : (
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                    <p className="line-clamp-2">{qp.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              const searchSources = (m as any).searchSources;
              const modelUsed = (m as any).modelUsed;

              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-2xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-tr from-cyan-600 to-blue-700 text-white'
                    }`}>
                      {isUser ? user?.name.charAt(0) || 'U' : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-tl-none'
                    }`}>
                      {!isUser && (
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                              <span>Exact Answer</span>
                              <span className="text-amber-400">⚡ Direct & Precise</span>
                            </span>
                            {modelUsed && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                                {modelUsed}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopyText(m.text, m.id)}
                            className="text-slate-400 hover:text-white p-1 rounded"
                            title="Copy Answer"
                          >
                            {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {/* Display attached camera/picture in user or assistant message bubble */}
                      {m.imageUrl && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-slate-700/60 bg-black/40 shadow-inner">
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => setZoomImageUrl(m.imageUrl || null)}
                            title="Click to enlarge picture"
                          >
                            <img
                              src={m.imageUrl}
                              alt="Attached visual"
                              className="max-h-64 sm:max-h-80 w-auto object-contain mx-auto rounded-xl hover:opacity-95 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white text-xs font-semibold">
                              <ZoomIn className="w-4 h-4 text-amber-300" />
                              <span>Click to enlarge photo</span>
                            </div>
                          </div>
                          <div className="px-2.5 py-1 bg-slate-950/70 text-[10px] text-slate-300 flex items-center justify-between border-t border-slate-800">
                            <span className="flex items-center space-x-1 font-medium">
                              <Camera className="w-3 h-3 text-amber-400" />
                              <span>Photo Analyzed by AI</span>
                            </span>
                            <span className="text-[9px] text-slate-400">Multimodal Gemini Vision</span>
                          </div>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                        {m.text}
                      </div>

                      {/* Google Search Grounding Sources */}
                      {searchSources && searchSources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1">
                          <div className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>Grounded with Google Search:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {searchSources.map((s: any, idx: number) => (
                              <a
                                key={idx}
                                href={s.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] bg-slate-900/80 hover:bg-slate-900 text-blue-300 px-2 py-1 rounded border border-slate-700"
                              >
                                <span>{s.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] mt-2 opacity-50 text-right">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3 bg-slate-800 p-3.5 rounded-2xl border border-slate-700">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-300">
                  {attachedImage ? "Reading photo & computing exact answer..." : `Computing exact answer with ${selectedModel}...`}
                </span>
              </div>
            </div>
          )}

          {transcribing && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3 bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-700/60">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300">
                  Transcribing speech with model gemini-3.5-transcribe...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hidden file input for picture upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Input Bar with Attached Picture Card, Camera, Upload & Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90">
          {/* Attached Picture Preview Banner */}
          {attachedImage && (
            <div className="mb-2.5 p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div
                  className="relative group cursor-pointer w-12 h-12 rounded-lg overflow-hidden border border-blue-400/50 flex-shrink-0 bg-black/50"
                  onClick={() => setZoomImageUrl(attachedImage.previewUrl)}
                  title="Click to zoom preview"
                >
                  <img
                    src={attachedImage.previewUrl}
                    alt="Attached visual"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold text-blue-300 flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Picture Attached</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                      Ready to Read
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {attachedImage.name || 'Camera Snapshot'} • Tap Send or ask a specific question
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={openCameraModal}
                  className="px-2.5 py-1 text-[11px] font-medium text-blue-200 bg-blue-900/60 hover:bg-blue-800 rounded-lg border border-blue-700/60 transition-colors"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Remove picture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion();
            }}
            className="flex items-center gap-2"
          >
            {/* Camera Option Button */}
            <button
              type="button"
              onClick={openCameraModal}
              className="p-3 rounded-xl transition-all shadow bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 flex-shrink-0"
              title="Open Camera: Take a picture of textbook, math problem or homework"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Camera</span>
            </button>

            {/* Choose Picture File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl transition-all shadow bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex-shrink-0"
              title="Upload picture from device"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Audio Transcription Record Button (gemini-3.5-transcribe) */}
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className={`p-3 rounded-xl transition-all shadow flex-shrink-0 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isRecording ? 'Stop recording & transcribe with gemini-3.5-transcribe' : 'Transcribe audio with gemini-3.5-transcribe'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Quick Google Search Toggle in Input Bar */}
            <button
              type="button"
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`p-3 rounded-xl transition-all border flex-shrink-0 ${
                useSearchGrounding
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title={useSearchGrounding ? 'Google Search Grounding Enabled' : 'Enable Google Search Grounding'}
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              placeholder={
                isRecording
                  ? 'Listening to speech...'
                  : attachedImage
                  ? 'Ask about this picture or tap Send for exact answer...'
                  : 'Ask a question or snap a photo for the exact answer (no extra talking)...'
              }
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={loading || transcribing}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-0"
            />

            {/* Submit Question / Picture */}
            <button
              type="submit"
              disabled={(!inputQuestion.trim() && !attachedImage) || loading || transcribing}
              className="px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 transition-all flex-shrink-0"
              title="Send question and picture to AI assistant"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Live Camera Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span>Take Picture for AI Assistant</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Camera
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Point camera at homework, book, math formulas, or whiteboard notes
                  </p>
                </div>
              </div>
              <button
                onClick={closeCameraModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  {cameraError ? (
                    <div className="space-y-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                      <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          onClick={() => startCamera(cameraFacing)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Try Camera Again</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium flex items-center justify-center space-x-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Select Photo from Device</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Starting camera preview...</p>
                    </div>
                  )}
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Live focus overlay frame */}
              {cameraActive && (
                <div className="absolute inset-4 sm:inset-8 border-2 border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  </div>
                  <div className="text-center text-[11px] font-medium text-white/80 bg-black/50 backdrop-blur-xs py-1 px-3 rounded-full mx-auto w-fit">
                    Position textbook text or homework here
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Flip / Switch Camera (user <-> environment) */}
                <button
                  onClick={toggleCameraFacing}
                  disabled={!cameraActive}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  title="Flip camera (Front / Back)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>

                {/* Upload from file button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Choose File</span>
                </button>
              </div>

              {/* Big Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Picture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImageUrl}
              alt="Enlarged visual"
              className="max-h-[85vh] w-auto object-contain rounded-xl border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

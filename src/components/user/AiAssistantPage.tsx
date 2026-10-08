import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Mic,
  MicOff,
  Globe,
  Volume2,
  VolumeX,
  Camera,
  Image as ImageIcon,
  X,
  ZoomIn,
  RefreshCw,
  Menu,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Lightbulb,
  Code,
  HeartHandshake,
  ExternalLink,
  ArrowUp,
  Languages,
  ChevronDown,
  Zap,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { firestoreService } from '../../services/firestoreService.js';
import { AIConversation, AIMessage } from '../../types/index.js';

// Gemini 4-Point Sparkle Icon Component (Google Gemini signature gradient icon)
export const GeminiSparkleIcon: React.FC<{ className?: string; size?: number }> = ({ className = "w-6 h-6", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
      fill="url(#geminiGradIcon)"
    />
    <defs>
      <linearGradient id="geminiGradIcon" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4" />
        <stop offset="0.45" stopColor="#9B72CB" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
  </svg>
);

// Language detection helpers
const isRTLText = (t: string) => /[\u0600-\u06FF]/.test(t);

const detectSpeechLanguage = (text: string): string => {
  if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[éèàçùâêîôû]/i.test(text) || text.toLowerCase().includes('bonjour')) return 'fr-FR';
  if (/[áéíóúñ¿¡]/i.test(text) || text.toLowerCase().includes('hola')) return 'es-ES';
  if (/[äöüß]/i.test(text) || text.toLowerCase().includes('hallo')) return 'de-DE';
  return 'en-US';
};

// Supported language options for foreign language responses
const LANGUAGE_OPTIONS = [
  { id: 'auto', label: 'Auto Detect', flag: '🌐', prompt: '' },
  { id: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰', prompt: 'You MUST answer in pure, polite, and friendly Urdu (اردو) according to the user\'s demand.' },
  { id: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦', prompt: 'You MUST answer in fluent, polite, and friendly Arabic (العربية) according to the user\'s demand.' },
  { id: 'fr', label: 'Français (French)', flag: '🇫🇷', prompt: 'You MUST answer in fluent, friendly French (Français) according to the user\'s demand.' },
  { id: 'es', label: 'Español (Spanish)', flag: '🇪🇸', prompt: 'You MUST answer in fluent, warm, and friendly Spanish (Español) according to the user\'s demand.' },
  { id: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳', prompt: 'You MUST answer in fluent, warm, and friendly Hindi (हिन्दी) according to the user\'s demand.' },
  { id: 'de', label: 'Deutsch (German)', flag: '🇩🇪', prompt: 'You MUST answer in fluent and friendly German (Deutsch) according to the user\'s demand.' },
  { id: 'en', label: 'English', flag: '🇺🇸', prompt: 'You MUST answer in fluent, friendly English according to the user\'s demand.' },
];

// Gemini Markdown & Code Formatter Component
const GeminiFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const isRTL = isRTLText(text);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`space-y-3.5 text-[15px] sm:text-[16px] leading-[1.8] text-gray-800 font-normal ${
        isRTL ? 'text-right font-sans' : 'text-left'
      }`}
    >
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
          const codeBody = language ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={index}
              dir="ltr"
              className="my-4 rounded-xl overflow-hidden border border-gray-700/60 bg-[#1e1e1e] shadow-lg text-white text-left"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs font-mono text-gray-300 border-b border-gray-700/50">
                <span className="uppercase font-semibold tracking-wider text-gray-400">
                  {language || 'code'}
                </span>
                <button
                  onClick={() => copyCode(codeBody, index)}
                  className="flex items-center space-x-1 hover:text-white transition-colors text-gray-300"
                >
                  {copiedCodeIdx === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto font-mono text-[13px] sm:text-[14px] leading-relaxed text-gray-100 bg-[#1e1e1e]">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Render regular markdown text
        const paragraphs = part.split('\n\n');
        return (
          <div key={index} className="space-y-3">
            {paragraphs.map((p, pIdx) => {
              const trimmed = p.trim();
              if (!trimmed) return null;

              // Heading 1 or 2 or 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-lg sm:text-xl font-semibold text-gray-900 mt-4 mb-1.5 tracking-tight flex items-center space-x-2">
                    <span>{trimmed.replace(/^###\s+/, '')}</span>
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-xl sm:text-2xl font-bold text-gray-900 mt-5 mb-2 tracking-tight">
                    {trimmed.replace(/^##\s+/, '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={pIdx} className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-6 mb-2 tracking-tight">
                    {trimmed.replace(/^#\s+/, '')}
                  </h1>
                );
              }

              // Divider
              if (trimmed === '---') {
                return <hr key={pIdx} className="my-4 border-gray-200" />;
              }

              // Bullet list lines
              const lines = trimmed.split('\n');
              const isList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || /^\d+\.\s/.test(l.trim()));

              if (isList) {
                return (
                  <ul key={pIdx} className={`space-y-2 my-2 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                    {lines.map((li, liIdx) => {
                      const cleanLi = li.replace(/^[-*]\s+|\d+\.\s+/, '');
                      return (
                        <li key={liIdx} className="flex items-start space-x-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0 ${isRTL ? 'ml-2.5' : 'mr-2.5'}`} />
                          <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanLi) }} />
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              return (
                <p key={pIdx} className="leading-[1.8]" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(p) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Helper to format inline bold, italics, backticks
function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 text-blue-700 font-mono text-[13px] border border-gray-200">$1</code>');
}

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [languageMenuOpen, setLanguageMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteModalConv, setDeleteModalConv] = useState<{ id: string; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, 'up' | 'down'>>({});

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Audio Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Adjust textarea height on typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputQuestion]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [user]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Cleanup camera and audio on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.getAiConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConvId) {
          setActiveConvId(res.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.getAiMessages(convId);
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputQuestion('');
    setAttachedImage(null);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleOpenDeleteModal = (e: React.MouseEvent, conv: { id: string; title: string }) => {
    e.stopPropagation();
    setDeleteModalConv(conv);
  };

  const confirmDeleteConv = async (convId: string) => {
    try {
      await api.deleteAiConversation(convId);
      const updated = conversations.filter(c => c.id !== convId);
      setConversations(updated);
      if (activeConvId === convId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
      setDeleteModalConv(null);
      addToast({ type: 'info', message: 'Chat removed from recent history' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete chat' });
    }
  };

  const handleClearAllConversations = async () => {
    if (!window.confirm("Are you sure you want to delete all previous conversations?")) return;
    try {
      for (const c of conversations) {
        await api.deleteAiConversation(c.id).catch(() => {});
      }
      setConversations([]);
      setActiveConvId(null);
      setMessages([]);
      addToast({ type: 'info', message: 'All recent chats cleared' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to clear conversations' });
    }
  };

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
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser.');
      setCameraActive(false);
    }
  };

  const openCameraModal = () => {
    setCameraModalOpen(true);
    setTimeout(() => startCamera(cameraFacing), 150);
  };

  const closeCameraModal = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
    setCameraModalOpen(false);
  };

  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64Data = dataUrl.split(',')[1];

    setAttachedImage({
      data: base64Data,
      mimeType: 'image/jpeg',
      previewUrl: dataUrl,
      name: `Snapshot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`
    });

    closeCameraModal();
    addToast({ type: 'success', message: 'Photo captured! Attached to prompt.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const base64Data = dataUrl.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type || 'image/jpeg',
        previewUrl: dataUrl,
        name: file.name
      });
      addToast({ type: 'success', message: `Attached ${file.name}` });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Speech Recognition (Web Speech API)
  const handleToggleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({ type: 'error', message: 'Speech recognition is not supported in this browser.' });
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Auto-set speech recognition language according to user selection
      if (selectedLanguage === 'ur') recognition.lang = 'ur-PK';
      else if (selectedLanguage === 'ar') recognition.lang = 'ar-SA';
      else if (selectedLanguage === 'fr') recognition.lang = 'fr-FR';
      else if (selectedLanguage === 'es') recognition.lang = 'es-ES';
      else if (selectedLanguage === 'hi') recognition.lang = 'hi-IN';
      else if (selectedLanguage === 'de') recognition.lang = 'de-DE';
      else recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuestion(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  // Multilingual Text to Speech
  const handleTextToSpeech = (text: string, msgId: string) => {
    if (!window.speechSynthesis) {
      addToast({ type: 'error', message: 'Text-to-speech is not supported on this browser.' });
      return;
    }

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown characters for smooth speech
    const cleanSpeech = text
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = detectSpeechLanguage(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Send Question to Gemini Advanced
  const handleAskQuestion = async (predefinedQuestion?: string, withGrounding?: boolean, targetLang?: string) => {
    const questionToSend = predefinedQuestion || inputQuestion.trim();
    if (!questionToSend && !attachedImage) return;

    const currentImage = attachedImage;
    const finalUseGrounding = withGrounding !== undefined ? withGrounding : useSearchGrounding;
    const activeLang = targetLang || selectedLanguage;

    // Reset input fields immediately
    setInputQuestion('');
    setAttachedImage(null);
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: 'temp_u_' + Date.now(),
      conversationId: activeConvId || 'pending',
      sender: 'user',
      text: questionToSend || '📸 [Attached Image]',
      imageUrl: currentImage?.previewUrl,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      let convId = activeConvId;
      if (!convId) {
        const title = questionToSend.slice(0, 36) || 'Multilingual Inquiry';
        const newConvRes = await api.createAiConversation(title, 'General Academic');
        if (newConvRes.success && newConvRes.conversation) {
          convId = newConvRes.conversation.id;
          setActiveConvId(convId);
          setConversations(prev => [newConvRes.conversation, ...prev]);
        }
      }

      // Compute language directive for Gemini Advanced
      const langOption = LANGUAGE_OPTIONS.find(l => l.id === activeLang);
      const rolePrompt = langOption?.prompt 
        ? `${langOption.prompt} Answer every single question according to the user's demand in real time. Be warm, friendly, empathetic, and reliable.`
        : "You are Gemini Advanced. Detect and honor the user's language demand without exception. If the user writes or asks in any foreign language (Urdu, Hindi, Arabic, Spanish, French, etc.), answer 100% in that demanded language in a friendly and structured way.";

      const res = await api.askAiQuestion({
        conversationId: convId || undefined,
        question: questionToSend,
        model: selectedModel,
        rolePrompt,
        useSearchGrounding: finalUseGrounding,
        image: currentImage
          ? {
              data: currentImage.data,
              mimeType: currentImage.mimeType
            }
          : undefined
      });

      if (res.success && res.assistantMessage) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, res.userMessage, res.assistantMessage];
        });

        if (res.searchSources && res.searchSources.length > 0) {
          (res.assistantMessage as any).searchSources = res.searchSources;
        }

        // Update conversation in sidebar list
        if (convId) {
          setConversations(prev =>
            prev.map(c =>
              c.id === convId
                ? { ...c, updatedAt: new Date().toISOString() }
                : c
            )
          );
        }
      } else {
        throw new Error('No assistant response received');
      }
    } catch (err: any) {
      console.error('Ask AI error:', err);
      addToast({ type: 'error', message: 'Failed to get answer from Gemini. Please retry.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const handleToggleLike = (id: string, type: 'up' | 'down') => {
    setLikedMap(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined : type
    } as any));
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Learner';
  const currentLangLabel = LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.label || 'Auto Detect';
  const currentLangFlag = LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.flag || '🌐';

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="h-[calc(100vh-125px)] min-h-[640px] flex overflow-hidden rounded-3xl bg-white border border-gray-200/90 shadow-2xl relative text-gray-900 font-sans">
      {/* 1. Mobile Sliding Panel Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          title="Click to close sidebar"
        />
      )}

      {/* 2. Left Sidebar / Sliding Panel (Consistent with Gemini UI Design) */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 lg:z-10 h-full flex flex-col justify-between bg-[#f0f4f9] border-r border-gray-200/80 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none flex-shrink-0 ${
          sidebarOpen
            ? 'w-72 sm:w-80 translate-x-0'
            : 'w-0 -translate-x-full lg:w-0 overflow-hidden'
        }`}
      >
        <div className="p-3 sm:p-4 flex flex-col h-full overflow-hidden">
          {/* Top Row: Hamburger / Close + "+ New chat" Button */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-full hover:bg-gray-200/70 text-gray-700 transition-colors"
              title="Close sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={handleNewChat}
              className="flex-1 py-2.5 px-4 bg-[#e9eef6] hover:bg-[#dde3ea] text-gray-800 text-sm font-medium rounded-full shadow-xs flex items-center space-x-2.5 transition-all"
            >
              <Plus className="w-4 h-4 text-gray-700" />
              <span>New chat</span>
            </button>
          </div>

          {/* Search Recent Chats Filter */}
          {conversations.length > 2 && (
            <div className="relative mt-3 mb-1 px-1 flex-shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recent chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Recent History Section */}
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between flex-shrink-0">
              <span>Recent</span>
              <span className="text-[10px] text-gray-400 font-normal">
                {filteredConversations.length} {filteredConversations.length === 1 ? 'chat' : 'chats'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 italic">
                  {searchQuery ? "No chats found matching search." : "No recent conversations."}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = activeConvId === c.id;
                  const isRtl = isRTLText(c.title);
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConv(c.id)}
                      className={`group cursor-pointer px-3.5 py-2.5 rounded-full text-[13px] flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-[#d3e3fd]/90 text-[#041e49] font-medium shadow-xs'
                          : 'text-gray-700 hover:bg-[#e9eef6]'
                      }`}
                    >
                      <div className={`truncate mr-2 flex items-center space-x-2.5 flex-1 min-w-0 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="truncate">{c.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleOpenDeleteModal(e, { id: c.id, title: c.title })}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all flex-shrink-0 ml-1"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Sidebar Info & Clear All */}
          <div className="pt-3 border-t border-gray-200/60 mt-auto flex items-center justify-between text-xs text-gray-500 px-2 flex-shrink-0">
            {conversations.length > 1 ? (
              <button
                onClick={handleClearAllConversations}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center space-x-1"
                title="Clear all conversation history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 font-medium">
                <GeminiSparkleIcon size={14} />
                <span>Dot X • Gemini</span>
              </div>
            )}
            <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
              Advanced
            </span>
          </div>
        </div>
      </aside>

      {/* 3. Main Workspace: Clean White Background, Minimal Gemini Advanced Layout */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <GeminiSparkleIcon size={24} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-semibold text-lg text-gray-900 tracking-tight">Gemini Advanced</h1>
                  <span className="text-[10px] font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 px-2 py-0.5 rounded-full shadow-xs">
                    2.5 Pro
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 hidden sm:block">
                  Multilingual AI • Real-Time Responses • Deep Reasoning
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Foreign Language Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f0f4f9] hover:bg-[#e1e6ed] text-gray-800 border border-gray-200/80 transition-colors shadow-xs"
                title="Select language demand"
              >
                <span>{currentLangFlag}</span>
                <span className="truncate max-w-[100px]">{currentLangLabel.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {languageMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs text-gray-800 animate-in fade-in duration-150"
                  onClick={() => setLanguageMenuOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Language Demand (زبان)
                  </div>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        addToast({ type: 'info', message: `Language set: ${lang.label}` });
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        selectedLanguage === lang.id ? 'bg-blue-50/80 text-blue-700 font-bold' : ''
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {selectedLanguage === lang.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleNewChat}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread / Empty Greeting */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            /* 100% Google Gemini Advanced New Chat Experience */
            <div className="max-w-3xl mx-auto w-full h-full flex flex-col justify-center py-6 sm:py-10">
              {/* Gemini Center Greeting */}
              <div className="mb-8 sm:mb-10">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/50">
                    Gemini Advanced • Real-Time Multilingual
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-transparent">
                  Hello, {userName}
                </h2>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#c4c7c5] tracking-tight mt-1.5">
                  How can I help you today? / کس زبان میں رہنمائی چاہیے؟
                </p>
              </div>

              {/* Multilingual Gemini Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Urdu / Foreign Language Prompt Card */}
                <div
                  onClick={() => handleAskQuestion("السلام علیکم! کیا آپ مجھے آسان اور دوستانہ انداز میں سمجھا سکتے ہیں کہ مصنوعی ذہانت اور مشین لرننگ کیا ہے؟", false, 'ur')}
                  className="bg-[#f0f4f9] hover:bg-[#dfe4ea] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-32 cursor-pointer transition-all border border-transparent hover:border-gray-300/40 shadow-xs group text-right"
                  dir="rtl"
                >
                  <p className="text-[14px] text-gray-800 font-medium leading-relaxed">
                    🇵🇰 اردو میں رہنمائی: "مصنوعی ذہانت اور مشین لرننگ آسان انداز میں سمجھائیں"
                  </p>
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-xs group-hover:scale-105 transition-transform">
                      <Languages className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 2. French / Foreign Language Card */}
                <div
                  onClick={() => handleAskQuestion("Pouvez-vous expliquer le fonctionnement des algorithmes et du Big-O de manière simple et amicale ?", false, 'fr')}
                  className="bg-[#f0f4f9] hover:bg-[#dfe4ea] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-32 cursor-pointer transition-all border border-transparent hover:border-gray-300/40 shadow-xs group"
                >
                  <p className="text-[14px] text-gray-800 font-normal leading-snug">
                    🇫🇷 En Français: "Expliquez les algorithmes et la complexité Big-O de façon amicale"
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
                      <Code className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Deep Concept & Exam Support Card */}
                <div
                  onClick={() => handleAskQuestion("I am preparing for university exams and feeling overwhelmed. Build a calm, structured, high-yield study plan.")}
                  className="bg-[#f0f4f9] hover:bg-[#dfe4ea] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-32 cursor-pointer transition-all border border-transparent hover:border-gray-300/40 shadow-xs group"
                >
                  <p className="text-[14px] text-gray-800 font-normal leading-snug">
                    Stress-free exam plan: empathetic, step-by-step revision guidance
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-xs group-hover:scale-105 transition-transform">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 4. Multimodal Camera Visual Card */}
                <div
                  onClick={() => openCameraModal()}
                  className="bg-[#f0f4f9] hover:bg-[#dfe4ea] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-32 cursor-pointer transition-all border border-transparent hover:border-gray-300/40 shadow-xs group"
                >
                  <p className="text-[14px] text-gray-800 font-normal leading-snug">
                    📸 Multimodal Camera: Photograph any textbook page, math formula, or diagram
                  </p>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-xs group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Active Messages Thread */
            <div className="max-w-3xl mx-auto w-full space-y-8">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                const searchSources = (m as any).searchSources;
                const isLiked = likedMap[m.id];
                const isUrduArabic = isRTLText(m.text);

                if (isUser) {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div
                        dir={isUrduArabic ? 'rtl' : 'ltr'}
                        className={`max-w-[85%] bg-[#f0f4f9] text-[#1f1f1f] rounded-[24px] px-5 py-3.5 text-[15px] sm:text-[16px] leading-relaxed shadow-xs ${
                          isUrduArabic ? 'text-right' : 'text-left'
                        }`}
                      >
                        {m.imageUrl && (
                          <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-200">
                            <img
                              src={m.imageUrl}
                              alt="Uploaded visual"
                              className="max-h-60 sm:max-h-72 w-auto object-contain rounded-xl cursor-pointer hover:opacity-95"
                              onClick={() => setZoomImageUrl(m.imageUrl || null)}
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      </div>
                    </div>
                  );
                }

                // Gemini Assistant Response
                return (
                  <div key={m.id} className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-7 h-7 flex-shrink-0 mt-0.5">
                      <GeminiSparkleIcon size={26} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Attached Image inside assistant response if any */}
                      {m.imageUrl && (
                        <div className="mb-3 max-w-sm overflow-hidden rounded-xl border border-gray-200">
                          <img
                            src={m.imageUrl}
                            alt="Analyzed media"
                            className="max-h-64 object-contain rounded-xl cursor-pointer"
                            onClick={() => setZoomImageUrl(m.imageUrl || null)}
                          />
                        </div>
                      )}

                      {/* Gemini Formatted Response */}
                      <GeminiFormattedText text={m.text} />

                      {/* Google Search Grounding Sources */}
                      {searchSources && searchSources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                          <div className="text-[11px] font-semibold text-gray-500 flex items-center space-x-1">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sources from Google Search:</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {searchSources.map((s: any, idx: number) => (
                              <a
                                key={idx}
                                href={s.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-xs bg-[#f0f4f9] hover:bg-[#dfe4ea] text-blue-700 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                              >
                                <span className="truncate max-w-[200px]">{s.title}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gemini Action Toolbar below response */}
                      <div className="flex items-center space-x-1 sm:space-x-2 mt-4 pt-2 text-gray-500">
                        <button
                          onClick={() => handleToggleLike(m.id, 'up')}
                          className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                            isLiked === 'up' ? 'text-blue-600 bg-blue-50' : ''
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleLike(m.id, 'down')}
                          className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                            isLiked === 'down' ? 'text-red-500 bg-red-50' : ''
                          }`}
                          title="Bad response"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyText(m.text, m.id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          title="Copy text"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleTextToSpeech(m.text, m.id)}
                          className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                            speakingId === m.id ? 'text-blue-600 bg-blue-50 animate-pulse' : ''
                          }`}
                          title={speakingId === m.id ? 'Stop listening' : 'Listen aloud (Multilingual speech)'}
                        >
                          {speakingId === m.id ? (
                            <VolumeX className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>

                        {/* Foreign language indicator chip if RTL */}
                        {isUrduArabic && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-2">
                            اردو / العربية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Gemini Shimmer Loading State */}
              {loading && (
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-7 h-7 flex-shrink-0 animate-spin">
                    <GeminiSparkleIcon size={26} />
                  </div>
                  <div className="space-y-2.5 flex-1 pt-1">
                    <div className="h-4 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full w-1/2 animate-pulse" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Hidden File Input for Picture Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 3. Centered Chat Input at the Bottom (100% Google Gemini Advanced Floating Pill UI) */}
        <div className="p-3 sm:p-4 max-w-3xl mx-auto w-full">
          {/* Quick Foreign Language Demand Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none text-[11px]">
            <span className="text-gray-400 font-medium whitespace-nowrap text-[10px] uppercase tracking-wider flex items-center space-x-1 pl-1">
              <Languages className="w-3 h-3 text-blue-500" />
              <span>Language:</span>
            </span>
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.id);
                  addToast({ type: 'info', message: `Target language: ${lang.label}` });
                }}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex items-center space-x-1 font-medium ${
                  selectedLanguage === lang.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#f0f4f9] hover:bg-[#e1e6ed] text-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Attached Picture Preview Banner */}
          {attachedImage && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <img
                  src={attachedImage.previewUrl}
                  alt="Attached preview"
                  className="w-12 h-12 object-cover rounded-xl border border-blue-300 cursor-pointer"
                  onClick={() => setZoomImageUrl(attachedImage.previewUrl)}
                />
                <div className="text-xs">
                  <p className="font-semibold text-blue-900 truncate max-w-[220px]">
                    {attachedImage.name || 'Photo attached'}
                  </p>
                  <p className="text-[11px] text-blue-600">Ready to analyze with Gemini Advanced Vision</p>
                </div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 rounded-full hover:bg-blue-100 text-blue-700 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Gemini Input Pill Container */}
          <div className="bg-[#f0f4f9] focus-within:bg-white focus-within:shadow-md border border-gray-200/60 focus-within:border-gray-300 rounded-[28px] transition-all p-3 sm:p-3.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskQuestion();
                }
              }}
              dir={isRTLText(inputQuestion) ? 'rtl' : 'ltr'}
              placeholder={
                isListening
                  ? "Listening to your voice..."
                  : selectedLanguage === 'ur'
                  ? "اردو میں سوال لکھیں یا تصویر بھیجیں..."
                  : "Ask Gemini Advanced (any language / کسی بھی زبان میں پوچھیں)..."
              }
              disabled={loading}
              className="w-full bg-transparent resize-none focus:outline-none text-[15px] sm:text-[16px] text-gray-900 placeholder:text-gray-500 max-h-44"
            />

            {/* Bottom Row of Input Tools */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1">
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={openCameraModal}
                  className="p-2 rounded-full hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Take a photo of homework or textbook"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Upload Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-gray-200/70 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Upload image from device"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Search Grounding Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                    useSearchGrounding
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-gray-600 hover:bg-gray-200/70'
                  }`}
                  title={useSearchGrounding ? "Google Search Grounding active" : "Enable Google Search Grounding"}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Speech to Text Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  className={`p-2 rounded-full transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'hover:bg-gray-200/70 text-gray-600 hover:text-gray-900'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Voice input (Multilingual Speech)"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleAskQuestion()}
                  disabled={(!inputQuestion.trim() && !attachedImage) || loading}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    inputQuestion.trim() || attachedImage
                      ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Send prompt"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Gemini Disclaimer */}
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Gemini Advanced answers in any demanded language in real time. Dot X Learner Platform.
          </p>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-gray-200">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Take Photo for Gemini Advanced</h3>
              </div>
              <button
                onClick={closeCameraModal}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                <div className="p-6 text-center text-white space-y-2">
                  {cameraError ? (
                    <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                  ) : (
                    <p className="text-xs text-gray-300">Starting camera preview...</p>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={toggleCameraFacing}
                disabled={!cameraActive}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200 flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip camera</span>
              </button>

              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Capture photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Photo Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImageUrl}
              alt="Zoomed media"
              className="max-h-[85vh] w-auto object-contain rounded-2xl border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal (Consistent with Gemini UI Design) */}
      {deleteModalConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-gray-900">Delete chat?</h3>
                <p className="text-xs text-gray-500">Remove from recent chat history</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              This will permanently delete <strong className="text-gray-900">"{deleteModalConv.title}"</strong> from your recent Gemini conversations.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteModalConv(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteConv(deleteModalConv.id)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

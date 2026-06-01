"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Bot,
  Loader2,
  Pause,
  Play,
  Trash2,
  Volume2,
  Settings,
  VolumeX,
} from "lucide-react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
  type: "text" | "audio";
  audioUrl?: string;
  timestamp: Date;
}

export default function AiChatPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "shimmer",
    model: "tts-1-hd",
    speed: 1.0,
  });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Обновляем стиль контейнера напрямую через DOM — без re-render React
  useEffect(() => {
    const vv = window.visualViewport;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      if (vv) {
        el.style.top = `${Math.round(vv.offsetTop)}px`;
        el.style.height = `${Math.round(vv.height)}px`;
      }
      scrollToBottom(false);
    };

    update();

    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    window.addEventListener("resize", update);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  // Загружаем переводы
  useEffect(() => {
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "ai-chat").then((translations) => {
      setT(translations);
      // Добавляем приветственное сообщение после загрузки переводов
      if (messages.length === 0 && translations) {
        setMessages([
          {
            role: "assistant",
            content: translations.messages.welcome,
            type: "text",
            timestamp: new Date(),
          },
        ]);
      }
    });
  }, [locale]);

  // Получаем геолокацию пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }

    // Проверяем поддерживаемые аудио форматы
    console.log("=== Supported Audio Formats ===");
    const formats = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/webm;codecs=vp8',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mp4;codecs=mp4a',
      'audio/mpeg',
      'audio/wav'
    ];
    
    formats.forEach(format => {
      const supported = MediaRecorder.isTypeSupported(format);
      console.log(`${format}: ${supported ? '✅' : '❌'}`);
    });
    console.log("===============================");

    // Загружаем настройки голоса
    const savedVoice = localStorage.getItem("ai-voice") || "shimmer";
    const savedModel = localStorage.getItem("ai-model") || "tts-1-hd";
    const savedSpeed = parseFloat(localStorage.getItem("ai-speed") || "1.0");

    setVoiceSettings({
      voice: savedVoice,
      model: savedModel,
      speed: savedSpeed,
    });
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const stopAiVoice = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingMessageIndex(null);
      setIsAiSpeaking(false);
    }
  };

  const startRecording = async () => {
    // Останавливаем голосовой ответ AI, если он играет
    stopAiVoice();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Пробуем использовать форматы в порядке предпочтения для OpenAI
      let mimeType = 'audio/webm'; // default fallback
      
      // Предпочитаем форматы, которые OpenAI точно поддерживает
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      console.log('Using MIME type:', mimeType);
      setAudioMimeType(mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Total chunks collected:', audioChunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        console.log('Recording stopped after', recordingDuration, 'ms');
        console.log('Total chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks collected!');
          alert('Не удалось записать аудио. Попробуйте еще раз.');
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
          return;
        }
        
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
        
        if (blob.size === 0) {
          console.error('Blob is empty despite having chunks!');
          alert('Аудиозапись пуста. Попробуйте еще раз.');
        }
        
        setAudioBlob(blob);
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        alert('Ошибка записи: ' + event.error);
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started, state:', mediaRecorder.state);
      };

      // Запускаем запись с timeslice для регулярного сбора данных
      mediaRecorder.start(1000); // Собираем данные каждую секунду
      setIsRecording(true);
      console.log('Recording started, state:', mediaRecorder.state);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Не удалось получить доступ к микрофону: " + error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      console.log('Attempting to stop recording after', recordingDuration, 'ms');
      console.log('Current state:', mediaRecorderRef.current.state);
      
      if (recordingDuration < 500) {
        alert('Запись слишком короткая. Говорите минимум 0.5 секунды.');
        cancelRecording();
        return;
      }
      
      // Запрашиваем данные перед остановкой
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const togglePreviewPlayback = () => {
    if (!audioBlob) return;

    if (!audioPreviewRef.current) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioPreviewRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || loading) return;

    // Проверяем размер blob
    if (audioBlob.size === 0) {
      console.error("Audio blob is empty");
      alert("Аудиозапись пуста. Попробуйте записать снова.");
      setAudioBlob(null);
      return;
    }

    console.log('Sending audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
    setLoading(true);

    try {
      // Определяем расширение файла на основе MIME типа
      const getFileExtension = (mimeType: string): string => {
        // Убираем codecs из MIME типа для определения расширения
        const baseType = mimeType.split(';')[0].trim();
        
        if (baseType.includes('mp4') || baseType.includes('m4a')) return 'mp4';
        if (baseType.includes('mpeg') || baseType.includes('mp3')) return 'mp3';
        if (baseType.includes('ogg') || baseType.includes('oga')) return 'ogg';
        if (baseType.includes('wav')) return 'wav';
        if (baseType.includes('webm')) return 'webm';
        if (baseType.includes('flac')) return 'flac';
        
        return 'webm'; // default
      };

      const extension = getFileExtension(audioMimeType);
      const fileName = `audio.${extension}`;
      
      console.log('Sending file:', fileName, 'with MIME type:', audioMimeType);

      // Отправляем аудио на сервер для транскрипции
      const formData = new FormData();
      formData.append("audio", audioBlob, fileName);

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        let errorMessage = "Ошибка распознавания аудио";
        try {
          const errorData = await transcribeRes.json();
          console.error("Transcription error:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const { text } = await transcribeRes.json();

      // Add user audio message
      const userMessage: Message = {
        role: "user",
        content: text,
        type: "audio",
        audioUrl: URL.createObjectURL(audioBlob),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setAudioBlob(null);

      // Get AI response
      await getAiResponse(updatedMessages);
    } catch (error: any) {
      console.error("Error sending audio:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Ошибка обработки аудио: ${error.message}`,
          type: "text",
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
    }
  };

  const sendTextMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      type: "text",
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    await getAiResponse(updatedMessages);
  };

  const playAiVoice = async (text: string, messageIndex?: number) => {
    try {
      // Останавливаем предыдущее аудио, если играет
      stopAiVoice();

      if (messageIndex !== undefined) {
        setPlayingMessageIndex(messageIndex);
      }

      setIsAiSpeaking(true);

      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: voiceSettings.voice,
          model: voiceSettings.model,
          speed: voiceSettings.speed,
        }),
      });

      if (!res.ok) {
        console.error("TTS error:", await res.text());
        setPlayingMessageIndex(null);
        setIsAiSpeaking(false);
        return;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setPlayingMessageIndex(null);
        setIsAiSpeaking(false);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.error("Audio play error:", err);
        setPlayingMessageIndex(null);
        setIsAiSpeaking(false);
      });
    } catch (error) {
      console.error("TTS error:", error);
      setPlayingMessageIndex(null);
      setIsAiSpeaking(false);
    }
  };

  const getAiResponse = async (updatedMessages: Message[]) => {
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userLocation: userLocation,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        console.error("API returned non-JSON:", text.slice(0, 200));
        throw new Error("Нет связи с сервером. Попробуйте снова.");
      }

      if (!res.ok) {
        console.error("API Error:", data);
        throw new Error(data.details || data.error || "Ошибка сервера");
      }

      const aiReply = data.reply ?? "Произошла ошибка. Попробуйте снова.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiReply,
          type: "text",
          timestamp: new Date(),
        },
      ]);

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = `Ошибка: ${error.message || "Проверьте интернет и попробуйте снова."}`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
          type: "text",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 flex flex-col bg-[#0a1f1a] overflow-hidden"
      style={{ top: 0, height: '100dvh' }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 bg-[#0f2d26] px-4 pb-3 flex items-center gap-3"
        style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
        >
          <ArrowLeft size={22} className="text-white" />
        </button>

        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
          <Bot size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base leading-tight truncate">
            {t?.header?.title ?? "ChargeFlow AI"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-emerald-400 text-xs">
              {t?.header?.status ?? "Онлайн"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isAiSpeaking && (
            <button
              onClick={stopAiVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 rounded-full text-red-400 text-xs font-medium"
            >
              <VolumeX size={14} />
              {t?.header?.stop ?? "Стоп"}
            </button>
          )}
          <button
            onClick={() => router.push("/ai-chat/settings")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition text-gray-400"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col justify-end min-h-full px-3 py-3 space-y-1">

        {/* Пустое состояние */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Bot size={40} className="text-emerald-400" />
            </div>
            <div className="text-center px-6">
              <p className="text-white font-semibold text-lg">ChargeFlow AI</p>
              <p className="text-gray-400 text-sm mt-1">
                {t?.header?.status ?? "Задайте любой вопрос о зарядке"}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* AI avatar */}
              {!isUser && (
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
              )}

              <div className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 shadow-sm ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-t-2xl rounded-bl-2xl rounded-br-md"
                      : "bg-[#1a3a30] text-gray-100 rounded-t-2xl rounded-br-2xl rounded-bl-md border border-emerald-900/20"
                  }`}
                >
                  {msg.type === "audio" && msg.audioUrl && (
                    <audio
                      controls
                      src={msg.audioUrl}
                      className="w-full mb-2"
                      style={{ height: "32px", filter: "invert(1) hue-rotate(180deg)" }}
                    />
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {!isUser && (
                    <div className="mt-1.5 flex items-center gap-2 border-t border-emerald-900/20 pt-1.5">
                      <button
                        onClick={() => playAiVoice(msg.content, i)}
                        disabled={playingMessageIndex === i}
                        className="flex items-center gap-1 text-xs text-emerald-400 disabled:opacity-50"
                      >
                        {playingMessageIndex === i ? (
                          <>
                            <Volume2 size={12} className="animate-pulse" />
                            <span>{t?.buttons?.listening ?? "Играет..."}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            <span>{t?.buttons?.listen ?? "Прослушать"}</span>
                          </>
                        )}
                      </button>
                      {playingMessageIndex === i && (
                        <button onClick={stopAiVoice} className="flex items-center gap-1 text-xs text-red-400">
                          <VolumeX size={12} />
                          <span>{t?.buttons?.stop ?? "Стоп"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-0.5 px-1">
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Печатает... */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-[#1a3a30] border border-emerald-900/20 rounded-t-2xl rounded-br-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "160ms" }} />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "320ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="flex-shrink-0 bg-[#0f2d26] px-3 py-2 border-t border-emerald-900/30">
        {/* Audio Preview */}
        {audioBlob && !isRecording && (
          <div className="mb-2 bg-[#0a1f1a] border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <button onClick={togglePreviewPlayback} className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center">
              {isPlayingPreview ? <Pause size={16} className="text-emerald-400" /> : <Play size={16} className="text-emerald-400 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-emerald-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 animate-pulse" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{t?.audio?.duration ?? "Аудио"} {formatTime(recordingTime)}</p>
            </div>
            <button onClick={cancelRecording} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20">
              <Trash2 size={16} className="text-red-400" />
            </button>
            <button onClick={sendAudioMessage} disabled={loading} className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center disabled:opacity-50">
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}

        {/* Recording */}
        {isRecording && (
          <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-medium flex-1 text-sm">
              {t?.input?.recording ?? "Запись..."} {formatTime(recordingTime)}
            </span>
            <button onClick={stopRecording} className="px-3 py-1.5 bg-red-500 rounded-full text-white text-xs font-medium">
              {t?.input?.recordingStop ?? "Стоп"}
            </button>
          </div>
        )}

        {/* Text input row */}
        {!audioBlob && !isRecording && (
          <div className="flex items-center gap-2">
            {/* Input pill */}
            <div className="flex-1 flex items-center bg-[#162b24] border border-emerald-900/40 rounded-full px-4 py-2.5 min-h-[44px]">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t?.input?.placeholder ?? "Сообщение..."}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-[16px] leading-normal outline-none"
                disabled={loading}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck="false"
                onFocus={() => scrollToBottom(false)}
                inputMode="text"
                enterKeyHint="send"
              />
            </div>

            {/* Send / Mic button — outside pill */}
            {input.trim() ? (
              <button
                onClick={sendTextMessage}
                disabled={loading}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-95 transition flex-shrink-0"
              >
                {loading
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <Send size={18} className="text-white" />
                }
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={loading}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-95 transition flex-shrink-0"
              >
                <Mic size={18} className="text-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

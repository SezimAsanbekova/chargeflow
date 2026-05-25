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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Отслеживаем открытие клавиатуры на iOS (visualViewport)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kb);
      if (kb > 50) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Не удалось получить доступ к микрофону");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
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

    setLoading(true);

    try {
      // Отправляем аудио на сервер для транскрипции
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json();
        console.error("Transcription error:", errorData);
        throw new Error(errorData.error || "Ошибка распознавания аудио");
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

      const data = await res.json();
      
      if (!res.ok) {
        console.error("API Error:", data);
        throw new Error(data.error || data.details || "Ошибка API");
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

      // Автоматически озвучиваем ответ AI
      await playAiVoice(aiReply);
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
    <div className="min-h-screen bg-[#0a1f1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#0f2d26] border-b border-emerald-900/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{t?.header?.title ?? "ChargeFlow AI"}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs">{t?.header?.status ?? "Онлайн"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAiSpeaking && (
            <button
              onClick={stopAiVoice}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full transition text-red-400 text-sm font-medium"
            >
              <VolumeX size={16} />
              <span>{t?.header?.stop ?? "Стоп"}</span>
            </button>
          )}
          <button
            onClick={() => router.push("/ai-chat/settings")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-white"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ paddingBottom: `${Math.max(96, keyboardHeight + 80)}px` }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={16} className="text-emerald-400" />
              </div>
            )}
            <div className="flex flex-col max-w-[75%]">
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-md"
                    : "bg-[#0f2d26] text-gray-100 border border-emerald-900/30 rounded-bl-md"
                }`}
              >
                {msg.type === "audio" && msg.audioUrl && (
                  <audio
                    controls
                    src={msg.audioUrl}
                    className="w-full mb-2"
                    style={{
                      height: "32px",
                      filter: "invert(1) hue-rotate(180deg)",
                    }}
                  />
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                
                {/* Кнопка воспроизведения для AI сообщений */}
                {msg.role === "assistant" && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => playAiVoice(msg.content, i)}
                      disabled={playingMessageIndex === i}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
                    >
                      {playingMessageIndex === i ? (
                        <>
                          <Volume2 size={14} className="animate-pulse" />
                          <span>{t?.buttons?.listening ?? "Воспроизведение..."}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>{t?.buttons?.listen ?? "Прослушать"}</span>
                        </>
                      )}
                    </button>
                    {playingMessageIndex === i && (
                      <button
                        onClick={stopAiVoice}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                      >
                        <VolumeX size={14} />
                        <span>{t?.buttons?.stop ?? "Стоп"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span
                className={`text-xs text-gray-500 mt-1 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatMessageTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Bot size={16} className="text-emerald-400" />
            </div>
            <div className="bg-[#0f2d26] border border-emerald-900/30 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span
                  className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="fixed left-0 right-0 bg-[#0f2d26] border-t border-emerald-900/30 px-4 py-3"
        style={{ bottom: `${keyboardHeight}px`, transition: 'bottom 0.05s ease-out' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Audio Preview */}
          {audioBlob && !isRecording && (
            <div className="mb-3 bg-[#0a1f1a] border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
              <button
                onClick={togglePreviewPlayback}
                className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition"
              >
                {isPlayingPreview ? (
                  <Pause size={18} className="text-emerald-400" />
                ) : (
                  <Play size={18} className="text-emerald-400 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <div className="h-1 bg-emerald-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-0 animate-pulse" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t?.audio?.duration ?? "Аудио"} {formatTime(recordingTime)}
                </p>
              </div>
              <button
                onClick={cancelRecording}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-500/20 transition"
              >
                <Trash2 size={18} className="text-red-400" />
              </button>
              <button
                onClick={sendAudioMessage}
                disabled={loading}
                className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-400 transition disabled:opacity-50"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium flex-1">
                {t?.input?.recording ?? "Запись..."} {formatTime(recordingTime)}
              </span>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full text-white text-sm font-medium transition"
              >
                {t?.input?.recordingStop ?? "Стоп"}
              </button>
            </div>
          )}

          {/* Input Bar */}
          {!audioBlob && !isRecording && (
            <div className="flex items-center gap-2 bg-[#0a1f1a] border border-emerald-900/40 rounded-full px-4 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t?.input?.placeholder ?? "Сообщение..."}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
                disabled={loading}
              />

              {input.trim() ? (
                <button
                  onClick={sendTextMessage}
                  disabled={loading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 disabled:bg-emerald-500/30 disabled:cursor-not-allowed hover:bg-emerald-400 transition flex-shrink-0"
                >
                  {loading ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Send size={18} className="text-white" />
                  )}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 transition flex-shrink-0"
                >
                  <Mic size={20} className="text-emerald-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

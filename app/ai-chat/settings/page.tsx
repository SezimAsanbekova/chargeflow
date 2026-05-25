"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Volume2, Play, Check } from "lucide-react";
import {
  getTranslations,
  getLocaleCookie,
  defaultLocale,
  type Locale,
} from "@/app/i18n";

const VOICES = [
  {
    id: "alloy",
    name: "Alloy",
    description: "Нейтральный, сбалансированный",
    gender: "Нейтральный",
  },
  {
    id: "echo",
    name: "Echo",
    description: "Мужской, чёткий",
    gender: "Мужской",
  },
  {
    id: "fable",
    name: "Fable",
    description: "Британский акцент, выразительный",
    gender: "Мужской",
  },
  {
    id: "onyx",
    name: "Onyx",
    description: "Глубокий мужской, авторитетный",
    gender: "Мужской",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Женский, энергичный",
    gender: "Женский",
  },
  {
    id: "shimmer",
    name: "Shimmer",
    description: "Мягкий женский, естественный",
    gender: "Женский",
  },
];

const MODELS = [
  {
    id: "tts-1",
    name: "Стандарт",
    description: "Быстрый, хорошее качество",
  },
  {
    id: "tts-1-hd",
    name: "HD",
    description: "Медленнее, но более естественный",
  },
];

const SPEEDS = [
  { value: 0.75, label: "0.75x - Медленно" },
  { value: 1.0, label: "1.0x - Нормально" },
  { value: 1.25, label: "1.25x - Быстро" },
  { value: 1.5, label: "1.5x - Очень быстро" },
];

export default function VoiceSettingsPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<any>(null);
  const [selectedVoice, setSelectedVoice] = useState("shimmer");
  const [selectedModel, setSelectedModel] = useState("tts-1-hd");
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Загружаем сохранённые настройки
    const savedVoice = localStorage.getItem("ai-voice") || "shimmer";
    const savedModel = localStorage.getItem("ai-model") || "tts-1-hd";
    const savedSpeed = parseFloat(localStorage.getItem("ai-speed") || "1.0");

    setSelectedVoice(savedVoice);
    setSelectedModel(savedModel);
    setSelectedSpeed(savedSpeed);

    // Загружаем переводы
    const savedLocale = getLocaleCookie();
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    getTranslations(locale, "ai-chat").then(setT);
  }, [locale]);

  const saveSettings = () => {
    localStorage.setItem("ai-voice", selectedVoice);
    localStorage.setItem("ai-model", selectedModel);
    localStorage.setItem("ai-speed", selectedSpeed.toString());
    router.back();
  };

  const testVoice = async (voiceId: string) => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }

    setTestingVoice(voiceId);

    const testText = t?.messages?.welcome || "Привет! Я ИИ-ассистент ChargeFlow. Помогу найти зарядную станцию.";

    try {
      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testText,
          voice: voiceId,
          model: selectedModel,
          speed: selectedSpeed,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setTestingVoice(null);
        setAudioElement(null);
      };

      audio.play();
      setAudioElement(audio);
    } catch (error) {
      console.error("Test voice error:", error);
      setTestingVoice(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Header */}
      <div className="bg-[#0f2d26] border-b border-emerald-900/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div>
          <p className="text-white font-semibold">{t?.settings?.title ?? "Настройки голоса"}</p>
          <p className="text-emerald-400 text-xs">{t?.settings?.subtitle ?? "Выберите голос AI"}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Модель */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t?.settings?.quality ?? "Качество"}</h3>
          <div className="space-y-2">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                  selectedModel === model.id
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-[#0f2d26] border-emerald-900/30 hover:border-emerald-500/50"
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">{t?.settings?.models?.[model.id]?.name ?? model.name}</p>
                  <p className="text-sm text-gray-400">{t?.settings?.models?.[model.id]?.description ?? model.description}</p>
                </div>
                {selectedModel === model.id && (
                  <Check size={20} className="text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Скорость */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t?.settings?.speed ?? "Скорость речи"}</h3>
          <div className="space-y-2">
            {SPEEDS.map((speed) => (
              <button
                key={speed.value}
                onClick={() => setSelectedSpeed(speed.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                  selectedSpeed === speed.value
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-[#0f2d26] border-emerald-900/30 hover:border-emerald-500/50"
                }`}
              >
                <p className="font-medium">{speed.value}x - {
                  speed.value === 0.75 ? (t?.settings?.speeds?.slow ?? "Медленно") :
                  speed.value === 1.0 ? (t?.settings?.speeds?.normal ?? "Нормально") :
                  speed.value === 1.25 ? (t?.settings?.speeds?.fast ?? "Быстро") :
                  (t?.settings?.speeds?.veryFast ?? "Очень быстро")
                }</p>
                {selectedSpeed === speed.value && (
                  <Check size={20} className="text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Голоса */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t?.settings?.voice ?? "Голос"}</h3>
          <div className="space-y-3">
            {VOICES.map((voice) => (
              <div
                key={voice.id}
                className={`p-4 rounded-xl border transition ${
                  selectedVoice === voice.id
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-[#0f2d26] border-emerald-900/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{voice.name}</p>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        {t?.settings?.voices?.[voice.id]?.gender ?? voice.gender}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t?.settings?.voices?.[voice.id]?.description ?? voice.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testVoice(voice.id)}
                      disabled={testingVoice === voice.id}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 transition disabled:opacity-50"
                    >
                      {testingVoice === voice.id ? (
                        <Volume2 size={18} className="text-emerald-400 animate-pulse" />
                      ) : (
                        <Play size={18} className="text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                        selectedVoice === voice.id
                          ? "bg-emerald-500 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Сохранить */}
        <button
          onClick={saveSettings}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-full font-semibold transition"
        >
          {t?.settings?.save ?? "Сохранить настройки"}
        </button>
      </div>
    </div>
  );
}

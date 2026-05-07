'use client';

import { Play, Pause, RotateCcw, X, Gauge, Volume2, VolumeX } from 'lucide-react';
import { getVoiceNavigator } from '../utils/voiceNavigator';
import { useState, useEffect } from 'react';

interface SimulationControlsProps {
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onExit: () => void;
}

const SPEED_OPTIONS = [10, 20, 40, 60];

export function SimulationControls({
  isPlaying,
  speed,
  onPlayPause,
  onReset,
  onSpeedChange,
  onExit,
}: SimulationControlsProps) {
  const voiceNavigator = getVoiceNavigator();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(voiceNavigator.getEnabled());

  // Синхронизируем состояние с VoiceNavigator
  useEffect(() => {
    setIsVoiceEnabled(voiceNavigator.getEnabled());
  }, [voiceNavigator]);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    voiceNavigator.setEnabled(newState);
    setIsVoiceEnabled(newState);
  };

  return (
    <div className="fixed top-20 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-[#0a1f1a]/95 backdrop-blur-sm border-2 border-emerald-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-lg">Тест-драйв</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice Toggle Button */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition ${
                isVoiceEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
              title={isVoiceEnabled ? 'Выключить голос' : 'Включить голос'}
            >
              {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={onExit}
              className="p-2 hover:bg-red-500/20 rounded-lg transition"
            >
              <X size={20} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={18} className="text-emerald-400" />
            <span className="text-white text-sm font-medium">Скорость: {speed} км/ч</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SPEED_OPTIONS.map((speedOption) => (
              <button
                key={speedOption}
                onClick={() => onSpeedChange(speedOption)}
                className={`py-2 px-3 rounded-lg font-medium text-sm transition ${
                  speed === speedOption
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-[#0f2d26] text-gray-400 hover:text-white hover:bg-emerald-600/20 border border-emerald-900/30'
                }`}
              >
                {speedOption}
              </button>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onPlayPause}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition shadow-lg ${
              isPlaying
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={18} />
                <span>Пауза</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Старт</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-lg"
          >
            <RotateCcw size={18} />
            <span>Сброс</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition shadow-lg"
          >
            <X size={18} />
            <span>Выход</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-3 text-center text-xs text-gray-400">
          Имитация движения по маршруту
        </div>
      </div>
    </div>
  );
}

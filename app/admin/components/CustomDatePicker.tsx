'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function CustomDatePicker({ value, onChange, placeholder = 'дд.мм.гггг' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={16} />
        <input
          type="text"
          value={formatDate(value)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-[#0a1f1a] border border-emerald-900/30 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm cursor-pointer"
        />
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-[#0f2d26] border border-emerald-500/30 rounded-xl shadow-2xl p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition"
            >
              <ChevronLeft className="text-gray-400" size={18} />
            </button>
            <div className="text-white font-semibold text-sm">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition"
            >
              <ChevronRight className="text-gray-400" size={18} />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-gray-400 text-xs font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => (
              <div key={index}>
                {day ? (
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg transition ${
                      isSelectedDate(day)
                        ? 'bg-emerald-500 text-white font-bold'
                        : isToday(day)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'text-gray-300 hover:bg-[#0a1f1a] hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-full aspect-square"></div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-900/30">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white text-xs transition"
            >
              Удалить
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

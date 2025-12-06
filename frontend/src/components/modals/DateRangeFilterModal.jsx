import React, { useState, useEffect, useMemo } from "react";
import { BiCalendarAlt, BiX, BiChevronLeft, BiChevronRight } from "react-icons/bi"; // Added BiChevron icons for navigation
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import minMax from "dayjs/plugin/minMax"; 

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(minMax); 

const today = dayjs();
const PH_LOCALE = "en-PH"; 

// --- Date Helper Functions ---

const getDaysInMonth = (year, month) => {
  const date = dayjs().year(year).month(month).startOf("month");
  const days = [];
  while (date.month() === month) {
    days.push(date.clone());
    date.add(1, "day");
  }
  return days;
};

// --- Modal Sub-Components ---

function DatePickerGrid({
  currentMonth,
  currentYear,
  startDate,
  endDate,
  onDateClick,
  mode,
}) {
  const startOfMonth = dayjs()
    .year(currentYear)
    .month(currentMonth)
    .startOf("month");
  
  const endOfMonth = dayjs()
    .year(currentYear)
    .month(currentMonth)
    .endOf("month");

  const startDayIndex = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
  const totalDays = endOfMonth.date();
  const calendarDays = [];

  // Week starts on Monday (1)
  const startOffset = (startDayIndex === 0 ? 6 : startDayIndex - 1);

  // Fill in empty spots for previous month
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }

  // Fill in the actual days
  for (let i = 1; i <= totalDays; i++) {
    const date = startOfMonth.date(i);
    // Don't show dates past today
    if (date.isAfter(today.endOf('day'))) break;
    calendarDays.push(date);
  }

  const isSelected = (date) => {
    if (!date) return false;
    // Check if date is strictly between start and end (exclusive)
    return startDate && endDate && date.isBetween(startDate, endDate, "day", "()");
  };

  const isRangeStart = (date) => {
    if (!date) return false;
    if (startDate && endDate && startDate.isSame(endDate, 'day')) {
        return date.isSame(startDate, 'day');
    }
    return startDate && date.isSame(startDate, "day");
  };

  const isRangeEnd = (date) => {
    if (!date) return false;
     if (startDate && endDate && startDate.isSame(endDate, 'day')) {
        return date.isSame(startDate, 'day');
    }
    return endDate && date.isSame(endDate, "day");
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.isSame(today, "day");
  };

  // Helper to determine cell classes
  const getCellClasses = (date) => {
    if (!date) return "text-gray-300";

    let classes = "w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 relative z-10"; // Reduced size slightly for cleaner look

    const start = isRangeStart(date);
    const end = isRangeEnd(date);
    const inRange = isSelected(date);
    const currentDay = isToday(date);
    
    // Default hover style
    classes += " hover:bg-blue-50"; 

    if (inRange) {
      // Dates in between the range
      classes = "w-9 h-9 flex items-center justify-center rounded-none text-blue-700 bg-blue-100 relative z-10"; 
    }

    if (start || end) {
      // Selected start or end date
      classes = "w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 bg-blue-600 text-white shadow-md relative z-10"; 
    } else if (currentDay) {
      // Unselected today date
      classes += " border border-blue-400 text-blue-600"; 
    } else {
      // Normal, unselected date
      classes += " text-gray-700";
    }

    return classes;
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Weekday Headers */}
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
        <span key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
          {day}
        </span>
      ))}

      {/* Calendar Days */}
      {calendarDays.map((date, index) => (
        <React.Fragment key={index}>
          {date ? (
            <div
              className={`flex items-center justify-center`}
              onClick={() => onDateClick(date)}
            >
              <div className={getCellClasses(date)}>
                {date.date()}
              </div>
            </div>
          ) : (
            <div key={`empty-${index}`} className="w-9 h-9"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function MonthPickerGrid({ currentYear, startDate, endDate, onMonthClick }) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const isSelected = (monthIndex) => {
    if (!startDate || !endDate) return false;
    const startOfMonth = dayjs().year(currentYear).month(monthIndex).startOf('month');
    
    return (
        startOfMonth.isSame(startDate.startOf('month')) && 
        startOfMonth.isSame(endDate.startOf('month'))
    );
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {months.map((month, index) => {
        const startOfMonth = dayjs().year(currentYear).month(index).startOf('month');
        const disabled = startOfMonth.isAfter(today.startOf('month'));

        return (
          <div
            key={month}
            className={`flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onMonthClick(index)}
          >
            <div
              className={`w-16 h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 ${ 
                isSelected(index)
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-gray-700 border border-gray-300 hover:bg-blue-50"
              }`}
            >
              {month}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Modal Component ---

export default function DateRangeFilterModal({ isOpen, onClose, onDateRangeApply }) {
  const [mode, setMode] = useState("Month"); 
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentYear, setCurrentYear] = useState(today.year());
  const [currentMonth, setCurrentMonth] = useState(today.month()); // 0-11

  // Generate a list of available years (current year and 5 years back)
  const yearOptions = useMemo(() => {
    const currentYearInt = today.year();
    const years = [];
    for (let i = 0; i < 6; i++) { 
      years.push(currentYearInt - i);
    }
    return years;
  }, []);

  const setRange = (start, end, rangeMode) => {
    const finalEnd = end.isAfter(today.endOf('day')) ? today.endOf('day') : end;
    setStartDate(start.startOf('day'));
    setEndDate(finalEnd);
    setMode(rangeMode);
  }

  // Effect to handle initialization and mode changes
  useEffect(() => {
    if (!isOpen) return;
    
    const now = dayjs();
    
    if (mode === "Month") {
        setCurrentYear(today.year()); 
        const start = now.startOf('month');
        setRange(start, now, "Month");
    } else if (mode === "Day") {
        setRange(now, now, "Day");
    } else if (mode === "Week") {
        const start = now.subtract(6, 'day'); 
        setRange(start, now, "Week");
    } else if (mode === "Custom") {
        setStartDate(null);
        setEndDate(null);
    }
    
    if (mode !== "Month") {
        setCurrentYear(today.year());
        setCurrentMonth(today.month());
    }
  }, [isOpen, mode]); 
  
  // Effect to re-select the month range when the Year dropdown changes
  useEffect(() => {
    if (mode === 'Month') {
        const selectedMonthIndex = startDate ? startDate.month() : today.month();
        
        const start = dayjs().year(currentYear).month(selectedMonthIndex).startOf("month");
        const end = dayjs().year(currentYear).month(selectedMonthIndex).endOf("month");
        
        if (!start.isAfter(today.startOf('month'))) {
             setRange(start, end, "Month");
        } else {
             const currentMonthStart = dayjs().startOf('month');
             setRange(currentMonthStart, today, "Month");
        }
    }
  }, [currentYear]);

  // Handle date selection in Calendar Grid (Custom/Day/Week)
  const handleDateClick = (date) => {
    date = date.startOf('day'); 

    if (mode === "Day") {
      setRange(date, date, "Day");
    } else if (mode === "Week") {
      const start = date.subtract(6, 'day'); 
      setRange(start, date, "Week");
    } else if (mode === "Custom") {
      if (!startDate || endDate) {
        setStartDate(date);
        setEndDate(null);
      } else if (date.isSameOrBefore(startDate, "day")) {
        setEndDate(startDate); 
        setStartDate(date); 
      } else {
        setEndDate(date);
      }
    }
  };

  // Handle month selection (Month Mode)
  const handleMonthClick = (monthIndex) => {
    const start = dayjs().year(currentYear).month(monthIndex).startOf("month");
    const end = dayjs().year(currentYear).month(monthIndex).endOf("month");
    
    if (start.isAfter(today.startOf('month'))) return;

    setRange(start, end, "Month");
  };

  // Switch between date view (month view) and year view (for month selection)
  const switchCalendarView = (targetMonth, targetYear) => {
    const newDate = dayjs().year(targetYear).month(targetMonth);
    
    if (newDate.isAfter(today, 'month')) {
        setCurrentMonth(today.month());
        setCurrentYear(today.year());
    } else {
        setCurrentMonth(newDate.month());
        setCurrentYear(newDate.year());
    }
  };

  const isMonthView = mode !== "Month";

  // Footer display text
  const footerText = useMemo(() => {
    if (startDate && endDate) {
      const finalStart = dayjs.min(startDate, endDate);
      const finalEnd = dayjs.max(startDate, endDate);
      
      const startStr = finalStart.format("MMM D, YYYY");
      const endStr = finalEnd.format("MMM D, YYYY");

      const diff = finalEnd.diff(finalStart, 'day') + 1;
      
      if (diff === 1) return `${startStr} (1 day)`;
      if (mode === "Month") return `${finalStart.format("MMM YYYY")} (${diff} days)`;
      
      return `${startStr} - ${endStr} (${diff} days)`;

    } else if (startDate) {
      return `${startDate.format("MMM D, YYYY")} - Select end date...`;
    }
    return "Select a date range";
  }, [startDate, endDate, mode]);

  // Apply button handler
  const handleApply = () => {
    if (startDate && endDate) {
      const finalStart = dayjs.min(startDate, endDate).startOf('day');
      const finalEnd = dayjs.max(startDate, endDate).endOf('day');
      
      onDateRangeApply({ startDate: finalStart, endDate: finalEnd, rangeType: mode });
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop - REVERTED TO STANDARD DIM/BLUR */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content - FIXED WIDTH AND CLEANER SHADOW */}
      <div className="bg-white rounded-xl shadow-2xl z-50 w-full max-w-md"> 
        {/* Header and Tabs */}
        <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Select date range</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                    <BiX className="w-6 h-6" />
                </button>
            </div>
            {/* Mode Tabs - Cleaned up to match inspiration image styling */}
            <div className="flex space-x-2 border-b-2 border-gray-100 pb-2">
                {["Custom", "Week", "Month", "Day"].map((m) => ( 
                    <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 border-b-2 
                        ${
                            mode === m
                                ? "text-blue-700 border-blue-600 font-bold" // Active tab line under text
                                : "text-gray-500 border-transparent hover:text-blue-500"
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>

        {/* Calendar/Month Picker Area */}
        <div className="px-4 py-4 overflow-y-auto max-h-[70vh]">
          {isMonthView ? (
            // Day/Week/Custom View
            <>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => switchCalendarView(currentMonth - 1, currentYear)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <BiChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold text-gray-800">
                  {dayjs()
                    .year(currentYear)
                    .month(currentMonth)
                    .format("MMM YYYY")}
                </span>
                <button
                  onClick={() => switchCalendarView(currentMonth + 1, currentYear)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                  disabled={dayjs().year(currentYear).month(currentMonth).isSame(today, 'month')}
                >
                  <BiChevronRight className="w-5 h-5" />
                </button>
              </div>

              <DatePickerGrid
                currentMonth={currentMonth}
                currentYear={currentYear}
                startDate={startDate}
                endDate={endDate}
                onDateClick={handleDateClick}
                mode={mode}
              />
            </>
          ) : (
            // Month View
            <>
                {/* Year Selector with Icon and Clean Input Style */}
                <div className="relative flex items-center mb-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                    <BiCalendarAlt className="w-5 h-5 text-blue-600 mr-3" />
                    <label htmlFor="year-select" className="sr-only">Select Year</label>
                    <select
                        id="year-select"
                        value={currentYear}
                        onChange={(e) => setCurrentYear(Number(e.target.value))}
                        className="w-full bg-transparent text-lg font-bold text-gray-800 outline-none appearance-none cursor-pointer"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Single 12-Month Grid for the selected year */}
                <MonthPickerGrid
                    currentYear={currentYear}
                    startDate={startDate}
                    endDate={endDate}
                    onMonthClick={handleMonthClick}
                />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm font-medium text-gray-600">
            {footerText}
          </p>
          <button
            onClick={handleApply}
            disabled={!startDate || !endDate}
            className={`py-2 px-6 rounded-lg text-white font-semibold transition-all duration-200 ${
              startDate && endDate
                ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/50" // Stronger button with shadow
                : "bg-gray-300 text-gray-500 cursor-not-allowed" 
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
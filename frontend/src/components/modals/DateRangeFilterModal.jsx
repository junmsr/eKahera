import React, { useState, useEffect, useMemo } from "react";
import { BiCalendarAlt, BiX } from "react-icons/bi";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// >>> FIX: Import and extend the minMax plugin
import minMax from "dayjs/plugin/minMax"; 

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
// >>> FIX: Extend the minMax plugin
dayjs.extend(minMax); 

const today = dayjs();
const PH_LOCALE = "en-PH"; // Retained for display consistency

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

  // We want the week to start on Monday (Monday is dayjs().day(1))
  // Calculate how many days before Monday the month starts.
  // dayjs().day() returns 0 for Sunday, 1 for Monday...
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
    // For single-day ranges (Day mode), it's both start and end
    if (startDate && endDate && startDate.isSame(endDate, 'day')) {
        return date.isSame(startDate, 'day');
    }
    return startDate && date.isSame(startDate, "day");
  };

  const isRangeEnd = (date) => {
    if (!date) return false;
     // For single-day ranges (Day mode), it's both start and end
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

    let classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 relative z-10";

    const start = isRangeStart(date);
    const end = isRangeEnd(date);
    const inRange = isSelected(date);
    const currentDay = isToday(date);
    
    // Add hover background for all clickable dates
    classes += " hover:bg-red-50";

    if (inRange) {
      // Background for dates between start and end
      classes = "w-10 h-10 flex items-center justify-center rounded-none text-red-600 bg-red-100 relative z-10";
    }

    if (start || end) {
      // Fully selected start or end date
      classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 bg-red-600 text-white shadow-lg relative z-10";
    } else if (currentDay) {
      // Unselected today date
      classes += " border border-red-400 text-red-600";
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
            <div key={`empty-${index}`} className="w-10 h-10"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function MonthPickerGrid({ currentYear, startDate, endDate, onMonthClick }) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const isSelected = (monthIndex) => {
    if (!startDate || !endDate) return false;
    const startOfMonth = dayjs().year(currentYear).month(monthIndex).startOf('month');
    
    // Check if the current month in the loop is the selected month range
    return (
        startOfMonth.isSame(startDate.startOf('month')) && 
        startOfMonth.isSame(endDate.startOf('month'))
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {months.map((month, index) => {
        const startOfMonth = dayjs().year(currentYear).month(index).startOf('month');
        // Disable months past the current month
        const disabled = startOfMonth.isAfter(today.startOf('month'));

        return (
          <div
            key={month}
            className={`flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onMonthClick(index)}
          >
            <div
              className={`w-14 h-14 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-150 ${
                isSelected(index)
                  ? "bg-red-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-200"
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
  const [mode, setMode] = useState("Month"); // Default to Month to match dashboard state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentYear, setCurrentYear] = useState(today.year());
  const [currentMonth, setCurrentMonth] = useState(today.month()); // 0-11

  const setRange = (start, end, rangeMode) => {
    // Ensure end date does not exceed today
    const finalEnd = end.isAfter(today.endOf('day')) ? today.endOf('day') : end;
    setStartDate(start.startOf('day'));
    setEndDate(finalEnd);
    setMode(rangeMode);
  }

  // Effect to handle initialization and mode changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Set initial range based on mode
    const now = dayjs();
    
    if (mode === "Day") {
        setRange(now, now, "Day");
    } else if (mode === "Week") {
        // Week: Last 7 days including today
        const start = now.subtract(6, 'day'); 
        setRange(start, now, "Week");
    } else if (mode === "Month") {
        const start = now.startOf('month');
        setRange(start, now, "Month");
    } else if (mode === "Custom") {
        setStartDate(null);
        setEndDate(null);
    }
    
    // Update the calendar view to the current month/year
    if (mode !== "Month") {
        setCurrentYear(today.year());
        setCurrentMonth(today.month());
    }
  }, [isOpen, mode]); // Rerun when mode changes or modal opens

  // Handle date selection in Calendar Grid (Custom/Day/Week)
  const handleDateClick = (date) => {
    date = date.startOf('day'); // Ensure time is ignored

    if (mode === "Day") {
      setRange(date, date, "Day");
    } else if (mode === "Week") {
      // Week: 7 days including the clicked date, ending on the clicked date
      const start = date.subtract(6, 'day'); 
      setRange(start, date, "Week");
    } else if (mode === "Custom") {
      if (!startDate || endDate) {
        // Start a new range
        setStartDate(date);
        setEndDate(null);
      } else if (date.isSameOrBefore(startDate, "day")) {
        // Select an earlier date, or click the same date (making it a single day range)
        setEndDate(startDate); // The old start becomes the new end
        setStartDate(date); // The new click becomes the start
      } else {
        // Set the end date
        setEndDate(date);
      }
    }
  };

  // Handle month selection (Month Mode)
  const handleMonthClick = (monthIndex) => {
    const start = dayjs().year(currentYear).month(monthIndex).startOf("month");
    const end = dayjs().year(currentYear).month(monthIndex).endOf("month");
    
    // Don't select future months
    if (start.isAfter(today.startOf('month'))) return;

    setRange(start, end, "Month");
  };

  // Switch between date view (month view) and year view (for month selection)
  const switchCalendarView = (targetMonth, targetYear) => {
    const newDate = dayjs().year(targetYear).month(targetMonth);
    
    // Prevent navigating past the current month/year
    if (newDate.isAfter(today, 'month')) {
        setCurrentMonth(today.month());
        setCurrentYear(today.year());
    } else {
        setCurrentMonth(newDate.month());
        setCurrentYear(newDate.year());
    }
  };

  const isMonthView = mode !== "Month";
  // Dynamically generate years, including the current and previous one for the Month picker
  const currentYearInt = today.year();
  const yearOptions = [currentYearInt, currentYearInt - 1].filter(y => y <= currentYearInt);

  // Footer display text
  const footerText = useMemo(() => {
    if (startDate && endDate) {
      // FIX: Use dayjs.min/max (which requires minMax plugin)
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
    // Done button should be clickable if both start and end are set.
    if (startDate && endDate) {
      // FIX: Use dayjs.min/max (which requires minMax plugin)
      const finalStart = dayjs.min(startDate, endDate).startOf('day');
      const finalEnd = dayjs.max(startDate, endDate).endOf('day');
      
      onDateRangeApply({ startDate: finalStart, endDate: finalEnd, rangeType: mode });
      onClose();
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm md:max-w-md">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Select date range</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <BiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-4 pb-0">
          {["Custom", "Week", "Month", "Day"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 mr-2 border 
                ${
                  mode === m
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
                }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Calendar/Month Picker Area */}
        <div className="p-4">
          {isMonthView && (
            <>
              {/* Calendar Navigation (Only for Day/Week/Custom) */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => switchCalendarView(currentMonth - 1, currentYear)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  &lt;
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
                  // Disable navigating forward past the current month
                  disabled={dayjs().year(currentYear).month(currentMonth).isSame(today, 'month')}
                >
                  &gt;
                </button>
              </div>

              {/* Day Calendar Grid */}
              <DatePickerGrid
                currentMonth={currentMonth}
                currentYear={currentYear}
                startDate={startDate}
                endDate={endDate}
                onDateClick={handleDateClick}
                mode={mode}
              />
            </>
          )}

          {mode === "Month" && (
            <>
                {yearOptions.map(year => (
                    <React.Fragment key={year}>
                        <h3 className="text-xl font-bold text-center my-4">{year}</h3>
                        <MonthPickerGrid
                            currentYear={year}
                            startDate={startDate}
                            endDate={endDate}
                            onMonthClick={handleMonthClick}
                        />
                    </React.Fragment>
                ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-sm font-medium text-gray-600 mb-2">
            {footerText}
          </p>
          <button
            onClick={handleApply}
            // Button is enabled only if both start and end dates are definitively set
            disabled={!startDate || !endDate}
            className={`w-full py-3 rounded-lg text-white font-bold transition-all duration-200 ${
              startDate && endDate
                ? "bg-red-600 hover:bg-red-700 shadow-lg"
                : "bg-red-300 cursor-not-allowed"
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
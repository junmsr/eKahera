import React, { useState, useEffect, useMemo } from "react";
import { BiCalendarAlt, BiX } from "react-icons/bi";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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

const getMonthStart = (year, month) => {
  return dayjs().year(year).month(month).startOf("month");
};

const getMonthEnd = (year, month) => {
  return dayjs().year(year).month(month).endOf("month");
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

  // Add padding days from the previous month (if Monday is the start, use 1, etc.)
  // We want the week to start on Monday (Mon: 0, Tue: 1, ..., Sun: 6)
  const startOffset = (startDayIndex === 0 ? 6 : startDayIndex - 1);

  // Fill in empty spots for previous month
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }

  // Fill in the actual days
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(startOfMonth.date(i));
  }

  const isSelected = (date) => {
    if (!date) return false;
    // Week mode: check if it's the start date (to show the "last 7 days" period)
    if (mode === "Week") {
      return (
        startDate &&
        date.isSame(startDate, "day") &&
        dayjs(startDate).add(6, "day").isSame(endDate, "day")
      );
    }
    // Custom/Day Mode
    if (startDate && endDate) {
      return (
        date.isSame(startDate, "day") ||
        date.isSame(endDate, "day") ||
        date.isBetween(startDate, endDate, "day", "()")
      );
    }
    return false;
  };

  const isRangeStart = (date) => {
    if (!date) return false;
    return startDate && date.isSame(startDate, "day");
  };

  const isRangeEnd = (date) => {
    if (!date) return false;
    return endDate && date.isSame(endDate, "day");
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.isSame(today, "day");
  };

  // Helper to determine cell classes
  const getCellClasses = (date) => {
    if (!date) return "text-gray-300"; // Placeholder cell

    let classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 relative z-10";

    const selected = isSelected(date);
    const start = isRangeStart(date);
    const end = isRangeEnd(date);
    const inRange = selected && !start && !end;
    const currentDay = isToday(date);
    const todayUnselected = currentDay && !selected;

    if (inRange) {
      // Background for dates between start and end
      classes += " bg-red-100 text-red-600 rounded-none";
    }

    if (start || end) {
      // Fully selected start or end date
      classes += " bg-red-600 text-white shadow-lg";
      if (start && end && !date.isSame(startDate, 'day')) {
         // Single day selection: Day mode or Custom start/end are the same
        classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-150 bg-red-600 text-white shadow-lg relative z-10";
      }
    } else if (todayUnselected) {
        // Unselected today date
        classes += " border border-red-400 text-red-600 hover:bg-red-100";
    } else if (!selected) {
      // Normal, unselected date
      classes += " text-gray-700 hover:bg-gray-100";
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
    return (
        startOfMonth.isSameOrAfter(startDate.startOf('month')) &&
        startOfMonth.isSameOrBefore(endDate.startOf('month'))
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {months.map((month, index) => {
        const selected = isSelected(index);
        const disabled = dayjs().year(currentYear).month(index).isAfter(today.endOf('month'), 'month');

        return (
          <div
            key={month}
            className={`flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onMonthClick(index)}
          >
            <div
              className={`w-14 h-14 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-150 ${
                selected
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
  const [mode, setMode] = useState("Custom");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentYear, setCurrentYear] = useState(today.year());
  const [currentMonth, setCurrentMonth] = useState(today.month()); // 0-11

  useEffect(() => {
    if (isOpen) {
        // Reset or initialize state when modal opens
        setMode("Custom");
        setStartDate(null);
        setEndDate(null);
        setCurrentYear(today.year());
        setCurrentMonth(today.month());
    }
  }, [isOpen]);

  // Handle date selection in Calendar Grid (Custom/Day/Week)
  const handleDateClick = (date) => {
    date = date.startOf('day'); // Ensure time is ignored

    if (mode === "Day") {
      setStartDate(date);
      setEndDate(date);
    } else if (mode === "Week") {
      const weekStart = date.startOf('week').add(1, 'day'); // Monday start
      const weekEnd = weekStart.add(6, 'day'); // Sunday end
      setStartDate(date); // We only highlight the selected date
      setEndDate(date.add(6, 'day')); // But set the range to 7 days starting from it
    } else if (mode === "Custom") {
      if (!startDate || endDate) {
        // Start a new range
        setStartDate(date);
        setEndDate(null);
      } else if (date.isSameOrBefore(startDate, "day")) {
        // Select an earlier date as the new start
        setStartDate(date);
        setEndDate(startDate); // Swap to ensure start < end
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
    setStartDate(start);
    setEndDate(end.isAfter(today) ? today : end); // Don't select past today
  };

  // Switch between date view (month view) and year view (for month selection)
  const switchCalendarView = (targetMonth, targetYear) => {
    setCurrentMonth(targetMonth);
    setCurrentYear(targetYear);
  };

  const isMonthView = mode !== "Month";
  const yearOptions = [today.year(), today.year() - 1];

  // Footer display text
  const footerText = useMemo(() => {
    if (startDate && endDate) {
      const startStr = startDate.format("MMM D, YYYY");
      const endStr = endDate.format("MMM D, YYYY");

      if (mode === "Day") return `${startStr}`;
      
      const diff = endDate.diff(startDate, 'day') + 1;

      if (mode === "Month") return `${startDate.format("MMM YYYY")} (${diff} days)`;
      if (mode === "Week") return `${startStr} - ${endStr} (${diff} days)`;
      
      return `${startStr} - ${endStr} (${diff} days)`;

    } else if (startDate) {
      return `${startDate.format("MMM D, YYYY")} - Select end date...`;
    }
    return "Select a date range";
  }, [startDate, endDate, mode]);

  // Apply button handler
  const handleApply = () => {
    if (startDate && endDate) {
      // Ensure the start date is before or same as the end date
      const finalStart = dayjs.min(startDate, endDate).startOf('day');
      const finalEnd = dayjs.max(startDate, endDate).endOf('day');
      onDateRangeApply({ startDate: finalStart, endDate: finalEnd, rangeType: mode });
      onClose();
    }
  };
  
  // Set the default range when mode changes
  useEffect(() => {
    const now = dayjs();
    if (mode === "Day") {
        setStartDate(now.startOf('day'));
        setEndDate(now.endOf('day'));
    } else if (mode === "Week") {
        const start = now.startOf('week').add(1, 'day'); // Monday start
        const end = start.add(6, 'day').endOf('day');
        setStartDate(start);
        setEndDate(end);
    } else if (mode === "Month") {
        const start = now.startOf('month');
        const end = now.endOf('day'); // End of today
        setStartDate(start);
        setEndDate(end);
    } else if (mode === "Custom") {
        setStartDate(null);
        setEndDate(null);
    }
    // Update the calendar view to the current month/year for Custom/Day/Week
    if (mode !== "Month") {
        setCurrentYear(today.year());
        setCurrentMonth(today.month());
    }
  }, [mode]);


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
                    ? "bg-red-500 text-white border-red-500"
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

// LowStockList is kept as a separate component for clean code, as in the original
function LowStockList({ lowStockProducts }) {
    if (lowStockProducts.length === 0) {
      return <p className="text-sm text-gray-500">No products with low stock.</p>;
    }
  
    return (
      <ul className="divide-y divide-gray-200">
        {lowStockProducts.map((product) => (
          <li
            key={product.product_id}
            className="py-3 flex justify-between items-center"
          >
            <span className="text-sm font-medium text-gray-800">
              {product.product_name}
            </span>
            <span className="text-sm font-bold text-red-600">
              {product.quantity_in_stock} left
            </span>
          </li>
        ))}
      </ul>
    );
  }
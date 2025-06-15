import React, { createContext, ReactNode, useContext, useState } from 'react';

interface CalendarContextType {
  isCalendarVisible: boolean;
  showCalendar: () => void;
  hideCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  const showCalendar = () => setIsCalendarVisible(true);
  const hideCalendar = () => setIsCalendarVisible(false);

  return (
    <CalendarContext.Provider
      value={{
        isCalendarVisible,
        showCalendar,
        hideCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
} 
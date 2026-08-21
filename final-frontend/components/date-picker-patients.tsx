"use client"

import * as React from "react"
import { CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  setYear,
  setMonth,
} from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Patient = {
  id: number
  queueNo: number
  patientName: string
  phoneNumber: string
  arrivalTime: string
  age: number
  status: "Waiting" | "In Progress" | "Completed"
  dateOfEntry: string
  doctorId: string
}

type DatePickerPatientsProps = {
  appointments: Patient[]
  selectedDoctorId: string
  onDateSelect?: (date: Date | undefined) => void
}

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

export function DatePickerPatients({ appointments, selectedDoctorId, onDateSelect }: DatePickerPatientsProps) {
  const [showCalendar, setShowCalendar] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isAnimating, setIsAnimating] = React.useState(false)

  // Generate years for selection (current year ± 10 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  // Generate all months for selection
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)

    // Add selection animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    // Hide calendar after selection with delay for animation
    setTimeout(() => setShowCalendar(false), 200)

    // Call parent callback if provided
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const handleClearDate = () => {
    setSelectedDate(undefined)
    if (onDateSelect) {
      onDateSelect(undefined)
    }
  }

  const handlePreviousMonth = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentMonth(subMonths(currentMonth, 1))
      setIsAnimating(false)
    }, 150)
  }

  const handleNextMonth = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentMonth(addMonths(currentMonth, 1))
      setIsAnimating(false)
    }, 150)
  }

  const handleYearChange = (year: string) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentMonth(setYear(currentMonth, Number.parseInt(year)))
      setIsAnimating(false)
    }, 150)
  }

  const handleMonthChange = (monthIndex: string) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentMonth(setMonth(currentMonth, Number.parseInt(monthIndex)))
      setIsAnimating(false)
    }, 150)
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the first day of the week (Monday = 1, Sunday = 0)
  const firstDayOfMonth = monthStart.getDay()
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Add empty cells for days before the month starts
  const paddingDays = Array.from({ length: startPadding }, (_, i) => null)

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center gap-2 text-gray-900 hover:text-gray-900 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
        >
          <CalendarDays className={`h-4 w-4 transition-transform duration-200 ${showCalendar ? "rotate-12" : ""}`} />
          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
        </Button>

        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDate}
            className="text-gray-900 hover:text-gray-700 transition-all duration-200 hover:scale-105 opacity-0 animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            Clear date
          </Button>
        )}
      </div>

      {/* Calendar Popover */}
      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-[320px] animate-slide-down">
          {/* Year and Month Selectors */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Select value={currentMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] h-8 text-gray-900 transition-all duration-200 hover:scale-105">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="animate-slide-down">
                  {years.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-gray-900 transition-colors duration-150 hover:bg-blue-50"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[120px] h-8 text-gray-900 transition-all duration-200 hover:scale-105">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="animate-slide-down">
                  {months.map((month, index) => (
                    <SelectItem
                      key={month}
                      value={index.toString()}
                      className="text-gray-900 transition-colors duration-150 hover:bg-blue-50"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreviousMonth}
                className="h-8 w-8 text-gray-900 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 hover:-translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 text-gray-900 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-4 w-4 transition-transform duration-200 hover:translate-x-0.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCalendar(false)}
                className="h-8 w-8 text-gray-900 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
              </Button>
            </div>
          </div>

          {/* Month Display */}
          <h3
            className={`text-lg font-semibold text-gray-900 text-center mb-4 transition-all duration-300 ${isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
          >
            {format(currentMonth, "MMMM yyyy")}
          </h3>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day, index) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-900 py-2 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            className={`grid grid-cols-7 gap-1 transition-all duration-300 ${isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
          >
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-10 w-10" />
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    h-10 w-10 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-110 active:scale-95 opacity-100 animate-fade-in
                    ${
                      isSelected
                        ? "bg-[#164772] text-white shadow-lg scale-105"
                        : isTodayDate
                          ? "bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200"
                          : "text-gray-900 hover:bg-gray-100 hover:shadow-md"
                    }
                  `}
                  style={{
                    animationDelay: `${(index + paddingDays.length) * 30}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds,
  addDays,
  isFuture,
  startOfDay,
  format,
  getHours,
  getMinutes
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  className?: string
  error?: string
}

export function DateTimePicker({ 
  value, 
  onChange, 
  className,
  error 
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [time, setTime] = React.useState<string>(
    value ? `${String(getHours(value)).padStart(2, '0')}:${String(getMinutes(value)).padStart(2, '0')}` : "12:00"
  )

  React.useEffect(() => {
    if (value) {
      setDate(value)
      setTime(`${String(getHours(value)).padStart(2, '0')}:${String(getMinutes(value)).padStart(2, '0')}`)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Combine the selected date with the current time using date-fns
      const [hours, minutes] = time.split(':').map(Number)
      
      // Use date-fns to set time components properly, avoiding timezone issues
      let combinedDate = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(selectedDate, hours),
            minutes
          ),
          0
        ),
        0
      )
      
      // Validate that the selected date/time is in the future using date-fns
      if (!isFuture(combinedDate)) {
        // If in the past, adjust to tomorrow at the same time
        const tomorrow = addDays(new Date(), 1)
        combinedDate = setMilliseconds(
          setSeconds(
            setMinutes(
              setHours(tomorrow, hours),
              minutes
            ),
            0
          ),
          0
        )
      }
      
      setDate(combinedDate)
      onChange(combinedDate)
      setOpen(false)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    
    if (date) {
      // Update the date with the new time using date-fns
      const [hours, minutes] = newTime.split(':').map(Number)
      
      // Use date-fns to set time components properly
      let updatedDate = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(date, hours),
            minutes
          ),
          0
        ),
        0
      )
      
      // Validate that the updated date/time is in the future using date-fns
      if (!isFuture(updatedDate)) {
        // If changing time makes it past, bump to tomorrow
        updatedDate = addDays(updatedDate, 1)
      }
      
      setDate(updatedDate)
      onChange(updatedDate)
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date"
    // Use date-fns format for consistent date formatting
    return format(date, 'MMM d, yyyy')
  }

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="flex flex-col gap-2 flex-1">
        <Label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className={cn(
                "w-full justify-between font-normal",
                !date && "text-muted-foreground",
                error && "border-red-500"
              )}
            >
              {formatDate(date)}
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 10}
              disabled={(date) => date < startOfDay(new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <Label htmlFor="time-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          value={time}
          onChange={handleTimeChange}
          className={cn(
            "bg-background appearance-none",
            "[&::-webkit-calendar-picker-indicator]:hidden",
            "[&::-webkit-calendar-picker-indicator]:appearance-none",
            error && "border-red-500"
          )}
        />
      </div>
    </div>
  )
}


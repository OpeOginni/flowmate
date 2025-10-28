"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

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
    value ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : "12:00"
  )

  React.useEffect(() => {
    if (value) {
      setDate(value)
      setTime(`${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Combine the selected date with the current time
      const [hours, minutes] = time.split(':').map(Number)
      selectedDate.setHours(hours, minutes, 0, 0)
      
      // Validate that the selected date/time is in the future
      const now = new Date()
      if (selectedDate <= now) {
        // If in the past, adjust to tomorrow at the same time
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(hours, minutes, 0, 0)
        setDate(tomorrow)
        onChange(tomorrow)
      } else {
        setDate(selectedDate)
        onChange(selectedDate)
      }
      setOpen(false)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    
    if (date) {
      // Update the date with the new time
      const [hours, minutes] = newTime.split(':').map(Number)
      const updatedDate = new Date(date)
      updatedDate.setHours(hours, minutes, 0, 0)
      
      // Validate that the updated date/time is in the future
      const now = new Date()
      if (updatedDate <= now) {
        // If changing time makes it past, bump to tomorrow
        const tomorrow = new Date(updatedDate)
        tomorrow.setDate(tomorrow.getDate() + 1)
        setDate(tomorrow)
        onChange(tomorrow)
      } else {
        setDate(updatedDate)
        onChange(updatedDate)
      }
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date"
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
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
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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


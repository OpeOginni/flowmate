import { fromUnixTime, addMinutes, addHours, addDays, addWeeks, getUnixTime } from 'date-fns';

/**
 * Extract time instruction from user text
 */
export function extractTimeInstruction(text: string): string | undefined {
  const patterns = [
    /(?:in|after|within)\s+(\d+)\s*(?:minute|min|minutes?)/i,
    /(?:in|after|within)\s+(\d+)\s*(?:hour|hours?|hr|hrs?)/i,
    /(?:in|after|within)\s+(\d+)\s*(?:day|days?)/i,
    /tomorrow/i,
    /next\s+week/i,
    /next\s+(\w+day)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return undefined;
}

/**
 * Calculate future timestamp based on user instruction
 */
export function calculateFutureTimestamp(
  currentTimestamp: number,
  timeInstruction: string
): number | undefined {
  const lowerInstruction = timeInstruction.toLowerCase();
  const currentDate = fromUnixTime(currentTimestamp);
  let futureDate: Date | undefined;

  // Use date-fns functions for date arithmetic
  const minutesMatch = lowerInstruction.match(/(\d+)\s*(?:minute|min|minutes?)/);
  if (minutesMatch) {
    futureDate = addMinutes(currentDate, parseInt(minutesMatch[1]));
  }

  const hoursMatch = lowerInstruction.match(/(\d+)\s*(?:hour|hours?|hr|hrs?)/);
  if (hoursMatch && !futureDate) {
    futureDate = addHours(currentDate, parseInt(hoursMatch[1]));
  }

  const daysMatch = lowerInstruction.match(/(\d+)\s*(?:day|days?)/);
  if (daysMatch && !futureDate) {
    futureDate = addDays(currentDate, parseInt(daysMatch[1]));
  }

  if (lowerInstruction.includes('tomorrow') && !futureDate) {
    futureDate = addDays(currentDate, 1);
  }

  if (lowerInstruction.includes('next week') && !futureDate) {
    futureDate = addWeeks(currentDate, 1);
  }

  if (futureDate) {
    return getUnixTime(futureDate);
  }

  return undefined;
}


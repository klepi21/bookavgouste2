interface TimeInterval {
  id: string;
  openTime: string;
  closeTime: string;
}

interface OperatingHours {
  weekday: number;
  isActive: boolean;
  timeIntervals: TimeInterval[];
}

interface GlobalSettings {
  bookingDurationMinutes: number;
}

/**
 * Generate time slots based on operating hours and booking duration
 */
export function generateSlotsFromOperatingHours(
  operatingHours: OperatingHours[],
  globalSettings: GlobalSettings,
  weekday: number
): string[] {
  const dayHours = operatingHours.find(h => h.weekday === weekday);
  
  if (!dayHours || !dayHours.isActive || dayHours.timeIntervals.length === 0) {
    return [];
  }

  const slots: string[] = [];
  const durationMinutes = globalSettings.bookingDurationMinutes;

  for (const interval of dayHours.timeIntervals) {
    const [openHour, openMinute] = interval.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = interval.closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    
    // Generate slots within this interval
    let currentMinutes = openMinutes;
    
    while (currentMinutes + durationMinutes <= closeMinutes) {
      const startHour = Math.floor(currentMinutes / 60);
      const startMinute = currentMinutes % 60;
      const endMinutes = currentMinutes + durationMinutes;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      slots.push(`${startTime} - ${endTime}`);
      
      currentMinutes += durationMinutes;
    }
  }

  return slots.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/**
 * Generate slots for a specific date using operating hours
 */
export async function generateSlotsForDate(
  date: string,
  service?: string
): Promise<string[]> {
  try {
    // console.log('🔍 Generating slots for date:', date, 'service:', service);
    
    // First try to get operating hours and global settings
    const [hoursRes, settingsRes] = await Promise.all([
      fetch('/api/operating-hours').catch(() => ({ json: () => [] })),
      fetch('/api/global-settings').catch(() => ({ json: () => null }))
    ]);
    
    const operatingHours: OperatingHours[] = await hoursRes.json();
    const globalSettings: GlobalSettings = await settingsRes.json();
    
    // console.log('📊 Operating hours:', operatingHours);
    // console.log('⚙️ Global settings:', globalSettings);
    
    // If we have operating hours configured, use the new system
    if (operatingHours.length > 0 && globalSettings && operatingHours.some(h => h.isActive && h.timeIntervals.length > 0)) {
      // console.log('✅ Using new operating hours system');
      const weekday = new Date(date).getDay();
      const baseSlots = generateSlotsFromOperatingHours(operatingHours, globalSettings, weekday);
      // console.log('🎯 Generated base slots:', baseSlots);
      
      // Check for date-specific overrides
      try {
        // console.log('🔍 Checking for date overrides for date:', date);
        const overridesRes = await fetch(`/api/date-overrides?date=${date}`);
        const overrides = await overridesRes.json();
        // console.log('📋 Date overrides found:', overrides);
        
        if (Array.isArray(overrides) && overrides.length > 0) {
          const availableOverrides = overrides
            .filter((o: { available: boolean; service?: string }) => 
              o.available && (!service || !o.service || o.service === service)
            )
            .map((o: { time: string }) => o.time);
          
          // console.log('✅ Available overrides:', availableOverrides);
          if (availableOverrides.length > 0) {
            return availableOverrides.sort((a: string, b: string) => 
              a.localeCompare(b, 'en', { numeric: true })
            );
          } else {
            // console.log('⚠️ No available overrides found, using base slots instead');
          }
        } else {
          // console.log('📅 No date overrides found, using base slots');
        }
      } catch (error) {
        // console.warn('Could not fetch date overrides:', error);
      }

      // Check for blocked intervals
      try {
        // console.log('🔍 Checking for blocked intervals for date:', date);
        const blockedRes = await fetch(`/api/blocked-intervals?date=${date}`);
        const blockedIntervals = await blockedRes.json();
        // console.log('🚫 Blocked intervals found:', blockedIntervals);
        
        if (Array.isArray(blockedIntervals) && blockedIntervals.length > 0) {
          // Filter out slots that overlap with blocked intervals
          const filteredSlots = baseSlots.filter(slot => {
            const [slotStart, slotEnd] = slot.split(' - ');
            const slotStartMinutes = timeToMinutes(slotStart);
            const slotEndMinutes = timeToMinutes(slotEnd);
            
            const hasOverlap = blockedIntervals.some((interval: any) => {
              const intervalStartMinutes = timeToMinutes(interval.startTime);
              const intervalEndMinutes = timeToMinutes(interval.endTime);
              
              const overlaps = slotStartMinutes < intervalEndMinutes && slotEndMinutes > intervalStartMinutes;
              
              if (overlaps) {
                // console.log(`🚫 Slot ${slot} overlaps with blocked interval ${interval.startTime}-${interval.endTime} (${interval.reason || 'No reason'})`);
              }
              
              return overlaps;
            });
            
            return !hasOverlap;
          });
          
          // console.log('✅ Slots after blocked intervals filter:', filteredSlots);
          return filteredSlots;
        } else {
          // console.log('📅 No blocked intervals found, using base slots');
        }
      } catch (error) {
        // console.warn('Could not fetch blocked intervals:', error);
      }
      
      // console.log('🎯 Returning baseSlots from new system:', baseSlots);
      return baseSlots;
    }
    
    // Fallback to old system - use global timeslots
    // console.log('🔄 Falling back to old global timeslots system');
    try {
      const globalSlotsRes = await fetch('/api/global-timeslots');
      const globalSlots = await globalSlotsRes.json();
      // console.log('📅 Global slots from old system:', globalSlots);
      
      if (Array.isArray(globalSlots) && globalSlots.length > 0) {
        const weekday = new Date(date).getDay();
        const slots = globalSlots
          .filter((s: { weekday: number }) => Number(s.weekday) === Number(weekday))
          .map((s: { time: string }) => s.time);
        
        // Check for date-specific overrides
        try {
          const overridesRes = await fetch(`/api/date-overrides?date=${date}`);
          const overrides = await overridesRes.json();
          
          if (Array.isArray(overrides) && overrides.some((o: { available: boolean }) => o.available)) {
            const available = overrides
              .filter((o: { available: boolean }) => o.available)
              .map((o: { time: string }) => o.time);
            return available.sort((a: string, b: string) => a.localeCompare(b, 'en', { numeric: true }));
          }
        } catch (error) {
          // console.warn('Could not fetch date overrides:', error);
        }
        
        return slots.sort((a: string, b: string) => a.localeCompare(b, 'en', { numeric: true }));
      }
    } catch (error) {
      // console.warn('Could not fetch global timeslots:', error);
    }
    
    // Final fallback - return empty array
    // console.log('❌ No slots found for date:', date);
    return [];
  } catch (error) {
    // console.error('❌ Error generating slots for date:', error);
    return [];
  }
}

/**
 * Filter out past slots if the date is today
 */
export function filterPastSlots(slots: string[], date: string): string[] {
  const today = new Date();
  const selectedDate = new Date(date);
  
  // console.log('🕐 Filtering past slots. Date:', date, 'Today:', today.toISOString().split('T')[0]);
  
  // If not today, return all slots
  if (
    today.getFullYear() !== selectedDate.getFullYear() ||
    today.getMonth() !== selectedDate.getMonth() ||
    today.getDate() !== selectedDate.getDate()
  ) {
    // console.log('📅 Not today, returning all slots:', slots);
    return slots;
  }
  
  // Filter out past slots
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  // console.log('⏰ Current time in minutes:', nowMinutes);
  
  const filtered = slots.filter(slot => {
    const [startTime] = slot.split(' - ');
    const [hour, minute] = startTime.split(':').map(Number);
    const slotMinutes = hour * 60 + minute;
    const isPast = slotMinutes <= nowMinutes;
    // console.log(`⏰ Slot ${slot} (${slotMinutes} min) - Past: ${isPast}`);
    return !isPast;
  });
  
  // console.log('✅ Past slots filtered:', filtered);
  return filtered;
}

/**
 * Remove already booked slots (check for time overlap)
 */
export function filterBookedSlots(slots: string[], bookedSlots: string[]): string[] {
  // console.log('🔍 Filtering booked slots. Available slots:', slots);
  // console.log('📅 Booked slots:', bookedSlots);
  
  const filtered = slots.filter(slot => {
    const [slotStart, slotEnd] = slot.split(' - ');
    const isBooked = bookedSlots.some(bookedTime => {
      // Check if the booked time overlaps with this slot
      // A booked time at 19:00 should block slots that start at 19:00 or later
      // but also slots that end at 19:00 or later (like 18:15-19:00)
      
      // Convert times to minutes for easier comparison
      const slotStartMinutes = timeToMinutes(slotStart);
      const slotEndMinutes = timeToMinutes(slotEnd);
      const bookedMinutes = timeToMinutes(bookedTime);
      
      // Check for overlap: slot overlaps if it starts before booked time ends
      // and ends after booked time starts
      // Since we don't know the duration of the booked slot, we assume it's 45 minutes
      const bookedEndMinutes = bookedMinutes + 45; // Assume 45 min duration
      
      const hasOverlap = slotStartMinutes < bookedEndMinutes && slotEndMinutes > bookedMinutes;
      
      // console.log(`⏰ Slot ${slot} (${slotStartMinutes}-${slotEndMinutes} min) vs Booked ${bookedTime} (${bookedMinutes}-${bookedEndMinutes} min) - Overlap: ${hasOverlap}`);
      
      return hasOverlap;
    });
    
    // console.log(`⏰ Slot ${slot} - Booked: ${isBooked}`);
    return !isBooked;
  });
  
  // console.log('✅ Filtered slots:', filtered);
  return filtered;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

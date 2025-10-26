export function getWeeksFromDates(startDate: Date, endDate: Date): number[] {
  const weeks: number[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekNumber = getWeekNumber(currentDate);
    if (!weeks.includes(weekNumber)) {
      weeks.push(weekNumber);
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks.sort((a, b) => a - b);
}

export function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getAvailableYears(): number[] {
  const currentYear = getCurrentYear();
  const years: number[] = [];
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push(i);
  }
  return years;
}


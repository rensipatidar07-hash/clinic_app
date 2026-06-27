export function calculateAgeDetail(birthDateStr: string): { years: number; months: number; totalMonths: number; display: string } {
  if (!birthDateStr) {
    return { years: 0, months: 0, totalMonths: 0, display: "0m" };
  }
  const birth = new Date(birthDateStr);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }

  // Adjust for partial days in the current month
  if (now.getDate() < birth.getDate() && months > 0) {
    months--;
  }

  const totalMonths = (years * 12) + months;

  let display = "";
  if (years > 0) {
    display += `${years} Yr${years > 1 ? 's' : ''}`;
  }
  if (months > 0 || years === 0) {
    if (display) display += " ";
    display += `${months} Mo${months > 1 ? 's' : ''}`;
  }
  if (!display) {
    display = "Newborn";
  }

  return { years, months, totalMonths, display };
}

export function generatePatientId(existingCount: number): string {
  const nextNum = 1001 + existingCount;
  return `P-${nextNum}`;
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

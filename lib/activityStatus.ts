type StatusInput = { isOpen: boolean; isHidden: boolean; dateStart: Date; dateEnd?: Date | null };

export type ActivityStatus = 'OPEN' | 'GESLOTEN' | 'AFGELOPEN' | 'VERBORGEN';

export function isAfgelopen(a: { dateStart: Date; dateEnd?: Date | null }, nu = new Date()): boolean {
  return (a.dateEnd ?? a.dateStart) < nu;
}

export function activityStatus(a: StatusInput, nu = new Date()): ActivityStatus {
  if (a.isHidden) return 'VERBORGEN';
  if (isAfgelopen(a, nu)) return 'AFGELOPEN';
  return a.isOpen ? 'OPEN' : 'GESLOTEN';
}

export const STATUS_LABEL: Record<ActivityStatus, string> = {
  OPEN: '🟢 Open',
  GESLOTEN: '🔴 Gesloten',
  AFGELOPEN: '⚪ Afgelopen',
  VERBORGEN: '🙈 Verborgen',
};

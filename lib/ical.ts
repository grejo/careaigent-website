import ical from 'ical-generator';
import { siteUrl } from './site';

export type IcalActivity = {
  slug: string;
  title: string;
  description?: string | null;
  dateStart: Date;
  dateEnd?: Date | null;
  location?: string | null;
};

export function generateIcal(activity: IcalActivity): string {
  const cal = ical({ name: 'CareAIgent' });
  cal.createEvent({
    start: activity.dateStart,
    end: activity.dateEnd ?? activity.dateStart,
    summary: activity.title,
    description: activity.description ?? '',
    location: activity.location ?? '',
    url: `${siteUrl()}/activiteiten/${activity.slug}`,
  });
  return cal.toString();
}

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ActivityForm from '@/components/admin/ActivityForm';

export const dynamic = 'force-dynamic';

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) notFound();

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '24px' }}>
        Activiteit bewerken
      </h1>
      <ActivityForm
        activity={{
          id: activity.id,
          title: activity.title,
          slug: activity.slug,
          description: activity.description,
          dateStart: activity.dateStart.toISOString(),
          dateEnd: activity.dateEnd?.toISOString() ?? null,
          location: activity.location,
          maxParticipants: activity.maxParticipants,
          registrationDeadline: activity.registrationDeadline?.toISOString() ?? null,
          isOpen: activity.isOpen,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extraFields: (Array.isArray(activity.extraFields) ? activity.extraFields : []) as any,
        }}
      />
    </div>
  );
}

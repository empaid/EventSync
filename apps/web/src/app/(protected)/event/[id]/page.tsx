import EventDetails from "@/components/events/EventDetails";
import EventUploader from "@/components/events/Uploader";

export default async function EventPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Event {id}</h1>
          <p className="text-gray-500">Manage audio assets for this event.</p>
        </div>
        {/* Single button to open upload popup; all logic stays inside EventUploader */}
        <EventUploader eventId={id} />
      </header>

      <EventDetails eventId={id} />
    </main>
  );
}

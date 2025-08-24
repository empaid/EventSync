
import EventList from "@/components/events/EventsList";
import NewEventButton from "@/components/events/NewEventsButton";

export default function DashboardPage() {
  return (
    <main className="min-h-dvh p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <NewEventButton />
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Your Events</h2>
        <EventList />
      </section>
    </main>
  );
}
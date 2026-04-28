import React, {useState, useEffect} from 'react';

interface Session {
  id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  max_speed_kmh?: number;
  avg_speed_kmh?: number;
  distance_km?: number;
}

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data.results || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--neon-blue)] neon-text">OBD2Free</h1>
        <p className="text-gray-400 mt-2">OBD2 Datalogs & Analytics</p>
      </header>

      <main>
        <h2 className="text-2xl font-semibold mb-4">Recent Sessions</h2>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-400">No sessions recorded yet. Start logging from the mobile app!</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const SessionCard: React.FC<{session: Session}> = ({session}) => {
  const startDate = new Date(session.started_at);
  const duration = session.duration_seconds
    ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`
    : 'In progress';

  return (
    <div className="bg-[var(--dark-card)] border-l-4 border-[var(--neon-green)] p-4 rounded-lg hover:shadow-lg hover:shadow-[var(--neon-green)]/20 transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white">
          {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}
        </h3>
        <span className="px-2 py-1 bg-[var(--neon-green)]/20 text-[var(--neon-green)] text-xs rounded-full">
          {session.ended_at ? 'Completed' : 'Active'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Duration</span>
          <span className="font-mono text-[var(--neon-blue)]">{duration}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Max Speed</span>
          <span className="font-mono text-[var(--neon-green)]">
            {session.max_speed_kmh?.toFixed(0) || '--'} km/h
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Speed</span>
          <span className="font-mono text-[var(--neon-blue)]">
            {session.avg_speed_kmh?.toFixed(1) || '--'} km/h
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Distance</span>
          <span className="font-mono text-[var(--neon-purple)]">
            {session.distance_km?.toFixed(2) || '--'} km
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <a
          href={`/api/sessions/${session.id}/data`}
          className="inline-block px-3 py-1 bg-[var(--neon-blue)] text-black text-sm font-semibold rounded hover:opacity-90 transition-opacity"
        >
          Download CSV
        </a>
      </div>
    </div>
  );
};

export default App;

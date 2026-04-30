import {useQuery} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {useAuth} from "../../hooks/use-auth";
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card";
import {Spinner} from "../../components/ui/spinner";
import {formatDate, formatDuration} from "../../lib/utils";

interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  distance_km: number;
  csv_row_count: number;
}

export default function DashboardPage() {
  const {user} = useAuth();

  const {data, isLoading} = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions?limit=10", {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const stats = {
    totalUsers: 1,
    totalSessions: data?.pagination?.total || 0,
    recentSessions: (data?.sessions || []) as Session[],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.display_name || user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">{user?.premium_level || "Free"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold capitalize">{user?.role}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Sessions</CardTitle>
          <Link to="/sessions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : stats.recentSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No sessions yet. Start logging from the mobile app or import a CSV.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((s) => (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatDate(s.started_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(s.duration_seconds)} · {s.max_speed_kmh?.toFixed(0) || "?"} km/h max
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {s.ended_at ? "Completed" : "Active"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

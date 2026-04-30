import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Spinner} from "../../components/ui/spinner";
import {formatDate, formatDuration} from "../../lib/utils";
import {Download, Eye, Upload} from "lucide-react";

interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  distance_km: number;
  max_rpm: number;
  csv_row_count: number;
}

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);

  const {data, isLoading} = useQuery({
    queryKey: ["sessions", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({page: String(page), limit: "20"});
      if (search) params.set("search", search);
      const res = await fetch(`/api/sessions?${params}`, {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      });
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
  });

  const sessions: Session[] = data?.sessions || [];
  const pagination = data?.pagination || {page: 1, totalPages: 1, total: 0};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">{pagination.total} total sessions</p>
        </div>
        <Button onClick={() => setShowImport(!showImport)}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </div>

      {/* Import Section */}
      {showImport && (
        <Card>
          <CardHeader><CardTitle>Import CSV</CardTitle></CardHeader>
          <CardContent>
            <ImportForm onDone={() => { setShowImport(false); window.location.reload(); }} />
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                    <th className="text-right p-3 font-medium">Max Speed</th>
                    <th className="text-right p-3 font-medium">Avg Speed</th>
                    <th className="text-right p-3 font-medium">Max RPM</th>
                    <th className="text-right p-3 font-medium">Rows</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-accent/50">
                      <td className="p-3">{formatDate(s.started_at)}</td>
                      <td className="p-3">{formatDuration(s.duration_seconds)}</td>
                      <td className="p-3 text-right font-mono">{s.max_speed_kmh?.toFixed(0) || "--"}</td>
                      <td className="p-3 text-right font-mono">{s.avg_speed_kmh?.toFixed(1) || "--"}</td>
                      <td className="p-3 text-right font-mono">{s.max_rpm?.toFixed(0) || "--"}</td>
                      <td className="p-3 text-right font-mono">{s.csv_row_count?.toLocaleString() || "--"}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${s.ended_at ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"}`}>
                          {s.ended_at ? "Completed" : "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link to={`/sessions/${s.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
                          <a href={`/api/sessions/${s.id}/data`} download><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function ImportForm({onDone}: {onDone: () => void}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
      <Input type="file" accept=".csv" onChange={handleFile} disabled={loading} />
      {loading && <Spinner />}
    </div>
  );
}

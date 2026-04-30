import {useState, useEffect} from "react";
import {useParams, Link} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card";
import {Button} from "../../components/ui/button";
import {Spinner} from "../../components/ui/spinner";
import {formatDate, formatDuration} from "../../lib/utils";
import {ArrowLeft, Download} from "lucide-react";

interface ParsedRow {
  [key: string]: number;
}

export default function SessionDetailPage() {
  const {id} = useParams<{id: string}>();
  const [data, setData] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [visibleParams, setVisibleParams] = useState<Set<string>>(new Set(["rpm", "speed"]));
  const [loadingData, setLoadingData] = useState(true);

  const {data: session, isLoading: loadingSession} = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${id}`, {
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
      });
      if (!res.ok) throw new Error("Session not found");
      return res.json();
    },
  });

  useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    fetch(`/api/sessions/${id}/data`, {
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
    })
      .then((r) => r.text())
      .then((csv) => {
        const lines = csv.trim().split("\n");
        if (lines.length < 2) return;
        const headers = lines[0].split(",");
        setColumns(headers);

        // Auto-select first 6 params
        setVisibleParams(new Set(headers.slice(0, 6)));

        const parsed = lines.slice(1).map((line) => {
          const vals = line.split(",");
          const row: ParsedRow = {};
          headers.forEach((h, i) => {
            const v = parseFloat(vals[i]);
            if (!isNaN(v)) row[h.trim()] = v;
          });
          return row;
        });
        setData(parsed);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [id]);

  const toggleParam = (p: string) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  if (loadingSession) {
    return <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/sessions">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Session {formatDate(session?.started_at || "")}
          </h1>
          <p className="text-muted-foreground">
            {formatDuration(session?.duration_seconds || 0)} ·{" "}
            Max {session?.max_speed_kmh?.toFixed(0) || "?"} km/h ·{" "}
            {data.length.toLocaleString()} data points
          </p>
        </div>
        <a href={`/api/sessions/${id}/data`} download>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />CSV</Button>
        </a>
      </div>

      {/* Parameter toggles */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Visible Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <button
                key={col}
                onClick={() => toggleParam(col)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  visibleParams.has(col)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent"
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loadingData ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : data.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground">No data available.</CardContent></Card>
      ) : (
        <>
          {/* Charts */}
          <ChartsSection data={data} columns={columns} visibleParams={visibleParams} />

          {/* Data table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Raw Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    {columns.filter((c) => visibleParams.has(c)).map((col) => (
                      <th key={col} className="text-left p-2 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 500).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-accent/50">
                      {columns.filter((c) => visibleParams.has(c)).map((col) => (
                        <td key={col} className="p-2 font-mono">{row[col]?.toFixed(1) ?? "--"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 500 && (
                <p className="text-center text-xs text-muted-foreground p-3">
                  Showing first 500 of {data.length.toLocaleString()} rows
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ChartsSection({data, columns, visibleParams}: {data: ParsedRow[]; columns: string[]; visibleParams: Set<string>}) {
  const chartCols = columns.filter((c) => visibleParams.has(c));
  if (chartCols.length === 0) return null;

  // Sample data for performance (max 2000 points)
  const step = Math.max(1, Math.floor(data.length / 2000));
  const sampled = data.filter((_, i) => i % step === 0);

  return (
    <div className="grid gap-4">
      {chartCols.map((col) => {
        const values = sampled.map((r) => r[col]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        return (
          <Card key={col}>
            <CardHeader className="pb-1"><CardTitle className="text-sm">{col}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-24 relative">
                <svg viewBox={`0 0 ${sampled.length} 100`} className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    points={sampled
                      .map((r, i) => `${i},${100 - ((r[col] - min) / range) * 90 - 5}`)
                      .join(" ")}
                  />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{min.toFixed(1)}</span>
                <span>{max.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

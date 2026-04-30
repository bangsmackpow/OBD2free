import {Link} from "react-router-dom";
import {Card, CardContent, CardHeader, CardTitle} from "../../components/ui/card";

const docMeta: Record<string, {title: string; description: string}> = {
  "getting-started": {title: "Getting Started", description: "Install the app, connect your OBD2 adapter, and start logging."},
  "user-guide": {title: "User Guide", description: "Dashboard, sessions, datalog viewer, settings, and premium features."},
  "technical-reference": {title: "Technical Reference", description: "API docs, JWT auth, CSV schema, and complete OBD2 PID reference."},
  "admin-guide": {title: "Admin Guide", description: "User management, license controls, system configuration."},
  troubleshooting: {title: "Troubleshooting", description: "Common issues with connections, data, accounts, and solutions."},
  "fault-codes": {title: "Fault Codes (DTC)", description: "Complete DTC reference with descriptions, causes, fixes, and severity ratings."},
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-1">Learn how to use OBD2Free</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(docMeta).map(([slug, meta]) => (
            <Link key={slug} to={`/docs/${slug}`}>
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle>{meta.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

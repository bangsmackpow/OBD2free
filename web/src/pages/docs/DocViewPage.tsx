import {useParams, Link} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {Spinner} from "../../components/ui/spinner";
import {Button} from "../../components/ui/button";
import {ArrowLeft} from "lucide-react";

export default function DocViewPage() {
  const {slug} = useParams<{slug: string}>();

  const {data, isLoading} = useQuery({
    queryKey: ["doc", slug],
    queryFn: async () => {
      const res = await fetch(`/api/docs/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<{content: string}>;
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-6 w-6" /></div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/docs"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
          <p className="text-center text-muted-foreground mt-12">Document not found.</p>
        </div>
      </div>
    );
  }

  // Simple markdown to HTML (basic implementation)
  const html = renderMarkdown(data.content);

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/docs"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Back to Docs</Button></Link>
        <article
          className="prose prose-sm dark:prose-invert max-w-none mt-6"
          dangerouslySetInnerHTML={{__html: html}}
        />
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("#### ")) return `<h4>${line.slice(5)}</h4>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      if (line.startsWith("| ")) return line; // skip tables
      if (line.startsWith("```")) return `<pre><code>`;
      if (line.startsWith("---")) return `<hr />`;
      if (line.startsWith("[")) {
        const match = line.match(/\[(.+?)\]\((.+?)\)/);
        if (match) return `<a href="${match[2]}">${match[1]}</a>`;
      }
      if (line.trim() === "") return "<br />";
      return `<p>${line}</p>`;
    })
    .join("\n");
}

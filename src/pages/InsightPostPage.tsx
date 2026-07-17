import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Insight {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  background_image_url: string | null;
  author_name: string | null;
  created_at: string;
}

const InsightPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    supabase
      .from("insights" as any)
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setPost(data as unknown as Insight);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (notFound || !post) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This post could not be found.</p>
        <Link to="/insights">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-8 pb-8 max-w-3xl mx-auto">
      <Link to="/insights" className="inline-flex">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights Library
        </Button>
      </Link>

      {post.background_image_url && (
        <div
          className="h-64 md:h-80 rounded-2xl bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${post.background_image_url})` }}
        />
      )}

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {post.author_name && <span>{post.author_name}</span>}
          {post.author_name && <span>·</span>}
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </article>
  );
};

export default InsightPostPage;

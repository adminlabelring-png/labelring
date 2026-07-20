import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Twitter, Linkedin, Facebook } from "lucide-react";

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

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

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

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = post.title;

  const shareLinks = [
    {
      label: "Share on X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: "Share on LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Share on Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <article className="pb-16">
      {/* Full-bleed hero banner */}
      <div className="relative -mx-4 md:-mx-8 lg:mx-[calc(50%-50vw)] -mt-6 md:-mt-24">
        <div
          className="relative min-h-[320px] md:min-h-[420px] bg-cover bg-center bg-muted flex items-end"
          style={
            post.background_image_url
              ? { backgroundImage: `url(${post.background_image_url})` }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-20 pb-10">
            <nav className="flex items-center gap-1.5 text-xs font-medium text-white/70 mb-4">
              <Link to="/insights" className="hover:text-white transition-colors">
                Insights
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/90">Guide</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] text-white max-w-3xl text-balance">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl">{post.excerpt}</p>
            )}
          </div>
        </div>
      </div>

      {/* Byline + share row */}
      <div className="max-w-3xl mx-auto px-0">
        <div className="flex items-center justify-between gap-4 py-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
              {initials(post.author_name || "Labelring")}
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{post.author_name || "Labelring"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shareLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="h-9 w-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none py-10">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>

        <Link to="/insights" className="inline-flex">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights Library
          </Button>
        </Link>
      </div>
    </article>
  );
};

export default InsightPostPage;

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import MarkdownContent from "@/components/MarkdownContent";
import { ArrowLeft, ArrowRight, ChevronRight, ScanLine, Sparkles, Twitter, Linkedin, Facebook } from "lucide-react";
import { useSeo, SITE_URL } from "@/hooks/use-seo";

interface Insight {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  background_image_url: string | null;
  author_name: string | null;
  author_twitter_url: string | null;
  author_linkedin_url: string | null;
  author_facebook_url: string | null;
  created_at: string;
  updated_at: string;
}

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string | null;
  background_image_url: string | null;
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
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);

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

  // Cross-links this post to other Insights content so search engines (and
  // readers) have a way to reach more pages than just the /insights index —
  // there's no category/tag field to group by, so "most recent" is the
  // simplest reliable relation.
  useEffect(() => {
    if (!slug) return;
    supabase
      .from("insights" as any)
      .select("slug, title, excerpt, background_image_url")
      .eq("published", true)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setRelatedPosts((data as unknown as RelatedPost[]) ?? []));
  }, [slug]);

  useSeo({
    title: post ? `${post.title} | Labelring Insights` : "Labelring Insights",
    description: post?.excerpt || "UK product labelling compliance guide from Labelring.",
    path: `/insights/${slug ?? ""}`,
    type: "article",
    image: post?.background_image_url || undefined,
    noindex: notFound,
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.background_image_url || undefined,
          author: { "@type": "Person", name: post.author_name || "Labelring" },
          publisher: { "@type": "Organization", name: "Labelring Ltd" },
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/insights/${slug}` },
        }
      : undefined,
  });

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

  const authorLinks = [
    { label: `${post.author_name || "Author"} on X`, icon: Twitter, href: post.author_twitter_url },
    { label: `${post.author_name || "Author"} on LinkedIn`, icon: Linkedin, href: post.author_linkedin_url },
    { label: `${post.author_name || "Author"} on Facebook`, icon: Facebook, href: post.author_facebook_url },
  ].filter((s): s is { label: string; icon: typeof Twitter; href: string } => !!s.href);

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
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] text-white max-w-2xl text-balance shrink-0">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-base md:text-lg text-white/80 max-w-md md:pb-1">{post.excerpt}</p>
              )}
            </div>
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
          {authorLinks.length > 0 && (
            <div className="flex items-center gap-2">
              {authorLinks.map((s) => (
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
          )}
        </div>

        <MarkdownContent body={post.body} className="py-10" />

        <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
          <h2 className="text-sm font-semibold">Put this into practice</h2>
          <p className="text-sm text-muted-foreground">
            Check an existing product label against UK regulations, or generate a compliant one from
            scratch — both take a couple of minutes.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link to="/scan">
              <Button size="sm" className="gap-2">
                <ScanLine className="h-3.5 w-3.5" /> Check my label
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/generate">
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Create a digital label
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-sm font-semibold">More from Insights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  to={`/insights/${related.slug}`}
                  className="group block rounded-lg border overflow-hidden hover:border-foreground/30 transition-colors"
                >
                  <div
                    className="h-24 bg-muted bg-cover bg-center"
                    style={
                      related.background_image_url
                        ? { backgroundImage: `url(${related.background_image_url})` }
                        : undefined
                    }
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium leading-snug group-hover:underline line-clamp-2">
                      {related.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link to="/insights" className="mt-8 inline-flex">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights Library
          </Button>
        </Link>
      </div>
    </article>
  );
};

export default InsightPostPage;

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  body: string;
  className?: string;
}

const MarkdownContent = ({ body, className }: MarkdownContentProps) => (
  <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const embedUrl = href ? getYouTubeEmbedUrl(href) : null;
          if (embedUrl) {
            return (
              <span className="not-prose my-6 block aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <iframe
                  src={embedUrl}
                  title="Embedded YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </span>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" />,
      }}
    >
      {body}
    </ReactMarkdown>
  </div>
);

export default MarkdownContent;

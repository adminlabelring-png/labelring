import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  ImagePlus,
  Youtube,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MarkdownContent from "@/components/MarkdownContent";

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

type Selection = { start: number; end: number };

const BULLET_RE = /^[-*+]\s+/;
const ORDERED_RE = /^\d+\.\s+/;
const QUOTE_RE = /^>\s+/;
const HEADING_RE = /^#{1,6}\s+/;
const ANY_MARKER_RE = /^(?:[-*+]\s+|\d+\.\s+|>\s+|#{1,6}\s+)/;

const MarkdownEditor = ({
  id,
  value,
  onChange,
  rows = 10,
  placeholder,
  onImageUpload,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingSelection = useRef<Selection | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (pendingSelection.current && textareaRef.current) {
      const { start, end } = pendingSelection.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelection.current = null;
    }
  }, [value]);

  const getTextarea = () => textareaRef.current;

  const applyWrap = (before: string, after: string, placeholderText: string) => {
    const ta = getTextarea();
    if (!ta) return;
    const { selectionStart: rawStart, selectionEnd: rawEnd, value: text } = ta;
    const hasRawSelection = rawEnd > rawStart;
    const rawSelected = hasRawSelection ? text.slice(rawStart, rawEnd) : "";

    // Trim leading/trailing whitespace out of the selection before wrapping.
    // CommonMark only recognises "**"/"*"/"`" as emphasis when they flank
    // non-whitespace content, so a selection that happens to capture a
    // trailing newline (e.g. from a double-click or drag-to-end-of-line)
    // would otherwise strand the closing marker on its own line and render
    // as literal asterisks instead of bold text.
    const leadingWs = rawSelected.match(/^\s*/)?.[0].length ?? 0;
    const trailingWs = rawSelected.match(/\s*$/)?.[0].length ?? 0;
    const start = rawStart + leadingWs;
    const end = rawEnd - trailingWs;
    const hasSelection = hasRawSelection && end > start;
    const selected = hasSelection ? text.slice(start, end) : placeholderText;

    const alreadyWrapped =
      text.slice(start - before.length, start) === before &&
      text.slice(end, end + after.length) === after;

    if (hasSelection && alreadyWrapped) {
      const newText =
        text.slice(0, start - before.length) + selected + text.slice(end + after.length);
      pendingSelection.current = { start: start - before.length, end: end - before.length };
      onChange(newText);
      return;
    }

    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    pendingSelection.current = { start: newStart, end: newEnd };
    onChange(newText);
  };

  const applyBlockPrefix = (
    makePrefix: (lineIndex: number) => string,
    matches: (line: string) => boolean
  ) => {
    const ta = getTextarea();
    if (!ta) return;
    const { selectionStart: selStart, selectionEnd: selEnd, value: text } = ta;

    const lineStart = text.lastIndexOf("\n", selStart - 1) + 1;
    let lineEnd = text.indexOf("\n", selEnd > selStart ? selEnd - 1 : selEnd);
    if (lineEnd === -1) lineEnd = text.length;

    const block = text.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const allAlreadyMarked = lines.every((line) => line.trim() === "" || matches(line));

    const newLines = lines.map((line, i) => {
      if (line.trim() === "") return line;
      if (allAlreadyMarked) return line.replace(ANY_MARKER_RE, "");
      return makePrefix(i) + line.replace(ANY_MARKER_RE, "");
    });
    const newBlock = newLines.join("\n");

    // Ensure a blank line separates a new list/quote/heading block from
    // preceding non-blank content, so it parses as its own block rather
    // than a "lazy continuation" of the paragraph above.
    let gap = "";
    if (!allAlreadyMarked && lineStart >= 2 && text[lineStart - 1] === "\n" && text[lineStart - 2] !== "\n") {
      gap = "\n";
    }

    const newText = text.slice(0, lineStart) + gap + newBlock + text.slice(lineEnd);
    const delta = gap.length + (newBlock.length - block.length);
    pendingSelection.current = { start: selStart + delta, end: selEnd + delta };
    onChange(newText);
  };

  const applyLink = () => {
    const ta = getTextarea();
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end, value: text } = ta;
    const label = end > start ? text.slice(start, end) : "link text";
    const url = "https://";
    const insertion = `[${label}](${url})`;
    const newText = text.slice(0, start) + insertion + text.slice(end);
    const urlStart = start + `[${label}](`.length;
    pendingSelection.current = { start: urlStart, end: urlStart + url.length };
    onChange(newText);
  };

  const insertAtCursor = (text: string) => {
    const ta = getTextarea();
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end, value: current } = ta;
    const newText = current.slice(0, start) + text + current.slice(end);
    const newPos = start + text.length;
    pendingSelection.current = { start: newPos, end: newPos };
    onChange(newText);
  };

  const insertYouTubeEmbed = () => {
    const ta = getTextarea();
    if (!ta) return;
    const { selectionStart: start, value: text } = ta;
    const base = "https://www.youtube.com/watch?v=";
    const placeholder = "VIDEO_ID";
    const insertion = `${base}${placeholder}\n`;
    const newText = text.slice(0, start) + insertion + text.slice(start);
    const idStart = start + base.length;
    pendingSelection.current = { start: idStart, end: idStart + placeholder.length };
    onChange(newText);
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onImageUpload) return;
    setUploadingImage(true);
    try {
      const url = await onImageUpload(file);
      insertAtCursor(`![](${url})\n`);
    } catch {
      // The caller (onImageUpload) is responsible for surfacing the error.
    } finally {
      setUploadingImage(false);
    }
  };

  const buttons: {
    key: string;
    label: string;
    icon: typeof Bold;
    onClick: () => void;
    disabled?: boolean;
    spin?: boolean;
  }[] = [
    { key: "bold", label: "Bold", icon: Bold, onClick: () => applyWrap("**", "**", "bold text") },
    { key: "italic", label: "Italic", icon: Italic, onClick: () => applyWrap("*", "*", "italic text") },
    { key: "code", label: "Code", icon: Code, onClick: () => applyWrap("`", "`", "code") },
    {
      key: "heading",
      label: "Heading",
      icon: Heading2,
      onClick: () => applyBlockPrefix(() => "## ", (l) => HEADING_RE.test(l)),
    },
    {
      key: "bullet",
      label: "Bullet list",
      icon: List,
      onClick: () => applyBlockPrefix(() => "- ", (l) => BULLET_RE.test(l)),
    },
    {
      key: "ordered",
      label: "Numbered list",
      icon: ListOrdered,
      onClick: () => applyBlockPrefix((i) => `${i + 1}. `, (l) => ORDERED_RE.test(l)),
    },
    {
      key: "quote",
      label: "Quote",
      icon: Quote,
      onClick: () => applyBlockPrefix(() => "> ", (l) => QUOTE_RE.test(l)),
    },
    { key: "link", label: "Link", icon: LinkIcon, onClick: applyLink },
    ...(onImageUpload
      ? [
          {
            key: "image",
            label: uploadingImage ? "Uploading…" : "Image",
            icon: uploadingImage ? Loader2 : ImagePlus,
            onClick: handleImageButtonClick,
            disabled: uploadingImage,
            spin: uploadingImage,
          },
        ]
      : []),
    { key: "youtube", label: "Embed YouTube video", icon: Youtube, onClick: insertYouTubeEmbed },
  ];

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5">
            {buttons.map((b) => (
              <Tooltip key={b.key}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={b.label}
                    disabled={b.disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={b.onClick}
                  >
                    <b.icon className={cn("h-3.5 w-3.5", b.spin && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{b.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        {onImageUpload && (
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />
        )}
        <TabsList className="h-8">
          <TabsTrigger value="write" className="text-xs h-6 px-2.5">
            Write
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs h-6 px-2.5">
            Preview
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="write" className="mt-2">
        <textarea
          id={id}
          ref={textareaRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            "font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
            "focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-2">
        <div className="rounded-md border px-4 py-3 min-h-[120px]">
          {value.trim() ? (
            <MarkdownContent body={value} className="prose-sm" />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MarkdownEditor;

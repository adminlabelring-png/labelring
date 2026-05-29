import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, ExternalLink, RefreshCw, FileImage, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface LeadClick {
  id: string;
  lead_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_path: string;
  referrer: string | null;
  user_agent: string | null;
  raw_query: string | null;
  created_at: string;
}

const AdminLeadsPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);

  const [clicks, setClicks] = useState<LeadClick[]>([]);
  const [loadingClicks, setLoadingClicks] = useState(false);

  const [scans, setScans] = useState<any[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [activeScan, setActiveScan] = useState<any | null>(null);
  const [scanFileUrl, setScanFileUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchClicks = async () => {
    setLoadingClicks(true);
    const { data, error } = await supabase
      .from("lead_clicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setClicks((data as LeadClick[]) ?? []);
    setLoadingClicks(false);
  };

  const fetchScans = async () => {
    setLoadingScans(true);
    const { data, error } = await supabase
      .from("scans" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setScans((data as any[]) ?? []);
    setLoadingScans(false);
  };

  const openScan = async (scan: any) => {
    setActiveScan(scan);
    setScanFileUrl(null);
    if (scan.file_path) {
      const { data, error } = await supabase.storage
        .from("scans")
        .createSignedUrl(scan.file_path, 60 * 10);
      if (!error && data?.signedUrl) setScanFileUrl(data.signedUrl);
    }
  };

  useEffect(() => {
    if (session) {
      fetchClicks();
      fetchScans();
    }
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin/leads` },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setClicks([]);
  };

  if (authLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="max-w-sm mx-auto py-16">
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Admin sign in</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Sign in to view lead activity." : "Create the first admin account."}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </Card>
      </div>
    );
  }

  // Group clicks by lead_id for the summary
  const byLead = new Map<string, LeadClick[]>();
  clicks.forEach((c) => {
    const key = c.lead_id || "(anonymous)";
    if (!byLead.has(key)) byLead.set(key, []);
    byLead.get(key)!.push(c);
  });

  const refreshAll = () => {
    fetchClicks();
    fetchScans();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Lead activity & label scans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={loadingClicks || loadingScans}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingClicks || loadingScans ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads ({clicks.length})</TabsTrigger>
          <TabsTrigger value="scans">Scans ({scans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          <Card className="p-4 bg-muted/30">
            <p className="text-sm font-medium mb-1">How to track a lead</p>
            <p className="text-xs text-muted-foreground mb-2">
              Append <code>?lead=NAME</code> to any link you put in an email. Optionally add UTM params.
            </p>
            <code className="text-xs block bg-background border rounded px-2 py-1.5 break-all">
              {window.location.origin}/?lead=john&amp;utm_source=email&amp;utm_campaign=oct-outreach
            </code>
          </Card>

          <div>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">By lead</h2>
            <div className="grid gap-2">
              {byLead.size === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No tracked clicks yet.</p>
              )}
              {[...byLead.entries()].map(([lead, items]) => (
                <Card key={lead} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{lead}</p>
                      <p className="text-xs text-muted-foreground">
                        {items.length} click{items.length !== 1 ? "s" : ""} · last{" "}
                        {new Date(items[0].created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {items[0].utm_campaign && (
                    <Badge variant="secondary" className="text-xs">{items[0].utm_campaign}</Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">All clicks</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">When</th>
                      <th className="text-left px-3 py-2 font-medium">Lead</th>
                      <th className="text-left px-3 py-2 font-medium">Source</th>
                      <th className="text-left px-3 py-2 font-medium">Campaign</th>
                      <th className="text-left px-3 py-2 font-medium">Landed on</th>
                      <th className="text-left px-3 py-2 font-medium">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-medium">{c.lead_id ?? "—"}</td>
                        <td className="px-3 py-2">{c.utm_source ?? "—"}</td>
                        <td className="px-3 py-2">{c.utm_campaign ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {c.landing_path}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                          {c.referrer || "direct"}
                        </td>
                      </tr>
                    ))}
                    {clicks.length === 0 && !loadingClicks && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No clicks yet. Send a test link to yourself with <code>?lead=test</code> to verify.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scans">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">When</th>
                    <th className="text-left px-3 py-2 font-medium">Product / File</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-left px-3 py-2 font-medium">Found</th>
                    <th className="text-left px-3 py-2 font-medium">Issues</th>
                    <th className="text-left px-3 py-2 font-medium">Flags</th>
                    <th className="text-left px-3 py-2 font-medium">Lead</th>
                    <th className="text-left px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => {
                    const changes = s.changes_detected as any;
                    const hasChange = changes?.hasAnyChange;
                    return (
                      <tr key={s.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => openScan(s)}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-medium truncate max-w-[220px]">
                          {s.product_name || s.file_name}
                          {s.product_name && (
                            <div className="text-xs text-muted-foreground font-normal truncate">{s.file_name}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">{s.category ?? "—"}</td>
                        <td className="px-3 py-2 text-[hsl(var(--risk-low))]">{s.found_count}/{s.total_count}</td>
                        <td className="px-3 py-2 text-[hsl(var(--risk-high))]">{s.needs_attention_count}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {s.is_seasonal && (
                              <Badge variant="outline" className="text-[10px] border-[hsl(var(--risk-medium)/0.5)] text-[hsl(var(--risk-medium))]">
                                Seasonal{s.season_tag ? ` · ${s.season_tag}` : ""}
                              </Badge>
                            )}
                            {hasChange && (
                              <Badge variant="outline" className="text-[10px] border-[hsl(var(--risk-high)/0.5)] text-[hsl(var(--risk-high))]">
                                Change detected
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">{s.lead_id ?? "—"}</td>
                        <td className="px-3 py-2 text-xs text-primary">View →</td>
                      </tr>
                    );
                  })}
                  {scans.length === 0 && !loadingScans && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No scans yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!activeScan} onOpenChange={(o) => !o && setActiveScan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              {activeScan?.file_name}
            </DialogTitle>
          </DialogHeader>
          {activeScan && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{activeScan.category ?? "—"}</Badge>
                <Badge variant="outline">{new Date(activeScan.created_at).toLocaleString()}</Badge>
                {activeScan.lead_id && <Badge>Lead: {activeScan.lead_id}</Badge>}
              </div>

              {scanFileUrl && (
                activeScan.mime_type?.startsWith("image/") ? (
                  <img src={scanFileUrl} alt={activeScan.file_name} className="w-full max-h-96 object-contain rounded border bg-muted" />
                ) : (
                  <a href={scanFileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                    Open original file ↗
                  </a>
                )
              )}

              <div className="rounded border divide-y">
                {(activeScan.fields as any[])?.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-3">
                    {f.status === "found" ? <CheckCircle className="h-4 w-4 text-[hsl(var(--risk-low))] shrink-0 mt-0.5" />
                      : f.status === "needs_review" ? <AlertTriangle className="h-4 w-4 text-[hsl(var(--risk-medium))] shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-[hsl(var(--risk-high))] shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground break-words">{f.value ?? "—"}</p>
                      {f.suggestedFix && (
                        <p className="text-xs text-[hsl(var(--risk-low))] mt-1">Suggestion: {f.suggestedFix}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadsPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, ExternalLink, RefreshCw, FileImage, CheckCircle, AlertTriangle, XCircle, Lock, History } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { lockScanAsVersion, getPendingRequests, decideChangeRequest, getLockedVersionByScan, type ChangeRequest, type ProductVersion } from "@/lib/version-lock";

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
  const [activeScanLocked, setActiveScanLocked] = useState<ProductVersion | null>(null);

  const [pendingRequests, setPendingRequests] = useState<ChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Lock dialog
  const [lockTarget, setLockTarget] = useState<any | null>(null);
  const [lockBy, setLockBy] = useState("");
  const [lockNote, setLockNote] = useState("");
  const [lockSubmitting, setLockSubmitting] = useState(false);

  // Decision dialog
  const [decisionTarget, setDecisionTarget] = useState<ChangeRequest | null>(null);
  const [decisionType, setDecisionType] = useState<"approved" | "rejected">("approved");
  const [decisionBy, setDecisionBy] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionPromote, setDecisionPromote] = useState(true);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

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
    setActiveScanLocked(null);
    if (scan.file_path) {
      const { data, error } = await supabase.storage
        .from("scans")
        .createSignedUrl(scan.file_path, 60 * 10);
      if (!error && data?.signedUrl) setScanFileUrl(data.signedUrl);
    }
    const locked = await getLockedVersionByScan(scan.id);
    setActiveScanLocked(locked);
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const data = await getPendingRequests();
    setPendingRequests(data);
    setLoadingRequests(false);
  };

  const handleLockSubmit = async () => {
    if (!lockTarget || !lockBy.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    if (!lockTarget.product_key) {
      toast.error("This scan has no product name — cannot be locked");
      return;
    }
    setLockSubmitting(true);
    try {
      const v = await lockScanAsVersion({
        productKey: lockTarget.product_key,
        productName: lockTarget.product_name,
        scanId: lockTarget.id,
        approvedBy: lockBy.trim(),
        note: lockNote.trim() || null,
      });
      toast.success(`Locked as v${v.version_number}`);
      setLockTarget(null);
      setLockBy("");
      setLockNote("");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to lock version");
    } finally {
      setLockSubmitting(false);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!decisionTarget || !decisionBy.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    setDecisionSubmitting(true);
    try {
      await decideChangeRequest({
        requestId: decisionTarget.id,
        decision: decisionType,
        decidedBy: decisionBy.trim(),
        note: decisionNote.trim() || null,
        promoteToLocked: decisionType === "approved" && decisionPromote,
        productKey: decisionTarget.product_key,
        productName: decisionTarget.product_name,
        newScanId: decisionTarget.new_scan_id,
      });
      toast.success(`Change ${decisionType}`);
      setDecisionTarget(null);
      setDecisionBy("");
      setDecisionNote("");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to record decision");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchClicks();
      fetchScans();
      fetchRequests();
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
    fetchRequests();
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
          <TabsTrigger value="approvals">
            Approvals {pendingRequests.length > 0 && <Badge className="ml-1.5 h-4 px-1 text-[10px]">{pendingRequests.length}</Badge>}
          </TabsTrigger>
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
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {s.product_key && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={() => setLockTarget(s)}>
                                  <Lock className="h-3 w-3" /> Lock
                                </Button>
                                <Link to={`/admin/products/${encodeURIComponent(s.product_key)}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                  <History className="h-3 w-3" /> History
                                </Link>
                              </>
                            )}
                            <button className="text-primary" onClick={() => openScan(s)}>View →</button>
                          </div>
                        </td>
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

        <TabsContent value="approvals" className="space-y-3">
          {pendingRequests.length === 0 && !loadingRequests && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No pending change requests. New scans that differ from a locked master will appear here.
            </Card>
          )}
          {pendingRequests.map((r) => {
            const changes = r.changes;
            return (
              <Card key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium">{r.product_name ?? r.product_key}</p>
                    <p className="text-xs text-muted-foreground">
                      Opened {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setDecisionTarget(r); setDecisionType("rejected"); setDecisionPromote(false); }}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => { setDecisionTarget(r); setDecisionType("approved"); setDecisionPromote(true); }}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
                {changes && (
                  <div className="text-xs text-muted-foreground space-y-0.5 border-l-2 border-border pl-3">
                    {changes.ingredientsAdded?.length > 0 && <p>+ Ingredients: {changes.ingredientsAdded.join(", ")}</p>}
                    {changes.ingredientsRemoved?.length > 0 && <p>− Ingredients: {changes.ingredientsRemoved.join(", ")}</p>}
                    {changes.allergensAdded?.length > 0 && <p>+ Allergens: {changes.allergensAdded.join(", ")}</p>}
                    {changes.allergensRemoved?.length > 0 && <p>− Allergens: {changes.allergensRemoved.join(", ")}</p>}
                    {changes.manufacturerChanged && <p>Mfr: {changes.manufacturerChanged.from ?? "—"} → {changes.manufacturerChanged.to ?? "—"}</p>}
                    {changes.originChanged && <p>Origin: {changes.originChanged.from ?? "—"} → {changes.originChanged.to ?? "—"}</p>}
                  </div>
                )}
                <Link to={`/admin/products/${encodeURIComponent(r.product_key)}`} className="text-xs text-primary inline-flex items-center gap-1">
                  <History className="h-3 w-3" /> View product history
                </Link>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Lock dialog */}
      <Dialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock as approved master</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will lock <strong>{lockTarget?.product_name ?? lockTarget?.file_name}</strong> as the approved master artwork. Any previously locked version will be archived automatically.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="lock-by">Reviewer name</Label>
              <Input id="lock-by" value={lockBy} onChange={(e) => setLockBy(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lock-note">Note (optional)</Label>
              <Textarea id="lock-note" value={lockNote} onChange={(e) => setLockNote(e.target.value)} placeholder="Approved final artwork for Q1 launch" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockTarget(null)}>Cancel</Button>
            <Button onClick={handleLockSubmit} disabled={lockSubmitting}>
              <Lock className="h-3 w-3 mr-1" /> Lock as master
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision dialog */}
      <Dialog open={!!decisionTarget} onOpenChange={(o) => !o && setDecisionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionType === "approved" ? "Approve change" : "Reject change"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Product: <strong>{decisionTarget?.product_name ?? decisionTarget?.product_key}</strong>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="dec-by">Reviewer name</Label>
              <Input id="dec-by" value={decisionBy} onChange={(e) => setDecisionBy(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dec-note">Decision note</Label>
              <Textarea id="dec-note" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Reason for approval / rejection" />
            </div>
            {decisionType === "approved" && (
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={decisionPromote} onCheckedChange={(v) => setDecisionPromote(!!v)} />
                <span>
                  <strong>Re-lock new version as approved master</strong>
                  <span className="block text-xs text-muted-foreground">Archives the current locked version automatically.</span>
                </span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionTarget(null)}>Cancel</Button>
            <Button onClick={handleDecisionSubmit} disabled={decisionSubmitting}
              variant={decisionType === "rejected" ? "destructive" : "default"}>
              {decisionType === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


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
                {activeScan.is_seasonal && (
                  <Badge variant="outline" className="border-[hsl(var(--risk-medium)/0.5)] text-[hsl(var(--risk-medium))]">
                    Seasonal{activeScan.season_tag ? ` · ${activeScan.season_tag}` : ""}
                  </Badge>
                )}
                {activeScan.changes_detected?.hasAnyChange && (
                  <Badge variant="outline" className="border-[hsl(var(--risk-high)/0.5)] text-[hsl(var(--risk-high))]">
                    Change vs previous
                  </Badge>
                )}
              </div>

              {activeScan.changes_detected?.hasAnyChange && (
                <div className="rounded border border-[hsl(var(--risk-high)/0.3)] bg-[hsl(var(--risk-high-bg))] p-3 text-xs space-y-1">
                  <p className="font-semibold text-[hsl(var(--risk-high))]">Detected changes</p>
                  {activeScan.changes_detected.ingredientsAdded?.length > 0 && (
                    <p>+ Ingredients: {activeScan.changes_detected.ingredientsAdded.join(", ")}</p>
                  )}
                  {activeScan.changes_detected.ingredientsRemoved?.length > 0 && (
                    <p>− Ingredients: {activeScan.changes_detected.ingredientsRemoved.join(", ")}</p>
                  )}
                  {activeScan.changes_detected.manufacturerChanged && (
                    <p>Manufacturer: {activeScan.changes_detected.manufacturerChanged.from ?? "—"} → {activeScan.changes_detected.manufacturerChanged.to ?? "—"}</p>
                  )}
                  {activeScan.changes_detected.originChanged && (
                    <p>Origin: {activeScan.changes_detected.originChanged.from ?? "—"} → {activeScan.changes_detected.originChanged.to ?? "—"}</p>
                  )}
                </div>
              )}

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

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "lr_tracked_clicks";

const alreadyTracked = (key: string): boolean => {
  try {
    const set = new Set<string>(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"));
    if (set.has(key)) return true;
    set.add(key);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    return false;
  } catch {
    return false;
  }
};

/**
 * Tracks email/campaign visits. Triggered when URL contains any of:
 * ?lead=, ?utm_source=, ?utm_campaign=, ?ref=
 * Logs once per unique query-string per browser session.
 */
export const LeadTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lead = params.get("lead") || params.get("ref");
    const utmSource = params.get("utm_source");
    const utmCampaign = params.get("utm_campaign");

    // Only track if we have something attribution-worthy
    if (!lead && !utmSource && !utmCampaign) return;

    const dedupeKey = `${location.pathname}?${location.search}`;
    if (alreadyTracked(dedupeKey)) return;

    const payload = {
      lead_id: lead,
      utm_source: utmSource,
      utm_medium: params.get("utm_medium"),
      utm_campaign: utmCampaign,
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      landing_path: location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      raw_query: location.search,
    };

    supabase
      .from("lead_clicks")
      .insert(payload)
      .then(({ error }) => {
        if (error) console.warn("Lead click tracking failed:", error.message);
      });
  }, [location.pathname, location.search]);

  return null;
};

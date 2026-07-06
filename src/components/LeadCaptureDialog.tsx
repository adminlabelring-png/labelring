import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/categories";

export const LEAD_SESSION_KEY = "labelring_lead_submitted";

export const hasSubmittedLead = () => {
  try {
    return sessionStorage.getItem(LEAD_SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

export const markLeadSubmitted = () => {
  try {
    sessionStorage.setItem(LEAD_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
};

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  company: z.string().trim().min(1, "Please enter your company").max(200),
  product_category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultCategory?: string;
  title?: string;
  description?: string;
  source?: string;
}

const LeadCaptureDialog = ({
  open,
  onOpenChange,
  onSuccess,
  defaultCategory,
  title = "One quick step",
  description = "Tell us who you are and we'll unlock your result.",
  source,
}: Props) => {
  const [values, setValues] = useState<{
    name: string;
    email: string;
    company: string;
    product_category: string | undefined;
  }>({ name: "", email: "", company: "", product_category: defaultCategory });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues((v) => ({
        ...v,
        product_category: v.product_category ?? defaultCategory,
      }));
    }
  }, [open, defaultCategory]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from("early_access_signups").insert([{
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      product_category: parsed.data.product_category,
      ...(source ? { source } : {}),
    } as never]);
    setSubmitting(false);
    if (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    markLeadSubmitted();
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lc-name">Name</Label>
            <Input
              id="lc-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              maxLength={100}
              required
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-email">Work email</Label>
            <Input
              id="lc-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              maxLength={255}
              required
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-company">Company</Label>
            <Input
              id="lc-company"
              value={values.company}
              onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
              maxLength={200}
              required
            />
            {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-category">Product category</Label>
            <Select
              value={values.product_category}
              onValueChange={(v) => setValues((s) => ({ ...s, product_category: v }))}
            >
              <SelectTrigger id="lc-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_category && (
              <p className="text-xs text-destructive">Please pick a category</p>
            )}
          </div>
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continue
          </Button>
          <p className="text-[11px] text-muted-foreground">
            We'll only use your details to contact you about Labelring early access.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureDialog;

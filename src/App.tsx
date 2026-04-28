import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScanProvider } from "@/lib/scan-context";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import ScanUploadPage from "@/pages/ScanUploadPage";
import ScanProcessingPage from "@/pages/ScanProcessingPage";
import ScanResultsPage from "@/pages/ScanResultsPage";
import AdminLeadsPage from "@/pages/AdminLeadsPage";
import NotFound from "@/pages/NotFound";
import { LeadTracker } from "@/lib/lead-tracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ScanProvider>
        <BrowserRouter>
          <LeadTracker />
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/scan" element={<ScanUploadPage />} />
              <Route path="/scan/processing" element={<ScanProcessingPage />} />
              <Route path="/scan/results" element={<ScanResultsPage />} />
              <Route path="/admin/leads" element={<AdminLeadsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ScanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

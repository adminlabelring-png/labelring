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
import ProductHistoryPage from "@/pages/ProductHistoryPage";
import NotFound from "@/pages/NotFound";
import { LeadTracker } from "@/lib/lead-tracker";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import DashboardPage from "@/pages/workspace/DashboardPage";
import LabelsPage from "@/pages/workspace/LabelsPage";
import ProductsPage from "@/pages/workspace/ProductsPage";
import CompliancePage from "@/pages/workspace/CompliancePage";
import SuppliersPage from "@/pages/workspace/SuppliersPage";
import SeasonalPage from "@/pages/workspace/SeasonalPage";
import VersionsPage from "@/pages/workspace/VersionsPage";
import DPPPage from "@/pages/workspace/DPPPage";
import TeamPage from "@/pages/workspace/TeamPage";
import SettingsPage from "@/pages/workspace/SettingsPage";

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
              <Route path="/admin/products/:productKey" element={<ProductHistoryPage />} />
            </Route>
            <Route element={<WorkspaceLayout />}>
              <Route path="/workspace" element={<DashboardPage />} />
              <Route path="/workspace/labels" element={<LabelsPage />} />
              <Route path="/workspace/products" element={<ProductsPage />} />
              <Route path="/workspace/compliance" element={<CompliancePage />} />
              <Route path="/workspace/suppliers" element={<SuppliersPage />} />
              <Route path="/workspace/seasonal" element={<SeasonalPage />} />
              <Route path="/workspace/versions" element={<VersionsPage />} />
              <Route path="/workspace/dpp" element={<DPPPage />} />
              <Route path="/workspace/team" element={<TeamPage />} />
              <Route path="/workspace/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ScanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

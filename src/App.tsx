import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import ProductDashboard from "@/pages/ProductDashboard";
import ComplianceDashboard from "@/pages/ComplianceDashboard";
import LabelDataDashboard from "@/pages/LabelDataDashboard";
import LabelUploadDashboard from "@/pages/LabelUploadDashboard";
import RulesEngineDashboard from "@/pages/RulesEngineDashboard";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductDashboard />} />
            <Route path="/compliance" element={<ComplianceDashboard />} />
            <Route path="/label-data" element={<LabelDataDashboard />} />
            <Route path="/upload" element={<LabelUploadDashboard />} />
            <Route path="/rules" element={<RulesEngineDashboard />} />
            <Route path="/collaboration" element={<PlaceholderPage title="Collaboration" description="Team review and approval workflows" />} />
            <Route path="/versions" element={<PlaceholderPage title="Version Control" description="Historical label versions and audit trail" />} />
            <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="Compliance metrics and reporting" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexProvider } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getConvexReactClient } from "@/lib/convexClient";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const convexClient = getConvexReactClient();

const App = () => (
  <ConvexProvider client={convexClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ConvexProvider>
);

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import InputPage from "@/pages/input";
import ProcessingPage from "@/pages/processing";
import ResultsPage from "@/pages/results";
import CollaborationPage from "@/pages/collaboration";
import FloatingNav from "@/components/FloatingNav";

function Router() {
  return (
    <div className="min-h-screen">
      <FloatingNav />
      <div className="pt-24 pb-12">
        <Switch>
          <Route path="/" component={InputPage} />
          <Route path="/processing/:id" component={ProcessingPage} />
          <Route path="/results/:id" component={ResultsPage} />
          <Route path="/collaboration" component={CollaborationPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Store from "./pages/Store";
import Admin from "./pages/Admin";
import Slots from "./pages/Slots";
import Poker from "./pages/Poker";
import Bingo from "./pages/Bingo";
import Sportsbook from "./pages/Sportsbook";
import PlaceholderPage from "./pages/PlaceholderPage";
import Profile from "./pages/Profile";
import Account from "./pages/Account";
import Wallet from "./pages/Wallet";
import Leaderboards from "./pages/Leaderboards";
import Achievements from "./pages/Achievements";
import Support from "./pages/Support";
import Games from "./pages/Games";
import Casino from "./pages/Casino";
import ScratchTickets from "./pages/ScratchTickets";
import PullTabs from "./pages/PullTabs";

const queryClient = new QueryClient();

// Component that wraps routes with Layout (needs to be inside Router)
const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/games" element={<Games />} />
      <Route path="/casino" element={<Casino />} />
      <Route path="/store" element={<Store />} />
      <Route path="/slots" element={<Slots />} />
      <Route path="/poker" element={<Poker />} />
      <Route path="/bingo" element={<Bingo />} />
      <Route path="/sportsbook" element={<Sportsbook />} />
      <Route path="/scratch-tickets" element={<ScratchTickets />} />
      <Route path="/pull-tabs" element={<PullTabs />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/account" element={<Account />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/leaderboards" element={<Leaderboards />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/support" element={<Support />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

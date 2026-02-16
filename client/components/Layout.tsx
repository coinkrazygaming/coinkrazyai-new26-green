import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/hooks/use-wallet';
import { PageTransition } from '@/components/PageTransition';
import { Coins, User, Home, Gamepad2, ShoppingCart, BarChart3, MessageSquare, Trophy, Award, Headphones, Settings, Zap, LogOut, Ticket, Dice5 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { wallet, currency, toggleCurrency } = useWallet();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Games', path: '/games', icon: Gamepad2 },
    { label: 'Casino', path: '/casino', icon: Dice5 },
    { label: 'Slots', path: '/slots', icon: Zap },
    { label: 'Poker', path: '/poker', icon: Coins },
    { label: 'Bingo', path: '/bingo', icon: Gamepad2 },
    { label: 'Sports', path: '/sportsbook', icon: BarChart3 },
    { label: 'Scratch Tickets', path: '/scratch-tickets', icon: Ticket },
    { label: 'Pull Tabs', path: '/pull-tabs', icon: Ticket },
    { label: 'Store', path: '/store', icon: ShoppingCart },
    { label: 'Leaderboard', path: '/leaderboards', icon: Trophy },
    { label: 'Achievements', path: '/achievements', icon: Award },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Wallet', path: '/wallet', icon: Coins },
    { label: 'Settings', path: '/account', icon: Settings },
    { label: 'Support', path: '/support', icon: Headphones },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: BarChart3 }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105 active:scale-95">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/40">
              <span className="text-primary-foreground font-black text-xl italic">CK</span>
            </div>
            <span className="font-black text-xl tracking-tighter hidden sm:inline-block">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                CoinKrazy
              </span>
              <span className="text-primary font-black">AI2</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Currency Toggle */}
                <div className="flex items-center bg-muted/40 rounded-full p-1 border border-border/40 backdrop-blur">
                  <button
                    onClick={() => currency !== 'GC' && toggleCurrency()}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-95",
                      currency === 'GC'
                        ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-md shadow-secondary/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    GC
                  </button>
                  <button
                    onClick={() => currency !== 'SC' && toggleCurrency()}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-95",
                      currency === 'SC'
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    SC
                  </button>
                </div>

                {/* Balance Display */}
                <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-muted/60 to-muted/20 px-4 py-2 rounded-full border border-border/40 backdrop-blur transition-all duration-300 hover:border-primary/20">
                  <Coins className={cn(
                    "w-4 h-4 transition-colors duration-300",
                    currency === 'GC' ? "text-secondary" : "text-primary"
                  )} />
                  <span className="font-mono font-bold">
                    {currency === 'GC'
                      ? Number(wallet?.goldCoins ?? 0).toLocaleString()
                      : Number(wallet?.sweepsCoins ?? 0).toFixed(2)}
                  </span>
                </div>

                <Button asChild variant="default" className="hidden sm:flex gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Link to="/store">
                    <Coins className="w-4 h-4" />
                    GET COINS
                  </Link>
                </Button>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/profile">{user?.username}</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={logout}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar / Sidebar Navigation */}
        <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-64 border-r border-border/40 md:block overflow-y-auto bg-background/50 backdrop-blur">
          <nav className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-primary/30 to-primary/10 text-primary border border-primary/30 shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
            
            <div className="mt-8 px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">AI ASSISTANTS</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>LuckyAI (Manager)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>SecurityAI</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <PageTransition animation="fade-in-up">
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/40 bg-background/95 backdrop-blur md:hidden supports-[backdrop-filter]:bg-background/80">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs py-2 px-3 rounded-lg transition-all duration-300 touch-none active:scale-95",
              location.pathname === item.path
                ? "text-primary bg-primary/10 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
        <Link
          to="/store"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs py-2 px-3 rounded-lg transition-all duration-300 touch-none active:scale-95",
            location.pathname === '/store'
              ? "text-primary bg-primary/10 font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-medium">Store</span>
        </Link>
      </nav>
    </div>
  );
};

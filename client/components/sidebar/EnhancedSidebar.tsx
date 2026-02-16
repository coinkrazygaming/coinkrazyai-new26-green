import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Home, User, Wallet, Settings, LogOut, Menu, X, Bell, MessageSquare,
  Gift, TrendingUp, Trophy, Shield, HelpCircle, Zap, Users, BarChart3,
  Lock, CreditCard, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

interface UnreadMessages {
  unreadCount: number;
  unreadNotifications: number;
}

const MENU_ITEMS = {
  player: [
    { icon: Home, label: 'Home', path: '/', category: 'main' },
    { icon: Zap, label: 'Games', path: '/games', category: 'games' },
    { icon: Trophy, label: 'Achievements', path: '/achievements', category: 'games' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', category: 'account' },
    { icon: Gift, label: 'Daily Bonus', path: '/daily-bonus', category: 'rewards' },
    { icon: Users, label: 'Referrals', path: '/referrals', category: 'rewards' },
    { icon: TrendingUp, label: 'Leaderboards', path: '/leaderboards', category: 'community' },
  ],
  admin: [
    { icon: BarChart3, label: 'Dashboard', path: '/admin', category: 'admin' },
    { icon: Users, label: 'Players', path: '/admin?tab=players', category: 'admin' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin?tab=financial', category: 'admin' },
    { icon: Bell, label: 'Notifications', path: '/admin?tab=notifications', category: 'admin' },
    { icon: Shield, label: 'Security', path: '/admin?tab=operations', category: 'admin' },
  ],
};

export const EnhancedSidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState<UnreadMessages>({ unreadCount: 0, unreadNotifications: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  const fetchUnreadCounts = async () => {
    try {
      const [msgRes, notifRes] = await Promise.all([
        apiCall('/messages/unread'),
        apiCall('/admin/notifications'),
      ]);

      setUnread({
        unreadCount: msgRes?.length || 0,
        unreadNotifications: notifRes?.filter((n: any) => !n.read_at).length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
      onClose();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = isAdmin ? MENU_ITEMS.admin : MENU_ITEMS.player;

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white z-50 overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900/95">
          <h1 className="text-xl font-bold">CoinKrazy</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile Card */}
        <div
          className="p-4 m-4 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-700/50 cursor-pointer hover:border-purple-600/70 transition-all"
          onClick={() => setShowProfileModal(true)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user.name || user.username}</p>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded px-2 py-1">
              <p className="text-gray-400">SC Balance</p>
              <p className="font-bold text-green-400">{Number(user.sc_balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded px-2 py-1">
              <p className="text-gray-400">GC Balance</p>
              <p className="font-bold text-yellow-400">{user.gc_balance || 0}</p>
            </div>
          </div>

          {user.kyc_verified && (
            <Badge className="mt-2 w-full justify-center bg-green-600/30 text-green-300 border-green-600/50">
              <Shield className="w-3 h-3 mr-1" />
              KYC Verified
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start text-left text-white border-slate-700 hover:bg-slate-700"
            onClick={() => handleNavigate('/wallet')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left text-white border-slate-700 hover:bg-slate-700 relative"
            onClick={() => handleNavigate('/messages')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {unread.unreadCount > 0 && (
              <Badge className="ml-auto bg-red-500 text-white text-xs">
                {unread.unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Settings & Logout */}
        <div className="p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start text-left text-white border-slate-700 hover:bg-slate-700"
            onClick={() => handleNavigate('/profile')}
          >
            <User className="w-4 h-4 mr-2" />
            Profile Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left text-white border-slate-700 hover:bg-slate-700"
            onClick={() => handleNavigate('/support')}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Support
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start text-left"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </>
            )}
          </Button>
        </div>

        {/* Footer Info */}
        <div className="p-4 text-xs text-gray-500 border-t border-slate-700 space-y-1">
          <p>© 2024 CoinKrazy</p>
          <p>Version 1.0.0</p>
        </div>
      </aside>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Player Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{user.name || user.username}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">SC Balance</p>
                <p className="text-lg font-bold text-green-600">{Number(user.sc_balance || 0).toFixed(2)}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">GC Balance</p>
                <p className="text-lg font-bold text-yellow-600">{user.gc_balance || 0}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                <Badge className="w-full justify-center">{user.status}</Badge>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">KYC Level</p>
                <Badge variant="secondary" className="w-full justify-center">
                  {user.kyc_level || 'None'}
                </Badge>
              </Card>
            </div>

            {/* Account Info */}
            <Card className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              {user.last_login && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="font-medium">{new Date(user.last_login).toLocaleString()}</span>
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleNavigate('/profile');
                  setShowProfileModal(false);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleNavigate('/profile?tab=banking');
                  setShowProfileModal(false);
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Methods
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

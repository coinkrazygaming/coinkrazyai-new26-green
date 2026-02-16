import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Bell, CheckCircle2, XCircle, Clock, AlertCircle, MessageSquare, Zap, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface AdminNotification {
  id: number;
  admin_id: number | null;
  ai_employee_id: string;
  message_type: 'alert' | 'request' | 'report' | 'task';
  subject: string;
  message: string;
  related_player_id: number | null;
  related_game_id: number | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'denied' | 'in_progress' | 'completed';
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminNotificationsProps {
  onNotificationRead?: (id: number) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onNotificationRead }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [assignedToAI, setAssignedToAI] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall<{ success: boolean; data?: AdminNotification[] }>(
        '/admin/v2/notifications/all'
      );
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredNotifications = (): AdminNotification[] => {
    switch (filter) {
      case 'pending':
        return notifications.filter(n => n.status === 'pending');
      case 'completed':
        return notifications.filter(n => ['approved', 'denied', 'completed'].includes(n.status));
      case 'unread':
        return notifications.filter(n => !n.read_at);
      default:
        return notifications;
    }
  };

  const handleApprove = async () => {
    if (!selectedNotification) return;

    try {
      setIsProcessing(true);
      await apiCall('/admin/notifications/approve', {
        method: 'POST',
        body: JSON.stringify({ notificationId: selectedNotification.id, reason: actionReason }),
      });
      toast.success('Notification approved!');
      await fetchNotifications();
      setSelectedNotification(null);
      setActionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve notification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedNotification) return;

    try {
      setIsProcessing(true);
      await apiCall('/admin/notifications/deny', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: selectedNotification.id,
          reason: actionReason || 'Denied by admin',
        }),
      });
      toast.success('Notification denied!');
      await fetchNotifications();
      setSelectedNotification(null);
      setActionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to deny notification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedNotification || !assignedToAI) return;

    try {
      setIsProcessing(true);
      await apiCall('/admin/notifications/assign', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: selectedNotification.id,
          assignedToAI,
        }),
      });
      toast.success(`Task assigned to ${assignedToAI}!`);
      await fetchNotifications();
      setSelectedNotification(null);
      setAssignedToAI('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedNotification) return;

    try {
      setIsProcessing(true);
      await apiCall('/admin/notifications/resolve', {
        method: 'POST',
        body: JSON.stringify({
          notificationId: selectedNotification.id,
          answer: actionReason || 'Issue resolved',
        }),
      });
      toast.success('Notification resolved!');
      await fetchNotifications();
      setSelectedNotification(null);
      setActionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve notification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiCall('/admin/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notificationId: id }),
      });
      onNotificationRead?.(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'denied':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'request':
        return '📋';
      case 'report':
        return '📊';
      case 'task':
        return '✅';
      default:
        return '📢';
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Admin Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Messages and tasks from AI employees
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {filteredNotifications.length}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'unread', 'completed'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400">No notifications to display</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                !notification.read_at ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => {
                setSelectedNotification(notification);
                if (!notification.read_at) {
                  handleMarkAsRead(notification.id);
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{getMessageTypeIcon(notification.message_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.subject}</h3>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {getStatusIcon(notification.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          From: {notification.ai_employee_id}
                        </p>
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">
                      {notification.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedNotification && (
        <Card className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Action Panel</span>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedNotification(null);
                  setActionReason('');
                  setAssignedToAI('');
                }}
              >
                ✕
              </Button>
            </CardTitle>
            <CardDescription>
              Manage this notification - {selectedNotification.subject}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Possible Actions */}
            <div className="space-y-3">
              {selectedNotification.status === 'pending' && (
                <>
                  {/* Approval Action */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">
                      Approve This Request
                    </p>
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Deny Action */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-3">
                      Deny This Request
                    </p>
                    <textarea
                      placeholder="Reason for denial..."
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      className="w-full mb-3 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm dark:bg-slate-900 dark:text-white"
                      rows={3}
                    />
                    <Button
                      onClick={handleDeny}
                      disabled={isProcessing}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Deny
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Assign to AI */}
                  {selectedNotification.message_type === 'task' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        Assign to AI Employee
                      </p>
                      <select
                        value={assignedToAI}
                        onChange={e => setAssignedToAI(e.target.value)}
                        className="w-full mb-3 px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">Select AI Employee...</option>
                        <option value="LuckyAi">LuckyAi</option>
                        <option value="SlotsAI">SlotsAI</option>
                        <option value="SecurityAI">SecurityAI</option>
                        <option value="ComplianceAI">ComplianceAI</option>
                      </select>
                      <Button
                        onClick={handleAssign}
                        disabled={isProcessing || !assignedToAI}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Assign Task
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Generic Resolve Action */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  Resolve or Provide Answer
                </p>
                <textarea
                  placeholder="Your response or resolution..."
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg text-sm dark:bg-slate-900 dark:text-white"
                  rows={3}
                />
                <Button
                  onClick={handleResolve}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Resolve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

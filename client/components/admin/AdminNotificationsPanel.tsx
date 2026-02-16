import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  MessageSquare,
  Check,
  X,
  Assign,
  Reply,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';

interface AdminNotification {
  id: number;
  ai_employee_id: string;
  message_type: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  player_username?: string;
  game_name?: string;
  created_at: string;
  read_at?: string;
}

export function AdminNotificationsPanel() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [activeStatus]);

  const fetchNotifications = async () => {
    try {
      const response = await adminApiCall<any>(
        `/admin-notifications?status=${activeStatus}`
      );
      setNotifications(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (
    notificationId: number,
    actionType: string,
    actionData?: Record<string, any>
  ) => {
    try {
      setActionLoading(notificationId);
      await adminApiCall(
        `/admin-notifications/${notificationId}/action`,
        {
          method: 'POST',
          body: JSON.stringify({
            action_type: actionType,
            action_data: actionData,
          }),
        }
      );

      toast.success(`Action "${actionType}" completed`);
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete action');
    } finally {
      setActionLoading(null);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await adminApiCall(
        `/admin-notifications/${notificationId}/read`,
        { method: 'POST' }
      );
      fetchNotifications();
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Notifications</h2>
        <p className="text-muted-foreground mt-1">
          Messages from AI employees and system alerts
        </p>
      </div>

      <Tabs
        value={activeStatus}
        onValueChange={setActiveStatus}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            <AlertCircle className="w-4 h-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            <Clock className="w-4 h-4 mr-2" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="denied">
            <XCircle className="w-4 h-4 mr-2" />
            Denied
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Check className="w-4 h-4 mr-2" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeStatus} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No notifications in this category</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map(notif => (
              <Card
                key={notif.id}
                className={`border-2 transition-all ${
                  notif.read_at ? 'opacity-75' : 'ring-1 ring-primary/20'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="text-xs">
                          {notif.ai_employee_id}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs border ${getPriorityColor(
                            notif.priority
                          )}`}
                        >
                          {notif.priority.toUpperCase()}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          {getStatusIcon(notif.status)}
                          {notif.status}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{notif.subject}</CardTitle>
                      {notif.player_username && (
                        <CardDescription>
                          Player: {notif.player_username}
                          {notif.game_name && ` • Game: ${notif.game_name}`}
                        </CardDescription>
                      )}
                    </div>
                    {!notif.read_at && (
                      <Button
                        onClick={() => markAsRead(notif.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Message Content */}
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {notif.message}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {notif.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleAction(notif.id, 'approve')}
                        disabled={actionLoading === notif.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === notif.id ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3 mr-2" />
                        )}
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleAction(notif.id, 'deny')}
                        disabled={actionLoading === notif.id}
                        variant="outline"
                        className="border-red-500/30 text-red-700 hover:bg-red-500/10"
                      >
                        {actionLoading === notif.id ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <X className="w-3 h-3 mr-2" />
                        )}
                        Deny
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleAction(notif.id, 'assign')}
                        disabled={actionLoading === notif.id}
                        variant="outline"
                      >
                        {actionLoading === notif.id ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Assign className="w-3 h-3 mr-2" />
                        )}
                        Assign to AI
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleAction(notif.id, 'resolve')}
                        disabled={actionLoading === notif.id}
                        variant="outline"
                      >
                        {actionLoading === notif.id ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          <Reply className="w-3 h-3 mr-2" />
                        )}
                        Resolve
                      </Button>
                    </div>
                  )}

                  {/* Status Badge */}
                  {notif.status !== 'pending' && (
                    <div className={`p-3 rounded-lg border text-sm ${getPriorityColor(
                      notif.priority
                    )}`}>
                      Status: <strong>{notif.status.toUpperCase()}</strong>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

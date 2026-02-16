import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Trash2, Search, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  senderName?: string;
  senderUsername?: string;
}

interface MessageThread {
  userId: number;
  username: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}

interface UserMessagingProps {
  currentUserId?: number;
  onClose?: () => void;
}

export const UserMessaging: React.FC<UserMessagingProps> = ({ currentUserId, onClose }) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMessageThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.userId);
    }
  }, [selectedThread]);

  const fetchMessageThreads = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall<{ success: boolean; data?: MessageThread[] }>(
        '/messages/threads'
      );
      if (response.success && response.data) {
        setThreads(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch message threads:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const response = await apiCall<{ success: boolean; data?: Message[] }>(
        `/messages/conversation?userId=${userId}`
      );
      if (response.success && response.data) {
        setMessages(response.data);

        // Mark messages as read
        const unreadMessages = response.data.filter(m => !m.is_read);
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(msg => {
            apiCall('/messages/read', {
              method: 'POST',
              body: JSON.stringify({ messageId: msg.id }),
            }).catch(err => console.error('Failed to mark message as read:', err));
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedThread) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setIsSending(true);
      const response = await apiCall<{ success: boolean; data?: Message }>(
        '/messages/send',
        {
          method: 'POST',
          body: JSON.stringify({
            recipientId: selectedThread.userId,
            message: messageText,
          }),
        }
      );

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data]);
        setMessageText('');
        toast.success('Message sent!');
        await fetchMessageThreads();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Delete this message?')) return;

    try {
      await apiCall(`/messages/${messageId}`, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const filteredThreads = threads.filter(
    thread =>
      thread.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Threads List */}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Messages
          </CardTitle>
          <CardDescription>Your conversations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2 p-4 -m-4 p-4">
          {/* Search */}
          <div className="relative mb-4 sticky top-0 z-10 -m-4 p-4 bg-white dark:bg-slate-950">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <button
                key={thread.userId}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedThread?.userId === thread.userId
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{thread.name || thread.username}</p>
                  {thread.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {thread.lastMessage}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(thread.lastMessageTime).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Conversation View */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedThread.name || selectedThread.username}</CardTitle>
                  <CardDescription>@{selectedThread.username}</CardDescription>
                </div>
                {onClose && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    ✕
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUserId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs opacity-75">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {message.sender_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="h-6 w-6 p-0 opacity-75 hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t bg-white dark:bg-slate-950">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to get started</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

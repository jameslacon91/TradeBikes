import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { MessageSquare, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  auctionId?: number;
  content: string;
  read: boolean;
  createdAt: string;
  otherUser?: {
    id: number;
    username: string;
    companyName: string;
  };
};

type Conversation = {
  userId: number;
  username: string;
  companyName: string;
  messages: Message[];
  unreadCount: number;
  lastMessage: Message;
};

const MessagesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Record<number, Conversation>>({});

  // Fetch all messages for the current user
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      return res.json() as Promise<Message[]>;
    },
    enabled: !!user,
  });

  // Mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('PATCH', `/api/messages/${messageId}/read`);
      if (!res.ok) {
        throw new Error('Failed to mark message as read');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string; auctionId?: number }) => {
      const res = await apiRequest('POST', '/api/messages', data);
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Organize messages into conversations by user
  useEffect(() => {
    if (messages) {
      const newConversations: Record<number, Conversation> = {};
      
      messages.forEach(message => {
        // Determine the other user in the conversation
        const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
        const isIncoming = message.senderId !== user?.id;
        
        // Get or create the conversation
        if (!newConversations[otherUserId]) {
          const otherUser = message.otherUser ?? {
            id: otherUserId,
            username: `User ${otherUserId}`,
            companyName: `Company ${otherUserId}`
          };
          
          newConversations[otherUserId] = {
            userId: otherUserId,
            username: otherUser.username,
            companyName: otherUser.companyName,
            messages: [],
            unreadCount: 0,
            lastMessage: message
          };
        }
        
        // Add message to conversation
        newConversations[otherUserId].messages.push(message);
        
        // Track unread count
        if (isIncoming && !message.read) {
          newConversations[otherUserId].unreadCount += 1;
        }
        
        // Update last message if this one is newer
        const currentLastMessage = newConversations[otherUserId].lastMessage;
        if (new Date(message.createdAt) > new Date(currentLastMessage.createdAt)) {
          newConversations[otherUserId].lastMessage = message;
        }
      });
      
      // Sort messages in each conversation by date (oldest first)
      Object.values(newConversations).forEach(conversation => {
        conversation.messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      setConversations(newConversations);
      
      // If we don't have a selected conversation but have conversations, select the first one
      if (selectedConversation === null && Object.keys(newConversations).length > 0) {
        // Find the conversation with the most recent message
        const mostRecentConversationId = Object.values(newConversations)
          .sort((a, b) => 
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
          )[0]?.userId;
        
        setSelectedConversation(mostRecentConversationId);
      }
    }
  }, [messages, user?.id, selectedConversation]);

  // Automatically mark messages as read when a conversation is selected
  useEffect(() => {
    if (selectedConversation && conversations[selectedConversation]) {
      const unreadMessages = conversations[selectedConversation].messages
        .filter(msg => msg.receiverId === user?.id && !msg.read)
        .map(msg => msg.id);
      
      // Mark each unread message as read
      unreadMessages.forEach(messageId => {
        markAsReadMutation.mutate(messageId);
      });
    }
  }, [selectedConversation, conversations, user?.id, markAsReadMutation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) {
      return;
    }
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: newMessage.trim()
    });
  };

  // Calculate total unread messages
  const totalUnreadMessages = Object.values(conversations).reduce(
    (total, conversation) => total + conversation.unreadCount, 
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading messages. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Conversations List */}
      <div className="md:col-span-1 overflow-y-auto max-h-[70vh] border border-gray-700 rounded-md">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white flex items-center">
            <MessageSquare className="mr-2" />
            Messages 
            {totalUnreadMessages > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnreadMessages}
              </Badge>
            )}
          </h3>
        </div>
        <div className="divide-y divide-gray-700">
          {Object.values(conversations).length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No messages found.
            </div>
          ) : (
            Object.values(conversations)
              // Sort by last message date (newest first)
              .sort((a, b) => 
                new Date(b.lastMessage.createdAt).getTime() - 
                new Date(a.lastMessage.createdAt).getTime()
              )
              .map(conversation => (
                <div 
                  key={conversation.userId}
                  className={`p-3 cursor-pointer hover:bg-gray-800 ${
                    selectedConversation === conversation.userId ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.userId)}
                >
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-primary text-white">
                        {conversation.companyName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-white truncate">
                          {conversation.companyName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(conversation.lastMessage.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-300 truncate">
                        {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          {conversation.unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="md:col-span-2 flex flex-col h-full">
        {selectedConversation && conversations[selectedConversation] ? (
          <Card className="flex flex-col h-full border border-gray-700 bg-gray-900">
            <CardHeader className="bg-gray-800 border-b border-gray-700 py-4">
              <CardTitle className="text-white flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-primary text-white">
                    {conversations[selectedConversation].companyName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conversations[selectedConversation].companyName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversations[selectedConversation].messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex items-start ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.senderId === user?.id 
                        ? 'bg-primary text-white ml-auto' 
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t border-gray-700 p-3 mt-auto">
              <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                <Textarea
                  className="flex-1 bg-gray-800 border-gray-700 focus:border-gray-500"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  className="h-full"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full border border-gray-700 bg-gray-900">
            <p className="text-gray-400">Select a conversation to view messages</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
import { useState, useEffect, useOptimistic, useCallback } from "react";
import { useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { supabaseClient } from "@/lib/supabase-client";
import MessageList, { Message } from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import { RealtimeChannel } from "@supabase/supabase-js";

enum ConnectionStatus {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

export default function ChatTab() {
  const { id: sweepstakeId } = useParams<{ id: string }>();
  const { data: currentUser } = trpc.auth.me.useQuery();

  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, newMessage]
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.CONNECTING
  );
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.chat.getMessages.useInfiniteQuery(
      { sweepstakeId: sweepstakeId || "", limit: 50 },
      {
        enabled: !!sweepstakeId,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (newMessage) => {
      // Add the confirmed message to the messages list
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    },
  });

  useEffect(() => {
    if (!data) return;

    const allMessages = data.pages.flatMap((page) => page.messages);
    setMessages(allMessages);
  }, [data]);

  useEffect(() => {
    if (!sweepstakeId || !currentUser) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        channel = supabaseClient
          .channel(`chat:${sweepstakeId}`, {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chat_messages",
              filter: `sweepstake_id=eq.${sweepstakeId}`,
            },
            async (payload) => {
              const newMessage = payload.new as {
                id: string;
                sweepstake_id: string;
                user_id: string;
                message: string;
                created_at: string;
              };

              // Skip if this is our own message - it's already been added via onSuccess
              if (newMessage.user_id === currentUser.id) {
                return;
              }

              // Fetch user data for the message sender
              const { data: userData } = await supabaseClient
                .from("users")
                .select("display_name, avatar_url")
                .eq("id", newMessage.user_id)
                .single();

              const message: Message = {
                id: newMessage.id,
                message: newMessage.message,
                createdAt: new Date(newMessage.created_at),
                userId: newMessage.user_id,
                displayName: userData?.display_name || null,
                avatarUrl: userData?.avatar_url || null,
              };

              setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === message.id);
                if (exists) return prev;
                return [...prev, message];
              });

              setShowNewMessageIndicator(true);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setConnectionStatus(ConnectionStatus.CONNECTED);
            } else if (status === "CHANNEL_ERROR") {
              setConnectionStatus(ConnectionStatus.ERROR);
            } else if (status === "CLOSED") {
              setConnectionStatus(ConnectionStatus.DISCONNECTED);
            }
          });
      } catch (error) {
        console.error("Error setting up realtime subscription:", error);
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [sweepstakeId, currentUser]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!sweepstakeId || !currentUser) return;

      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        message,
        createdAt: new Date(),
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatarUrl: null,
        isOptimistic: true,
      };

      // Optimistically add the message
      addOptimisticMessage(optimisticMessage);

      // Send to server
      sendMessageMutation.mutate({
        sweepstakeId,
        message,
      });
    },
    [sweepstakeId, currentUser, sendMessageMutation, addOptimisticMessage]
  );

  const handleScrollToBottom = () => {
    setShowNewMessageIndicator(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "bg-green-500";
      case ConnectionStatus.CONNECTING:
        return "bg-yellow-500 animate-pulse";
      case ConnectionStatus.DISCONNECTED:
      case ConnectionStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.DISCONNECTED:
        return "Disconnected";
      case ConnectionStatus.ERROR:
        return "Connection error";
      default:
        return "Unknown";
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-h-[80vh] min-h-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{getStatusText()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden mb-4">
        <MessageList
          messages={optimisticMessages}
          currentUserId={currentUser.id}
          isLoading={isFetchingNextPage}
          hasMore={hasNextPage}
          onLoadMore={fetchNextPage}
          showNewMessageIndicator={showNewMessageIndicator}
          onScrollToBottom={handleScrollToBottom}
        />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending || connectionStatus !== ConnectionStatus.CONNECTED}
      />
    </div>
  );
}

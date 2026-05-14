import { useEffect, useRef } from "react";
import { getInitials } from "@/utils/user-utils";

export interface Message {
  id: string;
  message: string;
  createdAt: Date;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOptimistic?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  showNewMessageIndicator?: boolean;
  onScrollToBottom?: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  showNewMessageIndicator,
  onScrollToBottom,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      const isAtBottom =
        containerRef.current.scrollHeight - containerRef.current.scrollTop <=
        containerRef.current.clientHeight + 100;

      if (isAtBottom || messages[messages.length - 1]?.userId === currentUserId) {
        scrollToBottom();
      }
    }
  }, [messages, currentUserId]);

  const handleScroll = () => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoading) return;

    // Check if scrolled to bottom and hide indicator
    const isAtBottom =
      containerRef.current.scrollHeight - containerRef.current.scrollTop <=
      containerRef.current.clientHeight + 50;

    if (isAtBottom && onScrollToBottom) {
      onScrollToBottom();
    }

    // Load more messages when scrolled to top
    if (containerRef.current.scrollTop === 0) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      onLoadMore();
    }
  };

  useEffect(() => {
    if (!isLoading && containerRef.current && prevScrollHeightRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = scrollDiff;
      prevScrollHeightRef.current = 0;
    }
  }, [isLoading]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
          No messages yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Be the first to start the conversation!
        </p>
      </div>
    );
  }

  const isAtBottom =
    containerRef.current != null &&
    containerRef.current.scrollHeight - containerRef.current.scrollTop <=
      containerRef.current.clientHeight + 50;

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto space-y-1 pb-4 pr-2 scroll-smooth scrollbar-pretty"
      >
        {isLoading && hasMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwnMessage = msg.userId === currentUserId;
          const showUsername =
            !isOwnMessage && (index === 0 || messages[index - 1]?.userId !== msg.userId);
          const showAvatar = index === 0 || messages[index + 1]?.userId !== msg.userId;
          const isNewDay =
            index === 0 ||
            new Date(messages[index - 1].createdAt).toDateString() !==
              new Date(msg.createdAt).toDateString();

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"} ${msg.isOptimistic ? "opacity-60" : ""}`}
            >
              {!isOwnMessage ? (
                showAvatar ? (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mb-1 ${
                      isOwnMessage
                        ? "bg-gradient-to-br from-primary to-primary-600"
                        : "bg-gradient-to-br from-gray-400 to-gray-600"
                    }`}
                  >
                    {getInitials(msg.displayName)}
                  </div>
                ) : (
                  <div className="w-8" />
                )
              ) : null}

              <div className={`flex flex-col w-full ${isOwnMessage ? "items-end" : "items-start"}`}>
                {isNewDay && (
                  <div className="flex items-center my-4 w-full">
                    <hr className="flex-grow border-gray-300 dark:border-gray-700" />
                    <span className="mx-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour12: false,
                      })}
                    </span>
                    <hr className="flex-grow border-gray-300 dark:border-gray-700" />
                  </div>
                )}

                {!isOwnMessage && showUsername && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-4 px-3">
                    {msg.displayName || "Anonymous"}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    isOwnMessage
                      ? "bg-primary text-white"
                      : "bg-neutral-100 dark:bg-neutral-900 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm [overflow-wrap:anywhere] hyphens-auto">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {!isAtBottom && showNewMessageIndicator ? (
        <button
          onClick={() => {
            scrollToBottom(true);
            onScrollToBottom?.();
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-600 transition-all flex items-center gap-2 text-sm font-semibold animate-bounce"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          New messages
        </button>
      ) : null}
    </div>
  );
}

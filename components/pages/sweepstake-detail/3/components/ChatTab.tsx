export default function ChatTab() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-gray-400"
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
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Chat Coming Soon</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Real-time chat will allow you to discuss matches, banter with friends, and celebrate
        victories together during the tournament.
      </p>
    </div>
  );
}

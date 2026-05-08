export default function QuickCreate() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Create a new sweepstake or enter join code..."
          className="flex-1 bg-gray-100 dark:bg-gray-900 border-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          readOnly
        />
        <button className="btn-primary px-6 py-3">Post</button>
      </div>
    </div>
  );
}

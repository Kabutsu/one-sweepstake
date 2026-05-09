interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="glass p-8 shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50 text-center">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">{description}</p>
    </div>
  );
}

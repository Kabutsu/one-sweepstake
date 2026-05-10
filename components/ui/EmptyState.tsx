interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{description}</p>
    </div>
  );
}

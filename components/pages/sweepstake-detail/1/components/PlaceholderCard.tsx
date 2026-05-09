interface PlaceholderCardProps {
  title: string;
  icon: string;
  description: string;
}

export default function PlaceholderCard({ title, icon, description }: PlaceholderCardProps) {
  return (
    <div className="glass p-6 shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50">
      <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white flex items-center space-x-2">
        <span className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xl">
          {icon}
        </span>
        <span>{title}</span>
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

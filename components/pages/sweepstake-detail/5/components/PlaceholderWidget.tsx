interface PlaceholderWidgetProps {
  title: string;
  icon: string;
  description: string;
  compact?: boolean;
}

export default function PlaceholderWidget({
  title,
  icon,
  description,
  compact = false,
}: PlaceholderWidgetProps) {
  return (
    <div
      className={`glass shadow-xl rounded-2xl border border-dashed border-gray-300/50 dark:border-gray-700/50 ${compact ? "p-4" : "p-6"} text-center`}
    >
      <div
        className={`${compact ? "w-12 h-12 text-2xl" : "w-16 h-16 text-3xl"} bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3`}
      >
        {icon}
      </div>
      <h3
        className={`font-bold text-gray-900 dark:text-white mb-1 ${compact ? "text-sm" : "text-base"}`}
      >
        {title}
      </h3>
      <p className={`text-gray-500 dark:text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  children: React.ReactNode;
}

export default function StatCard({ label, children }: StatCardProps) {
  return (
    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  );
}

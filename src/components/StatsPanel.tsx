import { CardItem } from '../types';
import { FileText, Bell, Link2, FolderHeart } from 'lucide-react';

interface StatsPanelProps {
  items: CardItem[];
}

export default function StatsPanel({ items }: StatsPanelProps) {
  const notesCount = items.filter((item) => item.type === 'nota').length;
  const remindersPending = items.filter((item) => item.type === 'lembrete' && !item.completed).length;
  const linksCount = items.filter((item) => item.type === 'link').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="stats-dashboard">
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300">
          <FolderHeart className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-neutral-450 uppercase tracking-wider font-semibold">Total Geral</p>
          <p className="text-xl font-display font-semibold text-neutral-800 dark:text-white">{items.length}</p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300">
          <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div>
          <p className="text-xs text-neutral-450 uppercase tracking-wider font-semibold">Anotações</p>
          <p className="text-xl font-display font-semibold text-neutral-800 dark:text-white">{notesCount}</p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300">
          <Bell className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs text-neutral-450 uppercase tracking-wider font-semibold">Lembretes Ativos</p>
          <p className="text-xl font-display font-semibold text-neutral-800 dark:text-white">{remindersPending}</p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300">
          <Link2 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-neutral-450 uppercase tracking-wider font-semibold">Links Salvos</p>
          <p className="text-xl font-display font-semibold text-neutral-800 dark:text-white">{linksCount}</p>
        </div>
      </div>
    </div>
  );
}

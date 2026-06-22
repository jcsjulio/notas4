import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Loader2, Link, Plus } from 'lucide-react';

interface AiSource {
  title: string;
  uri: string;
}

interface AiSearchPanelProps {
  isUnlocked: boolean;
  onAddAiCard: (title: string, content: string, sourceNotes: string) => void;
}

export default function AiSearchPanel({ isUnlocked, onAddAiCard }: AiSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [sources, setSources] = useState<AiSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setSources([]);

    try {
      const response = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Alguma coisa deu errado durante a consulta.');
      }

      const data = await response.json();
      setSearchResult(data.text);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao consultar a IA com busca integrada. Certifique-se de que a chave da API está configurada.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNote = () => {
    if (!searchResult) return;
    // Format sources nicely as references inside the content
    const sourcesHeading = sources.length > 0
      ? `\n\n**Fontes de busca:**\n` + sources.map(s => `- [${s.title}](${s.uri})`).join('\n')
      : '';

    // Create a title based on the query (capped)
    const title = query.length > 30 ? query.substring(0, 30) + '...' : query;

    onAddAiCard(
      `Pesquisa: ${title}`,
      searchResult + sourcesHeading,
      `Resultados gerados via IA baseada em Google Search sobre: ${query}`
    );

    // Reset and close
    setQuery('');
    setSearchResult(null);
    setSources([]);
    setIsOpen(false);
  };

  return (
    <div className="w-full bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-4 mb-6 shadow-sm" id="ai-search-assistant">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-355">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-neutral-800 dark:text-white flex items-center gap-1.5 text-sm sm:text-base">
              Grounded AI Search Assistant <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Google Search</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Faça perguntas sobre fatos recentes e salve a resposta como nota fundamentada em tempo real.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold px-3 py-1 bg-white hover:bg-neutral-50 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-emerald-800 dark:text-emerald-400 border border-neutral-150 dark:border-neutral-800 rounded-lg transition"
        >
          {isOpen ? 'Recolher' : 'Abrir Assistente'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-3 pt-3 border-t border-emerald-100/60 dark:border-emerald-900/40"
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Qual foi o resultado do último lançamento espacial? Ou: Quem escreveu o livro Dom Casmurro?"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-neutral-800 dark:text-white"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin-slow" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Pesquisar</span>
                  </>
                )}
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-red-100/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs font-medium text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-xl space-y-3"
                  id="search-result-display"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Resposta Sintetizada
                    </span>
                    {isUnlocked ? (
                      <button
                        onClick={handleSaveAsNote}
                        className="text-xs font-semibold px-2.5 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Salvar como Card
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-400 border border-neutral-250 px-2 py-0.5 rounded-lg font-medium">
                        Desbloqueie edição para salvar como Nota
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-line">
                    {searchResult}
                  </div>

                  {sources.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Link className="w-3 h-3 text-emerald-600" /> Fontes Consultadas via Google Grounding:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-neutral-850 dark:hover:bg-emerald-950/40 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center gap-1 transition max-w-[240px] truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Plus,
  Lock,
  Unlock,
  Sun,
  Moon,
  Filter,
  Layers,
  FileText,
  Bell,
  Link2,
  FolderOpen,
  ArrowUpDown,
  Laptop
} from 'lucide-react';
import { CardItem, ItemType } from './types';
import PasswordLock from './components/PasswordLock';
import StatsPanel from './components/StatsPanel';
import AiSearchPanel from './components/AiSearchPanel';
import ItemForm from './components/ItemForm';
import ItemCard from './components/ItemCard';
import { db, CARDS_COLLECTION, CONFIG_COLLECTION, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_ITEMS: CardItem[] = [
  {
    id: 'demo-1',
    type: 'nota',
    title: 'Seja bem-vindo(a) ao seu Painel de Anotações!',
    content: 'Este é um espaço seguro e responsivo para arquivar suas ideias, tarefas ou referências de modo descomplicado.\n\n🎙️ Experimente clicar no ícone de Áudio (volume) no cabeçalho deste card para escutar uma narração da IA (Gemini TTS) falando o conteúdo em português de forma natural!',
    createdAt: '2026-06-22',
    aiGenerated: true
  },
  {
    id: 'demo-2',
    type: 'lembrete',
    title: 'Revisar metas de hospedagem do GitHub Pages',
    content: 'Testar responsividade final do projeto e compilar o build de produção sem pendências de arquivos ou logs.',
    date: '2026-06-28',
    createdAt: '2026-06-22',
    completed: false
  },
  {
    id: 'demo-3',
    type: 'link',
    title: 'Comunidade Oficial Google AI Studio',
    content: 'https://ai.studio',
    createdAt: '2026-06-22'
  }
];


export default function App() {
  // Persistence states
  const [items, setItems] = useState<CardItem[]>(() => {
    try {
      const saved = localStorage.getItem('pessoal_cards_v1');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("FALHA AO LER LOCALSTORAGE 'pessoal_cards_v1':", e);
    }
    return DEFAULT_ITEMS;
  });

  // Master password loaded from Firestore
  const [dbPassword, setDbPassword] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pessoal_admin_password');
    } catch (_) {
      return null;
    }
  });

  const [isPasswordSet, setIsPasswordSet] = useState(() => {
    try {
      return !!localStorage.getItem('pessoal_admin_password');
    } catch (e) {
      console.warn("FALHA AO LER 'pessoal_admin_password':", e);
      return false;
    }
  });

  // Admin access unlocked state (default locked on load for privacy)
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Layout & UI view configs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | ItemType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'date-target'>('newest');

  // Modal forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CardItem | null>(null);

  // Dark/Light Theme selection
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      console.warn("FALHA AO LER 'theme':", e);
      return false;
    }
  });

  const [syncError, setSyncError] = useState<string | null>(null);

  // Effect to serialize cards list
  useEffect(() => {
    localStorage.setItem('pessoal_cards_v1', JSON.stringify(items));
  }, [items]);

  // Load master password from Firestore (or fallback to localstorage)
  useEffect(() => {
    const configDoc = doc(db, CONFIG_COLLECTION, 'lock');
    const unsubscribe = onSnapshot(configDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.password === 'string') {
          setDbPassword(data.password);
          setIsPasswordSet(true);
          try {
            localStorage.setItem('pessoal_admin_password', data.password);
          } catch (err) {
            console.warn("Local storage write failed:", err);
          }
        }
      }
    }, (error) => {
      console.warn("Firestore config lock snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COLLECTION}/lock`);
    });

    return () => unsubscribe();
  }, []);

  // Load real-time items from Firestore
  useEffect(() => {
    const cardsCol = collection(db, CARDS_COLLECTION);
    const unsubscribe = onSnapshot(cardsCol, (snapshot) => {
      const dbItems: CardItem[] = [];
      snapshot.forEach((docItem) => {
        dbItems.push({
          ...(docItem.data() as CardItem),
          id: docItem.id
        });
      });
      if (dbItems.length > 0) {
        setItems(dbItems);
      }
      setSyncError(null);
    }, (error) => {
      console.warn("Firestore onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, CARDS_COLLECTION);
      setSyncError(error.message || String(error));
    });

    return () => unsubscribe();
  }, []);

  // Effect to apply document dark styles
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth unlock controllers
  const handleUnlock = (password: string): boolean => {
    const savedPassword = dbPassword || localStorage.getItem('pessoal_admin_password');
    if (savedPassword === password) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const handleSetPassword = async (password: string) => {
    try {
      localStorage.setItem('pessoal_admin_password', password);
    } catch (err) {
      console.warn("Local storage write failed:", err);
    }
    setIsPasswordSet(true);
    setIsUnlocked(true);
    setDbPassword(password);

    // Sync password configuration to Firestore
    try {
      await setDoc(doc(db, CONFIG_COLLECTION, 'lock'), { password });
      setSyncError(null);
    } catch (error: any) {
      console.warn("Firestore write error during set password:", error);
      handleFirestoreError(error, OperationType.WRITE, `${CONFIG_COLLECTION}/lock`);
      setSyncError(error.message || String(error));
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
  };

  // Card items operations
  const handleSaveItem = async (data: Partial<CardItem>) => {
    if (!isUnlocked) return;

    if (data.id) {
      // Edit item locally
      const existingItem = items.find((item) => item.id === data.id);
      if (!existingItem) return;

      const updated: CardItem = {
        ...existingItem,
        title: data.title!,
        content: data.content!,
        type: data.type!,
        date: data.date || '',
        imageUrl: data.imageUrl || '',
      };

      // Clean properties
      Object.keys(updated).forEach(
        (key) => (updated as any)[key] === undefined && delete (updated as any)[key]
      );

      // Update local state first
      setItems((prev) => prev.map((item) => (item.id === data.id ? updated : item)));

      // Synced database set Doc
      try {
        await setDoc(doc(db, CARDS_COLLECTION, data.id), updated, { merge: true });
        setSyncError(null);
      } catch (error: any) {
        console.warn("Firestore write error during edit:", error);
        handleFirestoreError(error, OperationType.WRITE, `${CARDS_COLLECTION}/${data.id}`);
        setSyncError(error.message || String(error));
      }
    } else {
      // Add new item locally
      const randomId = `card-${Date.now()}`;
      const newItem: CardItem = {
        id: randomId,
        title: data.title!,
        content: data.content!,
        type: data.type!,
        date: data.date || '',
        imageUrl: data.imageUrl || '',
        createdAt: new Date().toISOString().split('T')[0],
        completed: data.type === 'lembrete' ? false : undefined,
      };

      // Clean properties
      Object.keys(newItem).forEach(
        (key) => (newItem as any)[key] === undefined && delete (newItem as any)[key]
      );

      // Update local state first
      setItems((prev) => [newItem, ...prev]);

      // Synced database set Doc
      try {
        await setDoc(doc(db, CARDS_COLLECTION, randomId), newItem);
        setSyncError(null);
      } catch (error: any) {
        console.warn("Firestore write error during create:", error);
        handleFirestoreError(error, OperationType.WRITE, `${CARDS_COLLECTION}/${randomId}`);
        setSyncError(error.message || String(error));
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (!isUnlocked) return;
    
    // Update local state first
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteDoc(doc(db, CARDS_COLLECTION, id));
      setSyncError(null);
    } catch (error: any) {
      console.warn("Firestore delete error:", error);
      handleFirestoreError(error, OperationType.DELETE, `${CARDS_COLLECTION}/${id}`);
      setSyncError(error.message || String(error));
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (!isUnlocked) return;
    const existingItem = items.find((item) => item.id === id);
    if (!existingItem) return;

    const newValue = !existingItem.completed;

    // Update local state first
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: newValue } : item))
    );

    try {
      await setDoc(doc(db, CARDS_COLLECTION, id), {
        completed: newValue
      }, { merge: true });
      setSyncError(null);
    } catch (error: any) {
      console.warn("Firestore write error toggle complete:", error);
      handleFirestoreError(error, OperationType.WRITE, `${CARDS_COLLECTION}/${id}`);
      setSyncError(error.message || String(error));
    }
  };

  const handleAddAiCard = async (title: string, content: string, summary: string) => {
    if (!isUnlocked) return;
    const id = `ai-${Date.now()}`;
    const aiNote: CardItem = {
      id,
      type: 'nota',
      title,
      content,
      aiGenerated: true,
      aiSummary: summary,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Clean properties
    Object.keys(aiNote).forEach(
      (key) => (aiNote as any)[key] === undefined && delete (aiNote as any)[key]
    );

    // Update local state first
    setItems((prev) => [aiNote, ...prev]);

    try {
      await setDoc(doc(db, CARDS_COLLECTION, id), aiNote);
      setSyncError(null);
    } catch (error: any) {
      console.warn("Firestore write error AI note:", error);
      handleFirestoreError(error, OperationType.WRITE, `${CARDS_COLLECTION}/${id}`);
      setSyncError(error.message || String(error));
    }
  };

  const handleOpenEdit = (item: CardItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Filtering lists logic
  const filteredItems = items
    .filter((item) => {
      // Type filtering
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;

      // Searching query filtering
      const searchLower = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.date && item.date.includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date-target') {
        // Items with date go first, ordered ascending, empty date elements at the back
        if (a.date && b.date) return a.date.localeCompare(b.date);
        if (a.date) return -1;
        if (b.date) return 1;
      }
      // Default: By newest insertion date
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 font-sans transition-colors duration-300">
      {/* Dynamic Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-150 dark:border-neutral-850 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-700/10 text-emerald-800 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                Notas
              </h1>
              <p className="text-[10px] text-neutral-450 tracking-wider uppercase font-semibold hidden sm:block">
                Hospedado via GitHub Pages • Offline First
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-neutral-150 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Lock/Unlock Switch Component */}
            <PasswordLock
              isUnlocked={isUnlocked}
              isPasswordSet={isPasswordSet}
              onUnlock={handleUnlock}
              onLock={handleLock}
              onSetPassword={handleSetPassword}
            />
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="dashboard-layout">
        
        {/* Visitor Warning if locked */}
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-neutral-700 dark:text-amber-400 text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-3 justify-between"
            id="read-only-banner"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 animate-pulse" />
              <p>
                <strong>Modo de Leitura Ativado:</strong> Você pode navegar e buscar cards à vontade. 
                Para habilitar a inserção, edição ou exclusão de notas, destrave o cadeado superior usando sua senha.
              </p>
            </div>
            <button
              onClick={() => {
                const btn = document.getElementById('toggle-lock-btn');
                if (btn) btn.click();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-neutral-900 rounded-lg transition shrink-0"
            >
              Destravar Cadastro
            </button>
          </motion.div>
        )}

        {/* Firestore Sync Setup Warning Banner */}
        {syncError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm shadow-sm"
            id="firebase-permission-banner"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg mt-0.5 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  Conexão ao Banco Online (Notas do Usuário)
                </p>
                <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                  O Firestore retornou erro de permissão. Para sincronizar as notas online nos seus dispositivos usando o seu projeto <strong>notas-31536</strong>, configure as Regras de Segurança no Console do Firebase de modo a aceitar leitura e escrita (ou utilize as regras contidas no arquivo <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-xs">firestore.rules</code> enviado).
                </p>
                <div className="pt-2 text-[11px] text-neutral-500 flex flex-wrap items-center gap-2">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                    Offline-First Ativo
                  </span>
                  <span>Suas notas estão rodando de forma 100% segura salvas localmente no seu navegador!</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats box metric visualizers */}
        <StatsPanel items={items} />

        {/* Gemini powered text-grounded agent searches lookups */}
        <AiSearchPanel isUnlocked={isUnlocked} onAddAiCard={handleAddAiCard} />

        {/* Controls Toolbar Area */}
        <section className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 p-4 rounded-2xl mb-6 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
          
          {/* Main search input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar título, texto ou data..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-neutral-450 absolute left-3 top-3" />
          </div>

          {/* Filtering selection tabs row */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                activeFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ver Todos</span>
            </button>

            <button
              onClick={() => setActiveFilter('nota')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                activeFilter === 'nota'
                  ? 'bg-emerald-700 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-650 dark:text-neutral-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notas Only</span>
            </button>

            <button
              onClick={() => setActiveFilter('lembrete')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                activeFilter === 'lembrete'
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-650 dark:text-neutral-400'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Lembretes</span>
            </button>

            <button
              onClick={() => setActiveFilter('link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                activeFilter === 'link'
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-650 dark:text-neutral-400'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Links</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Sorting buttons toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'date-target' : 'newest')}
              className="p-2 border border-neutral-150 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 text-xs font-semibold flex items-center gap-1 transition"
              title="Alternar classificação"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {sortBy === 'newest' ? 'Recentes Primeiro' : 'Metas / Prazos'}
              </span>
            </button>

            {/* Trigger Add Action Creator Button */}
            <button
              onClick={() => {
                if (isUnlocked) {
                  setEditingItem(null);
                  setIsFormOpen(true);
                } else {
                  const btn = document.getElementById('toggle-lock-btn');
                  if (btn) btn.click();
                }
              }}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-xs ${
                isUnlocked
                  ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-500/10'
                  : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {isUnlocked ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-xs" />}
              <span>Adicionar Card</span>
            </button>
          </div>
        </section>

        {/* Items Grid Layout */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              id="cards-grid"
            >
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isUnlocked={isUnlocked}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteItem}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-2xl p-6"
              id="empty-state"
            >
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-850 flex items-center justify-center text-neutral-400 mb-4 animate-bounce-slow">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-lg text-neutral-800 dark:text-white">
                Nenhum item cadastrado ou encontrado
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                {searchQuery
                  ? 'Os critérios de busca digitados não coincidem com suas notas. Tente ajustar o texto de pesquisa.'
                  : 'Crie uma nova anotação, registre um link útil ou capture imagens carregando documentos! Desbloqueie sua senha mestre para começar.'}
              </p>
              {!isUnlocked && !searchQuery && (
                <button
                  onClick={() => {
                    const btn = document.getElementById('toggle-lock-btn');
                    if (btn) btn.click();
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl transition"
                >
                  Destravar Painel para Criar
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Primary additions/editor form modal */}
      <ItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        isUnlocked={isUnlocked}
      />
    </div>
  );
}

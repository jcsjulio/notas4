import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Bell, Link2, Check } from 'lucide-react';
import { CardItem, ItemType } from '../types';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<CardItem>) => void;
  initialItem?: CardItem | null;
  isUnlocked: boolean;
}

export default function ItemForm({ isOpen, onClose, onSave, initialItem, isUnlocked }: ItemFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('nota');
  const [date, setDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Attachment Imaging State
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial note state for editing
  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setContent(initialItem.content);
      setType(initialItem.type);
      setDate(initialItem.date || '');
      setImageUrl(initialItem.imageUrl || '');
    } else {
      setTitle('');
      setContent('');
      setType('nota');
      setDate('');
      setImageUrl('');
    }
  }, [initialItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) return;
    if (!title.trim() || !content.trim()) return;

    onSave({
      id: initialItem?.id,
      title: title.trim(),
      content: content.trim(),
      type,
      date: date || undefined,
      imageUrl: imageUrl || undefined,
    });
    onClose();
  };

  // Convert File to Base64 String
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione uma imagem válida (PNG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setImageUrl(base64Data); // Show thumbnail and attach it to item
    };
    reader.onerror = () => {
      alert('Erro ao carregar o arquivo.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop Handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="item-form-modal">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
        />

        {/* Modal content cardboard */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-10 my-8"
        >
          {/* Header styling */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-700" />

          <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="font-display font-semibold text-neutral-800 dark:text-white text-lg">
                {initialItem ? 'Editar Item' : 'Criar Novo Item'}
              </h3>
              <p className="text-xs text-neutral-450">
                Configure os detalhes, prazos e salve em seu banco de dados local.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
            {/* Local Image Attachment Area (completely client-side & static-friendly!) */}
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition-all duration-300 relative ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                    Anexo de Imagem Local
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Arraste ou clique abaixo para anexar uma imagem à sua nota de forma 100% offline.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 items-center justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition"
                    >
                      Selecionar Imagem
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg transition"
                      >
                        Remover Anexo
                      </button>
                    )}
                  </div>
                </div>

                {imageUrl && (
                  <div className="relative w-16 h-16 rounded-lg border border-neutral-250 dark:border-neutral-800 overflow-hidden flex-shrink-0">
                    <img src={imageUrl} alt="Anexo" className="w-full h-full object-cover referer-policy" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-450 uppercase tracking-widest block">
                  Tipo de Item
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('nota')}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                      type === 'nota'
                        ? 'border-emerald-600 bg-emerald-50/30 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Anotação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('lembrete')}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                      type === 'lembrete'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Lembrete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('link')}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                      type === 'link'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    <span>Link Salvo</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-450 uppercase tracking-widest block">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'link' ? 'Ex: Repositório GitHub' : 'Ex: Lista de compras semanal'}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Contents selection depending on Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-450 uppercase tracking-widest block">
                  {type === 'link' ? 'URL do Link' : 'Conteúdo'}
                </label>
                {type === 'link' ? (
                  <input
                    type="url"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                ) : (
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva sua anotação ou lembrete... (Suporta Markdown simples)"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-sans"
                  />
                )}
              </div>

              {/* Extra row for Date deadlines */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-450 uppercase tracking-widest block">
                  Data Complementar <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isUnlocked}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg text-white transition flex items-center gap-1.5 shadow-sm ${
                    isUnlocked
                      ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-500/10'
                      : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>

              {!isUnlocked && (
                <p className="text-[11px] text-red-500 text-center font-medium leading-relaxed bg-red-100/20 py-1.5 rounded-lg border border-red-500/10">
                  ⚠️ Desbloqueie a edição clicando no cadeado para poder salvar ou criar itens.
                </p>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

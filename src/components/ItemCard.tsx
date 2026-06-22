import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Bell,
  Link2,
  Trash2,
  Edit,
  ExternalLink,
  Volume2,
  VolumeX,
  Loader2,
  Calendar,
  CheckCircle,
  Circle,
  Eye,
  AudioLines
} from 'lucide-react';
import { CardItem } from '../types';

interface ItemCardProps {
  key?: string;
  item: CardItem;
  isUnlocked: boolean;
  onEdit: (item: CardItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}

export default function ItemCard({
  item,
  isUnlocked,
  onEdit,
  onDelete,
  onToggleComplete,
}: ItemCardProps) {
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean-up playing audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently playing, we want to pause it
    if (isCurrentlyPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsCurrentlyPlaying(false);
      return;
    }

    setTtsLoading(true);

    try {
      // Build synthesis content: Include title and body text
      const speechText = `Título: ${item.title}. Conteúdo: ${item.content}`;

      // Try server-side TTS first
      try {
        const response = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechText,
            voice: 'Zephyr' // Default model voice
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const base64Audio = data.audio;

          if (base64Audio) {
            // Decode base64 to binary data and play
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes.buffer], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(blob);

            // Create new audio instance
            if (audioRef.current) {
              audioRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
              setIsCurrentlyPlaying(false);
              URL.revokeObjectURL(audioUrl);
            };

            audio.play();
            setIsCurrentlyPlaying(true);
            setTtsLoading(false);
            return;
          }
        }
      } catch (serverErr) {
        console.warn('Servidor TTS indisponível, usando fallback nativo do navegador:', serverErr);
      }

      // Fallback: Web Speech API SpeechSynthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // limit previous speaking
        
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'pt-BR';
        
        // Find a Portuguese voice if available
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.startsWith('pt'));
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        utterance.onend = () => {
          setIsCurrentlyPlaying(false);
        };
        utterance.onerror = () => {
          setIsCurrentlyPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsCurrentlyPlaying(true);
      } else {
        throw new Error('TTS nativo não suportado neste navegador.');
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível narrar este item no momento. Verifique se o navegador suporta síntese de voz.');
    } finally {
      setTtsLoading(false);
    }
  };

  // Helper to format date Brazilian standard
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Decide colors and icon based on Type
  const getTypeStyling = () => {
    switch (item.type) {
      case 'nota':
        return {
          icon: <FileText className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />,
          borderColor: 'border-l-4 border-l-emerald-600',
          bgColor: 'bg-emerald-50/20 dark:bg-emerald-950/5',
          tagLabel: 'Anotação',
        };
      case 'lembrete':
        return {
          icon: <Bell className="w-5 h-5 text-amber-500" />,
          borderColor: 'border-l-4 border-l-amber-500',
          bgColor: 'bg-amber-500/5',
          tagLabel: 'Lembrete',
        };
      case 'link':
        return {
          icon: <Link2 className="w-5 h-5 text-blue-500" />,
          borderColor: 'border-l-4 border-l-blue-500',
          bgColor: 'bg-blue-500/5',
          tagLabel: 'Link Salvo',
        };
    }
  };

  const styleConfig = getTypeStyling();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col justify-between bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-2xl ${
        styleConfig.borderColor
      } ${
        item.completed ? 'opacity-65 dark:opacity-50' : ''
      } hover:shadow-md transition-shadow duration-300 p-5 group`}
      id={`card-${item.id}`}
    >
      <div className="space-y-3">
        {/* Top Type Indicator / Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850">
              {styleConfig.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block">
                {styleConfig.tagLabel}
                {item.aiGenerated && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-150 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[8px] font-bold">
                    IA
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Action buttons (Edit & Delete & TTS) */}
          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Audio TTS Narrative Trigger */}
            <button
              onClick={handleTTS}
              disabled={ttsLoading}
              className={`p-1.5 rounded-lg transition-all ${
                isCurrentlyPlaying
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-450 hover:text-emerald-700'
              }`}
              title={isCurrentlyPlaying ? 'Pausar leitura de voz' : 'Ouvir nota com Gemini TTS'}
            >
              {ttsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              ) : isCurrentlyPlaying ? (
                <VolumeX className="w-4 h-4 text-emerald-700 dark:text-emerald-400 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Edit Option */}
            <button
              onClick={() => {
                if (isUnlocked) {
                  onEdit(item);
                } else {
                  alert('🔒 Desbloqueie a edição na barra superior para alterar este card.');
                }
              }}
              className={`p-1.5 rounded-lg transition ${
                isUnlocked
                  ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-450 hover:text-neutral-700'
                  : 'text-neutral-300 cursor-not-allowed dark:text-neutral-700'
              }`}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>

            {/* Delete Option */}
            <button
              onClick={() => {
                if (isUnlocked) {
                  if (confirm('Deseja realmente apagar este item?')) {
                    onDelete(item.id);
                  }
                } else {
                  alert('🔒 Desbloqueie a edição na barra superior para apagar este card.');
                }
              }}
              className={`p-1.5 rounded-lg transition ${
                isUnlocked
                  ? 'hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-450 hover:text-red-600'
                  : 'text-neutral-300 cursor-not-allowed dark:text-neutral-700'
              }`}
              title="Apagar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          {item.type === 'lembrete' && onToggleComplete && (
            <button
              onClick={() => {
                if (isUnlocked) {
                  onToggleComplete(item.id);
                } else {
                  alert('🔒 Desbloqueie a edição na barra superior para marcar o lembrete.');
                }
              }}
              className="text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition flex-shrink-0"
              title={item.completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
            >
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          )}

          <h4
            className={`font-display font-semibold text-neutral-800 dark:text-white text-base leading-snug ${
              item.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
            }`}
          >
            {item.title}
          </h4>
        </div>

        {/* Content Body */}
        <div className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed break-words font-sans">
          {item.type === 'link' ? (
            <div className="flex flex-col gap-2">
              <a
                href={item.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 hover:underline hover:text-emerald-950 dark:hover:text-emerald-300 font-medium font-mono text-xs truncate max-w-full"
              >
                <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.content}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          ) : (
            <p className="whitespace-pre-line text-sm">{item.content}</p>
          )}
        </div>

        {/* Animated wave showing during reading */}
        {isCurrentlyPlaying && (
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 max-w-max">
            <AudioLines className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400">Escutando áudio gerado</span>
          </div>
        )}
      </div>

      {/* Date Complement & Footer Meta */}
      {(item.date || item.createdAt) && (
        <div className="flex justify-between items-center mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-450 font-mono">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {item.date ? `Meta: ${formatDateStr(item.date)}` : `Criado em ${formatDateStr(item.createdAt)}`}
            </span>
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            {item.type === 'link' && (
              <a
                href={item.content}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-emerald-800 dark:text-emerald-450 rounded-md transition"
                title="Ir para o link"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

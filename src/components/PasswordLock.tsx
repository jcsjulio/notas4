import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Eye, EyeOff, ShieldAlert, KeyRound, Check, X, ShieldCheck } from 'lucide-react';

interface PasswordLockProps {
  isUnlocked: boolean;
  isPasswordSet: boolean;
  onUnlock: (password: string) => boolean;
  onLock: () => void;
  onSetPassword: (password: string) => void;
}

export default function PasswordLock({
  isUnlocked,
  isPasswordSet,
  onUnlock,
  onLock,
  onSetPassword,
}: PasswordLockProps) {
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordSet) {
      if (passwordInput.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setError('As senhas não coincidem.');
        return;
      }
      onSetPassword(passwordInput);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPasswordInput('');
        setConfirmPasswordInput('');
        setShowModal(false);
      }, 1500);
    } else {
      const successUnlock = onUnlock(passwordInput);
      if (successUnlock) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPasswordInput('');
          setShowModal(false);
        }, 1200);
      } else {
        setError('Senha incorreta. Tente novamente.');
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setPasswordInput('');
    setConfirmPasswordInput('');
    setError('');
  };

  return (
    <div className="relative inline-block" id="password-lock-wrapper">
      {/* Target Action Button */}
      <button
        id="toggle-lock-btn"
        onClick={() => {
          if (isUnlocked) {
            onLock();
          } else {
            setShowModal(true);
          }
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
          isUnlocked
            ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'bg-neutral-150 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-850 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }`}
        title={isUnlocked ? 'Modo de Edição Ativo. Clique para bloquear.' : 'Modo de Leitura Apenas. Clique para liberar.'}
      >
        {isUnlocked ? (
          <>
            <Unlock className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Edição Liberada</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">Visualização</span>
          </>
        )}
      </button>

      {/* Lock Overlay Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="lock-modal-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 z-10"
              id="lock-modal-content"
            >
              {/* Decorative top bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-600" />

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                    {isPasswordSet ? <KeyRound className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-neutral-800 dark:text-white">
                      {isPasswordSet ? 'Desbloquear Edição' : 'Definir Senha'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {isPasswordSet ? 'Insira a senha mestra para editar' : 'Crie uma senha de acesso'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    {isPasswordSet ? <ShieldCheck className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                  </div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-white">
                    {isPasswordSet ? 'Edição Liberada com sucesso!' : 'Senha cadastrada com sucesso!'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Fechando painel...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {isPasswordSet ? 'Senha Mestra' : 'Nova Senha'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder={isPasswordSet ? '••••••••' : 'Mínimo 4 caracteres'}
                        className="w-full px-3 py-2 pr-10 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-650"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {!isPasswordSet && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Confirmar Senha
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-medium text-red-500"
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-355 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-sm font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs"
                    >
                      {isPasswordSet ? 'Liberar' : 'Salvar Senha'}
                    </button>
                  </div>

                  {!isPasswordSet && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed text-center">
                      * Esta senha é salva de forma segura na nuvem via <strong>Firebase Firestore</strong>, sincronizando entre todos os seus dispositivos.
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

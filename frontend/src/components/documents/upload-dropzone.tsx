'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  /** Version resserrée (padding réduit) pour un contexte étroit comme un dialog. */
  compact?: boolean;
  /** Attribut `accept` du champ fichier natif. Défaut : documents (pdf/image). */
  accept?: string;
  /** Texte affiché au-dessus du bouton, en version non compacte. */
  label?: string;
}

const ACCEPT_PAR_DEFAUT = '.pdf,.png,.jpg,.jpeg,.webp';

export function UploadDropzone({
  onFileSelected,
  disabled,
  compact,
  accept = ACCEPT_PAR_DEFAUT,
  label = 'Déposez PDF ou images',
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [survole, setSurvole] = useState(false);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setSurvole(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSurvole(true);
      }}
      onDragLeave={() => setSurvole(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center rounded-card border border-dashed text-center transition-colors ${
        compact ? 'p-4' : 'p-10'
      } ${survole ? 'border-accent-blue bg-accent-blue/5' : 'border-subtle bg-[var(--surface-3)]'}`}
    >
      <UploadCloud size={compact ? 20 : 28} className={compact ? 'mb-1.5 text-fg-dim' : 'mb-3 text-fg-dim'} />
      {!compact && <p className="font-medium text-fg">{label}</p>}
      <p className={`text-fg-muted ${compact ? 'text-xs' : 'mt-1 text-sm'}`}>
        {compact ? 'Déposez ou cliquez' : 'Ou cliquez pour sélectionner un document.'}
      </p>
      <Button
        type="button"
        className={compact ? 'mt-2' : 'mt-4'}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        {disabled ? 'Envoi…' : 'Choisir des fichiers'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

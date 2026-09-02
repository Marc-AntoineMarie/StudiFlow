'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelected, disabled }: UploadDropzoneProps) {
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
      className={`flex flex-col items-center justify-center rounded-card border border-dashed p-10 text-center transition-colors ${
        survole ? 'border-accent-blue bg-accent-blue/5' : 'border-subtle bg-[var(--surface-3)]'
      }`}
    >
      <UploadCloud size={28} className="mb-3 text-fg-dim" />
      <p className="font-medium text-fg">Déposez PDF ou images</p>
      <p className="mt-1 text-sm text-fg-muted">Ou cliquez pour sélectionner un document.</p>
      <Button type="button" className="mt-4" onClick={() => inputRef.current?.click()} disabled={disabled}>
        {disabled ? 'Envoi…' : 'Choisir des fichiers'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

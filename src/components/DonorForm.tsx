/**
 * DonorForm.tsx — Formulário de dados do doador
 * 
 * Coleta nome, email, CPF e telefone antes de gerar o PIX.
 * Inclui opção de doação anônima e máscaras de input.
 */

import { useState } from 'react';
import type { DonorInfo } from '../gateways';

interface DonorFormProps {
  amount: number;
  onSubmit: (donor: DonorInfo) => void;
}

/** Máscara de CPF: 000.000.000-00 */
function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Máscara de telefone: (00) 00000-0000 */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function DonorForm({ amount, onSubmit }: DonorFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: anonymous ? 'Anônimo' : name.trim(),
      email: email.trim(),
      document: document.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
    });
  }

  const isValid = email.includes('@') && document.replace(/\D/g, '').length === 11;

  return (
    <form className="donor-form" onSubmit={handleSubmit}>
      <h2>Doar R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
      <p className="donor-form-subtitle">
        Preencha seus dados para gerar o PIX
      </p>

      <label className="donor-checkbox">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={e => setAnonymous(e.target.checked)}
        />
        <span>Doar anonimamente</span>
      </label>

      {!anonymous && (
        <div className="donor-field">
          <label htmlFor="donor-name">Nome completo</label>
          <input
            id="donor-name"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
      )}

      <div className="donor-field">
        <label htmlFor="donor-email">E-mail</label>
        <input
          id="donor-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="donor-field">
        <label htmlFor="donor-cpf">CPF</label>
        <input
          id="donor-cpf"
          type="text"
          placeholder="000.000.000-00"
          value={document}
          onChange={e => setDocument(maskCpf(e.target.value))}
          inputMode="numeric"
          required
        />
      </div>

      <div className="donor-field">
        <label htmlFor="donor-phone">Telefone</label>
        <input
          id="donor-phone"
          type="text"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={e => setPhone(maskPhone(e.target.value))}
          inputMode="numeric"
        />
      </div>

      <button
        type="submit"
        className="btn-generate-pix"
        disabled={!isValid}
      >
        Gerar PIX
      </button>

      <p className="donor-form-security">
        🔒 Seus dados são protegidos e utilizados apenas para geração do PIX.
      </p>
    </form>
  );
}

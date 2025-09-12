import { useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Crown, ArrowLeft, FileText, DollarSign, Calendar, User, Phone, Mail, Save } from 'lucide-react';
import type { CreateContract } from '@/shared/types';

export default function CreateContract() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContract>({
    client_name: '',
    client_document: '',
    client_email: '',
    client_phone: '',
    contract_value: 0,
    payment_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isPending && !user) {
    navigate('/');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contract_value' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Nome do cliente é obrigatório';
    }

    if (!formData.client_document.trim()) {
      newErrors.client_document = 'CPF ou CNPJ é obrigatório';
    } else if (formData.client_document.length < 11) {
      newErrors.client_document = 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos';
    }

    if (formData.client_email && !/\S+@\S+\.\S+/.test(formData.client_email)) {
      newErrors.client_email = 'Email inválido';
    }

    if (!formData.contract_value || formData.contract_value <= 0) {
      newErrors.contract_value = 'Valor deve ser maior que zero';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Data de pagamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Contrato criado com sucesso! Link para assinatura: ${window.location.origin}${result.signature_link}`);
        navigate('/dashboard');
      } else {
        const error = await response.json();
        alert(`Erro ao criar contrato: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Erro ao criar contrato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-kings-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kings-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kings-bg-primary text-kings-text-primary font-space">
      {/* Header */}
      <header className="border-b border-kings-border backdrop-blur-sm bg-kings-bg-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-kings-bg-tertiary rounded-lg transition-colors border border-kings-border"
              >
                <ArrowLeft className="h-6 w-6 text-kings-text-secondary" />
              </button>
              <div className="bg-kings-primary p-2 rounded-lg">
                <Crown className="h-8 w-8 text-kings-bg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kings-primary">
                  Novo Contrato
                </h1>
                <p className="text-sm text-kings-text-muted">Preencha os dados do cliente</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-kings-bg-secondary/50 backdrop-blur-sm border border-kings-border rounded-xl p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-kings-primary/20 border border-kings-primary/30 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-kings-primary" />
              </div>
              <h2 className="text-2xl font-bold text-kings-text-primary">Dados do Cliente</h2>
            </div>
            <p className="text-kings-text-muted">
              Preencha as informações do cliente para gerar o contrato de prestação de serviços.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="client_name" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="client_name"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-kings-bg-tertiary border ${errors.client_name ? 'border-red-500' : 'border-kings-border'} rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle`}
                  placeholder="Ex: João Silva Santos"
                />
                {errors.client_name && <p className="mt-1 text-sm text-red-400">{errors.client_name}</p>}
              </div>

              <div>
                <label htmlFor="client_document" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  CPF ou CNPJ *
                </label>
                <input
                  type="text"
                  id="client_document"
                  name="client_document"
                  value={formData.client_document}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-kings-bg-tertiary border ${errors.client_document ? 'border-red-500' : 'border-kings-border'} rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle`}
                  placeholder="Ex: 12345678901"
                />
                {errors.client_document && <p className="mt-1 text-sm text-red-400">{errors.client_document}</p>}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="client_email" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email (opcional)
                </label>
                <input
                  type="email"
                  id="client_email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-kings-bg-tertiary border ${errors.client_email ? 'border-red-500' : 'border-kings-border'} rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle`}
                  placeholder="cliente@email.com"
                />
                {errors.client_email && <p className="mt-1 text-sm text-red-400">{errors.client_email}</p>}
              </div>

              <div>
                <label htmlFor="client_phone" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone (opcional)
                </label>
                <input
                  type="text"
                  id="client_phone"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-kings-bg-tertiary border border-kings-border rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contract_value" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Valor do Contrato (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="contract_value"
                  name="contract_value"
                  value={formData.contract_value || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-kings-bg-tertiary border ${errors.contract_value ? 'border-red-500' : 'border-kings-border'} rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary placeholder-kings-text-subtle`}
                  placeholder="0.00"
                />
                {errors.contract_value && <p className="mt-1 text-sm text-red-400">{errors.contract_value}</p>}
              </div>

              <div>
                <label htmlFor="payment_date" className="block text-sm font-medium text-kings-text-secondary mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Data de Pagamento *
                </label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-kings-bg-tertiary border ${errors.payment_date ? 'border-red-500' : 'border-kings-border'} rounded-lg focus:ring-2 focus:ring-kings-primary focus:border-transparent text-kings-text-primary`}
                />
                {errors.payment_date && <p className="mt-1 text-sm text-red-400">{errors.payment_date}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-kings-border">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-kings-bg-tertiary hover:bg-kings-bg-tertiary/70 border border-kings-border rounded-lg font-medium transition-colors text-kings-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-kings-primary hover:bg-kings-primary-dark rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-kings-bg-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kings-bg-primary"></div>
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Gerar Contrato</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

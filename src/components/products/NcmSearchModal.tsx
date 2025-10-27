import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import Modal from '../ui/Modal';

interface NcmResult {
  codigo: string;
  descricao: string;
}

interface NcmSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ncm: string) => void;
  initialSearchTerm?: string;
}

const NcmSearchModal: React.FC<NcmSearchModalProps> = ({ isOpen, onClose, onSelect, initialSearchTerm = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [results, setResults] = useState<NcmResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/ncm/v1?search=${query}`);
      setResults(response.data || []);
      if (response.data.length === 0) {
        setError('Nenhum NCM encontrado para sua busca.');
      }
    } catch (err) {
      setError('Falha ao buscar NCMs. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      handleSearch(initialSearchTerm);
    } else if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setError(null);
    }
  }, [isOpen, initialSearchTerm, handleSearch]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, handleSearch]);

  const handleSelectNcm = (ncm: NcmResult) => {
    onSelect(ncm.codigo);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar NCM" size="2xl">
      <div className="p-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            placeholder="Digite uma descrição ou código para buscar..."
            autoFocus
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isLoading ? <Loader2 className="animate-spin text-gray-400" /> : <Search className="text-gray-400" />}
          </div>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto scrollbar-styled">
          {error && !isLoading && <div className="p-4 text-center text-sm text-red-500">{error}</div>}
          {!error && !isLoading && results.length === 0 && searchTerm.length > 2 && (
            <div className="p-4 text-center text-sm text-gray-500">Nenhum resultado encontrado.</div>
          )}
          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map((ncm) => (
                <li key={ncm.codigo}>
                  <button
                    type="button"
                    onClick={() => handleSelectNcm(ncm)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <p className="font-semibold text-gray-800">{ncm.codigo}</p>
                    <p className="text-sm text-gray-600">{ncm.descricao}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NcmSearchModal;

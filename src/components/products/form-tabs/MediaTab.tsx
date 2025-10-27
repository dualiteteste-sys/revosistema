import React from 'react';
import { UploadCloud } from 'lucide-react';

const MediaTab: React.FC = () => {
  return (
    <div className="max-w-4xl">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Imagens do Produto</h3>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
              <span>Carregue um arquivo</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
            </label>
            <p className="pl-1">ou arraste e solte</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        A funcionalidade de upload de imagens será implementada em uma etapa futura.
      </p>
    </div>
  );
};

export default MediaTab;

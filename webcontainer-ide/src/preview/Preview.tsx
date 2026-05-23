import React from 'react';
import { useStore } from '../store/useStore';
import { RefreshCw } from 'lucide-react';

export const Preview: React.FC = () => {
  const { previewUrl } = useStore();
  const [key, setKey] = React.useState(0);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">PREVIEW</h3>
        {previewUrl && (
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-700 rounded"
            title="Refresh preview"
          >
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        )}
      </div>
      <div className="flex-1 bg-white">
        {previewUrl ? (
          <iframe
            key={key}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Starting dev server...</p>
          </div>
        )}
      </div>
    </div>
  );
};

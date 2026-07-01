import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors">
          <X size={18}/>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

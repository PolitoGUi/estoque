import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/60 p-0 md:p-4">
    <div className="bg-white md:rounded-xl rounded-t-2xl shadow-2xl w-full max-w-md max-h-[90vh] md:max-h-full flex flex-col mt-auto md:mt-0 animate-in slide-in-from-bottom-4 md:zoom-in-95">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors bg-gray-100/50 hover:bg-gray-200">
          <X size={18}/>
        </button>
      </div>
      <div className="p-5 overflow-y-auto pb-safe">
        {children}
      </div>
    </div>
  </div>
);

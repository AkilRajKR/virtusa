import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FileUploader({ onFileSelect, selectedFile, onRemove, accept = ".pdf,.doc,.docx,.txt" }) {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: false,
        maxSize: 10485760 // 10MB
    });

    return (
        <div>
            <motion.div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative overflow-hidden group
                    ${isDragActive ? 'border-cyan-500 bg-cyan-500/10' : selectedFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900/50'
                    }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <input {...getInputProps()} />

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <AnimatePresence mode="wait">
                    {selectedFile ? (
                        <motion.div
                            key="selected"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex flex-col items-center gap-3 relative z-10"
                        >
                            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-300">{selectedFile.name}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Remove
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex flex-col items-center gap-3 text-slate-500 relative z-10"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Upload className="h-12 w-12 mb-2" />
                            </motion.div>
                            <div>
                                <p className="font-medium text-lg">
                                    {isDragActive ? 'Drop file here' : 'Click or drag to upload'}
                                </p>
                                <p className="text-sm mt-1">Supports PDF, DOCX, TXT (Max 10MB)</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

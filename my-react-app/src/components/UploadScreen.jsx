import { useState, useRef, useCallback } from 'react';
import { User, UploadCloud, FileText, X, Zap } from 'lucide-react';
import { callApi } from '../utils/api';
import { MONO } from '../utils/constants';

export default function UploadScreen({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;

    const allowedTypes = ['.bin', '.log', '.tlog'];
    const maxSize = 10 * 1024 * 1024;
    const fileExt = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExt)) {
      setError('Непідтримуваний тип файлу. Підтримуються: .bin, .log, .tlog');
      return;
    }

    if (f.size > maxSize) {
      setError('Файл занадто великий. Максимальний розмір: 10MB');
      return;
    }

    if (f.size === 0) {
      setError('Файл порожній');
      return;
    }

    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await callApi(file);
      onAnalyzed(file.name, response);
    } catch {
      setError("Помилка аналізу. Спробуйте ще раз.");
      setAnalyzing(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className="min-h-screen bg-slate-900 flex flex-col"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,100,180,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(30,60,120,0.13) 0%, transparent 60%)",
      }}
    >
      <nav className="w-full flex items-center justify-between px-8 py-5">
        <span className="text-xl font-semibold tracking-tight select-none" style={{ fontFamily: MONO, letterSpacing: "-0.01em" }}>
          <span className="text-slate-100">Drone</span>
          <span style={{ background: "linear-gradient(90deg, #60a5fa 0%, #38bdf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Log
          </span>
          <span className="text-slate-400 font-light"> Analyzer</span>
        </span>
        <button className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors bg-slate-800/50">
          <User size={17} />
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className="relative w-full max-w-lg min-h-[400px] flex flex-col items-center justify-center rounded-2xl px-10 py-14 transition-all duration-300"
          style={{
            background: dragging ? "rgba(56,100,180,0.18)" : "rgba(255,255,255,0.04)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: dragging ? "1.5px solid rgba(96,165,250,0.55)" : "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: dragging
              ? "0 0 0 4px rgba(96,165,250,0.08), 0 20px 60px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.35)",
          }}
        >
          <span className="absolute top-3 left-3 w-4 h-4 border-t border-l border-slate-600/40 rounded-tl-sm pointer-events-none" />
          <span className="absolute top-3 right-3 w-4 h-4 border-t border-r border-slate-600/40 rounded-tr-sm pointer-events-none" />
          <span className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-slate-600/40 rounded-bl-sm pointer-events-none" />
          <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-slate-600/40 rounded-br-sm pointer-events-none" />

          <input ref={inputRef} type="file" accept=".bin,.log,.tlog" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

          {!file ? (
            <>
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.18)" }}>
                <UploadCloud size={30} strokeWidth={1.5} className="text-blue-400" style={{ opacity: dragging ? 1 : 0.85 }} />
              </div>
              <h2 className="text-slate-100 text-xl font-medium mb-8 text-center" style={{ fontFamily: MONO, letterSpacing: "-0.02em" }}>
                Перетягніть файл сюди
              </h2>
              <button
                onClick={() => inputRef.current?.click()}
                className="relative px-7 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-transform active:scale-95 focus:outline-none"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)", fontFamily: MONO, letterSpacing: "0.01em" }}
              >
                Вибрати файл
              </button>
              <p className="mt-6 text-xs text-slate-500 text-center" style={{ fontFamily: MONO, letterSpacing: "0.04em" }}>
                Підтримувані формати: .BIN, .LOG, .TLOG
              </p>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "rgba(52,211,153,0.09)", border: "1px solid rgba(52,211,153,0.20)" }}>
                <FileText size={30} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <p className="text-slate-100 text-base font-medium mb-1 text-center max-w-xs truncate" style={{ fontFamily: MONO }}>
                {file.name}
              </p>
              <p className="text-slate-500 text-xs mb-8" style={{ fontFamily: MONO }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>

              {error && (
                <p className="text-red-400 text-xs mb-4 text-center" style={{ fontFamily: MONO }}>{error}</p>
              )}

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="relative px-8 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-transform active:scale-95 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: analyzing ? "linear-gradient(135deg, #374151 0%, #6b7280 100%)" : "linear-gradient(135deg, #059669 0%, #0ea5e9 100%)",
                  boxShadow: analyzing ? "none" : "0 4px 20px rgba(5,150,105,0.30)",
                  fontFamily: MONO,
                  letterSpacing: "0.01em",
                }}
              >
                <Zap size={15} strokeWidth={2} />
                <span>{analyzing ? "Аналіз..." : "Почати аналіз"}</span>
              </button>

              {!analyzing && (
                <button onClick={resetFile} className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" style={{ fontFamily: MONO }}>
                  <X size={13} /> Скасувати вибір
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { X, Upload, RotateCcw, Check, Sparkles, Building2, Image as ImageIcon } from 'lucide-react';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  currentBrandName: string;
  currentBrandSub: string;
  onSaveLogo: (logoUrl: string, brandName: string, brandSub: string) => void;
  onResetLogo: () => void;
}

export const LogoCustomizerModal: React.FC<LogoCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  currentBrandName,
  currentBrandSub,
  onSaveLogo,
  onResetLogo,
}) => {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const [brandName, setBrandName] = useState(currentBrandName || 'MechMatrix');
  const [brandSub, setBrandSub] = useState(currentBrandSub || 'Mechanical Engineering Matrix');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setLogoUrl(currentLogoUrl);
      setBrandName(currentBrandName || 'MechMatrix');
      setBrandSub(currentBrandSub || 'Mechanical Engineering Matrix');
    }
  }, [isOpen, currentLogoUrl, currentBrandName, currentBrandSub]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal adalah 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLogo(logoUrl.trim(), brandName.trim() || 'MechMatrix', brandSub.trim());
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan logo dan nama merek ke standar default MechMatrix?')) {
      onResetLogo();
      setLogoUrl('');
      setBrandName('MechMatrix');
      setBrandSub('Mechanical Engineering Matrix');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center border border-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kustomisasi Logo & Identitas
              </h3>
              <p className="text-xs text-slate-500">
                Ganti logo aplikasi dengan logo perusahaan atau departemen Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-5 text-xs">
          {/* Live Preview Section */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Pratinjau Tampilan Header
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Light Mode Preview */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5 shadow-2xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Preview"
                    className="h-8 max-w-[100px] object-contain rounded"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                    M
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                    {brandName || 'MechMatrix'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {brandSub || 'Mechanical Engineering'}
                  </div>
                </div>
              </div>

              {/* Dark Mode Preview */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center gap-2.5 shadow-2xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Preview"
                    className="h-8 max-w-[100px] object-contain rounded bg-white/5 p-0.5"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                    M
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-extrabold text-white text-sm tracking-tight truncate">
                    {brandName || 'MechMatrix'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {brandSub || 'Mechanical Engineering'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Logo File */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Unggah File Logo (PNG, JPG, SVG, WebP)
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih Berkas Logo</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Hapus Gambar
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Disarankan logo transparan format PNG atau SVG dengan rasio horizontal (lebar:tinggi 2:1 hingga 4:1).
            </p>
          </div>

          {/* Or Paste Direct Image URL */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Atau Tautan URL Logo Eksternal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={logoUrl.startsWith('data:') ? '' : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://perusahaan.com/assets/logo.png"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Brand Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Merek / Aplikasi
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="MechMatrix"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Divisi / Subjudul
              </label>
              <input
                type="text"
                value={brandSub}
                onChange={(e) => setBrandSub(e.target.value)}
                placeholder="Mechanical Engineering Matrix"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Standar</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Logo</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

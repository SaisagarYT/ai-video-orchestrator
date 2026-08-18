import { useState } from 'react';
import { Upload, X, Filter } from 'lucide-react';
import { Button } from './Button';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (mediaUrl: string, mediaType: string) => void;
}

export type MediaTabType = 'Uploads' | 'Elements' | 'Image Generations' | 'Video Generations' | 'Audio';

export function MediaPickerModal({ isOpen, onClose, onSelectMedia }: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<MediaTabType>('Uploads');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      onSelectMedia?.(fakeUrl, file.type.startsWith('video') ? 'video' : 'image');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs font-app text-white select-none">
      <div className="max-w-2xl w-full rounded-3xl bg-[#121212] border border-[#282828] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Top Header Tabs */}
        <div className="flex items-center justify-between border-b border-[#202020] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['Uploads', 'Elements', 'Image Generations', 'Video Generations', 'Audio'] as MediaTabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#888] hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#777] hover:text-white hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#888] uppercase tracking-wider">
              {activeTab}
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#282828] text-xs text-[#AAA] hover:text-white transition-colors cursor-pointer"
            >
              <Filter className="h-3 w-3" />
              <span>Filter</span>
            </button>
          </div>

          {/* Upload Dropzone (from Screenshot 4) */}
          <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-[#2A2A2A] bg-[#0E0E0E] text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-[#161616] border border-[#282828] flex items-center justify-center text-[#E7FE25]">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Upload reference or media file</p>
              <p className="text-[11px] text-[#666] mt-0.5">
                Protected or copyrighted content is not allowed • No uploads found
              </p>
            </div>
            <label className="inline-block px-4 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-xs font-bold text-white border border-[#333] cursor-pointer transition-colors shadow-sm">
              Upload file
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*" />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#202020]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

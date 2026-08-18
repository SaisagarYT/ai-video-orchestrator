import { useState } from 'react';
import type { ReferenceAsset } from '../types/creativeSpec';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../../components/ui';
import { Image, Trash2, Sliders, Upload } from 'lucide-react';

interface ReferenceAssetDeckProps {
  references: ReferenceAsset[];
  onAddReference: (ref: Omit<ReferenceAsset, 'id'>) => void;
  onRemoveReference: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

export function ReferenceAssetDeck({
  references,
  onAddReference,
  onRemoveReference,
  onUpdateWeight,
}: ReferenceAssetDeckProps) {
  const [selectedType, setSelectedType] = useState<ReferenceAsset['type']>('product_hero');

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddReference({
        name: file.name,
        type: selectedType,
        url: URL.createObjectURL(file),
        weight: 0.8,
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      });
    }
  };

  return (
    <Card className="border-[var(--border-default)] font-app">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-[var(--brand-lime)]" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              4. Visual References & IP Consistency
            </CardTitle>
          </div>
          <Badge variant="outline" size="sm">
            {references.length} Anchors Attached
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Upload Zone with Role Selector */}
        <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-sunken)]/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-[var(--text-primary)]">
                Attach Reference Anchor
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Inject product photography, color moods, or style guides for multi-modal rendering.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ReferenceAsset['type'])}
                className="h-8 px-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none"
              >
                <option value="product_hero">Product Hero Image</option>
                <option value="visual_style">Visual Style Reference</option>
                <option value="color_mood">Color & Lighting Mood</option>
                <option value="character_ref">Actor / Character</option>
              </select>

              <label className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--brand-lime)] hover:bg-[var(--brand-lime-hover)] text-[#161616] font-bold text-xs cursor-pointer shadow-xs">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSimulatedUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* References List */}
        {references.length === 0 ? (
          <div className="text-center py-6 text-[var(--text-muted)] space-y-1">
            <p className="text-xs">No reference images attached yet.</p>
            <p className="text-[11px]">Attach an image above to lock in exact product fidelity.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {references.map((ref) => (
              <div
                key={ref.id}
                className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={ref.url}
                    alt={ref.name}
                    className="h-10 w-10 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[200px]">
                      {ref.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                      <Badge variant="lime" size="sm">
                        {ref.type.replace(/_/g, ' ')}
                      </Badge>
                      {ref.fileSize && <span>{ref.fileSize}</span>}
                    </div>
                  </div>
                </div>

                {/* Weight Slider */}
                <div className="flex items-center gap-3 w-full sm:w-60">
                  <Sliders className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Influence Weight</span>
                      <span className="font-mono-code font-bold text-[var(--brand-lime)]">
                        {(ref.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={ref.weight}
                      onChange={(e) => onUpdateWeight(ref.id, Number(e.target.value))}
                      className="w-full accent-[var(--brand-lime)] cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveReference(ref.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-destructive)] hover:bg-[var(--bg-surface-active)] transition-colors cursor-pointer"
                    title="Remove Reference"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

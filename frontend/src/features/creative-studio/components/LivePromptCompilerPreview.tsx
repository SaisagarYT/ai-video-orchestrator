import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Label } from '../../../components/ui';
import { Terminal, Copy, Check, Sparkles, Play, Monitor, RefreshCw } from 'lucide-react';

interface LivePromptCompilerPreviewProps {
  compiledPrompt: string;
  customDirectives: string;
  negativePrompt: string;
  previewUrl: string | null;
  isGeneratingPreview: boolean;
  onUpdateCustomDirectives: (text: string) => void;
  onUpdateNegativePrompt: (text: string) => void;
  onGeneratePreview: () => void;
}

export function LivePromptCompilerPreview({
  compiledPrompt,
  customDirectives,
  negativePrompt,
  previewUrl,
  isGeneratingPreview,
  onUpdateCustomDirectives,
  onUpdateNegativePrompt,
  onGeneratePreview,
}: LivePromptCompilerPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 font-app">
      {/* Live AI Compiled Prompt Card */}
      <Card className="border-[var(--border-default)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Live Compiled AI Production Prompt
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="lime" size="sm">
                Real-Time Synthesis
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="h-3.5 w-3.5 text-[#12B886]" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copied ? 'Copied' : 'Copy Prompt'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Compiled Output Terminal */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-sunken)] border border-[var(--border-subtle)] font-mono-code text-[11px] text-[var(--text-primary)] leading-relaxed relative overflow-x-auto select-all max-h-36">
            <span className="text-[var(--brand-lime)] select-none mr-2">$</span>
            {compiledPrompt}
          </div>

          {/* Custom Prompt Directives Input */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px]">Subject Directives & Visual Nuances</Label>
            <textarea
              value={customDirectives}
              onChange={(e) => onUpdateCustomDirectives(e.target.value)}
              rows={3}
              placeholder="Refine specific subject textures, steam, motion nuances, or color details..."
              className="w-full p-3 rounded-lg bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-lime)] resize-none"
            />
          </div>

          {/* Negative Prompting */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-[var(--color-destructive)]">
              Negative Prompt Tokens (Artifact Prevention)
            </Label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => onUpdateNegativePrompt(e.target.value)}
              className="w-full h-8 px-3 rounded-lg bg-[var(--bg-surface-sunken)] border border-[var(--border-default)] font-mono-code text-[11px] text-[var(--text-secondary)] focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Frame Test Generator Preview */}
      <Card className="border-[var(--border-default)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[var(--brand-lime)]" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Cinematographic Frame Preview
              </CardTitle>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onGeneratePreview}
              isLoading={isGeneratingPreview}
              leftIcon={isGeneratingPreview ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            >
              Generate Test Frame
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs">
          {previewUrl ? (
            <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] relative group">
              <img
                src={previewUrl}
                alt="Cinema Frame Preview"
                className="w-full h-56 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button variant="primary" size="sm" leftIcon={<Play className="h-3.5 w-3.5" />}>
                  Play In Motion
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-40 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-sunken)]/50 flex flex-col items-center justify-center text-center p-4 space-y-2">
              <Sparkles className="h-6 w-6 text-[var(--brand-lime)]" />
              <div>
                <p className="font-semibold text-xs text-[var(--text-primary)]">
                  Simulate Frame Rendering
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-sm">
                  Click "Generate Test Frame" to evaluate the compiled camera optics, lighting LUT, and reference fidelity.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

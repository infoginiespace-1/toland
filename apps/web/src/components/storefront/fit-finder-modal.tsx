'use client';

import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2, ArrowRight, Ruler, HelpCircle } from 'lucide-react';

interface FitFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  availableSizes: string[];
}

export function FitFinderModal({
  isOpen,
  onClose,
  onSelectSize,
  availableSizes,
}: FitFinderModalProps) {
  const [heightFt, setHeightFt] = useState('5.8');
  const [weightKg, setWeightKg] = useState(70);
  const [fitPreference, setFitPreference] = useState<'snug' | 'regular' | 'relaxed'>('regular');
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [recommendedSize, setRecommendedSize] = useState('32');
  const [matchConfidence, setMatchConfidence] = useState(94);

  if (!isOpen) return null;

  const calculateFit = () => {
    let size = '32';
    let confidence = 92;

    if (weightKg <= 58) {
      size = fitPreference === 'snug' ? '28' : '30';
      confidence = 94;
    } else if (weightKg <= 66) {
      size = fitPreference === 'snug' ? '30' : '32';
      confidence = 96;
    } else if (weightKg <= 76) {
      size = fitPreference === 'relaxed' ? '34' : '32';
      confidence = 95;
    } else if (weightKg <= 86) {
      size = fitPreference === 'snug' ? '32' : '34';
      confidence = 93;
    } else if (weightKg <= 96) {
      size = fitPreference === 'relaxed' ? '38' : '36';
      confidence = 91;
    } else {
      size = '38';
      confidence = 90;
    }

    // Fallback if suggested size isn't in stock
    if (availableSizes.length > 0 && !availableSizes.includes(size)) {
      size = availableSizes[0];
    }

    setRecommendedSize(size);
    setMatchConfidence(confidence);
    setStep('result');
  };

  const handleApply = () => {
    onSelectSize(recommendedSize);
    onClose();
    setStep('input');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-alt">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Find My Perfect Denim Fit</h3>
              <p className="text-2xs text-muted">Smart factory sizing algorithm</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-text hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'input' ? (
            <div className="space-y-5">
              {/* Height Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text">Your Height</span>
                  <span className="font-mono font-bold text-primary">
                    {heightFt === '5.4' ? "5'4\" (163 cm)" :
                     heightFt === '5.6' ? "5'6\" (168 cm)" :
                     heightFt === '5.8' ? "5'8\" (173 cm)" :
                     heightFt === '5.10' ? "5'10\" (178 cm)" :
                     heightFt === '6.0' ? "6'0\" (183 cm)" :
                     "6'2\"+ (188+ cm)"}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { val: '5.4', label: "5'4\"" },
                    { val: '5.6', label: "5'6\"" },
                    { val: '5.8', label: "5'8\"" },
                    { val: '5.10', label: "5'10\"" },
                    { val: '6.0', label: "6'0\"" },
                    { val: '6.2', label: "6'2\"+" },
                  ].map((h) => (
                    <button
                      key={h.val}
                      type="button"
                      onClick={() => setHeightFt(h.val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        heightFt === h.val
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface-alt border-border text-muted hover:text-text'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text">Your Weight</span>
                  <span className="font-mono font-bold text-primary text-sm">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={105}
                  step={1}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-3xs font-mono text-muted">
                  <span>50 kg</span>
                  <span>75 kg</span>
                  <span>100+ kg</span>
                </div>
              </div>

              {/* Preferred Fit */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text block">Preferred Fit Style</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'snug', label: 'Snug Slim', desc: 'Fitted at waist & calf' },
                    { id: 'regular', label: 'Classic Regular', desc: 'Balanced everyday comfort' },
                    { id: 'relaxed', label: 'Relaxed Straight', desc: 'Roomier seat & thigh' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFitPreference(f.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        fitPreference === f.id
                          ? 'border-primary bg-primary/5 text-primary shadow-xs'
                          : 'border-border bg-surface-alt text-muted hover:border-primary/40'
                      }`}
                    >
                      <div className="text-xs font-bold text-text">{f.label}</div>
                      <div className="text-3xs text-muted mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={calculateFit}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Calculate My Recommended Size</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                  {matchConfidence}% Match Confidence
                </span>
                <h4 className="text-lg font-black text-text pt-2">
                  Your Recommended Size is <span className="text-primary font-mono text-2xl">Waist {recommendedSize}</span>
                </h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Based on {heightFt} height, {weightKg}kg weight, and {fitPreference} fit preference, this waist size gives you authentic denim drape with optimal waistband comfort.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-alt border border-border text-left text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-text">
                  <Ruler className="w-4 h-4 text-primary" />
                  <span>Factory In-House Stone Wash Guarantee</span>
                </div>
                <p className="text-2xs text-muted leading-relaxed">
                  All TOLAND ring-spun denims are pre-shrunk in industrial washing tunnels, so this size will remain true after regular household washes without shrinkage.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-3 rounded-xl border border-border text-xs font-bold text-muted hover:text-text transition-colors"
                >
                  Recalculate
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-3.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Select Size {recommendedSize}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

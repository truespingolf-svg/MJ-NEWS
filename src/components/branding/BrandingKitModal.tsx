import React, { useState, useRef } from 'react';
import { OrganizationBranding } from '../../types/branding.ts';
import {
  saveOrganizationBranding,
  loadOrganizationBranding,
} from '../../services/brandingStorage.ts';
import { X, Palette, Upload, Check, RotateCcw, Building, Globe, Mail, Phone } from 'lucide-react';

interface BrandingKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (branding: OrganizationBranding) => void;
}

export const BrandingKitModal: React.FC<BrandingKitModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [branding, setBranding] = useState<OrganizationBranding>(() =>
    loadOrganizationBranding()
  );
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setBranding((prev) => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    saveOrganizationBranding(branding);
    onSaved(branding);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121217] border border-[#2c2c38] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-[#2c2c38] flex items-center justify-between bg-[#0e0e13]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Organisation Branding Kit
              </h3>
              <p className="text-[11px] text-neutral-400">
                Configure your global brand identity to reuse across tickets, invitations, and documents.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Org Name & Tagline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Organisation Full Name
              </label>
              <input
                type="text"
                value={branding.name}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-2 text-white font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Official Tagline / Subtitle
              </label>
              <input
                type="text"
                value={branding.tagline || ''}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1.5">
              Official Corporate Logo / Seal
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex items-center gap-4 p-3 bg-[#181820] border border-[#2e2e3c] rounded-xl">
              {branding.logoUrl ? (
                <div className="w-14 h-14 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                  <img
                    src={branding.logoUrl}
                    alt="Logo Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-[#23232d] rounded-lg flex items-center justify-center text-neutral-500 shrink-0 font-serif font-bold text-xl">
                  {branding.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <span className="text-xs font-semibold text-white block">
                  {branding.logoUrl ? 'Brand Logo Attached' : 'No Logo Uploaded Yet'}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  PNG or SVG with transparent background recommended.
                </span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3 stroke-[2.5]" />
                    <span>Choose File</span>
                  </button>
                  {branding.logoUrl && (
                    <button
                      onClick={() => setBranding({ ...branding, logoUrl: '' })}
                      className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded border border-red-500/30 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colors & Fonts */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1 bg-[#181820] border border-[#2e2e3c] rounded p-1.5 font-mono text-xs uppercase text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Secondary Accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  className="flex-1 bg-[#181820] border border-[#2e2e3c] rounded p-1.5 font-mono text-xs uppercase text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Preferred Font
              </label>
              <select
                value={branding.preferredFont}
                onChange={(e) => setBranding({ ...branding, preferredFont: e.target.value as any })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-2 text-xs text-white focus:outline-none"
              >
                <option value="cinzel">Cinzel (Regal Roman)</option>
                <option value="playfair">Playfair Display (Serif)</option>
                <option value="bodoni">Bodoni Moda (Editorial)</option>
                <option value="source-serif">Source Serif (Clean Book)</option>
                <option value="oswald">Oswald (Modern Bold)</option>
                <option value="courier">Courier Prime (Dispatch)</option>
                <option value="sans">Plus Jakarta Sans</option>
              </select>
            </div>
          </div>

          {/* Contact Details & Address */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
              Official Headquarters Address
            </label>
            <input
              type="text"
              value={branding.address}
              onChange={(e) => setBranding({ ...branding, address: e.target.value })}
              className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-2 text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={branding.email}
                onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Telephone
              </label>
              <input
                type="text"
                value={branding.phone}
                onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={branding.website}
                onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-1.5 text-white"
              />
            </div>
          </div>

          {/* Footer & Registration */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
              Official Footer &amp; Registration Imprint
            </label>
            <input
              type="text"
              value={branding.officialFooter}
              onChange={(e) => setBranding({ ...branding, officialFooter: e.target.value })}
              className="w-full bg-[#181820] border border-[#2e2e3c] rounded p-2 text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2c2c38] bg-[#0e0e13] flex justify-between items-center">
          <span className="text-[11px] text-neutral-400">
            {isSavedFeedback ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Branding Profile Saved
              </span>
            ) : (
              'Saved to browser storage and applied automatically.'
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1c1c24] hover:bg-[#282834] text-neutral-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-black shadow-lg transition-all"
            >
              Save Branding Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MaintenanceReport, PlantPhoto } from '../../types';
import { Camera, Image as ImageIcon, Edit3, Trash2, Plus, Sparkles } from 'lucide-react';
import { PhotoEditorModal } from '../PhotoEditor/PhotoEditorModal';

interface PhotoCaptureStepProps {
  reportData: Partial<MaintenanceReport>;
  onChange: (updates: Partial<MaintenanceReport>) => void;
}

export const PhotoCaptureStep: React.FC<PhotoCaptureStepProps> = ({ reportData, onChange }) => {
  const photos: PlantPhoto[] = reportData.photos || [];
  const [editingPhoto, setEditingPhoto] = useState<PlantPhoto | null>(null);

  // File Upload / Camera Capture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newPhoto: PlantPhoto = {
            id: 'ph-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            url: result,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          onChange({ photos: [...(reportData.photos || []), newPhoto] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    onChange({ photos: photos.filter((p) => p.id !== id) });
  };

  const handleUpdatePhoto = (updatedPhoto: PlantPhoto) => {
    const updated = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    onChange({ photos: updated });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <Camera className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Step 4: Inspection Photos & Crop/Highlight Markup</strong>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Take photos directly on your phone camera or upload from gallery. Crop and highlight cracks, wear, or damage before saving.
            </p>
          </div>
        </div>
      </div>

      {/* Camera / Upload Input Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Direct Camera Capture */}
        <label className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold p-3.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 text-xs">
          <Camera className="w-5 h-5" />
          <span>Take Photo with Phone Camera</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Gallery File Upload */}
        <label className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 text-xs border border-slate-700">
          <ImageIcon className="w-5 h-5 text-sky-400" />
          <span>Choose Photos from Gallery</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Photos Grid Display */}
      {photos.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl text-center space-y-2">
          <Camera className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">No photos attached yet</p>
          <p className="text-[11px] text-slate-400">
            Use your camera or file uploader above to attach inspection photos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {photos.map((ph, idx) => (
            <div key={ph.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative aspect-video bg-slate-900 group">
                <img
                  src={ph.url}
                  alt={ph.caption}
                  className="w-full h-full object-cover"
                />

                {/* Annotation Overlay Badge */}
                <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-700">
                  Photo #{idx + 1}
                </div>

                {/* Edit & Remove Floating Actions */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => setEditingPhoto(ph)}
                    className="p-1.5 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-500 transition-colors"
                    title="Crop & Highlight photo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removePhoto(ph.id)}
                    className="p-1.5 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-500 transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 space-y-1.5">
                <input
                  type="text"
                  value={ph.caption}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange({
                      photos: photos.map((p) => (p.id === ph.id ? { ...p, caption: val } : p))
                    });
                  }}
                  placeholder="Caption / defect note..."
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:bg-white focus:outline-none"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Logged: {ph.timestamp}</span>
                  <button
                    onClick={() => setEditingPhoto(ph)}
                    className="text-sky-600 font-bold hover:underline flex items-center space-x-0.5"
                  >
                    <Edit3 className="w-3 h-3 mr-0.5" />
                    <span>Edit / Crop</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editingPhoto && (
        <PhotoEditorModal
          photo={editingPhoto}
          onSave={handleUpdatePhoto}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  );
};

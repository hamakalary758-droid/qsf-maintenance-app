import React, { useState } from 'react';
import { Smartphone, Layout, FileText, CheckCircle2, FileSpreadsheet, FileBox, FileCheck, HelpCircle } from 'lucide-react';

export const MockupsView: React.FC = () => {
  const [activeMockup, setActiveMockup] = useState<'form' | '5w1h' | '5why' | 'actions' | 'review' | 'report'>('form');

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Smartphone className="w-4 h-4" />
          <span>Phase 1 — Mobile Wireframes & Design Mockups</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Interactive UI Wireframe Sandbox</h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Select any of the 6 core screen mockups below to inspect the phone wireframe design before entering live plant data.
        </p>

        {/* Mockup Navigation Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800">
          {[
            { id: 'form', name: '1. Basic Fields', icon: Layout },
            { id: '5w1h', name: '2. 5W+1H Boxes', icon: HelpCircle },
            { id: '5why', name: '3. 5-Why Flow', icon: FileBox },
            { id: 'actions', name: '4. Actions & Parts', icon: CheckCircle2 },
            { id: 'review', name: '5. Review Screen', icon: FileCheck },
            { id: 'report', name: '6. Report Output', icon: FileSpreadsheet }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMockup === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMockup(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone Frame Simulator */}
      <div className="max-w-md mx-auto bg-slate-900 p-3 rounded-[36px] shadow-2xl border-4 border-slate-800">
        {/* Phone Notch & Speaker */}
        <div className="w-32 h-4 bg-slate-800 mx-auto rounded-b-xl mb-2 flex items-center justify-center space-x-2">
          <div className="w-10 h-1 bg-slate-900 rounded-full"></div>
          <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
        </div>

        {/* Phone Screen Container */}
        <div className="bg-slate-50 text-slate-900 min-h-[580px] rounded-[24px] p-4 font-sans text-xs flex flex-col justify-between border border-slate-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-3 -mx-4 -mt-4 rounded-t-[24px] mb-3 flex items-center justify-between border-b border-slate-800">
            <div>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">PLANT REPORT MOCKUP</span>
              <h3 className="font-bold text-sm text-white">Shutdown Maintenance</h3>
            </div>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
              {activeMockup.toUpperCase()}
            </span>
          </div>

          {/* Wireframe Mockup Views */}
          <div className="flex-1 space-y-3 py-1">
            {activeMockup === 'form' && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
                  <span className="font-bold text-sky-900 text-xs">Wireframe #1: Basic Maintenance Info</span>
                  <p className="text-[11px] text-sky-700">Phone layout optimized for fast thumb entry in noisy plant environments.</p>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 text-[11px]">Technician Name *</label>
                  <div className="p-2 bg-white border border-slate-300 rounded text-slate-500 font-mono text-[11px]">
                    e.g. Marcus Vance (Tech #4092)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Date *</label>
                    <div className="p-2 bg-white border border-slate-300 rounded text-slate-500 text-[11px]">
                      2026-08-15
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Shutdown Event</label>
                    <div className="p-2 bg-white border border-slate-300 rounded text-slate-500 text-[11px] truncate">
                      Q3 Major Shutdown
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px]">Equipment Name & Code *</label>
                  <div className="p-2 bg-white border border-slate-300 rounded text-slate-500 text-[11px]">
                    Slurry Pump P-102A (EQ-PMP-102A)
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px]">Plant Location / Area *</label>
                  <div className="p-2 bg-white border border-slate-300 rounded text-slate-500 text-[11px]">
                    Area 3 - Heavy Processing Unit
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px]">Failure Type *</label>
                  <div className="p-2 bg-sky-50 border border-sky-300 rounded text-sky-800 font-bold text-[11px] flex justify-between items-center">
                    <span>Mechanical Failure</span>
                    <span>&#9660;</span>
                  </div>
                </div>
              </div>
            )}

            {activeMockup === '5w1h' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="font-bold text-indigo-900 text-xs">Wireframe #2: 5W + 1H Methodical Analysis</span>
                  <p className="text-[11px] text-indigo-700">6 structural input boxes preventing missed investigation facts.</p>
                </div>

                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">WHAT Happened?</span>
                    <p className="text-slate-600 mt-0.5">Impeller vanes pitted severely & high shaft vibration...</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">WHEN Discovered?</span>
                    <p className="text-slate-600 mt-0.5">During Day Shift startup pre-shutdown flush at 10:30 AM...</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">WHERE Located?</span>
                    <p className="text-slate-600 mt-0.5">Suction housing & shaft bearing assembly #2...</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">WHO Discovered?</span>
                    <p className="text-slate-600 mt-0.5">Marcus Vance & David K. (Shift Techs)...</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">WHICH Mode/Condition?</span>
                    <p className="text-slate-600 mt-0.5">Under 85% high viscosity slurry recirculation...</p>
                  </div>
                  <div className="p-2 bg-white border border-slate-300 rounded">
                    <span className="font-bold text-indigo-600 uppercase text-[10px]">HOW Detected?</span>
                    <p className="text-slate-600 mt-0.5">Inline vibration alarm + cavitation acoustic rumble...</p>
                  </div>
                </div>
              </div>
            )}

            {activeMockup === '5why' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="font-bold text-purple-900 text-xs">Wireframe #3: 5-Why Root Cause Flowchart</span>
                  <p className="text-[11px] text-purple-700">5 sequential linked cards guiding true root cause discovery.</p>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className={`p-2 rounded border ${
                        num === 5
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[10px] ${num === 5 ? 'text-rose-700' : 'text-purple-700'}`}>
                          {num === 5 ? 'WHY #5 (ROOT CAUSE)' : `WHY #${num}`}
                        </span>
                        {num < 5 && <span className="text-purple-400 font-bold">&darr;</span>}
                      </div>
                      <p className="mt-0.5">
                        {num === 1 && 'Why did pump fail? High vibration & flow drop.'}
                        {num === 2 && 'Why high vibration? Impeller lost balance.'}
                        {num === 3 && 'Why lost balance? Cavitation chunked vane tips.'}
                        {num === 4 && 'Why cavitation? Operating below minimum stable flow.'}
                        {num === 5 && 'Why below stable flow? Bypass control valve CV-102 stuck.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMockup === 'actions' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-900 text-xs">Wireframe #4: Actions & Spare Parts Table</span>
                  <p className="text-[11px] text-emerald-700">Track task assignments and warehouse spare part costs.</p>
                </div>

                <div className="bg-white border border-slate-300 rounded p-2">
                  <span className="font-bold text-slate-800 text-[11px]">Corrective Action Items</span>
                  <div className="mt-1 space-y-1">
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-[10px]">
                      <span>Replace Chrome Impeller</span>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Completed</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-[10px]">
                      <span>Laser Shaft Alignment</span>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">In Progress</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded p-2">
                  <span className="font-bold text-slate-800 text-[11px]">Spare Parts Used</span>
                  <table className="w-full text-[10px] mt-1 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold">
                        <th className="p-1 text-left">Part Name</th>
                        <th className="p-1 text-center">Qty</th>
                        <th className="p-1 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-200">
                        <td className="p-1">Chrome Impeller #IMP-8802</td>
                        <td className="p-1 text-center">1</td>
                        <td className="p-1 text-right">$1,450</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="p-1">Mechanical Shaft Seal</td>
                        <td className="p-1 text-center">2</td>
                        <td className="p-1 text-right">$560</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMockup === 'review' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="font-bold text-amber-900 text-xs">Wireframe #5: Final Review & Pre-Commit Screen</span>
                  <p className="text-[11px] text-amber-700">Audit all inputs, photos, and analysis before saving.</p>
                </div>

                <div className="p-2 bg-white border border-slate-300 rounded space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center border-b pb-1">
                    <span className="font-bold text-slate-800">Report Summary: SDR-2026-0801</span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">DRAFT</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Equipment:</span> Slurry Pump P-102A
                  </div>
                  <div>
                    <span className="text-slate-500">Photos:</span> 2 Annotated Plant Images
                  </div>
                  <div>
                    <span className="text-slate-500">5-Why Root Cause:</span> Bypass valve stuck
                  </div>
                  <div>
                    <span className="text-slate-500">Spare Parts Cost:</span> $2,010.00
                  </div>
                </div>

                <button className="w-full py-2 bg-emerald-600 text-white font-bold rounded text-xs shadow-sm">
                  Finalize & Save Report
                </button>
              </div>
            )}

            {activeMockup === 'report' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-bold text-blue-900 text-xs">Wireframe #6: Multi-Format Report Export</span>
                  <p className="text-[11px] text-blue-700">Generate professional Excel, PDF, or Word files on demand.</p>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-center">
                    <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-700 mb-1" />
                    <span className="font-bold text-emerald-900 text-[10px]">Excel (.xlsx)</span>
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-300 rounded text-center">
                    <FileText className="w-5 h-5 mx-auto text-rose-700 mb-1" />
                    <span className="font-bold text-rose-900 text-[10px]">PDF (.pdf)</span>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-300 rounded text-center">
                    <FileBox className="w-5 h-5 mx-auto text-blue-700 mb-1" />
                    <span className="font-bold text-blue-900 text-[10px]">Word (.doc)</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] space-y-1">
                  <div>&gt; Generates 5W1H & 5Why sheets</div>
                  <div>&gt; Embeds annotated damage photos</div>
                  <div>&gt; Includes sign-off signature blocks</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Offline Local Cache Active</span>
            <span className="font-bold text-emerald-600">&bull; Phone Ready</span>
          </div>
        </div>

        {/* Phone Home Indicator Bar */}
        <div className="w-24 h-1 bg-slate-700 mx-auto rounded-full mt-2"></div>
      </div>
    </div>
  );
};

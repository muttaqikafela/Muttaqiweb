import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  History,
  X,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
  FileText,
  Edit2,
  Trash2,
  Save,
  Plus,
  Code2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { hasDeveloperSession } from '../lib/developerAuth';
import { EditLogDiff, EditLogEntry } from '../types';

interface EditLogBadgeProps {
  targetId: string;
  secondaryIds?: (string | undefined | null)[];
  targetTitle?: string;
  compact?: boolean;
  className?: string;
}

export const EditLogBadge: React.FC<EditLogBadgeProps> = ({
  targetId,
  secondaryIds,
  targetTitle,
  compact = false,
  className = ''
}) => {
  const {
    getEditLogsForTarget,
    canManageEditLogs,
    updateEditLog,
    deleteEditLog,
    requestConfirm
  } = useAdmin();
  const { isDeveloper } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditLogEntry | null>(null);

  const devMode = Boolean((isDeveloper || canManageEditLogs) && hasDeveloperSession());
  const logs = getEditLogsForTarget(targetId, secondaryIds);
  if (logs.length === 0) return null;

  const latestLog = logs[0];

  const getRoleLabel = (role: 'admin' | 'sub_admin' | 'employee') => {
    if (role === 'sub_admin') return 'সাব-অ্যাডমিন';
    if (role === 'employee') return 'কর্মচারী';
    return 'অ্যাডমিন';
  };

  const handleStartEdit = (entry: EditLogEntry) => {
    if (!devMode) return;
    setEditingEntry({
      ...entry,
      diffs: (entry.diffs || []).map((d) => ({ ...d }))
    });
  };

  const handleDiffChange = (idx: number, field: keyof EditLogDiff, value: string) => {
    if (!editingEntry) return;
    const nextDiffs = editingEntry.diffs.map((d, i) => (i === idx ? { ...d, [field]: value } : d));
    setEditingEntry({ ...editingEntry, diffs: nextDiffs });
  };

  const handleAddDiffRow = () => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      diffs: [...editingEntry.diffs, { label: '', oldVal: '', newVal: '' }]
    });
  };

  const handleRemoveDiffRow = (idx: number) => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      diffs: editingEntry.diffs.filter((_, i) => i !== idx)
    });
  };

  const handleSaveEdit = () => {
    if (!devMode || !editingEntry) return;
    updateEditLog(editingEntry);
    setEditingEntry(null);
  };

  const handleDeleteLog = (entry: EditLogEntry) => {
    if (!devMode) return;
    requestConfirm({
      title: 'এডিট লগ ডিলিট করুন (ডেভেলপার)',
      message: `আপনি কি "${entry.targetTitle}" (${entry.editedDateBn}) এর এই এডিট লগটি স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => {
        if (editingEntry?.id === entry.id) setEditingEntry(null);
        deleteEditLog(entry.id);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={`সর্বশেষ এডিট: ${latestLog.editedDateBn} — বিস্তারিত লগ হিস্টোরি দেখুন`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-300/90 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition-colors cursor-pointer shrink-0 ${
          compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]'
        } ${className}`}
      >
        <History className={compact ? 'w-3 h-3 text-amber-700' : 'w-3.5 h-3.5 text-amber-700'} />
        <span>লগ হিস্টোরি ({logs.length})</span>
        {!compact && (
          <span className="hidden sm:inline text-[10px] font-medium text-amber-700/90 border-l border-amber-300 pl-1.5">
            {latestLog.editedDateBn.split(',')[0]}
          </span>
        )}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
            onClick={() => {
              setEditingEntry(null);
              setIsOpen(false);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 bg-[#0f2922] text-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#DCB473]/20 border border-[#DCB473]/40 flex items-center justify-center text-[#DCB473] shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold truncate">
                        এডিট লগ হিস্টোরি
                      </h3>
                      <span className="text-[10px] font-bold bg-[#DCB473]/20 text-[#DCB473] border border-[#DCB473]/40 px-2 py-0.5 rounded-md">
                        মোট {logs.length} বার এডিট
                      </span>
                      {devMode && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/50 px-2 py-0.5 rounded-md">
                          <Code2 className="w-3 h-3" />
                          ডেভেলপার কন্ট্রোল
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 truncate mt-0.5">
                      {targetTitle || latestLog.targetTitle} • {latestLog.targetDepartment}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Immutability / Developer Notice */}
              {devMode ? (
                <div className="px-5 py-2.5 bg-purple-50 border-b border-purple-200 flex items-center gap-2 text-[11px] text-purple-950 font-medium shrink-0">
                  <Code2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    ওয়েবসাইট ডেভেলপার মোড সক্রিয় — আপনি যেকোনো এডিট লগ সম্পাদনা বা স্থায়ীভাবে ডিলিট করতে পারবেন। অ্যাডমিন বা সাব-অ্যাডমিনের জন্য এই লগ অপরিবর্তনীয়।
                  </span>
                </div>
              ) : (
                <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900 font-medium shrink-0">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    এটি স্থায়ী ও অপরিবর্তনীয় এডিট লগ — অ্যাডমিন ও সাব-অ্যাডমিন উভয়ই এটি দেখতে পারবেন, তবে কেউই এই লগ হিস্টোরি ডিলিট করতে পারবেন না।
                  </span>
                </div>
              )}

              {/* Log Timeline */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-stone-50/60">
                {logs.map((entry, idx) => {
                  const isEditingThis = devMode && editingEntry?.id === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold bg-stone-200/80 text-stone-700 px-2 py-0.5 rounded">
                            #{logs.length - idx}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-800">
                            <User className="w-3.5 h-3.5 text-emerald-700" />
                            {entry.editedBy}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {getRoleLabel(entry.editedByRole)}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium">
                            ({entry.targetDepartment})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>{entry.editedDateBn}</span>
                          </div>
                          {devMode && !isEditingThis && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(entry)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold cursor-pointer"
                                title="লগ এডিট করুন (ডেভেলপার)"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>এডিট</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(entry)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer"
                                title="লগ ডিলিট করুন (ডেভেলপার)"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ডিলিট</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditingThis && editingEntry ? (
                        <div className="p-4 space-y-3 bg-purple-50/40">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">সম্পাদনাকারী</label>
                              <input
                                type="text"
                                value={editingEntry.editedBy}
                                onChange={(e) => setEditingEntry({ ...editingEntry, editedBy: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">তারিখ ও সময়</label>
                              <input
                                type="text"
                                value={editingEntry.editedDateBn}
                                onChange={(e) => setEditingEntry({ ...editingEntry, editedDateBn: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">শিরোনাম</label>
                              <input
                                type="text"
                                value={editingEntry.targetTitle}
                                onChange={(e) => setEditingEntry({ ...editingEntry, targetTitle: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">বিভাগ</label>
                              <input
                                type="text"
                                value={editingEntry.targetDepartment}
                                onChange={(e) => setEditingEntry({ ...editingEntry, targetDepartment: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-stone-700">পরিবর্তনের তালিকা (Diffs)</span>
                              <button
                                type="button"
                                onClick={handleAddDiffRow}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>নতুন সারি যোগ</span>
                              </button>
                            </div>
                            {editingEntry.diffs.map((diff, dIdx) => (
                              <div key={dIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border border-stone-200">
                                <input
                                  type="text"
                                  value={diff.label}
                                  placeholder="ফিল্ডের নাম"
                                  onChange={(e) => handleDiffChange(dIdx, 'label', e.target.value)}
                                  className="sm:col-span-3 px-2 py-1 text-xs border border-stone-300 rounded"
                                />
                                <input
                                  type="text"
                                  value={diff.oldVal}
                                  placeholder="পূর্বের মান"
                                  onChange={(e) => handleDiffChange(dIdx, 'oldVal', e.target.value)}
                                  className="sm:col-span-4 px-2 py-1 text-xs border border-rose-200 bg-rose-50/40 rounded"
                                />
                                <input
                                  type="text"
                                  value={diff.newVal}
                                  placeholder="নতুন মান"
                                  onChange={(e) => handleDiffChange(dIdx, 'newVal', e.target.value)}
                                  className="sm:col-span-4 px-2 py-1 text-xs border border-emerald-200 bg-emerald-50/40 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDiffRow(dIdx)}
                                  className="sm:col-span-1 p-1 text-rose-600 hover:bg-rose-50 rounded flex items-center justify-center cursor-pointer"
                                  title="সারি বাদ দিন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">সারসংক্ষেপ</label>
                            <input
                              type="text"
                              value={editingEntry.summary}
                              onChange={(e) => setEditingEntry({ ...editingEntry, summary: e.target.value })}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingEntry(null)}
                              className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                            >
                              বাতিল
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>সংরক্ষণ করুন</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 space-y-2">
                          {entry.diffs && entry.diffs.length > 0 ? (
                            <div className="divide-y divide-stone-100 border border-stone-100 rounded-lg overflow-hidden">
                              {entry.diffs.map((diff, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="px-3 py-2 bg-white flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs"
                                >
                                  <span className="font-bold text-stone-700 sm:w-40 shrink-0">
                                    {diff.label}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/70 line-through break-all text-[11px]">
                                      {diff.oldVal || 'খালি'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold break-all text-[11px]">
                                      {diff.newVal || 'খালি'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60">
                              <FileText className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                              <span>{entry.summary}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-stone-500 font-medium">
                  সর্বশেষ সংশোধন: {latestLog.editedDateBn}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#0f2922] hover:bg-[#173a30] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

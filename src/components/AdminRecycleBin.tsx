import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  RotateCcw,
  History,
  Search,
  Lock,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  ArchiveRestore,
  FolderOpen,
  ShieldAlert,
  Edit2,
  X,
  Save,
  Plus,
  Code2
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { hasDeveloperSession } from '../lib/developerAuth';
import { AuditEntityType, EditLogDiff, EditLogEntry, RecycleBinItem } from '../types';

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  haji: 'হাজী নিবন্ধন',
  finance: 'আয়-ব্যয় লেজার',
  payment: 'পেমেন্ট ভাউচার',
  expense: 'অফিস আয়-ব্যয়',
  notice: 'নোটিশ বোর্ড',
  service: 'সেবাসমূহ',
  gallery: 'ফটো গ্যালারি',
  team: 'পরিচালনা পর্ষদ',
  review: 'হাজী রিভিউ',
  kafela_group: 'কাফেলা গ্রুপ',
  pricing: 'মূল্য নির্ধারণ',
  message: 'যোগাযোগ বার্তা',
  company: 'সাধারণ তথ্য',
  prayer: 'নামাজের সময়সূচী',
  stats: 'পরিসংখ্যান'
};

export const AdminRecycleBin: React.FC = () => {
  const {
    recycleBin,
    editLogs,
    isSubAdmin,
    canEditRecycleBin,
    canManageEditLogs,
    updateRecycleBinItem,
    restoreFromRecycleBin,
    permanentlyDeleteRecycleBinItem,
    cleanRecycleBin,
    updateEditLog,
    deleteEditLog,
    clearAllEditLogs,
    requestConfirm
  } = useAdmin();
  const { isDeveloper } = useSite();

  const devMode = Boolean((isDeveloper || canManageEditLogs || canEditRecycleBin) && hasDeveloperSession());
  const canRestoreOrClean = Boolean(isSubAdmin || devMode);

  const [activeSubTab, setActiveSubTab] = useState<'recycle' | 'edit-logs'>('recycle');
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Developer Edit Modal States
  const [editingRecycleItem, setEditingRecycleItem] = useState<RecycleBinItem | null>(null);
  const [recyclePayloadJson, setRecyclePayloadJson] = useState<string>('');
  const [showAdvancedPayload, setShowAdvancedPayload] = useState(false);
  const [payloadJsonError, setPayloadJsonError] = useState<string | null>(null);

  const [editingLog, setEditingLog] = useState<EditLogEntry | null>(null);

  const filteredRecycleItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return recycleBin.filter((item) => {
      if (entityFilter !== 'all' && item.entityType !== entityFilter) return false;
      if (!q) return true;
      return (
        item.targetTitle.toLowerCase().includes(q) ||
        (item.targetSubtitle || '').toLowerCase().includes(q) ||
        item.targetDepartment.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.deletedBy.toLowerCase().includes(q) ||
        item.deletedDateBn.toLowerCase().includes(q)
      );
    });
  }, [recycleBin, searchTerm, entityFilter]);

  const filteredEditLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return editLogs.filter((log) => {
      if (entityFilter !== 'all' && log.targetType !== entityFilter) return false;
      if (!q) return true;
      return (
        log.targetTitle.toLowerCase().includes(q) ||
        log.targetDepartment.toLowerCase().includes(q) ||
        log.editedBy.toLowerCase().includes(q) ||
        log.editedDateBn.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q)
      );
    });
  }, [editLogs, searchTerm, entityFilter]);

  const handleRestore = (item: RecycleBinItem) => {
    if (!canRestoreOrClean) return;
    requestConfirm({
      title: 'মূল ডাটা শীটে ফিরিয়ে আনুন',
      message: `আপনি কি "${item.targetTitle}" তথ্যটি পূর্বের অবস্থায় (${item.targetDepartment}) মূল ডাটা শীটে ফিরিয়ে আনতে চান?`,
      confirmText: 'হ্যাঁ, ফিরিয়ে আনুন',
      onConfirm: () => restoreFromRecycleBin(item.id)
    });
  };

  const handlePermanentDelete = (item: RecycleBinItem) => {
    if (!canRestoreOrClean) return;
    requestConfirm({
      title: 'স্থায়ীভাবে মুছে ফেলুন',
      message: `আপনি কি নিশ্চিতভাবে "${item.targetTitle}" রিসাইকেল বিন থেকে স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`,
      confirmText: 'হ্যাঁ, স্থায়ীভাবে মুছুন',
      onConfirm: () => permanentlyDeleteRecycleBinItem(item.id)
    });
  };

  const handleCleanAll = () => {
    if (!canRestoreOrClean || recycleBin.length === 0) return;
    requestConfirm({
      title: 'সম্পূর্ণ রিসাইকেল বিন ক্লিন করুন',
      message: `রিসাইকেল বিনে থাকা মোট ${recycleBin.length} টি ডিলিটকৃত তথ্য স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিতভাবে রিসাইকেল বিন ক্লিন করতে চান?`,
      confirmText: 'হ্যাঁ, সব ক্লিন করুন',
      onConfirm: () => cleanRecycleBin()
    });
  };

  // Developer Recycle Bin Item Edit Handlers
  const openRecycleEditor = (item: RecycleBinItem) => {
    if (!devMode) return;
    setEditingRecycleItem({ ...item });
    try {
      setRecyclePayloadJson(JSON.stringify(item.payload || {}, null, 2));
    } catch {
      setRecyclePayloadJson('{}');
    }
    setPayloadJsonError(null);
    setShowAdvancedPayload(false);
  };

  const handleSaveRecycleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devMode || !editingRecycleItem) return;
    let parsedPayload = editingRecycleItem.payload;
    if (showAdvancedPayload) {
      try {
        parsedPayload = JSON.parse(recyclePayloadJson);
        setPayloadJsonError(null);
      } catch (err: any) {
        setPayloadJsonError(`JSON ফরম্যাট সঠিক নয়: ${err?.message || 'Parse error'}`);
        return;
      }
    }
    updateRecycleBinItem({
      ...editingRecycleItem,
      targetTitle: editingRecycleItem.targetTitle.trim() || editingRecycleItem.targetTitle,
      targetSubtitle: editingRecycleItem.targetSubtitle?.trim() || undefined,
      targetDepartment: editingRecycleItem.targetDepartment.trim() || editingRecycleItem.targetDepartment,
      deletedBy: editingRecycleItem.deletedBy.trim() || editingRecycleItem.deletedBy,
      deletedDateBn: editingRecycleItem.deletedDateBn.trim() || editingRecycleItem.deletedDateBn,
      summary: editingRecycleItem.summary.trim() || editingRecycleItem.summary,
      payload: parsedPayload
    });
    setEditingRecycleItem(null);
  };

  // Developer Edit Log Handlers
  const openLogEditor = (entry: EditLogEntry) => {
    if (!devMode) return;
    setEditingLog({
      ...entry,
      diffs: (entry.diffs || []).map((d) => ({ ...d }))
    });
  };

  const handleLogDiffChange = (idx: number, field: keyof EditLogDiff, value: string) => {
    if (!editingLog) return;
    setEditingLog({
      ...editingLog,
      diffs: editingLog.diffs.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    });
  };

  const handleAddLogDiffRow = () => {
    if (!editingLog) return;
    setEditingLog({
      ...editingLog,
      diffs: [...editingLog.diffs, { label: '', oldVal: '', newVal: '' }]
    });
  };

  const handleRemoveLogDiffRow = (idx: number) => {
    if (!editingLog) return;
    setEditingLog({
      ...editingLog,
      diffs: editingLog.diffs.filter((_, i) => i !== idx)
    });
  };

  const handleSaveLogEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devMode || !editingLog) return;
    updateEditLog(editingLog);
    setEditingLog(null);
  };

  const handleDeleteLog = (entry: EditLogEntry) => {
    if (!devMode) return;
    requestConfirm({
      title: 'এডিট লগ ডিলিট করুন (ডেভেলপার)',
      message: `আপনি কি নিশ্চিতভাবে "${entry.targetTitle}" (${entry.editedDateBn}) এর এই এডিট লগ হিস্টোরিটি স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => deleteEditLog(entry.id)
    });
  };

  const handleClearAllLogs = () => {
    if (!devMode || editLogs.length === 0) return;
    requestConfirm({
      title: 'সকল এডিট লগ হিস্টোরি মুছুন (ডেভেলপার)',
      message: `মোট ${editLogs.length} টি এডিট লগ হিস্টোরি স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিতভাবে সব এডিট লগ মুছতে চান?`,
      confirmText: 'হ্যাঁ, সব লগ মুছুন',
      onConfirm: () => clearAllEditLogs()
    });
  };

  const recycleCategories: Array<{ id: string; label: string; count: number }> = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of recycleBin) {
      counts.set(item.entityType, (counts.get(item.entityType) || 0) + 1);
    }
    return [
      { id: 'all', label: 'সব তথ্য', count: recycleBin.length },
      ...Array.from(counts.entries()).map(([id, count]) => ({
        id,
        label: ENTITY_LABELS[id as AuditEntityType] || id,
        count
      }))
    ];
  }, [recycleBin]);

  const logCategories: Array<{ id: string; label: string; count: number }> = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of editLogs) {
      counts.set(log.targetType, (counts.get(log.targetType) || 0) + 1);
    }
    return [
      { id: 'all', label: 'সব লগ', count: editLogs.length },
      ...Array.from(counts.entries()).map(([id, count]) => ({
        id,
        label: ENTITY_LABELS[id as AuditEntityType] || id,
        count
      }))
    ];
  }, [editLogs]);

  const getRoleBadge = (role: 'admin' | 'sub_admin' | 'employee') => {
    if (role === 'sub_admin') return 'সাব-অ্যাডমিন';
    if (role === 'employee') return 'কর্মচারী';
    return 'সুপার অ্যাডমিন';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2922] via-[#14352c] to-[#0b1f1a] text-white p-6 rounded-2xl border border-[#DCB473]/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/15 px-2.5 py-1 rounded-md border border-[#DCB473]/35">
                <ArchiveRestore className="w-3.5 h-3.5" />
                রিসাইকেল বিন ও স্থায়ী অডিট লগ
              </span>
              {devMode ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-200 bg-purple-500/25 px-2.5 py-1 rounded-md border border-purple-400/40">
                  <Code2 className="w-3.5 h-3.5" />
                  ওয়েবসাইট ডেভেলপার নিয়ন্ত্রণ সক্রিয় (রিসাইকেল বিন ও লগ হিস্টোরি এডিট ও ডিলিট অনুমোদিত)
                </span>
              ) : isSubAdmin ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  সাব-অ্যাডমিন নিয়ন্ত্রণ সক্রিয় (রিস্টোর ও ক্লিন অনুমোদিত)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-400/30">
                  <Lock className="w-3.5 h-3.5" />
                  শুধুমাত্র দেখার অনুমতি (রিস্টোর ও ক্লিন শুধুমাত্র সাব-অ্যাডমিনের জন্য)
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              রিসাইকেল বিন ও এডিট লগ হিস্টোরি
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
              {devMode
                ? 'ওয়েবসাইট ডেভেলপার হিসেবে আপনি রিসাইকেল বিনের যেকোনো তথ্য এডিট, পূর্বের শীটে রিস্টোর ও স্থায়ীভাবে ডিলিট/ক্লিন করতে পারবেন এবং সকল এডিট লগ হিস্টোরিও এডিট বা ডিলিট করতে পারবেন।'
                : 'অ্যাডমিন কোনো তথ্য ডিলিট করলে তা এখানে রিসাইকেল বিন শীটে সংরক্ষিত থাকে। শুধুমাত্র সাব-অ্যাডমিন ডিলিটকৃত তথ্য পূর্বের অবস্থায় মূল ডাটা শীটে ফিরিয়ে আনতে অথবা রিসাইকেল বিন ক্লিন করতে পারবেন। সকল এডিট লগ হিস্টোরি স্থায়ী — অ্যাডমিন বা সাব-অ্যাডমিন কেউই এটি মুছে ফেলতে পারবেন না।'}
            </p>
          </div>

          {activeSubTab === 'recycle' && canRestoreOrClean && recycleBin.length > 0 && (
            <button
              type="button"
              onClick={handleCleanAll}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>রিসাইকেল বিন ক্লিন করুন ({recycleBin.length})</span>
            </button>
          )}

          {activeSubTab === 'edit-logs' && devMode && editLogs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllLogs}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>সব লগ হিস্টোরি মুছুন ({editLogs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('recycle');
              setEntityFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSubTab === 'recycle'
                ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>রিসাইকেল বিন</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                activeSubTab === 'recycle'
                  ? 'bg-[#DCB473]/25 text-[#DCB473]'
                  : 'bg-white text-stone-700'
              }`}
            >
              {recycleBin.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('edit-logs');
              setEntityFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeSubTab === 'edit-logs'
                ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>সকল এডিট লগ হিস্টোরি</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                activeSubTab === 'edit-logs'
                  ? 'bg-[#DCB473]/25 text-[#DCB473]'
                  : 'bg-white text-stone-700'
              }`}
            >
              {editLogs.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === 'recycle'
                ? 'ডিলিটকৃত তথ্য খুঁজুন...'
                : 'এডিট লগ, নাম বা তারিখ খুঁজুন...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
          />
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(activeSubTab === 'recycle' ? recycleCategories : logCategories).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setEntityFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              entityFilter === cat.id
                ? 'bg-emerald-900 text-white border-emerald-900'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* TAB 1: RECYCLE BIN */}
      {activeSubTab === 'recycle' ? (
        <div className="space-y-4">
          {!canRestoreOrClean && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">সাব-অ্যাডমিন সংরক্ষিত নিয়ন্ত্রণ</p>
                <p className="text-amber-900/90 leading-relaxed">
                  অ্যাডমিন কর্তৃক ডিলিটকৃত সকল তথ্য এখানে নিরাপদে সংরক্ষিত আছে। শুধুমাত্র <strong>সাব-অ্যাডমিন</strong> প্যানেল থেকে এই রিসাইকেল বিন ক্লিন করা অথবা ডিলিটকৃত তথ্য পূর্বের অবস্থায় মূল ডাটা শীটে ফিরিয়ে আনা সম্ভব।
                </p>
              </div>
            </div>
          )}

          {filteredRecycleItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800">
                {recycleBin.length === 0
                  ? 'রিসাইকেল বিন বর্তমানে খালি আছে'
                  : 'অনুসন্ধানের সাথে কোনো ডিলিটকৃত তথ্য মেলেনি'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                অ্যাডমিন কোনো শীট থেকে কোনো তথ্য ডিলিট করলে সেটি স্বয়ংক্রিয়ভাবে এখানে জমা হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecycleItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs hover:border-stone-300 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {ENTITY_LABELS[item.entityType] || item.entityType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        মূল শীট: {item.targetDepartment}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                        <Clock className="w-3 h-3 text-stone-400" />
                        ডিলিটের তারিখ: {item.deletedDateBn}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 break-words">
                        {item.targetTitle}
                      </h3>
                      {item.targetSubtitle && (
                        <p className="text-xs font-medium text-stone-500 mt-0.5">
                          {item.targetSubtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-stone-700 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200/70 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        ডিলিট করেছেন: <strong className="text-stone-700">{item.deletedBy}</strong> ({getRoleBadge(item.deletedByRole)})
                      </span>
                    </div>
                  </div>

                  {/* Actions — Sub-Admin (Restore/Delete) + Developer (Edit/Restore/Delete) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    {canRestoreOrClean ? (
                      <>
                        {devMode && (
                          <button
                            type="button"
                            onClick={() => openRecycleEditor(item)}
                            className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="রিসাইকেল বিন তথ্য এডিট করুন (ডেভেলপার)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>এডিট</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>পূর্বের অবস্থায় ফিরিয়ে আনুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>স্থায়ীভাবে মুছুন</span>
                        </button>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold">
                        <Lock className="w-3.5 h-3.5 text-stone-500" />
                        <span>শুধুমাত্র সাব-অ্যাডমিন রিস্টোর / ক্লিন করতে পারবেন</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: EDIT LOG HISTORY (IMMUTABLE FOR ADMIN & SUB-ADMIN; EDITABLE/DELETABLE BY DEVELOPER) */
        <div className="space-y-4">
          {devMode ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-xs text-purple-950">
              <Code2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">ডেভেলপার ফুল কন্ট্রোল (এডিট লগ হিস্টোরি)</p>
                <p className="text-purple-900/90 leading-relaxed">
                  ওয়েবসাইট ডেভেলপার হিসেবে আপনি প্রতিটি এডিট লগ সম্পাদনা, এককভাবে ডিলিট অথবা উপরের বাটন দিয়ে সব লগ একসাথে মুছে ফেলতে পারবেন। অ্যাডমিন বা সাব-অ্যাডমিন কেউই এগুলো এডিট বা ডিলিট করতে পারবেন না।
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-950">
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">স্থায়ী এডিট লগ হিস্টোরি (মুছে ফেলা সম্ভব নয়)</p>
                <p className="text-emerald-900/90 leading-relaxed">
                  অ্যাডমিন যেকোনো শীটের তথ্য এডিট করলে সরাসরি তা আপডেট হয় এবং কী পরিবর্তন করা হয়েছে ও কত তারিখে করা হয়েছে তা এখানে এবং সংশ্লিষ্ট তথ্যের পাশে স্থায়ীভাবে সংরক্ষিত থাকে। অ্যাডমিন বা সাব-অ্যাডমিন কেউই কোনো এডিট লগ ডিলিট করতে পারবেন না।
                </p>
              </div>
            </div>
          )}

          {filteredEditLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <History className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-stone-800">
                {editLogs.length === 0
                  ? 'এখনো কোনো এডিট লগ হিস্টোরি তৈরি হয়নি'
                  : 'অনুসন্ধানের সাথে কোনো এডিট লগ মেলেনি'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                যেকোনো তথ্য এডিট করা হলে সাথে সাথেই তার পরিবর্তন ও তারিখ এখানে যুক্ত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEditLogs.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden"
                >
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                        #{filteredEditLogs.length - idx}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {entry.targetDepartment}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                        {entry.targetTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-white border border-stone-200 px-2.5 py-0.5 rounded-md">
                        <User className="w-3 h-3 text-emerald-700" />
                        {entry.editedBy} ({getRoleBadge(entry.editedByRole)})
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {entry.editedDateBn}
                      </span>
                      {devMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => openLogEditor(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold cursor-pointer"
                            title="লগ এডিট করুন (ডেভেলপার)"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>এডিট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer"
                            title="লগ ডিলিট করুন (ডেভেলপার)"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ডিলিট</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4">
                    <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                      {entry.diffs.map((diff, dIdx) => (
                        <div
                          key={dIdx}
                          className="px-3 py-2 bg-white flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs"
                        >
                          <span className="font-bold text-stone-700 sm:w-44 shrink-0">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DEVELOPER MODAL 1: EDIT RECYCLE BIN ITEM */}
      {devMode &&
        editingRecycleItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
            onClick={() => setEditingRecycleItem(null)}
          >
            <form
              onSubmit={handleSaveRecycleEdit}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 bg-[#0f2922] text-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-5 h-5 text-purple-300" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">রিসাইকেল বিন তথ্য সম্পাদনা (ডেভেলপার)</h3>
                    <p className="text-[11px] text-stone-300">ডিলিটকৃত তথ্যের বিবরণ বা মূল ডাটা স্ন্যাপশট পরিবর্তন করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRecycleItem(null)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      value={editingRecycleItem.targetTitle}
                      onChange={(e) =>
                        setEditingRecycleItem({ ...editingRecycleItem, targetTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">উপ-শিরোনাম</label>
                    <input
                      type="text"
                      value={editingRecycleItem.targetSubtitle || ''}
                      onChange={(e) =>
                        setEditingRecycleItem({ ...editingRecycleItem, targetSubtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">মূল শীট / বিভাগ</label>
                    <input
                      type="text"
                      value={editingRecycleItem.targetDepartment}
                      onChange={(e) =>
                        setEditingRecycleItem({ ...editingRecycleItem, targetDepartment: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ডিলিটকারী</label>
                    <input
                      type="text"
                      value={editingRecycleItem.deletedBy}
                      onChange={(e) =>
                        setEditingRecycleItem({ ...editingRecycleItem, deletedBy: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">ডিলিটের তারিখ ও সময়</label>
                    <input
                      type="text"
                      value={editingRecycleItem.deletedDateBn}
                      onChange={(e) =>
                        setEditingRecycleItem({ ...editingRecycleItem, deletedDateBn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সারসংক্ষেপ</label>
                  <textarea
                    rows={3}
                    value={editingRecycleItem.summary}
                    onChange={(e) =>
                      setEditingRecycleItem({ ...editingRecycleItem, summary: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>

                <div className="border-t border-stone-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPayload((v) => !v)}
                    className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>
                      {showAdvancedPayload
                        ? 'মূল ডাটা স্ন্যাপশট (JSON) লুকান'
                        : 'মূল ডাটা স্ন্যাপশট (JSON) এডিট করুন (রিস্টোরের আগে পরিবর্তনের জন্য)'}
                    </span>
                  </button>
                  {showAdvancedPayload && (
                    <div className="mt-2 space-y-1.5">
                      <textarea
                        rows={8}
                        value={recyclePayloadJson}
                        onChange={(e) => {
                          setRecyclePayloadJson(e.target.value);
                          setPayloadJsonError(null);
                        }}
                        className="w-full px-3 py-2 text-[11px] font-mono bg-stone-900 text-emerald-300 border border-stone-700 rounded-xl"
                      />
                      {payloadJsonError && (
                        <p className="text-[11px] font-bold text-rose-600">{payloadJsonError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingRecycleItem(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* DEVELOPER MODAL 2: EDIT LOG ENTRY */}
      {devMode &&
        editingLog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
            onClick={() => setEditingLog(null)}
          >
            <form
              onSubmit={handleSaveLogEdit}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 bg-[#0f2922] text-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-5 h-5 text-purple-300" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold">এডিট লগ হিস্টোরি সম্পাদনা (ডেভেলপার)</h3>
                    <p className="text-[11px] text-stone-300">এডিট লগের বিবরণ, তারিখ ও পরিবর্তনের তালিকা সম্পাদনা করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">তথ্যের শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      value={editingLog.targetTitle}
                      onChange={(e) => setEditingLog({ ...editingLog, targetTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">বিভাগ</label>
                    <input
                      type="text"
                      value={editingLog.targetDepartment}
                      onChange={(e) => setEditingLog({ ...editingLog, targetDepartment: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">সম্পাদনাকারী</label>
                    <input
                      type="text"
                      value={editingLog.editedBy}
                      onChange={(e) => setEditingLog({ ...editingLog, editedBy: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">রোল</label>
                    <select
                      value={editingLog.editedByRole}
                      onChange={(e) =>
                        setEditingLog({
                          ...editingLog,
                          editedByRole: e.target.value as EditLogEntry['editedByRole']
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="admin">সুপার অ্যাডমিন</option>
                      <option value="sub_admin">সাব-অ্যাডমিন</option>
                      <option value="employee">কর্মচারী</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ ও সময়</label>
                    <input
                      type="text"
                      value={editingLog.editedDateBn}
                      onChange={(e) => setEditingLog({ ...editingLog, editedDateBn: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">পরিবর্তনের বিবরণ (পূর্বের মান ➔ নতুন মান)</label>
                    <button
                      type="button"
                      onClick={handleAddLogDiffRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন সারি যোগ</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingLog.diffs.map((diff, dIdx) => (
                      <div
                        key={dIdx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200"
                      >
                        <input
                          type="text"
                          value={diff.label}
                          placeholder="ফিল্ডের নাম"
                          onChange={(e) => handleLogDiffChange(dIdx, 'label', e.target.value)}
                          className="sm:col-span-3 px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={diff.oldVal}
                          placeholder="পূর্বের মান"
                          onChange={(e) => handleLogDiffChange(dIdx, 'oldVal', e.target.value)}
                          className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-rose-50/50 border border-rose-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={diff.newVal}
                          placeholder="নতুন মান"
                          onChange={(e) => handleLogDiffChange(dIdx, 'newVal', e.target.value)}
                          className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLogDiffRow(dIdx)}
                          className="sm:col-span-1 p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center cursor-pointer"
                          title="বাদ দিন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">সারসংক্ষেপ</label>
                  <textarea
                    rows={2}
                    value={editingLog.summary}
                    onChange={(e) => setEditingLog({ ...editingLog, summary: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>লগ সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

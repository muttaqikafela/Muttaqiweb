import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeamMember } from '../types';
import { useAdmin } from '../context/AdminContext';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  EyeOff,
  CheckCircle2,
  Maximize2,
  Phone,
  Plus,
  Quote,
  Trash2
} from 'lucide-react';

interface BoardOfDirectorsSectionProps {
  id?: string;
  sectionClassName?: string;
}

const DEFAULT_DIRECTOR_FALLBACK_MESSAGE =
  'পবিত্র হজ্ব, ওমরাহ ও নিরাপদ ভ্রমণ সেবায় সর্বোচ্চ সততা, আন্তরিকতা ও বিশ্বস্ততার সাথে আপনার পাশে থাকাই আমাদের অঙ্গীকার।';

export const BoardOfDirectorsSection: React.FC<BoardOfDirectorsSectionProps> = ({
  id = 'board-of-directors',
  sectionClassName = 'py-16 sm:py-20 bg-white border-t border-stone-200/80'
}) => {
  const {
    teamMembers,
    isAdminLoggedIn,
    isSubAdmin,
    canSubAdminAdd,
    canEditRecord,
    canDeleteRecord,
    canApproveRecords,
    toggleTeamApproval,
    openTeamModal,
    deleteTeamMember,
    requestConfirm
  } = useAdmin();

  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [returnedFromZoom, setReturnedFromZoom] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  const stageRef = useRef<HTMLDivElement>(null);

  const displayTeam = useMemo(
    () => (isAdminLoggedIn ? teamMembers : teamMembers.filter((m) => m.isApproved !== false)),
    [isAdminLoggedIn, teamMembers]
  );

  const selectedDirector = useMemo(
    () => (selectedDirectorId ? displayTeam.find((m) => m.id === selectedDirectorId) || null : null),
    [displayTeam, selectedDirectorId]
  );

  const otherDirectors = useMemo(
    () => (selectedDirector ? displayTeam.filter((m) => m.id !== selectedDirector.id) : []),
    [displayTeam, selectedDirector]
  );

  const selectedIndex = useMemo(
    () => (selectedDirector ? displayTeam.findIndex((m) => m.id === selectedDirector.id) : -1),
    [displayTeam, selectedDirector]
  );

  // If the currently focused director is removed or hidden, cleanly return to the grid
  useEffect(() => {
    if (selectedDirectorId && !selectedDirector) {
      setSelectedDirectorId(null);
    }
  }, [selectedDirectorId, selectedDirector]);

  // Allow Escape key to return smoothly back to the full Board of Directors grid
  useEffect(() => {
    if (!selectedDirectorId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDirectorId(null);
        setReturnedFromZoom(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDirectorId]);

  const handleSelectDirector = (memberId: string) => {
    setReturnedFromZoom(false);
    setSelectedDirectorId(memberId);
    // Keep the zoomed stage comfortably aligned in view without jarring jumps
    requestAnimationFrame(() => {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const handleBackToGrid = () => {
    setSelectedDirectorId(null);
    setReturnedFromZoom(true);
  };

  const handleStepDirector = (direction: -1 | 1) => {
    if (displayTeam.length <= 1 || selectedIndex < 0) return;
    const nextIndex = (selectedIndex + direction + displayTeam.length) % displayTeam.length;
    setSelectedDirectorId(displayTeam[nextIndex].id);
  };

  const handleDeleteMember = (member: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: 'পরিচালনা সদস্য মুছে ফেলার নিশ্চিতকরণ',
      message: `আপনি কি "${member.name}" কে পরিচালনা পর্ষদ থেকে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => deleteTeamMember(member.id)
    });
  };

  const canToggleVisibility = canApproveRecords || isSubAdmin;

  const renderAvatar = (member: TeamMember, imgClass: string, fallbackTextClass: string) => {
    const hasValidImage = Boolean(member.image) && !brokenImageIds[member.id];
    if (hasValidImage) {
      return (
        <img
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setBrokenImageIds((prev) => ({ ...prev, [member.id]: true }))}
          className={imgClass}
        />
      );
    }
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f2922] to-[#1a4337] text-[#DCB473] font-bold ${fallbackTextClass}`}
      >
        {member.initials || member.name.charAt(0) || 'ম'}
      </div>
    );
  };

  const getDirectorMessage = (member: TeamMember) => (member.message ?? member.bio ?? '').trim();

  return (
    <section id={id} className={`scroll-mt-20 ${sectionClassName}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={stageRef}>
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-[#a67c33] uppercase tracking-wider block mb-1.5">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2922] leading-tight">
              আমাদের <span className="text-[#a67c33]">পরিচালনা পর্ষদ</span>
            </h2>
            <p className="mt-2.5 text-stone-600 text-sm sm:text-base leading-relaxed">
              {selectedDirector
                ? 'নির্বাচিত পরিচালকের সম্পূর্ণ পরিচিতি ও বাণী নিচে দেখানো হয়েছে। অন্য পরিচালকদের প্রোফাইল এক কোনে সংরক্ষিত রয়েছে।'
                : 'যেকোনো পরিচালকের প্রোফাইলে ক্লিক করলে তাঁর সম্পূর্ণ পরিচিতি ও পরিচালকের বার্তা (বাণী) বড় আকারে দেখতে পারবেন।'}
            </p>
          </div>

          {isAdminLoggedIn && canSubAdminAdd('team') && (
            <button
              type="button"
              onClick={() => openTeamModal('new')}
              className="min-h-[44px] px-4 py-2.5 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পরিচালক যুক্ত করুন</span>
            </button>
          )}
        </div>

        {/* ================================================================ */}
        {/* FOCUSED / ZOOMED-IN STATE + CORNER ZOOMED-OUT OTHER DIRECTORS     */}
        {/* ================================================================ */}
        {selectedDirector ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
            {/* Top Controls Bar */}
            <div className="px-4 sm:px-7 py-3.5 bg-[#FAF8F5] border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToGrid}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#173d32] text-[#DCB473] font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পেছনে যান (সব পরিচালক)</span>
              </button>

              <div className="flex items-center gap-2">
                {isAdminLoggedIn && canEditRecord('team', selectedDirector.isApproved !== false) && (
                  <button
                    type="button"
                    onClick={() => openTeamModal(selectedDirector)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-[#0f2922] border border-stone-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#a67c33]" />
                    <span>তথ্য ও বার্তা সম্পাদন</span>
                  </button>
                )}

                {displayTeam.length > 1 && (
                  <div className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleStepDirector(-1)}
                      className="w-9 h-9 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="পূর্ববর্তী পরিচালক"
                      title="পূর্ববর্তী পরিচালক"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs font-bold text-stone-600 tabular-nums">
                      {selectedIndex + 1} / {displayTeam.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepDirector(1)}
                      className="w-9 h-9 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="পরবর্তী পরিচালক"
                      title="পরবর্তী পরিচালক"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Content: Zoomed-In Selected Profile + Bottom-Right Corner Zoomed-Out Cluster */}
            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch bg-gradient-to-br from-white via-white to-[#FAF8F5]/80">
              {/* Zoomed-In Focal Director Showcase */}
              <div
                key={selectedDirector.id}
                className="lg:col-span-8 director-zoom-in-enter flex flex-col justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Large Zoomed Portrait */}
                  <div className="relative w-44 h-48 sm:w-52 sm:h-60 rounded-2xl overflow-hidden bg-[#0f2922]/10 border-2 border-[#DCB473]/60 shadow-lg shrink-0">
                    {renderAvatar(
                      selectedDirector,
                      'w-full h-full object-cover object-top',
                      'text-5xl'
                    )}
                    {selectedDirector.role.includes('প্রতিষ্ঠাতা') && (
                      <span className="absolute top-3 left-3 bg-[#0f2922]/90 text-[#DCB473] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#DCB473]/40">
                        প্রতিষ্ঠাতা
                      </span>
                    )}
                  </div>

                  {/* Full Profile Identity Details */}
                  <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#a67c33] tracking-wide">
                        {selectedDirector.role}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f2922] leading-snug mt-1">
                        {selectedDirector.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 mt-1">
                        মুত্তাকী হজ্ব ও কন্সাল্টেন্সি — পরিচালনা পর্ষদ
                      </p>
                    </div>

                    {isAdminLoggedIn && selectedDirector.isApproved === false && (
                      <span className="inline-block bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                        ড্রাফট / লুকানো
                      </span>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      {selectedDirector.phone && (
                        <a
                          href={`tel:${selectedDirector.phone}`}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#173d32] text-[#DCB473] font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="font-mono">{selectedDirector.phone}</span>
                        </a>
                      )}

                      {isAdminLoggedIn &&
                        canDeleteRecord('team', selectedDirector.isApproved !== false) && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMember(selectedDirector, e)}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>মুছে ফেলুন</span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Director Message ("পরিচালকের বার্তা / বাণী") Block */}
                <div className="rounded-2xl bg-[#FAF8F5] border border-[#DCB473]/40 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0">
                      <Quote className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#0f2922]">
                        পরিচালকের বার্তা
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        {selectedDirector.name} — {selectedDirector.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                    {getDirectorMessage(selectedDirector) || DEFAULT_DIRECTOR_FALLBACK_MESSAGE}
                  </p>
                </div>
              </div>

              {/* Zoomed-Out Remaining Directors Docked Together in the Bottom-Right Corner */}
              {otherDirectors.length > 0 && (
                <div className="lg:col-span-4 flex flex-col justify-end items-end">
                  <div className="director-corner-dock-enter w-full sm:max-w-md lg:max-w-full ml-auto bg-[#FAF8F5] border border-stone-200/90 rounded-2xl p-3 sm:p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-stone-200/80">
                      <span className="text-xs font-bold text-[#0f2922]">
                        অন্যান্য পরিচালকবৃন্দ ({otherDirectors.length})
                      </span>
                      <span className="text-[10px] font-semibold text-stone-500">
                        ক্লিক করে জুম করুন
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {otherDirectors.map((other) => (
                        <button
                          key={other.id}
                          type="button"
                          onClick={() => handleSelectDirector(other.id)}
                          className="group p-2 rounded-xl bg-white hover:bg-[#0f2922] border border-stone-200/90 hover:border-[#DCB473] text-center transition-all duration-200 hover:scale-[1.03] cursor-pointer flex flex-col items-center gap-1.5 shadow-2xs"
                          title={`${other.name} — বিস্তারিত ও বার্তা দেখুন`}
                        >
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 group-hover:border-[#DCB473]/70 shrink-0">
                            {renderAvatar(
                              other,
                              'w-full h-full object-cover object-top',
                              'text-sm'
                            )}
                          </div>
                          <div className="w-full min-w-0">
                            <span className="block text-[11px] font-bold text-[#0f2922] group-hover:text-white leading-tight line-clamp-2">
                              {other.name}
                            </span>
                            <span className="block text-[9px] font-semibold text-[#a67c33] group-hover:text-[#DCB473] truncate mt-0.5">
                              {other.role}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* DEFAULT FULL GRID STATE (RESTORED ON BACK)                       */
          /* ================================================================ */
          <div
            className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 ${
              returnedFromZoom ? 'director-grid-restore-enter' : ''
            }`}
          >
            {displayTeam.map((member) => {
              const directorMsg = getDirectorMessage(member);
              const canEdit = isAdminLoggedIn && canEditRecord('team', member.isApproved !== false);
              const canDelete = isAdminLoggedIn && canDeleteRecord('team', member.isApproved !== false);
              return (
                <div
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectDirector(member.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectDirector(member.id);
                    }
                  }}
                  className={`bg-[#FAF8F5] rounded-2xl overflow-hidden border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DCB473] ${
                    member.isApproved === false
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-stone-200/90 hover:border-[#DCB473]'
                  }`}
                >
                  {/* Portrait Container */}
                  <div className="relative aspect-square overflow-hidden bg-[#0f2922]/10">
                    {renderAvatar(
                      member,
                      'w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500',
                      'text-4xl'
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06231a]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {member.role.includes('প্রতিষ্ঠাতা') && (
                      <span className="absolute top-2.5 left-2.5 bg-[#0f2922]/90 text-[#DCB473] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#DCB473]/40 shadow-sm">
                        প্রতিষ্ঠাতা
                      </span>
                    )}

                    {/* Admin / Sub-Admin Quick Actions (stopPropagation prevents accidental zoom) */}
                    {(canEdit || canDelete) && (
                      <div
                        className="absolute top-2 right-2 flex items-center gap-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTeamModal(member);
                            }}
                            className="w-8 h-8 bg-white/95 hover:bg-white text-stone-800 rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                            title="তথ্য ও বার্তা সম্পাদন"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-700" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMember(member, e)}
                            className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Subtle Hover Zoom Indicator */}
                    <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-white/90 text-[#0f2922] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>

                    {isAdminLoggedIn && member.isApproved === false && (
                      <span className="absolute bottom-2.5 left-2.5 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
                        লুকানো
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-3.5 sm:p-5 text-center flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#0f2922] leading-snug">
                        {member.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-semibold text-[#a67c33] mt-1">
                        {member.role}
                      </p>
                      {directorMsg && (
                        <p className="mt-2.5 text-[11px] sm:text-xs text-stone-500 leading-relaxed line-clamp-2">
                          {directorMsg}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#0f2922] group-hover:text-[#a67c33] transition-colors">
                        বার্তা ও তথ্য দেখুন →
                      </span>

                      {isAdminLoggedIn && canToggleVisibility && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTeamApproval(member.id);
                          }}
                          className={`p-1 rounded-md cursor-pointer transition-colors ${
                            member.isApproved === false
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-stone-400 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title={member.isApproved === false ? 'দৃশ্যমান করুন' : 'লুকান'}
                        >
                          {member.isApproved === false ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

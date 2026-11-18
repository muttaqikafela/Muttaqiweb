import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  Minimize2,
  Phone,
  Plus,
  Quote,
  Trash2
} from 'lucide-react';

interface BoardOfDirectorsSectionProps {
  id?: string;
  sectionClassName?: string;
}

interface PortraitSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_DIRECTOR_FALLBACK_MESSAGE =
  'পবিত্র হজ্ব, ওমরাহ ও নিরাপদ ভ্রমণ সেবায় সর্বোচ্চ সততা, আন্তরিকতা ও বিশ্বস্ততার সাথে আপনার পাশে থাকাই আমাদের অঙ্গীকার।';

const ZOOM_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
  const pendingFlipRef = useRef<{
    rects: Map<string, PortraitSnapshot>;
    focusId: string | null;
    previousFocusId: string | null;
  } | null>(null);
  const activeAnimationsRef = useRef<Animation[]>([]);

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

  const cancelRunningAnimations = useCallback(() => {
    activeAnimationsRef.current.forEach((anim) => {
      try {
        anim.cancel();
      } catch {
        // Ignore already finished animations
      }
    });
    activeAnimationsRef.current = [];
  }, []);

  // Capture every visible portrait's exact live position & size relative to stageRef before state changes
  const capturePortraitSnapshots = useCallback(
    (nextFocusId: string | null) => {
      const stageEl = stageRef.current;
      if (!stageEl) return;
      const stageRect = stageEl.getBoundingClientRect();
      const rects = new Map<string, PortraitSnapshot>();

      const portraitEls = stageEl.querySelectorAll<HTMLElement>('[data-director-portrait-id]');
      portraitEls.forEach((el) => {
        const memberId = el.dataset.directorPortraitId;
        if (!memberId) return;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        rects.set(memberId, {
          x: rect.left - stageRect.left,
          y: rect.top - stageRect.top,
          width: rect.width,
          height: rect.height
        });
      });

      if (rects.size > 0) {
        pendingFlipRef.current = {
          rects,
          focusId: nextFocusId,
          previousFocusId: selectedDirectorId
        };
      }
    },
    [selectedDirectorId]
  );

  // Execute compositor-only FLIP Zoom-In & Zoom-Out animations synchronously before browser paint
  useLayoutEffect(() => {
    const flip = pendingFlipRef.current;
    if (!flip) return;
    pendingFlipRef.current = null;

    const stageEl = stageRef.current;
    if (!stageEl) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    cancelRunningAnimations();

    if (prefersReducedMotion) return;

    const nextStageRect = stageEl.getBoundingClientRect();
    const spawned: Animation[] = [];
    let secondaryOrder = 0;

    const portraitEls = stageEl.querySelectorAll<HTMLElement>('[data-director-portrait-id]');
    portraitEls.forEach((el) => {
      const memberId = el.dataset.directorPortraitId;
      if (!memberId || typeof el.animate !== 'function') return;
      const prev = flip.rects.get(memberId);
      if (!prev) return;

      const nextRect = el.getBoundingClientRect();
      if (nextRect.width <= 0 || nextRect.height <= 0) return;

      const nextX = nextRect.left - nextStageRect.left;
      const nextY = nextRect.top - nextStageRect.top;

      const prevCenterX = prev.x + prev.width / 2;
      const prevCenterY = prev.y + prev.height / 2;
      const nextCenterX = nextX + nextRect.width / 2;
      const nextCenterY = nextY + nextRect.height / 2;

      const dx = prevCenterX - nextCenterX;
      const dy = prevCenterY - nextCenterY;

      // Uniform area-based scale keeps facial proportions crisp without distortion during flight
      const scale = Math.sqrt((prev.width * prev.height) / (nextRect.width * nextRect.height));

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(scale - 1) < 0.01) {
        return;
      }

      const isPrimaryZoomIn = flip.focusId !== null && memberId === flip.focusId;
      const isPrimaryZoomOut = flip.previousFocusId !== null && memberId === flip.previousFocusId;
      const isHeroFlight = isPrimaryZoomIn || isPrimaryZoomOut;

      const duration = isPrimaryZoomIn ? 560 : isPrimaryZoomOut ? 520 : 480;
      const delay = isHeroFlight ? 0 : Math.min(secondaryOrder++ * 20, 110);

      el.style.zIndex = isPrimaryZoomIn ? '40' : isPrimaryZoomOut ? '35' : '20';
      el.style.willChange = 'transform, opacity';

      const anim = el.animate(
        [
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
            opacity: isHeroFlight ? 0.92 : 0.86
          },
          {
            transform: 'translate3d(0, 0, 0) scale(1)',
            opacity: 1
          }
        ],
        {
          duration,
          delay,
          easing: ZOOM_EASING,
          fill: 'backwards'
        }
      );

      const cleanupStyle = () => {
        el.style.zIndex = '';
        el.style.willChange = '';
      };
      anim.onfinish = cleanupStyle;
      anim.oncancel = cleanupStyle;

      spawned.push(anim);
    });

    activeAnimationsRef.current = spawned;
  }, [selectedDirectorId, cancelRunningAnimations]);

  // Clean up any active animations on unmount
  useEffect(() => cancelRunningAnimations, [cancelRunningAnimations]);

  // If the currently focused director is removed or hidden, cleanly return to the grid
  useEffect(() => {
    if (selectedDirectorId && !selectedDirector) {
      setSelectedDirectorId(null);
    }
  }, [selectedDirectorId, selectedDirector]);

  const handleSelectDirector = useCallback(
    (memberId: string) => {
      if (memberId === selectedDirectorId) {
        // Clicking the already-focused director photo zooms back out to the full grid
        capturePortraitSnapshots(null);
        setSelectedDirectorId(null);
        setReturnedFromZoom(true);
        return;
      }

      capturePortraitSnapshots(memberId);
      setReturnedFromZoom(false);
      setSelectedDirectorId(memberId);

      // Gently align stage only if its top is scrolled out of comfortable view
      requestAnimationFrame(() => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (rect.top < 72 || rect.top > window.innerHeight * 0.65) {
          stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },
    [selectedDirectorId, capturePortraitSnapshots]
  );

  const handleBackToGrid = useCallback(() => {
    if (!selectedDirectorId) return;
    capturePortraitSnapshots(null);
    setSelectedDirectorId(null);
    setReturnedFromZoom(true);
  }, [selectedDirectorId, capturePortraitSnapshots]);

  // Allow Escape key to zoom out smoothly back to the full Board of Directors grid
  useEffect(() => {
    if (!selectedDirectorId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleBackToGrid();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDirectorId, handleBackToGrid]);

  const handleStepDirector = (direction: -1 | 1) => {
    if (displayTeam.length <= 1 || selectedIndex < 0) return;
    const nextIndex = (selectedIndex + direction + displayTeam.length) % displayTeam.length;
    const nextId = displayTeam[nextIndex].id;
    capturePortraitSnapshots(nextId);
    setSelectedDirectorId(nextId);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={stageRef}>
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
                ? 'নির্বাচিত পরিচালকের বাণী ও সম্পূর্ণ পরিচিতি নিচে দেখানো হয়েছে। ছবিতে পুনরায় ক্লিক করলে জুম আউট হয়ে পূর্বের অবস্থায় ফিরে যাবে।'
                : 'যেকোনো পরিচালকের ছবিতে ক্লিক করলে অ্যানিমেশনসহ জুম ইন হয়ে তাঁর সম্পূর্ণ পরিচিতি ও পরিচালকের বার্তা (বাণী) বড় আকারে দেখতে পারবেন।'}
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
        {/* FOCUSED / ZOOMED-IN STATE + ZOOMED-OUT OTHER DIRECTORS AT BOTTOM */}
        {/* ================================================================ */}
        {selectedDirector ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl relative">
            {/* Top Controls Bar */}
            <div className="director-stage-chrome-enter rounded-t-3xl px-4 sm:px-7 py-3.5 bg-[#FAF8F5] border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
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

            {/* Stage Content: Message on LEFT of Photo (RIGHT), Remaining Directors docked at BOTTOM */}
            <div
              className={`bg-gradient-to-br from-white via-white to-[#FAF8F5]/80 ${
                otherDirectors.length === 0 ? 'rounded-b-3xl' : ''
              }`}
            >
              {/* Zoomed-In Focal Director Showcase (Full Width: Message Left + Photo Right) */}
              <div className="p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* LEFT OF PHOTO: Director Message ("পরিচালকের বার্তা / বাণী") Block */}
                <div
                  key={`msg-${selectedDirector.id}`}
                  className="order-2 sm:order-1 sm:col-span-7 lg:col-span-8 h-full flex flex-col justify-center director-message-enter"
                >
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#DCB473]/45 p-5 sm:p-7 shadow-xs flex flex-col justify-between gap-5 h-full">
                    <div>
                      <div className="flex items-center gap-3 mb-4 pb-3.5 border-b border-[#DCB473]/25">
                        <div className="w-10 h-10 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0 shadow-xs">
                          <Quote className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base sm:text-lg font-extrabold text-[#0f2922]">
                            পরিচালকের বার্তা
                          </h4>
                          <span className="text-xs text-[#a67c33] font-semibold block truncate">
                            {selectedDirector.name} — {selectedDirector.role}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base lg:text-[17px] text-stone-700 leading-[1.85] whitespace-pre-line">
                        {getDirectorMessage(selectedDirector) || DEFAULT_DIRECTOR_FALLBACK_MESSAGE}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200/70 flex items-center justify-between gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-[#0f2922]">
                        — {selectedDirector.name}
                      </span>
                      <span className="text-[11px] font-semibold text-[#a67c33]">
                        মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Large Zoomed Portrait (Click again to Zoom Out!) + Identity Details */}
                <div className="order-1 sm:order-2 sm:col-span-5 lg:col-span-4 flex flex-col items-center text-center gap-4">
                  {/* Interactive Focal Portrait — Click to smoothly Zoom Out back to grid */}
                  <button
                    data-director-portrait-id={selectedDirector.id}
                    type="button"
                    onClick={handleBackToGrid}
                    aria-label={`${selectedDirector.name}-এর ছবি জুম আউট করে সব পরিচালক দেখুন`}
                    title="জুম আউট করতে ছবিতে ক্লিক করুন"
                    className="group/portrait relative w-52 h-56 sm:w-full sm:max-w-[264px] sm:h-auto sm:aspect-[4/4.3] rounded-2xl overflow-hidden bg-[#0f2922]/10 border-2 border-[#DCB473]/75 shadow-xl shrink-0 cursor-zoom-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DCB473] focus-visible:ring-offset-2"
                  >
                    {renderAvatar(
                      selectedDirector,
                      'w-full h-full object-cover object-top transition-transform duration-300 ease-out group-hover/portrait:scale-[1.03]',
                      'text-5xl'
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06231a]/60 via-transparent to-transparent opacity-0 group-hover/portrait:opacity-100 transition-opacity duration-200 pointer-events-none" />

                    {selectedDirector.role.includes('প্রতিষ্ঠাতা') && (
                      <span className="absolute top-3 left-3 bg-[#0f2922]/90 text-[#DCB473] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#DCB473]/40 shadow-sm pointer-events-none">
                        প্রতিষ্ঠাতা
                      </span>
                    )}

                    {/* Subtle Zoom-Out Cue on Portrait */}
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0f2922]/90 text-[#DCB473] border border-[#DCB473]/45 px-2.5 py-1 text-[11px] font-bold shadow-md opacity-85 group-hover/portrait:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>জুম আউট</span>
                    </span>
                  </button>

                  {/* Full Profile Identity Details beneath Portrait */}
                  <div
                    key={`id-${selectedDirector.id}`}
                    className="w-full space-y-2.5 min-w-0 director-identity-enter"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#a67c33] tracking-wide">
                        {selectedDirector.role}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f2922] leading-snug mt-1">
                        {selectedDirector.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        মুত্তাকী হজ্ব ও কন্সাল্টেন্সি — পরিচালনা পর্ষদ
                      </p>
                    </div>

                    {isAdminLoggedIn && selectedDirector.isApproved === false && (
                      <span className="inline-block bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                        ড্রাফট / লুকানো
                      </span>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {selectedDirector.phone && (
                        <a
                          href={`tel:${selectedDirector.phone}`}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#173d32] text-[#DCB473] font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
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
                            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>মুছে ফেলুন</span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Zoomed-Out Remaining Directors Docked Below (Bottom Strip instead of Side) */}
              {otherDirectors.length > 0 && (
                <div className="rounded-b-3xl border-t border-stone-200/80 bg-[#FAF8F5]/90 px-5 sm:px-8 py-5">
                  <div className="director-stage-chrome-enter flex flex-wrap items-center justify-between gap-2 mb-3.5">
                    <span className="text-xs sm:text-sm font-bold text-[#0f2922]">
                      অন্যান্য পরিচালকবৃন্দ ({otherDirectors.length})
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      ছবিতে ক্লিক করে জুম ইন করুন
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {otherDirectors.map((other) => (
                      <button
                        key={other.id}
                        type="button"
                        onClick={() => handleSelectDirector(other.id)}
                        className="group p-2.5 rounded-xl bg-white hover:bg-[#0f2922] border border-stone-200/90 hover:border-[#DCB473] text-center transition-colors duration-200 hover:-translate-y-0.5 cursor-zoom-in flex flex-col items-center gap-2 shadow-2xs hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DCB473]"
                        title={`${other.name} — জুম ইন করে বিস্তারিত ও বার্তা দেখুন`}
                      >
                        <div
                          data-director-portrait-id={other.id}
                          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group-hover:border-[#DCB473]/70 shrink-0"
                        >
                          {renderAvatar(
                            other,
                            'w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105',
                            'text-base'
                          )}
                        </div>
                        <div className="w-full min-w-0">
                          <span className="block text-xs font-bold text-[#0f2922] group-hover:text-white leading-tight line-clamp-2">
                            {other.name}
                          </span>
                          <span className="block text-[10px] font-semibold text-[#a67c33] group-hover:text-[#DCB473] truncate mt-0.5">
                            {other.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* DEFAULT FULL GRID STATE (SMOOTHLY RESTORED ON ZOOM-OUT)          */
          /* ================================================================ */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
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
                  className={`relative bg-[#FAF8F5] rounded-2xl border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DCB473] ${
                    member.isApproved === false
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-stone-200/90 hover:border-[#DCB473]'
                  }`}
                >
                  {/* Portrait Container (FLIP Target — no outer card overflow-hidden clipping during flight) */}
                  <div
                    data-director-portrait-id={member.id}
                    className="relative aspect-square rounded-t-2xl overflow-hidden bg-[#0f2922]/10"
                  >
                    {renderAvatar(
                      member,
                      'w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500',
                      'text-4xl'
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06231a]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

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

                    {/* Subtle Hover Zoom-In Indicator */}
                    <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-white/90 text-[#0f2922] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm pointer-events-none">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>

                    {isAdminLoggedIn && member.isApproved === false && (
                      <span className="absolute bottom-2.5 left-2.5 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
                        লুকানো
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div
                    className={`p-3.5 sm:p-5 text-center flex-1 flex flex-col justify-between bg-white rounded-b-2xl ${
                      returnedFromZoom ? 'director-card-body-enter' : ''
                    }`}
                  >
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

import React from 'react';
import { PageId, TeamMember } from '../types';
import { useAdmin } from '../context/AdminContext';
import {
  Sparkles,
  Building,
  ShieldCheck,
  EyeOff,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

interface AboutPageProps {
  setCurrentPage: (page: PageId) => void;
  onOpenInquiry: (serviceId?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentPage }) => {
  const {
    teamMembers,
    stats,
    companyInfo,
    isAdminLoggedIn,
    toggleTeamApproval,
    openTeamModal,
    deleteTeamMember,
    requestConfirm
  } = useAdmin();

  const displayTeam = isAdminLoggedIn
    ? teamMembers
    : teamMembers.filter((m) => m.isApproved !== false);

  const handleDeleteMember = (member: TeamMember) => {
    requestConfirm({
      title: 'পরিচালনা সদস্য মুছে ফেলার নিশ্চিতকরণ',
      message: `আপনি কি "${member.name}" কে পরিচালনা পর্ষদ থেকে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => deleteTeamMember(member.id)
    });
  };

  return (
    <div className="bg-[#FAF8F5]">
      {/* Page Title & Breadcrumb Banner */}
      <section className="bg-gradient-to-r from-[#0a221b] via-[#0f2e26] to-[#0a221b] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCB473_1px,transparent_1px)] opacity-10 [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            আমাদের সম্পর্কে
          </h1>
          <nav className="flex justify-center items-center gap-2 text-sm text-stone-300">
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#DCB473] transition-colors cursor-pointer"
            >
              হোম
            </button>
            <span className="text-[#DCB473]">/</span>
            <span className="text-[#DCB473] font-medium">আমাদের সম্পর্কে</span>
          </nav>
        </div>
      </section>

      {/* Leadership Team Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2922]">
              আমাদের <span>পরিচালনা পর্ষদ</span>
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              পরিচিত হোন আমাদের উদ্যমী পরিচালনা দলটির সঙ্গে: যারা আবেগ, দক্ষতা ও দূরদর্শিতার সাথে নেতৃত্ব দিচ্ছেন, আমাদের কোম্পানিকে সফলতা ও আস্থার পথে এগিয়ে নিয়ে যাচ্ছেন।
            </p>
          </div>

          {/* Admin Team Add Banner */}
          {isAdminLoggedIn && (
            <div className="mb-10 p-4 bg-[#0f2922]/5 border-2 border-dashed border-[#DCB473] rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#0f2922]">
                  পরিচালনা পর্ষদ প্রশাসন: মোট {teamMembers.length} জন সদস্য
                </span>
              </div>

              <button
                onClick={() => openTeamModal('new')}
                className="px-4 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            </div>
          )}

          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {displayTeam.map((member) => (
              <div
                key={member.id}
                className={`bg-stone-50 rounded-2xl overflow-hidden border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group ${
                  member.isApproved === false ? 'border-amber-400 bg-amber-50/20' : 'border-stone-200/80 hover:border-[#DCB473]'
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-[#0f2922]/10">
                  <img
                    src={member.image}
                    alt={`${member.name} - ${member.role}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {member.role.includes('প্রতিষ্ঠাতা') && (
                    <span className="absolute top-3 left-3 bg-[#DCB473] text-[#0f2922] text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                      প্রতিষ্ঠাতা
                    </span>
                  )}

                  {/* Admin Badges & Actions */}
                  {isAdminLoggedIn && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      <button
                        onClick={() => openTeamModal(member)}
                        className="p-1.5 bg-white/95 hover:bg-white text-stone-800 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-110"
                        title="সম্পাদন করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-700" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer transition-transform hover:scale-110"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {isAdminLoggedIn && member.isApproved === false && (
                    <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
                      অননুমোদিত
                    </span>
                  )}
                </div>

                <div className="p-5 text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-[#0f2922] transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#b88e44] mt-1">
                      {member.role}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                    <span>মুত্তাকী পরিবার</span>
                    {isAdminLoggedIn && (
                      <button
                        onClick={() => toggleTeamApproval(member.id)}
                        className={`font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                          member.isApproved === false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'text-stone-500 hover:text-amber-800'
                        }`}
                      >
                        {member.isApproved === false ? '✓ অনুমোদন দিন' : 'ড্রাফট'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Company Story */}
      <section className="py-16 sm:py-20 bg-stone-50 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#b88e44] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#DCB473]" />
                <span>আমাদের পথচলা</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2922] leading-tight">
                <span>আল্লাহ</span> অসম্ভবকে সম্ভব করেন।
              </h2>
              <div className="text-stone-700 text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  আমাদের প্রতিষ্ঠান শুরু হয় অভিজ্ঞ ও নিষ্ঠাবান প্রতিষ্ঠাতা <strong>মোঃ রাজু মিয়া</strong>–এর নেতৃত্বে। তার দূরদর্শী দিকনির্দেশনায় আমরা দ্রুতই একটি নির্ভরযোগ্য ভ্রমণ ও ইমিগ্রেশন সেবা প্রতিষ্ঠান হিসেবে পরিচিতি লাভ করি।
                </p>
                <p>
                  বর্তমানে তার সঙ্গে যুক্ত রয়েছেন দক্ষ ব্যবস্থাপনা পরিচালকবৃন্দ— <strong>মোঃ শাহাদাৎ হোসেন খন্দকার সাগর</strong>, <strong>এ কে এম সাদিকুল আলম</strong>, <strong>মোঃ তাহিনুর রহমান</strong>, <strong>মোঃ মেহেদি হাসান</strong>, <strong>মোঃ হাবিবুর রহমান সুজন</strong>, <strong>মোঃ মাহফুজুর রহমান রোকন</strong> এবং <strong>মোঃ মেহেদি হাসান শান্ত</strong>। তাঁরা সকলেই অভিজ্ঞতা, পেশাদারিত্ব ও আন্তরিকতার সঙ্গে গ্রাহকদের সর্বোচ্চ মানের সেবা প্রদানে প্রতিশ্রুতিবদ্ধ।
                </p>
                <p>
                  আমরা বিশ্বাস করি, একটি সফল ভ্রমণের পেছনে রয়েছে নিখুঁত পরিকল্পনা ও দক্ষ ব্যবস্থাপনা। এই বিশ্বাসকে কেন্দ্র করে আমরা গড়ে তুলেছি এক ছাতার নিচে সমস্ত ভ্রমণ ও ইমিগ্রেশন সেবা — যার মধ্যে রয়েছে হজ্ব ও উমরাহ ব্যবস্থাপনা, আন্তর্জাতিক ও অভ্যন্তরীণ বিমান টিকিট বুকিং, হোটেল বুকিং নিশ্চিতকরণ, দেশি ও বিদেশি ট্যুর প্যাকেজ, বিশ্বের সকল দেশের জন্য ভিসা প্রসেসিং, পাসপোর্ট প্রক্রিয়াকরণ, জনশক্তি রপ্তানি সংক্রান্ত পরামর্শ ও সহায়তা, এবং ইমিগ্রেশন প্রক্রিয়ায় প্রয়োজনীয় দিকনির্দেশনা।
                </p>
                <p className="font-medium text-[#0f2922]">
                  আমাদের লক্ষ্য শুধুমাত্র সেবা প্রদান নয় — বরং আপনাকে একটি নির্ভরযোগ্য অভিজ্ঞতা উপহার দেওয়া, যেখানে আপনার প্রতিটি পদক্ষেপ হবে সহজ, সুরক্ষিত ও নিশ্চিন্ত।
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800">
                  <Building className="w-4 h-4 text-[#DCB473]" />
                  <span>দুপচাঁচিয়া, বগুড়া</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>শত শত সন্তুষ্ট যাত্রী</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center hover:border-[#DCB473] transition-colors"
                  >
                    <span className="block text-3xl sm:text-4xl font-extrabold text-[#0f2922] font-mono mb-1">
                      {stat.value}
                    </span>
                    <span className="block text-sm font-bold text-stone-800 mb-0.5">
                      {stat.label}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {stat.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

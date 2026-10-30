import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { getAllGroupsOccupancy, MAX_PILGRIMS_PER_GROUP } from '../data/kafelaGroups';
import { X, CheckCircle, Phone, MessageCircle, Send, Users } from 'lucide-react';

interface ServiceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultServiceId?: string;
}

export const ServiceInquiryModal: React.FC<ServiceInquiryModalProps> = ({
  isOpen,
  onClose,
  defaultServiceId
}) => {
  const { services, companyInfo, addInquiry, inquiries, kafelaGroups } = useAdmin();
  const groupsOccupancy = useMemo(() => getAllGroupsOccupancy(kafelaGroups, inquiries), [kafelaGroups, inquiries]);
  const [selectedService, setSelectedService] = useState<string>(defaultServiceId || (services[0]?.id || 'hajj-umrah'));
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [travelers, setTravelers] = useState('১ জন (একক)');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activeService = services.find((s) => s.id === selectedService);

    // Save inquiry to admin context
    addInquiry({
      name: name.trim(),
      phone: phone.trim(),
      serviceId: selectedService,
      serviceName: activeService ? activeService.title : 'সাধারণ সেবা',
      // Hero / package pre-registration must land in Haji registrations,
      // never in general inquiries.
      registrationType: selectedService === 'haji-full-registration' ? 'haji' : 'general',
      selectedGroup: selectedGroup || undefined,
      travelers,
      message: message.trim()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 500);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName('');
    setPhone('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-[#DCB473]/30 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">
              আলহামদুলিল্লাহ! আপনার অনুরোধ গৃহীত হয়েছে
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed max-w-sm mx-auto mb-4">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সির পক্ষ থেকে অতি শীঘ্রই আপনার সাথে ({phone}) নম্বরে যোগাযোগ করা হবে, ইনশাআল্লাহ।
            </p>
            {selectedGroup && (
              <p className="text-xs text-purple-900 bg-purple-50 border border-purple-200 py-1.5 px-3 rounded-lg max-w-sm mx-auto mb-5 font-medium">
                কাফেলা গ্রুপ: <strong>{selectedGroup}</strong> (আসন বরাদ্দ প্রক্রিয়াভুক্ত)
              </p>
            )}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 text-xs text-stone-600 space-y-1">
              <p>জরুরি তথ্যের জন্য সরাসরি আমাদের হেল্পলাইনে কল করতে পারেন:</p>
              <p className="text-sm font-bold text-[#0f2922]">{companyInfo.phone1Display}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#0f2922] text-white font-medium rounded-xl hover:bg-[#1a4237] transition-colors"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
                মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
              </span>
              <h3 className="text-2xl font-bold text-[#0f2922]">
                প্যাকেজ ও সেবা অনুসন্ধান ফরম
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                আপনার প্রয়োজন জানান, আমাদের বিশেষজ্ঞ টিম আপনাকে সম্পূর্ণ ফ্রিতে সঠিক পরামর্শ প্রদান করবে।
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  আগ্রহী সেবা নির্বাচন করুন *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473] bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    আপনার নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="উদাঃ মোঃ আব্দুল্লাহ"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="০১৭xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  যাত্রীর সংখ্যা
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473] bg-white"
                >
                  <option value="১ জন (একক)">১ জন (একক)</option>
                  <option value="২ জন (দম্পতি / সঙ্গী)">২ জন (দম্পতি / সঙ্গী)</option>
                  <option value="৩-৫ জন (পরিবার)">৩-৫ জন (পরিবার)</option>
                  <option value="৬+ জন (কাফেলা / গ্রুপ)">৬+ জন (কাফেলা / গ্রুপ)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-700" />
                    কাফেলা গ্রুপ নির্বাচন (ঐচ্ছিক)
                  </label>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    NB: প্রতি গ্রুপে সর্বোচ্চ ৫০ জন
                  </span>
                </div>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473] bg-white"
                >
                  <option value="">গ্রুপ নির্ধারণ নেই (পরামর্শ অনুযায়ী ঠিক হবে)</option>
                  {groupsOccupancy.map((item) => (
                    <option
                      key={item.group.id}
                      value={item.group.name}
                      disabled={item.isFull}
                    >
                      {item.group.name} ({item.group.category}) — {item.isFull ? '❌ পূর্ণ (৫০/৫০ জন)' : `${item.currentCount}/${MAX_PILGRIMS_PER_GROUP} জন (${item.seatsLeft} আসন বাকি)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  অতিরিক্ত কোনো প্রশ্ন বা বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="যেমনঃ আনুমানিক কোন মাসে যেতে চান বা বিশেষ কোন হোটেল চাওয়া আছে কি না..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>অনুরোধ জমা দিন</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>তাৎক্ষণিক কথা বলতে চান?</span>
              <div className="flex gap-2">
                <a
                  href={`tel:${companyInfo.phone1}`}
                  className="text-[#0f2922] font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-[#DCB473]" />
                  <span>কল করুন</span>
                </a>
                <span>|</span>
                <a
                  href={companyInfo.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপ</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

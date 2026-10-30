import React, { useState } from 'react';
import { PageId } from '../types';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageCircle } from 'lucide-react';

interface ContactPageProps {
  setCurrentPage: (page: PageId) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ setCurrentPage }) => {
  const { companyInfo, addContactMessage } = useAdmin();
  const { siteSettings } = useSite();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    addContactMessage({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 500);
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Page Title & Breadcrumb Banner */}
      <section className="bg-gradient-to-r from-[#0a221b] via-[#0f2e26] to-[#0a221b] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCB473_1px,transparent_1px)] opacity-10 [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            যোগাযোগ করুন
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
            <span className="text-[#DCB473] font-medium">যোগাযোগ</span>
          </nav>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2922]">
              <span>আজই</span> যোগাযোগ করুন
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base">
              এখনই আমাদের সাথে যোগাযোগ করুন। হজ্ব, ওমরাহ, ভিসা বা যেকোনো ভ্রমণের বিষয়ে বিস্তারিত জানতে আমরা প্রস্তুত।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Office Address */}
            <div className="bg-white rounded-2xl p-7 border border-stone-200/90 shadow-xs hover:shadow-lg hover:border-[#DCB473] transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mb-5 shadow-sm">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                অফিসের ঠিকানা
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed max-w-xs">
                {companyInfo.address}
                <span className="block text-xs text-stone-500 mt-1">{siteSettings.domain}</span>
              </p>
              <div className="mt-4 text-xs text-[#b88e44] font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>সকাল ৯:০০ - রাত ৮:০০ (শনি-বৃহস্পতি)</span>
              </div>
            </div>

            {/* Card 2: Phone */}
            <div className="bg-white rounded-2xl p-7 border border-stone-200/90 shadow-xs hover:shadow-lg hover:border-[#DCB473] transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mb-5 shadow-sm">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                যোগাযোগের তথ্য
              </h3>
              <div className="space-y-1 text-sm font-semibold text-stone-800">
                <p>
                  <a href={`tel:${companyInfo.phone1}`} className="hover:text-[#b88e44] transition-colors">
                    {companyInfo.phone1Display}
                  </a>
                </p>
                <p>
                  <a href={`tel:${companyInfo.phone2}`} className="hover:text-[#b88e44] transition-colors">
                    {companyInfo.phone2Display}
                  </a>
                </p>
              </div>
              <a
                href={companyInfo.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপে নক দিন</span>
              </a>
            </div>

            {/* Card 3: Email */}
            <div className="bg-white rounded-2xl p-7 border border-stone-200/90 shadow-xs hover:shadow-lg hover:border-[#DCB473] transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mb-5 shadow-sm">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                ইমেইল করুন
              </h3>
              <p className="text-sm text-stone-600">
                <a
                  href={`mailto:${companyInfo.email}`}
                  className="font-semibold text-stone-800 hover:text-[#b88e44] transition-colors"
                >
                  {companyInfo.email}
                </a>
              </p>
              <span className="mt-4 text-xs text-stone-500">
                ২৪ ঘণ্টার মধ্যে উত্তর প্রদান করা হয়
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Google Map Section */}
      <section className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Contact Form */}
            <div className="lg:col-span-6 bg-stone-50 p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="text-2xl font-bold text-[#0f2922] mb-2">
                আমাদেরকে বার্তা দিন
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-6">
                আপনার নাম, যোগাযোগ ও বার্তা লিখুন। আমাদের প্রতিনিধি অতি দ্রুত আপনার সাথে যোগাযোগ করবেন।
              </p>

              {isSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-emerald-900 mb-1">
                    ধন্যবাদ! আপনার বার্তা সফলভাবে পাঠানো হয়েছে।
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-700 mb-4">
                    আমরা আপনার বার্তা পর্যালোচনা করে শীঘ্রই যোগাযোগ করব, ইনশাআল্লাহ।
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    আরেকটি বার্তা পাঠান
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="আপনার নাম লিখুন..."
                      className="w-full px-4 py-2.5 bg-white text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="০১৭xxxxxxxx"
                        className="w-full px-4 py-2.5 bg-white text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ইমেইল এড্রেস (ঐচ্ছিক)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@mail.com"
                        className="w-full px-4 py-2.5 bg-white text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      বিষয় *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="যেমনঃ ওমরাহ প্যাকেজ বা ভিসা সম্পর্কে তথ্য"
                      className="w-full px-4 py-2.5 bg-white text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      এখানে লিখুন.. *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="আপনার প্রশ্ন বা প্রয়োজনীয় বিস্তারিত বিবরণ লিখুন..."
                      className="w-full px-4 py-2.5 bg-white text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>পাঠানো হচ্ছে...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>বার্তা পাঠান</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Google Maps Embed */}
            <div className="lg:col-span-6 bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm flex flex-col h-full">
              <div className="p-4 bg-[#0f2922] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#DCB473]" />
                  <span className="text-xs font-bold">মদিনা শপিং কমপ্লেক্স, দুপচাঁচিয়া, বগুড়া</span>
                </div>
                <a
                  href="https://maps.google.com/?q=24.875136,89.173564"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#DCB473] hover:underline"
                >
                  গুগল ম্যাপে খুলুন ↗
                </a>
              </div>
              <div className="w-full h-80 sm:h-96 lg:h-[480px]">
                <iframe
                  src={companyInfo.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="মুত্তাকী হজ্ব ও কন্সাল্টেন্সি অফিস অবস্থান"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

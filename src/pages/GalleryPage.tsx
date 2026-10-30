import React, { useState } from 'react';
import { PageId, GalleryItem } from '../types';
import { useAdmin } from '../context/AdminContext';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Eye,
  CheckCircle2,
  EyeOff,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

interface GalleryPageProps {
  setCurrentPage: (page: PageId) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ setCurrentPage }) => {
  const {
    galleryItems,
    isAdminLoggedIn,
    toggleGalleryApproval,
    openGalleryModal,
    deleteGalleryItem,
    requestConfirm
  } = useAdmin();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'সব ছবি' },
    { id: 'holysites', label: 'পবিত্র স্থানসমূহ (মক্কা ও মদিনা)' },
    { id: 'hajj', label: 'পবিত্র হজ্ব কাফেলা' },
    { id: 'umrah', label: 'ওমরাহ ও জিয়ারত' },
    { id: 'groups', label: 'কাফেলা ও প্রশিক্ষণ' }
  ];

  // If public visitor, only show approved gallery items
  const baseItems = isAdminLoggedIn
    ? galleryItems
    : galleryItems.filter((g) => g.isApproved !== false);

  const filteredItems = selectedCategory === 'all'
    ? baseItems
    : baseItems.filter((item) => item.category === selectedCategory);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveImageIndex(null);
  };

  const showNext = () => {
    if (activeImageIndex !== null) {
      setActiveImageIndex((activeImageIndex + 1) % filteredItems.length);
    }
  };

  const showPrev = () => {
    if (activeImageIndex !== null) {
      setActiveImageIndex((activeImageIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  const handleDeleteItem = (item: GalleryItem) => {
    requestConfirm({
      title: 'ছবি মুছে ফেলার নিশ্চিতকরণ',
      message: `আপনি কি "${item.title}" ছবিটি গ্যালারি থেকে স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => deleteGalleryItem(item.id)
    });
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Page Title & Breadcrumb Banner */}
      <section className="bg-gradient-to-r from-[#0a221b] via-[#0f2e26] to-[#0a221b] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCB473_1px,transparent_1px)] opacity-10 [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            ফটো গ্যালারি
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
            <span className="text-[#DCB473] font-medium">গ্যালারি</span>
          </nav>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2922]">
              পবিত্র তীর্থযাত্রার <span>স্মরণীয় মুহূর্তসমূহ</span>
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base">
              আমাদের সম্মানিত হাজীদের সফল হজ্ব ও ওমরাহ যাত্রা, হারামাইন শরীফাইনের মনোমুগ্ধকর দৃশ্য এবং কাফেলার কিছু খণ্ডচিত্র।
            </p>
          </div>

          {/* Admin Add Photo Banner */}
          {isAdminLoggedIn && (
            <div className="mb-8 p-4 bg-[#0f2922]/5 border-2 border-dashed border-[#DCB473] rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#0f2922]">
                  গ্যালারি প্রশাসন: মোট {galleryItems.length}টি ছবি (ড্রাফট সহ)
                </span>
              </div>

              <button
                onClick={() => openGalleryModal('new')}
                className="px-4 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ছবি যোগ করুন</span>
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid of Images */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              এই ক্যাটাগরিতে কোনো ছবি পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border flex flex-col justify-between ${
                    item.isApproved === false ? 'border-amber-400 bg-amber-50/20' : 'border-stone-200'
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      onClick={() => openLightbox(index)}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 cursor-pointer"
                      loading="lazy"
                    />

                    {/* Admin top action badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {isAdminLoggedIn && item.isApproved === false && (
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-md shadow">
                          অননুমোদিত
                        </span>
                      )}
                      {isAdminLoggedIn && item.isApproved !== false && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md shadow">
                          অনুমোদিত
                        </span>
                      )}
                    </div>

                    {/* Admin Edit / Delete Floating Buttons */}
                    {isAdminLoggedIn && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGalleryModal(item);
                          }}
                          className="p-1.5 bg-white/95 hover:bg-white text-stone-800 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-110"
                          title="সম্পাদন করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-stone-700" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item);
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer transition-transform hover:scale-110"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div
                      onClick={() => openLightbox(index)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/90 text-[#0f2922] flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                        <ZoomIn className="w-5 h-5 text-[#0f2922]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h3 className="text-sm font-bold text-stone-800 line-clamp-1 group-hover:text-[#0f2922] transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between">
                      <button
                        onClick={() => openLightbox(index)}
                        className="text-[11px] font-semibold text-[#b88e44] inline-flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        <span>বড় করে দেখুন</span>
                      </button>

                      {/* Admin inline approval toggle */}
                      {isAdminLoggedIn && (
                        <button
                          onClick={() => toggleGalleryApproval(item.id)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                            item.isApproved === false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'text-stone-500 hover:text-amber-800'
                          }`}
                        >
                          {item.isApproved === false ? '✓ অনুমোদন দিন' : 'ড্রাফট করুন'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen Lightbox Modal */}
      {activeImageIndex !== null && filteredItems[activeImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 cursor-pointer"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={showPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={showNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center max-h-[85vh]">
            <img
              src={filteredItems[activeImageIndex].image}
              alt={filteredItems[activeImageIndex].title}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl mb-4 border border-white/10"
            />
            <div className="text-center text-white px-4">
              <h3 className="text-lg font-bold">
                {filteredItems[activeImageIndex].title}
              </h3>
              {filteredItems[activeImageIndex].description && (
                <p className="text-xs text-stone-300 mt-1 max-w-lg mx-auto">
                  {filteredItems[activeImageIndex].description}
                </p>
              )}
              <span className="text-[11px] text-[#DCB473] mt-2 block font-mono">
                ছবি {activeImageIndex + 1} / {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

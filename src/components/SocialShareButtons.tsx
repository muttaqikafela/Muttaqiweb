import React, { useState, useRef, useEffect } from 'react';
import { FacebookIcon } from './BrandIcons';
import { MessageCircle, Share2, Copy, Check, X } from 'lucide-react';

export interface ShareContent {
  title: string;
  text?: string;
  url: string;
  imageUrl?: string;
}

interface SocialShareButtonsProps {
  content: ShareContent;
  compact?: boolean;
  className?: string;
  onMessage?: (message: string) => void;
}

type SocialNetwork = 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'x';

export const getHomepageUrl = (anchor?: string) => {
  if (typeof window === 'undefined') {
    return anchor ? `https://muttaqi.com.bd/#${anchor}` : 'https://muttaqi.com.bd/';
  }
  const origin = window.location.origin || 'https://muttaqi.com.bd';
  return anchor ? `${origin}/#${anchor}` : `${origin}/`;
};

export const getSharePageUrl = (anchor?: string) => getHomepageUrl(anchor);

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  content,
  compact = false,
  className = '',
  onMessage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Destination link MUST lead to the website's homepage when clicked on social media
  const homepageDestinationUrl = content.url || getHomepageUrl();

  const shareText = [
    content.title,
    content.text,
    `🌐 ওয়েবসাইট ভিজিট করুন: ${homepageDestinationUrl}`
  ]
    .filter(Boolean)
    .join('\n');

  const copyLink = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${homepageDestinationUrl}`);
      }
      setCopied(true);
      onMessage?.('হোমপেজ লিংক ও বিবরণ সফলভাবে কপি হয়েছে!');
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setIsOpen(false), 400);
    } catch {
      onMessage?.('লিংক কপি করতে ব্যর্থ হয়েছে।');
    }
  };

  const openShare = async (network: SocialNetwork, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(false);

    if (network === 'instagram') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: content.title,
            text: shareText,
            url: homepageDestinationUrl
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(`${shareText}\n${homepageDestinationUrl}`);
        onMessage?.('হোমপেজ লিংক ও বিবরণ কপি হয়েছে। Instagram-এ পোস্ট করতে পেস্ট করুন।');
      } catch {
        onMessage?.('Instagram-এ শেয়ার করতে ওয়েবসাইটের লিংক কপি করুন।');
      }
      return;
    }

    const encodedHomeUrl = encodeURIComponent(homepageDestinationUrl);
    const encodedText = encodeURIComponent(
      content.title ? `${content.title} | মুত্তাকী হজ্ব ও কন্সাল্টেন্সি` : 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি'
    );

    let target = '';
    if (network === 'facebook') {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodedHomeUrl}&quote=${encodedText}`;
    } else if (network === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedHomeUrl}`;
    } else if (network === 'whatsapp') {
      const waMessage = encodeURIComponent(
        `${content.title ? `*${content.title}*\n` : ''}${
          content.text ? `${content.text}\n\n` : ''
        }🌐 বিস্তারিত জানতে ও বুকিং করতে ওয়েবসাইট ভিজিট করুন:\n${homepageDestinationUrl}`
      );
      target = `https://wa.me/?text=${waMessage}`;
    } else {
      // X / Twitter
      target = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedHomeUrl}`;
    }

    try {
      const win = window.open(target, '_blank', 'noopener,noreferrer');
      if (!win) {
        const link = document.createElement('a');
        link.href = target;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      try {
        const link = document.createElement('a');
        link.href = target;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        onMessage?.('লিংক কপি করে সোশ্যাল মিডিয়ায় শেয়ার করুন।');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Single Share Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="সোশ্যাল মিডিয়ায় শেয়ার করুন"
        aria-label="সোশ্যাল মিডিয়ায় শেয়ার করুন"
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer select-none ${
          isOpen
            ? 'bg-[#0f2922] text-[#DCB473] ring-2 ring-[#DCB473]/70'
            : 'bg-white hover:bg-stone-50 text-stone-700 hover:text-[#0f2922] border border-stone-200/90'
        } ${compact ? 'h-7 w-7 sm:h-7.5 sm:w-7.5 p-1' : 'px-3 py-1.5 text-xs'}`}
      >
        <Share2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4 text-[#8d6928]'} />
        {!compact && <span>শেয়ার</span>}
      </button>

      {/* Dropdown Popover Menu with all individual Social Network Options */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-52 sm:w-56 rounded-2xl bg-white/98 backdrop-blur-md p-2 shadow-2xl border border-stone-200 text-stone-800 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-label="শেয়ার অপশন"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-stone-100 mb-1">
            <span className="text-[11px] font-extrabold text-[#0f2922] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#b88e44]" />
              শেয়ার অপশন নির্বাচন করুন
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded-md hover:bg-stone-100 cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Social Network Items */}
          <div className="space-y-1">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={(e) => void openShare('whatsapp', e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#073b20] hover:bg-emerald-50 transition cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
              </div>
              <span className="flex-1 text-left">হোয়াটসঅ্যাপ (WhatsApp)</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={(e) => void openShare('facebook', e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-900 hover:bg-blue-50 transition cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FacebookIcon className="w-3.5 h-3.5" />
              </div>
              <span className="flex-1 text-left">ফেসবুক (Facebook)</span>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={(e) => void openShare('instagram', e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-pink-900 hover:bg-pink-50 transition cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="font-black text-xs leading-none">◎</span>
              </div>
              <span className="flex-1 text-left">ইনস্টাগ্রাম (Instagram)</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={(e) => void openShare('x', e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-900 hover:bg-stone-100 transition cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="font-black text-[11px] leading-none">𝕏</span>
              </div>
              <span className="flex-1 text-left">এক্স (Twitter)</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={(e) => void openShare('linkedin', e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#0A66C2] hover:bg-sky-50 transition cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-xs font-extrabold text-[10px]">
                in
              </div>
              <span className="flex-1 text-left">লিঙ্কডইন (LinkedIn)</span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={(e) => void copyLink(e)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition border-t border-stone-100 mt-1 cursor-pointer"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </div>
              <span className="flex-1 text-left">
                {copied ? 'হোমপেজ লিংক কপি হয়েছে!' : 'হোমপেজ লিংক কপি করুন'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

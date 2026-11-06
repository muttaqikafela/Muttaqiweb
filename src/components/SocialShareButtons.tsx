import React from 'react';
import { FacebookIcon } from './BrandIcons';
import { MessageCircle } from 'lucide-react';

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

const NETWORKS: { id: SocialNetwork; label: string; className: string }[] = [
  { id: 'facebook', label: 'Facebook', className: 'bg-[#1877F2] hover:bg-[#1264cf] text-white' },
  { id: 'instagram', label: 'Instagram', className: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 hover:brightness-105 text-white' },
  { id: 'linkedin', label: 'LinkedIn', className: 'bg-[#0A66C2] hover:bg-[#084f99] text-white' },
  { id: 'whatsapp', label: 'WhatsApp', className: 'bg-[#25D366] hover:bg-[#1db954] text-[#073b20]' },
  { id: 'x', label: 'X', className: 'bg-black hover:bg-gray-800 text-white' }
];

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
  // Destination link MUST lead to the website's homepage when clicked on social media
  const homepageDestinationUrl = content.url || getHomepageUrl();

  const shareText = [
    content.title,
    content.text,
    `🌐 ওয়েবসাইট ভিজিট করুন: ${homepageDestinationUrl}`
  ]
    .filter(Boolean)
    .join('\n');

  const openShare = async (network: SocialNetwork, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

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

    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`share-btn-group flex flex-wrap items-center gap-1.5 ${className}`}
      role="group"
      aria-label="সোশ্যাল মিডিয়ায় শেয়ার করুন"
      onClick={(e) => e.stopPropagation()}
    >
      {NETWORKS.map((network) => (
        <button
          key={network.id}
          type="button"
          onClick={(event) => void openShare(network.id, event)}
          title={`${network.label}-এ শেয়ার করুন`}
          aria-label={`${network.label}-এ শেয়ার করুন`}
          className={`inline-flex items-center justify-center gap-1 rounded-lg font-semibold shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer ${
            network.className
          } ${compact ? 'h-6.5 min-w-6.5 px-1.5 text-[10px]' : 'px-2.5 py-1.5 text-xs'}`}
        >
          {network.id === 'facebook' && <FacebookIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
          {network.id === 'instagram' && (
            <span className={`font-black leading-none ${compact ? 'text-xs' : 'text-sm'}`}>◎</span>
          )}
          {network.id === 'linkedin' && (
            <span className={`font-extrabold leading-none ${compact ? 'text-[9px]' : 'text-xs'}`}>in</span>
          )}
          {network.id === 'whatsapp' && <MessageCircle className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
          {network.id === 'x' && <span className="font-black leading-none text-[11px]">𝕏</span>}
          {!compact && <span>{network.label}</span>}
          {compact && network.id === 'whatsapp' && <span className="font-bold text-[9px]">WA</span>}
        </button>
      ))}
    </div>
  );
};

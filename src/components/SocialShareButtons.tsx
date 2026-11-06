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

const getPageUrl = () => {
  if (typeof window === 'undefined') return 'https://muttaqi.com.bd/';
  return `${window.location.origin}${window.location.pathname}`;
};

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  content,
  compact = false,
  className = '',
  onMessage
}) => {
  const message = [content.title, content.text, content.imageUrl ? `ছবি: ${content.imageUrl}` : '']
    .filter(Boolean)
    .join('\n');
  const shareUrl = content.imageUrl || content.url;

  const openShare = async (network: SocialNetwork, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (network === 'instagram') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: content.title, text: message, url: shareUrl });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(`${message}\n${shareUrl}`);
        onMessage?.('শেয়ার লিংক কপি হয়েছে। Instagram খুলে পোস্ট/স্টোরিতে পেস্ট করুন।');
      } catch {
        onMessage?.('Instagram-এ শেয়ার করতে ছবির লিংক কপি করে অ্যাপে পেস্ট করুন।');
      }
      return;
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(message);
    let target = '';
    if (network === 'facebook') {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    } else if (network === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (network === 'whatsapp') {
      target = `https://wa.me/?text=${encodeURIComponent(`${message}\n${shareUrl}`)}`;
    } else {
      target = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} role="group" aria-label="সোশ্যাল মিডিয়ায় শেয়ার করুন">
      {NETWORKS.map((network) => (
        <button
          key={network.id}
          type="button"
          onClick={(event) => void openShare(network.id, event)}
          title={`${network.label}-এ শেয়ার করুন`}
          aria-label={`${network.label}-এ শেয়ার করুন`}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold shadow-sm transition ${network.className} ${compact ? 'h-7 min-w-7 px-1.5 text-[10px]' : 'px-2.5 py-1.5 text-xs'}`}
        >
          {network.id === 'facebook' && <FacebookIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
          {network.id === 'instagram' && <span className={`font-black leading-none ${compact ? 'text-sm' : 'text-base'}`}>◎</span>}
          {network.id === 'linkedin' && <span className={`font-extrabold leading-none ${compact ? 'text-[10px]' : 'text-xs'}`}>in</span>}
          {network.id === 'whatsapp' && <MessageCircle className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
          {network.id === 'x' && <span className="font-black leading-none">𝕏</span>}
          {!compact && <span>{network.label}</span>}
          {compact && network.id === 'whatsapp' && <span>WA</span>}
        </button>
      ))}
    </div>
  );
};

export const getSharePageUrl = (anchor: string) => `${getPageUrl()}#${anchor}`;

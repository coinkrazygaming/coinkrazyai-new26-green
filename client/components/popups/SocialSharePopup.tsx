import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Mail, Copy, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialSharePopupProps {
  winAmount: number;
  gameName: string;
  gameId?: number;
  onShare?: (platform: string, message: string) => Promise<void>;
  onClose: () => void;
}

export const SocialSharePopup: React.FC<SocialSharePopupProps> = ({
  winAmount,
  gameName,
  gameId,
  onShare,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareMessage = `🎉 I just won ${winAmount} SC playing ${gameName} on CoinKrazy Social Casino! 🎰 Join me and win big! 💰 https://coinkrazy.io/?ref=social`;

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=https://coinkrazy.io&quote=${encodeURIComponent(shareMessage)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-red-500 hover:bg-red-600',
      url: `mailto:?subject=Check out CoinKrazy!&body=${encodeURIComponent(shareMessage)}`
    }
  ];

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: string, url: string) => {
    setSelectedPlatform(platform);
    setIsSharing(true);

    try {
      // Record the share
      if (onShare) {
        await onShare(platform, shareMessage);
      }

      // Open share URL
      window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border-2 border-primary rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">You Won!</h2>
            <p className="text-3xl font-black text-primary">{winAmount} SC</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Share Message Preview */}
        <div className="bg-muted p-4 rounded-lg mb-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-2">Your Share Message:</p>
          <p className="text-sm text-foreground leading-relaxed">{shareMessage}</p>
        </div>

        {/* Social Platforms */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold text-muted-foreground">Share your win:</p>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name, platform.url)}
                  disabled={isSharing}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                    platform.color,
                    'text-white font-semibold text-sm',
                    isSharing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy to Clipboard */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleCopyMessage}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Message
              </>
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={onClose}
          >
            Continue Playing
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Share your wins to unlock exclusive rewards and bonuses!
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Share2, Link as LinkIcon, Users, Gift, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface ReferralLink {
  unique_code: string;
  referralUrl: string;
  clicks: number;
  conversions: number;
  total_referral_bonus: number;
}

interface ReferralStats {
  uniqueCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalScEarned: number;
  totalGcEarned: number;
}

interface ReferralShareCardProps {
  onRefresh?: () => void;
}

export const ReferralShareCard: React.FC<ReferralShareCardProps> = ({ onRefresh }) => {
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      const [linkRes, statsRes] = await Promise.all([
        apiCall<ReferralLink>('/referral/link'),
        apiCall<ReferralStats>('/referral/stats'),
      ]);

      if (linkRes) setReferralLink(linkRes);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (referralLink?.referralUrl) {
      navigator.clipboard.writeText(referralLink.referralUrl);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!referralLink?.referralUrl) return;

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CoinKrazy - Win Big!',
          text: 'Join me on CoinKrazy and win amazing prizes! Use my referral link for exclusive bonuses.',
          url: referralLink.referralUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const message = `🎉 Join me on CoinKrazy Social Casino! Win amazing prizes and get instant rewards! ${referralLink?.referralUrl}`;
    const encoded = encodeURIComponent(message);
    const url = referralLink?.referralUrl || '';

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${url}`,
      whatsapp: `https://wa.me/?text=${encoded}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Referral Program
          </CardTitle>
          <CardDescription>Earn rewards by inviting your friends!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Link Section */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-dashed border-purple-300 dark:border-purple-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Your Referral Link
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded px-3 py-2 truncate text-sm font-mono">
                {referralLink?.referralUrl || 'Loading...'}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <span className="text-green-600">✓</span>
                  </>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Code: <span className="font-semibold">{referralLink?.unique_code}</span>
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Total Referrals
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.totalReferrals || 0}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {stats?.completedReferrals || 0} completed
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Earnings
                </span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats?.totalScEarned?.toFixed(2) || '0'} SC
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                + {stats?.totalGcEarned || 0} GC
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Share Your Link
            </p>
            <div className="grid grid-cols-4 gap-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => shareToSocial('facebook')}
              >
                <span className="text-lg">f</span>
              </Button>
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={() => shareToSocial('twitter')}
              >
                𝕏
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => shareToSocial('whatsapp')}
              >
                <span className="text-lg">💬</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareLink}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              How It Works
            </p>
            <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <li>✓ Friend signs up with your code</li>
              <li>✓ They make their first deposit</li>
              <li>✓ You earn 2.5 SC + 500 GC bonus!</li>
              <li>✓ Unlimited referrals, unlimited earnings</li>
            </ul>
          </div>

          {/* Activity Section */}
          {(referralLink?.clicks || 0) > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Link Activity
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-purple-700 dark:text-purple-300 text-xs">Clicks</p>
                  <p className="text-lg font-bold">{referralLink?.clicks || 0}</p>
                </div>
                <div>
                  <p className="text-purple-700 dark:text-purple-300 text-xs">Conversions</p>
                  <p className="text-lg font-bold">{referralLink?.conversions || 0}</p>
                </div>
              </div>
              {referralLink && referralLink.clicks > 0 && (
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                  Conversion rate: {((referralLink.conversions / referralLink.clicks) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white text-center">
            <p className="text-sm font-semibold mb-2">💰 Share & Earn!</p>
            <p className="text-xs opacity-90">
              Keep sharing to maximize your earnings!
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

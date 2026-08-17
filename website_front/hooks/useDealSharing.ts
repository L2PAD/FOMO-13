import { useCallback } from 'react';
import copy from 'clipboard-copy';
import { toast } from 'react-toastify';

export const useDealSharing = () => {
    const generateDealLink = useCallback((dealId: string, tab: string = 'sell', section?: 'otc' | 'p2p') => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const normalizedTab = String(tab || 'sell').trim().toLowerCase().replace(/\s+/g, '-');

        if (normalizedTab === 'top-members') {
            const params = new URLSearchParams();
            if (dealId) {
                params.set('id', dealId);
            }

            const query = params.toString();
            return `${baseUrl}/utility/top-members${query ? `?${query}` : ''}`;
        }

        const params = new URLSearchParams({
            tab: normalizedTab,
            id: dealId
        });
        if (section === 'p2p') {
            params.set('section', 'p2p');
        }
        return `${baseUrl}/utility?${params.toString()}`;
    }, []);

    const shareDeal = useCallback(async (dealId: string, tab: string = 'sell', section?: 'otc' | 'p2p') => {
        const shareUrl = generateDealLink(dealId, tab, section);
        const shareText = `Check out this on FOMO.CX: `;

        if (navigator.share && window.innerWidth < 480) {
            try {
                await navigator.share({
                    title: 'Sharing',
                    text: shareText,
                    url: shareUrl,
                });
                toast.success('Shared successfully!');
                return { success: true, method: 'native' };
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    toast.error('Failed to share deal');
                }
                return { success: false, method: 'native', error: 'cancelled' };
            }
        } else {
            try {
                await copy(shareUrl);
                toast.success('Link copied to clipboard!');
                return { success: true, method: 'clipboard' };
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                toast.error('Failed to copy link');
                return { success: false, method: 'clipboard', error };
            }
        }
    }, [generateDealLink]);

    return { generateDealLink, shareDeal };
};

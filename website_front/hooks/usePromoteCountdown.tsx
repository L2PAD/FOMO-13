import { useEffect, useState } from 'react';

export const usePromoteCountdown = (nextPromotedDate?: string | Date) => {
    const getTimeLeft = () => {
        if (!nextPromotedDate) return 0;

        const diff =
            new Date(nextPromotedDate).getTime() - Date.now();

        return Math.max(diff, 0);
    };

    const [timeLeft, setTimeLeft] = useState<number>(getTimeLeft);

    useEffect(() => {
        if (!nextPromotedDate) return;

        setTimeLeft(getTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(getTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [nextPromotedDate]);

    const minutes = Math.floor(timeLeft / 1000 / 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return {
        minutes,
        seconds,
        isEnded: timeLeft <= 0,
    };
};

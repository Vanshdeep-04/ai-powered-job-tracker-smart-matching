import { useEffect, useCallback } from 'react';

export function useWindowFocus(callback) {
    const handleFocus = useCallback(() => {
        callback();
    }, [callback]);

    useEffect(() => {
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [handleFocus]);
}

export function useVisibilityChange(callback) {
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                callback();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [callback]);
}

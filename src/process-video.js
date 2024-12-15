import { useCallback, useRef } from 'react';
import { useSetIsProcessing, useVideoData } from './state';

export const useProcessVideo = () => {
    const setIsProcessing = useSetIsProcessing();
    const videoData = useVideoData();
    const videoDataRef = useRef();
    videoDataRef.current = videoData;

    return useCallback(async () => {
        setIsProcessing(true);
        // await process()
        await new Promise(resolve => {
            setTimeout(() => resolve(), 3000);
        });
        setIsProcessing(false);

        return videoDataRef.current;
    }, [setIsProcessing]);
};

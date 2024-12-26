import { useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { v4 as uuid } from 'uuid';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import {
    useSetIsProcessing,
    useVideoData,
    useTrimStart,
    useTrimEnd,
    useIsMuted,
    useVideoEditorConfigMaxVideoDurationInSeconds,
    useVideoEditorConfigMaxVideoSize
} from './state';

export const processVideo = async ({
    sourceUri,
    maxVideoSize,
    trimStart = 0,
    trimEnd,
    maxVideoDuration = 0,
    shouldRemoveAudio
}) => {
    const targetUri = `${FileSystem.cacheDirectory}${uuid()}.mp4`;
    const duration = Math.min(trimEnd ? (trimEnd - trimStart) : maxVideoDuration, maxVideoDuration);
    return new Promise((resolve, reject) => {
        const ffmpegArgs = [
            // Source video url
            '-i', sourceUri,
            // Scale bigger dimension to maxVideoSize if bigger than maxVideoSize
            ...(maxVideoSize ? ['-vf', `scale=if(gt(iw\\,ih)\\,min(${maxVideoSize}\\,iw)\\,-2):if(gt(iw\\,ih)\\,-2\\,min(${maxVideoSize}\\,ih))`] : []),
            // Skip trimStart seconds
            ...(trimStart ? ['-ss', trimStart] : []),
            // Extract the next duration seconds
            ...(duration ? ['-t', duration] : []),
            // Use libx264 video codec
            '-c:v', 'libx264',
            // Remove audio
            ...(shouldRemoveAudio ? ['-an'] : []),
            // Target video url
            targetUri
        ];

        FFmpegKit.executeAsync(
            ffmpegArgs.join(' '),
            async session => {
                const returnCode = await session.getReturnCode();
                if (!ReturnCode.isSuccess(returnCode)) {
                    reject();
                }

                resolve({
                    uri: targetUri
                });
            }
        );
    });
};

export const useProcessVideo = () => {
    const setIsProcessing = useSetIsProcessing();
    const videoData = useVideoData();
    const trimStart = useTrimStart();
    const isMuted = useIsMuted();
    const trimEnd = useTrimEnd();
    const maxVideoDuration = useVideoEditorConfigMaxVideoDurationInSeconds();
    const maxVideoSize = useVideoEditorConfigMaxVideoSize();
    const processVideoDataRef = useRef();
    processVideoDataRef.current = {
        videoData,
        trimStart,
        trimEnd,
        maxVideoDuration,
        maxVideoSize,
        isMuted
    };

    return useCallback(async () => {
        setIsProcessing(true);

        const {
            videoData,
            trimStart,
            trimEnd,
            maxVideoDuration,
            maxVideoSize,
            isMuted
        } = processVideoDataRef.current;
        const { uri } = await processVideo({
            sourceUri: videoData.uri,
            maxVideoSize,
            trimStart,
            trimEnd,
            maxVideoDuration,
            shouldRemoveAudio: isMuted
        });

        setIsProcessing(false);

        return { uri };
    }, [setIsProcessing]);
};

import React, {
    useCallback,
    useEffect,
    useRef
} from 'react';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import styled from 'styled-components/native';
import noop from 'lodash/noop';
import { _DEFAULT_INITIAL_PLAYBACK_STATUS } from 'expo-av/build/AV';
import {
    useSetIsVideoComponentBusy,
    useSetIsVideoLoading,
    useSetPositionInMillis,
    useSetVideoComponent,
    useVideoComponent,
    useVideoData
} from './state';

const Video = styled(ExpoVideo)`
    flex: 1;
    justify-content: center;
`;

export const useVideo = () => {
    const videoData = useVideoData();
    const setVideoComponent = useSetVideoComponent();
    const setIsVideoLoading = useSetIsVideoLoading();
    const videoComponent = useVideoComponent();
    const setIsVideoComponentBusy = useSetIsVideoComponentBusy();
    const setPositionInMillis = useSetPositionInMillis();

    const uriRef = useRef();
    uriRef.current = videoData?.uri;

    useEffect(() => {
        videoComponent?.loadAsync(
            { uri: uriRef.current },
            _DEFAULT_INITIAL_PLAYBACK_STATUS,
            true
        ).catch(noop);
    }, [videoComponent]);

    const onRefChange = useCallback(videoRef => {
        setVideoComponent(videoRef);
    }, [setVideoComponent]);

    const renderVideo = () => (
        <Video
            ref={onRefChange}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            onLoadStart={() => {
                setIsVideoLoading(true);
            }}
            onLoad={() => {
                setIsVideoLoading(false);
                setIsVideoComponentBusy(false);
            }}
            onPlaybackStatusUpdate={status => {
                setPositionInMillis(status?.positionMillis ?? 0);
            }}
        />
    );

    return {
        renderVideo
    };
};

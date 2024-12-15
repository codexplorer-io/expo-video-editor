import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import styled from 'styled-components/native';
import { usePrevious } from '@codexporer.io/react-hooks';
import {
    VIDEO_EDITOR_ROUTE_NAME,
    useCloseVideoEditor,
    useVideoEditorState,
    useResetEditorState,
    useVideoEditorConfigVideoUri,
    useIsReady,
    useSetIsReady,
    useSetVideoData,
    useIsProcessing,
    useIsVideoLoading,
    useVideoEditorConfigIsLocal
} from './state';
import { HeaderBar } from './header-bar';
import { Processing } from './processing';
import { downloadVideo } from './download-video';
import { Trimmer } from './trimmer';
import { useVideo } from './video';

const ScreenRoot = styled.View`
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: ${({ theme }) => theme.colors.primary};
`;

const SafeArea = styled.SafeAreaView`
    display: flex;
    flex: 1;
`;

const ScreenContent = styled.View`
    display: flex;
    flex: 1;
    position: relative;
    background-color: #000;
`;

const VideoEditorViewContainer = styled.View`
    flex: 1;
`;

export const VideoEditorScreen = () => {
    const isFocused = useIsFocused();
    const videoUri = useVideoEditorConfigVideoUri();
    const isLocal = useVideoEditorConfigIsLocal();
    const closeVideoEditor = useCloseVideoEditor();
    const setIsReady = useSetIsReady();
    const isProcessing = useIsProcessing();
    const setVideoData = useSetVideoData();
    const isVideoLoading = useIsVideoLoading();
    const isReady = useIsReady();
    const { renderVideo } = useVideo();

    // Initialise the image data when it is set through the props
    useEffect(() => {
        const initialise = async () => {
            if (videoUri) {
                const {
                    url,
                    width,
                    height,
                    duration
                } = await downloadVideo({
                    url: videoUri,
                    isLocal
                });
                setVideoData({
                    uri: url,
                    width,
                    height,
                    duration
                });
                setIsReady(true);
            }
        };
        initialise();
    }, [
        videoUri,
        isLocal,
        setVideoData,
        setIsReady
    ]);

    useEffect(() => {
        const handler = isFocused && BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                closeVideoEditor();
                return true;
            }
        );

        return () => handler && handler.remove();
    }, [
        closeVideoEditor,
        isFocused
    ]);

    return (
        <ScreenRoot>
            <HeaderBar />
            <SafeArea>
                <ScreenContent>
                    {isReady ? (
                        <VideoEditorViewContainer>
                            {renderVideo()}
                            <Trimmer />
                        </VideoEditorViewContainer>
                    ) : (
                        <Processing isOverlay={false} />
                    )}
                    {(isProcessing || isVideoLoading) ? <Processing /> : null}
                </ScreenContent>
            </SafeArea>
        </ScreenRoot>
    );
};

export const VideoEditor = () => {
    const {
        shouldOpen,
        shouldClose,
        navigation
    } = useVideoEditorState();
    const resetEditorState = useResetEditorState();

    const previousShouldClose = usePrevious(shouldClose);
    const shouldCloseScreen = shouldClose && !previousShouldClose;
    useEffect(() => {
        if (shouldCloseScreen) {
            navigation.goBack();
            setTimeout(() => resetEditorState(), 1000);
        }
    }, [
        shouldCloseScreen,
        navigation,
        resetEditorState
    ]);

    const previousShouldOpen = usePrevious(shouldOpen);
    const shouldOpenScreen = !shouldClose && shouldOpen && !previousShouldOpen;
    useEffect(() => {
        shouldOpenScreen && navigation.navigate(VIDEO_EDITOR_ROUTE_NAME);
    }, [
        shouldOpenScreen,
        navigation
    ]);

    return null;
};

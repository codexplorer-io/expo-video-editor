import { useRef } from 'react';
import {
    createStore,
    createStateHook,
    createActionsHook
} from 'react-sweet-state';

export const VIDEO_EDITOR_ROUTE_NAME = 'CodExpoVideoEditor';

const initialState = {
    videoEditorState: {
        shouldOpen: false,
        shouldClose: false,
        navigation: undefined,
        config: {
            onEditingComplete: undefined,
            videoUri: undefined,
            isLocal: false,
            maxVideoSize: undefined,
            maxVideoDurationInSeconds: undefined,
            imageCaptureAction: {
                getIsVisible: () => false,
                getIsEnabled: () => false,
                onCapture: undefined,
                maxImageSize: 0,
                successMessage: 'Image saved',
                label: 'Save As Image'
            }
        }
    },
    isVideoLoading: false,
    isReady: false,
    isProcessing: false,
    videoData: {
        uri: '',
        width: 0,
        height: 0,
        duration: 0
    },
    videoComponent: null,
    isVideoComponentBusy: true,
    positionInMillis: 0,
    isPlaying: false,
    trimStart: 0,
    trimEnd: 0,
    isMuted: false
};

const initializeNavigation = navigation => ({
    getState,
    setState
}) => {
    setState({
        videoEditorState: {
            ...getState().videoEditorState,
            navigation
        }
    });
};

const openVideoEditor = config => ({ setState, getState }) => {
    const { videoEditorState } = getState();
    if (!videoEditorState.shouldOpen) {
        setState({
            videoEditorState: {
                ...videoEditorState,
                shouldOpen: true,
                shouldClose: false,
                config: {
                    ...initialState.videoEditorState.config,
                    ...config
                }
            }
        });
    }
};

const closeVideoEditor = () => ({ setState, getState }) => {
    const { videoEditorState } = getState();
    if (!videoEditorState.shouldClose) {
        setState({
            videoEditorState: {
                ...videoEditorState,
                shouldOpen: false,
                shouldClose: true
            }
        });
    }
};

const setIsReady = isReady => ({ setState }) => {
    setState({ isReady });
};

const setIsVideoLoading = isVideoLoading => ({ setState }) => {
    setState({ isVideoLoading });
};

const setIsProcessing = isProcessing => ({ setState }) => {
    setState({ isProcessing });
};

const setVideoData = videoData => ({ setState }) => {
    setState({ videoData });
};

const setVideoComponent = videoComponent => ({ setState }) => {
    setState({ videoComponent });
};

const setIsVideoComponentBusy = isVideoComponentBusy => ({ setState }) => {
    setState({ isVideoComponentBusy });
};

const setPositionInMillis = positionInMillis => ({ setState }) => {
    setState({ positionInMillis });
};

const setIsPlaying = isPlaying => ({ setState }) => {
    setState({ isPlaying });
};

const setTrimStart = trimStart => ({ setState }) => {
    setState({ trimStart });
};

const setTrimEnd = trimEnd => ({ setState }) => {
    setState({ trimEnd });
};

const setIsMuted = isMuted => ({ setState }) => {
    setState({ isMuted });
};

const resetEditorState = () => ({ getState, setState }) => {
    setState({
        ...initialState,
        videoEditorState: getState().videoEditorState
    });
};

const Store = createStore({
    initialState,
    actions: {
        initializeNavigation,
        openVideoEditor,
        closeVideoEditor,
        setIsVideoLoading,
        setIsReady,
        setIsProcessing,
        setVideoData,
        setVideoComponent,
        setIsVideoComponentBusy,
        setPositionInMillis,
        setIsPlaying,
        setTrimStart,
        setTrimEnd,
        setIsMuted,
        resetEditorState
    },
    name: 'expoVideoEditor'
});

const useActions = createActionsHook(Store);

export const useVideoEditorState = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config,
            ...videoEditorState
        }
    }) => videoEditorState
});

export const useVideoEditorConfigOnEditingComplete = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                onEditingComplete
            }
        }
    }) => onEditingComplete
});

export const useVideoEditorConfigVideoUri = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                videoUri
            }
        }
    }) => videoUri
});

export const useVideoEditorConfigIsLocal = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                isLocal
            }
        }
    }) => isLocal
});

export const useVideoEditorConfigImageCaptureAction = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                imageCaptureAction
            }
        }
    }) => imageCaptureAction
});

export const useVideoEditorConfigMaxVideoSize = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                maxVideoSize
            }
        }
    }) => maxVideoSize
});

export const useVideoEditorConfigMaxVideoDurationInSeconds = createStateHook(Store, {
    selector: ({
        videoEditorState: {
            config: {
                maxVideoDurationInSeconds
            }
        }
    }) => maxVideoDurationInSeconds
});

export const useInitializeNavigation = () => useActions().initializeNavigation;

export const useOpenVideoEditor = () => useActions().openVideoEditor;

export const useCloseVideoEditor = () => useActions().closeVideoEditor;

export const useIsVideoLoading = createStateHook(Store, {
    selector: ({ isVideoLoading }) => isVideoLoading
});

export const useSetIsVideoLoading = () => useActions().setIsVideoLoading;

export const useIsReady = createStateHook(Store, {
    selector: ({ isReady }) => isReady
});

export const useSetIsReady = () => useActions().setIsReady;

export const useIsProcessing = createStateHook(Store, {
    selector: ({ isProcessing }) => isProcessing
});

export const useSetIsProcessing = () => useActions().setIsProcessing;

export const useVideoData = createStateHook(Store, {
    selector: ({ videoData }) => videoData
});

export const useSetVideoData = () => useActions().setVideoData;

export const useVideoComponent = createStateHook(Store, {
    selector: ({ videoComponent }) => videoComponent
});

export const useVideoComponentRef = () => {
    const videoComponent = useVideoComponent();
    const videoComponentRef = useRef();
    videoComponentRef.current = videoComponent;
    return videoComponentRef;
};

export const useSetVideoComponent = () => useActions().setVideoComponent;

export const useIsVideoComponentBusy = createStateHook(Store, {
    selector: ({ isVideoComponentBusy }) => isVideoComponentBusy
});

export const useSetIsVideoComponentBusy = () => useActions().setIsVideoComponentBusy;

export const usePositionInMillis = createStateHook(Store, {
    selector: ({ positionInMillis }) => positionInMillis
});

export const useSetPositionInMillis = () => useActions().setPositionInMillis;

export const useIsPlaying = createStateHook(Store, {
    selector: ({ isPlaying }) => isPlaying
});

export const useSetIsPlaying = () => useActions().setIsPlaying;

export const useTrimStart = createStateHook(Store, {
    selector: ({ trimStart }) => trimStart
});

export const useSetTrimStart = () => useActions().setTrimStart;

export const useTrimEnd = createStateHook(Store, {
    selector: ({ trimEnd }) => trimEnd
});

export const useSetTrimEnd = () => useActions().setTrimEnd;

export const useIsMuted = createStateHook(Store, {
    selector: ({ isMuted }) => isMuted
});

export const useSetIsMuted = () => useActions().setIsMuted;

export const useResetEditorState = () => useActions().resetEditorState;

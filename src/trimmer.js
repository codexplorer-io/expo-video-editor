import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    PanResponder,
    Animated
} from 'react-native';
import styled, { css } from 'styled-components/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from '@codexporer.io/expo-layout-state';
import { useDimensions } from '@codexporer.io/react-hooks';
import inRange from 'lodash/inRange';
import noop from 'lodash/noop';
import { Text } from 'react-native-paper';
import { formatTimeSpan, TimeSpanFormat } from '@pole-journal/formatters';
import { runOnJS } from 'react-native-reanimated';
import { v4 as uuid } from 'uuid';
import {
    useAppSnackbarActions,
    APP_SNACKBAR_POSITION,
    APP_SNACKBAR_DURATION
} from '@codexporer.io/expo-app-snackbar';
import {
    useIsVideoComponentBusy,
    usePositionInMillis,
    useSetIsVideoComponentBusy,
    useVideoComponentRef,
    useVideoData,
    useIsPlaying,
    useTrimStart,
    useSetTrimStart,
    useTrimEnd,
    useSetTrimEnd,
    useIsMuted,
    useSetIsMuted,
    useVideoEditorConfigImageCaptureAction,
    useSetIsProcessing,
    useVideoEditorConfigMaxVideoDurationInSeconds
} from './state';
import { IconButton } from './icon-button';
import { getVideoSnapshotUri } from './get-video-cover-uri';
import resizerImage from './assets/resizer.png';

const HEIGHT = 40;
const PADDING = 80;
const CORNER_THUMB_WIDTH = 20;
const CORNER_RESPONDER_WIDTH = 10;
const CALCULATED_PADDING = PADDING / 2 - CORNER_THUMB_WIDTH / 2;
const CORNERS_EXTRA_HEIGHT = 20;
const POINTER_THUMB_EXTRA_HEIGHT = 20;
const CORNERS_HEIGHT = HEIGHT + CORNERS_EXTRA_HEIGHT;
const POINTER_THUMB_WIDTH = 2;

const Root = styled.View`
    padding-left: ${CALCULATED_PADDING}px;
    padding-right: ${CALCULATED_PADDING}px;
`;

const containerStyle = css`
    position: relative;
    flex-direction: row;
    justify-content: center;
    height: ${HEIGHT}px;
`;

const Container = styled.View`
    ${containerStyle}
    background-color: rgba(255, 255, 255, 0.4);
    margin-top: ${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
`;

const Corners = styled.View`
    position: absolute;
    top: -${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
    height: ${CORNERS_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT}px;
    flex: 1;
    flex-direction: row;
    justify-content: space-between;
    overflow: visible;
`;

const LeftSection = styled(Animated.View)`
    ${containerStyle}
    margin-top: ${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
    left: ${({ left }) => left}px;
`;

const RightSection = styled(Animated.View)`
    ${containerStyle}
    position: absolute;
    flex: 1;
    margin-top: ${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
    right: ${({ right }) => right}px;
`;

const Row = styled.View`
    flex-direction: row;
`;

const cornerResponderStyle = css`
    background-color: transparent;
    width: ${CORNER_RESPONDER_WIDTH}px;
    height: ${HEIGHT}px;
    position: absolute;
`;

const LeftCornerResponder = styled.View`
    ${cornerResponderStyle}
    right: -${CORNER_RESPONDER_WIDTH}px
`;

const RightCornerResponder = styled.View`
    ${cornerResponderStyle}
    left: -${CORNER_RESPONDER_WIDTH}px
`;

const CornerThumb = styled.Image`
    background-color: transparent;
    width: ${CORNER_THUMB_WIDTH}px;
    height: ${CORNERS_HEIGHT}px;
    margin-top: -${CORNERS_EXTRA_HEIGHT / 2}px;
    ${({ isRight }) => isRight ? 'transform: rotate(180deg);' : ''}
`;

const PointerThumb = styled(Animated.View)`
    position: absolute;
    width: ${POINTER_THUMB_WIDTH}px;
    height: ${CORNERS_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT}px;
    top: 0px;
    left: ${({ left }) => left}px;
    background-color: #e0e0e0;
`;

const Progress = styled.View`
    position: absolute;
    left: 0;
    right: 0;
    top: ${CORNERS_EXTRA_HEIGHT / 2}px;
    bottom: ${CORNERS_EXTRA_HEIGHT / 2}px;
`;

const CornerLine = styled.View`
    background-color: rgba(0, 0, 0, 0.7);
    width: ${({ width }) => width}px;
`;

const Spacer = styled.View`
    height: ${({ height = 10 }) => height}px;
`;

const Time = styled(Text)`
    text-align: center;
    color: white;
`;

const LimitMessage = styled(Text)`
    position: absolute;
    top: ${({ top = 0 }) => -top - 10}px;
    left: 10px;
    right: 10px;
    padding: 10px;
    background-color: ${({ top = 0 }) => top ? 'rgba(0, 0, 0, 0.5)' : 'transparent'};
    text-align: center;
    color: ${({ top = 0 }) => top ? 'white' : 'transparent'};
`;

const BottomActionsRoot = styled.View`
    background-color: ${({ theme }) => theme.colors.primary};
    padding-left: 10px;
    padding-right: 10px;
`;

const BottomActionsContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
`;

const BottomActionSpacer = styled.View`
    width: 10px;
`;

const calculateCornerResult = (duration, value, width, fromRight) => {
    const val = Math.abs(value);
    const result = duration * val / width;
    return fromRight ? duration - result : result;
};

const calculateOffset = (duration, value, width, fromRight) => {
    const offset = Math.abs(value * (width - PADDING) / duration);
    return fromRight ? offset - (width - PADDING) : offset;
};

const calculatePointerThumbOffset = (offset, leftOffset, rightOffset) => {
    if (
        inRange(offset, leftOffset, leftOffset + CORNER_THUMB_WIDTH) ||
        inRange(offset + CORNER_THUMB_WIDTH, leftOffset, leftOffset + CORNER_THUMB_WIDTH)
    ) {
        return leftOffset + CORNER_THUMB_WIDTH - 2;
    }

    if (
        inRange(offset, rightOffset, rightOffset + CORNER_THUMB_WIDTH) ||
        inRange(offset + CORNER_THUMB_WIDTH, rightOffset, rightOffset + CORNER_THUMB_WIDTH)
    ) {
        return rightOffset - POINTER_THUMB_WIDTH + 2;
    }

    return offset;
};

const BottomActions = ({
    isPlaying,
    onPlay,
    isMuted,
    onMute,
    onImageCapture,
    imageCaptureActionConfig
}) => (
    <BottomActionsRoot>
        <BottomActionsContainer>
            <BottomAction
                iconName={isPlaying ? 'pause-circle' : 'play-circle'}
                text={isPlaying ? 'Pause' : 'Play'}
                onPress={() => {
                    onPlay(!isPlaying);
                }}
            />
            <BottomActionSpacer />
            <BottomAction
                iconName={isMuted ? 'volume-high' : 'volume-off'}
                text={isMuted ? 'Retrieve Sound' : 'Remove Sound'}
                onPress={() => {
                    onMute(!isMuted);
                }}
            />
            {!!imageCaptureActionConfig?.getIsVisible?.() &&
                !!imageCaptureActionConfig?.onCapture &&
                (
                    <>
                        <BottomActionSpacer />
                        <BottomAction
                            iconName='camera-plus'
                            text={imageCaptureActionConfig.label}
                            isDisabled={!imageCaptureActionConfig?.getIsEnabled?.()}
                            onPress={onImageCapture}
                        />
                    </>
                )
            }
        </BottomActionsContainer>
        <Spacer />
    </BottomActionsRoot>
);

const BottomAction = ({
    iconName,
    text,
    onPress,
    isDisabled
}) => (
    <IconButton
        iconName={iconName}
        text={text}
        onPress={onPress}
        isDisabled={isDisabled}
    />
);

export const Trimmer = () => {
    const { width: windowWidth } = useDimensions('window');
    const {
        currentLayout: { width },
        setCurrentLayout
    } = useLayout({ width: windowWidth });
    const {
        currentLayout: {
            height: limitMessageHeight
        },
        setCurrentLayout: setLimitMessageLayout
    } = useLayout({ width: windowWidth });
    const {
        duration,
        uri
    } = useVideoData();
    const trimStart = useTrimStart();
    const setTrimStart = useSetTrimStart();
    const trimEnd = useTrimEnd();
    const setTrimEnd = useSetTrimEnd();
    const [currentTime, setCurrentTime] = useState(trimStart);
    const videoComponentRef = useVideoComponentRef();
    const imageCaptureActionConfig = useVideoEditorConfigImageCaptureAction();
    const maxVideoDurationInSeconds = useVideoEditorConfigMaxVideoDurationInSeconds();
    const isVideoComponentBusy = useIsVideoComponentBusy();
    const setIsVideoComponentBusy = useSetIsVideoComponentBusy();
    const positionInMillis = usePositionInMillis();
    const isPlaying = useIsPlaying();
    const isMuted = useIsMuted();
    const setIsMuted = useSetIsMuted();
    const setIsProcessing = useSetIsProcessing();
    const [, { show: showAppSnackbar }] = useAppSnackbarActions();
    const [, setComponentRefreshId] = useState('');

    const isVideoComponentBusyRef = useRef();
    isVideoComponentBusyRef.current = isVideoComponentBusy;

    const onProgressChange = progressOffset => {
        setCurrentTime(
            calculateCornerResult(
                duration,
                progressOffset,
                width - PADDING
            )
        );
    };
    const progressTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .onStart(event => {
            runOnJS(onProgressChange)(event.absoluteX - CALCULATED_PADDING);
        });

    const progressDragGesture = Gesture.Pan().onChange(event => {
        runOnJS(onProgressChange)(event.absoluteX - CALCULATED_PADDING);
    });

    const leftCornerPosRef = useRef();
    const rightCornerPosRef = useRef();
    const handleLeftCornerMoveRef = useRef();
    const handleLeftCornerReleaseRef = useRef();
    const handleRightCornerMoveRef = useRef();
    const handleRightCornerReleaseRef = useRef();

    const {
        leftCorner,
        rightCorner,
        leftResponder,
        rightResponder
    } = useMemo(() => {
        const leftCorner = new Animated.Value(0);
        const rightCorner = new Animated.Value(0);

        leftCorner.addListener(({ value }) => {
            leftCornerPosRef.current = value;
        });
        rightCorner.addListener(({ value }) => {
            rightCornerPosRef.current = value;
        });

        return {
            leftCorner,
            rightCorner,
            leftResponder: PanResponder.create({
                onMoveShouldSetPanResponder:
                    (e, gestureState) => Math.abs(gestureState.dx) > 0,
                onMoveShouldSetPanResponderCapture:
                    (e, gestureState) => Math.abs(gestureState.dx) > 0,
                onPanResponderMove:
                    (e, gestureState) => handleLeftCornerMoveRef.current(e, gestureState),
                onPanResponderRelease:
                    () => handleLeftCornerReleaseRef.current()
            }),
            rightResponder: PanResponder.create({
                onMoveShouldSetPanResponder:
                    (e, gestureState) => Math.abs(gestureState.dx) > 0,
                onMoveShouldSetPanResponderCapture:
                    (e, gestureState) => Math.abs(gestureState.dx) > 0,
                onPanResponderMove:
                    (e, gestureState) => handleRightCornerMoveRef.current(e, gestureState),
                onPanResponderRelease:
                    () => handleRightCornerReleaseRef.current()
            })
        };
    }, []);

    handleLeftCornerMoveRef.current = (e, gestureState) => {
        setTrimStart(
            calculateCornerResult(duration, leftCornerPosRef.current, width - PADDING)
        );

        Animated.event([null, { dx: leftCorner }], { useNativeDriver: false })(e, gestureState);
    };

    handleLeftCornerReleaseRef.current = () => {
        if (leftCornerPosRef.current < 0) {
            setTrimStart(0);
            leftCorner.setOffset(0);
        } else if (trimEnd - trimStart < 1) {
            const startTime = trimEnd - 1;
            setTrimStart(startTime);
            leftCorner.setOffset(calculateOffset(duration, startTime, width));
        } else {
            leftCorner.setOffset(leftCornerPosRef.current);
        }

        leftCorner.setValue(0);
    };

    handleRightCornerMoveRef.current = (e, gestureState) => {
        setTrimEnd(
            calculateCornerResult(duration, rightCornerPosRef.current, width - PADDING, true)
        );

        Animated.event([null, { dx: rightCorner }], { useNativeDriver: false })(e, gestureState);
    };

    handleRightCornerReleaseRef.current = () => {
        if (rightCornerPosRef.current > 0) {
            setTrimEnd(duration);
            rightCorner.setOffset(0);
        } else if (trimEnd - trimStart < 1) {
            const endTime = trimStart + 1;
            setTrimEnd(endTime);
            rightCorner.setOffset(calculateOffset(duration, endTime, width, true));
        } else {
            rightCorner.setOffset(rightCornerPosRef.current);
        }

        rightCorner.setValue(0);
    };

    useEffect(() => {
        setTrimEnd(duration);
    }, [setTrimEnd, duration]);

    useEffect(() => {
        if (trimStart != null && !Number.isNaN(trimStart)) {
            setCurrentTime(trimStart);
        }
    }, [
        trimStart,
        setIsVideoComponentBusy,
        videoComponentRef
    ]);

    useEffect(() => {
        if (trimEnd != null && !Number.isNaN(trimEnd)) {
            setCurrentTime(trimEnd);
        }
    }, [trimEnd, setIsVideoComponentBusy, videoComponentRef]);

    useEffect(() => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        if (currentTime != null && !Number.isNaN(currentTime)) {
            setIsVideoComponentBusy(true);
            videoComponentRef.current.setPositionAsync(
                currentTime * 1000,
                { toleranceMillisBefore: 0, toleranceMillisAfter: 0 }
            ).then(() => {
                setIsVideoComponentBusy(false);
            }).catch(noop);
        }
    }, [
        currentTime,
        setIsVideoComponentBusy,
        videoComponentRef
    ]);

    useEffect(() => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        const hasReachedEnd = isPlaying &&
            Math.floor(positionInMillis / 1000) >= Math.floor(trimEnd);
        if (hasReachedEnd) {
            setIsVideoComponentBusy(true);
            videoComponentRef.current.pauseAsync()
                .then(() => videoComponentRef.current.setPositionAsync(
                    trimEnd * 1000,
                    { toleranceMillisBefore: 0, toleranceMillisAfter: 0 }
                )).then(() => {
                    setIsVideoComponentBusy(false);
                }).catch(noop);
        }
    }, [
        positionInMillis,
        isPlaying,
        trimStart,
        trimEnd,
        setIsVideoComponentBusy,
        videoComponentRef
    ]);

    const onPlay = shouldPlay => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        setIsVideoComponentBusy(true);
        const hasReachedEnd = Math.floor(positionInMillis / 1000) >= Math.floor(trimEnd);
        videoComponentRef.current?.[shouldPlay ? (hasReachedEnd ? 'playFromPositionAsync' : 'playAsync') : 'pauseAsync'](
            ...(
                shouldPlay && hasReachedEnd ?
                    [trimStart * 1000, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 }] :
                    []
            )
        ).then(() => {
            setIsVideoComponentBusy(false);
        }).catch(noop);
    };

    const onMute = shouldMute => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        setIsVideoComponentBusy(true);
        videoComponentRef.current?.setIsMutedAsync(shouldMute).then(() => {
            setIsMuted(shouldMute);
            setIsVideoComponentBusy(false);
            showAppSnackbar({
                message: shouldMute ? 'Video muted' : 'Video unmuted',
                duration: APP_SNACKBAR_DURATION.short,
                position: APP_SNACKBAR_POSITION.bottom
            });
        }).catch(noop);
    };

    const onImageCapture = async () => {
        setIsProcessing(true);
        const url = await getVideoSnapshotUri({
            url: uri,
            maxImageSize: imageCaptureActionConfig.maxImageSize,
            timeInSeconds: currentTime
        });
        imageCaptureActionConfig.onCapture({ url });
        setComponentRefreshId(uuid());
        setIsProcessing(false);
        showAppSnackbar({
            message: imageCaptureActionConfig.successMessage,
            duration: APP_SNACKBAR_DURATION.short,
            position: APP_SNACKBAR_POSITION.bottom
        });
    };

    const leftOffset = useMemo(
        () => calculateOffset(duration, trimStart, width),
        [duration, trimStart, width]
    );
    const rightOffset = useMemo(
        () => calculateOffset(duration, trimEnd, width, true),
        [duration, trimEnd, width]
    );
    const canDisplayResponders = useMemo(() => (
        width -
        CALCULATED_PADDING * 2 -
        CORNER_THUMB_WIDTH * 2 -
        Math.abs(rightOffset) -
        Math.abs(leftOffset) -
        CORNER_RESPONDER_WIDTH * 2
    ) > 0, [leftOffset, rightOffset, width]);
    const shouldDisplayLeftResponder = canDisplayResponders &&
        leftOffset < CORNER_RESPONDER_WIDTH;
    const shouldDisplayRightResponder = canDisplayResponders &&
        rightOffset > -CORNER_RESPONDER_WIDTH;

    const trimmedDuration = trimEnd - trimStart;
    const calculatedCurrentTime = positionInMillis / 1000;
    const trimmedCurrentTime = calculatedCurrentTime - trimStart;
    const formattedDuration = formatTimeSpan({
        timeSpan: trimmedDuration,
        shouldIncludeMinutes: true,
        shouldIncludeSeconds: true,
        format: TimeSpanFormat.TIME
    });
    const formattedCurrentTime = formatTimeSpan({
        timeSpan: trimmedCurrentTime,
        shouldIncludeMinutes: true,
        shouldIncludeSeconds: true,
        format: TimeSpanFormat.TIME
    });

    const pointerThumbOffset = calculatePointerThumbOffset(
        calculateOffset(
            duration,
            calculatedCurrentTime,
            width
        ),
        leftOffset,
        width - CALCULATED_PADDING * 2 - CORNER_THUMB_WIDTH + rightOffset
    );

    return (
        <>
            <Root onLayout={event => setCurrentLayout(event.nativeEvent.layout)}>
                {maxVideoDurationInSeconds != null &&
                    Math.floor(trimmedDuration) > maxVideoDurationInSeconds &&
                    (
                        <LimitMessage
                            top={limitMessageHeight}
                            onLayout={event => setLimitMessageLayout(event.nativeEvent.layout)}
                        >
                            {`Video exceeds ${maxVideoDurationInSeconds} seconds and will be trimmed to the first ${maxVideoDurationInSeconds} seconds.`}
                        </LimitMessage>
                    )
                }
                <Spacer />
                <Time>
                    {formattedCurrentTime}
                    {' '}
                    /
                    {' '}
                    {formattedDuration}
                </Time>
                <Spacer />
                <Container>
                    <Corners>
                        <GestureDetector
                            gesture={progressDragGesture}
                        >
                            <GestureDetector
                                gesture={progressTapGesture}
                            >
                                <Progress />
                            </GestureDetector>
                        </GestureDetector>
                        <LeftSection
                            left={-width + PADDING}
                            // eslint-disable-next-line react/forbid-component-props
                            style={{
                                transform: [{
                                    translateX: leftCorner
                                }]
                            }}
                            {...leftResponder.panHandlers}
                        >
                            <Row>
                                {shouldDisplayLeftResponder && (
                                    <LeftCornerResponder />
                                )}
                                <CornerLine width={width - PADDING} />
                                <CornerThumb
                                    source={resizerImage}
                                    resizeMode='stretch'
                                />
                            </Row>
                        </LeftSection>
                        <RightSection
                            right={-width + PADDING}
                            // eslint-disable-next-line react/forbid-component-props
                            style={{
                                transform: [{
                                    translateX: rightCorner
                                }]
                            }}
                            {...rightResponder.panHandlers}
                        >
                            <Row>
                                {shouldDisplayRightResponder && (
                                    <RightCornerResponder />
                                )}
                                <CornerThumb
                                    isRight
                                    source={resizerImage}
                                    resizeMode='stretch'
                                />
                                <CornerLine width={width - PADDING} />
                            </Row>
                        </RightSection>
                        <PointerThumb left={pointerThumbOffset} />
                    </Corners>
                </Container>
                <Spacer height={CORNERS_EXTRA_HEIGHT} />
            </Root>
            <Spacer />
            <BottomActions
                isPlaying={isPlaying}
                onPlay={onPlay}
                isMuted={isMuted}
                onMute={onMute}
                onImageCapture={onImageCapture}
                imageCaptureActionConfig={imageCaptureActionConfig}
            />
        </>
    );
};

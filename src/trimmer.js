/* eslint-disable react/forbid-component-props */
import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import styled, { css } from 'styled-components/native';
import {
    PanResponder,
    Animated
} from 'react-native';
import { useLayout } from '@codexporer.io/expo-layout-state';
import { useDimensions } from '@codexporer.io/react-hooks';
import inRange from 'lodash/inRange';
import noop from 'lodash/noop';
import { Text } from 'react-native-paper';
import { formatTimeSpan, TimeSpanFormat } from '@pole-journal/formatters';
import {
    useIsVideoComponentBusy,
    usePositionInMillis,
    useSetIsVideoComponentBusy,
    useVideoComponentRef,
    useVideoData
} from './state';

const HEIGHT = 40;
const PADDING = 80;
const CORNER_THUMB_WIDTH = 20;
const CORNER_RESPONDER_WIDTH = 40;
const CALCULATED_PADDING = PADDING / 2 - CORNER_THUMB_WIDTH / 2;
const CORNERS_EXTRA_HEIGHT = 20;
const POINTER_THUMB_EXTRA_HEIGHT = 20;
const CORNERS_HEIGHT = HEIGHT + CORNERS_EXTRA_HEIGHT;
const POINTER_THUMB_WIDTH = 2;

const Root = styled.View`
    // background-color: brown;
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
    background-color: red;
    margin-top: ${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
`;

const Corners = styled.View`
    position: absolute;
    top: -${(CORNERS_EXTRA_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT) / 2}px;
    height: ${CORNERS_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT}px;
    flex: 1;
    flex-direction: row;
    justify-content: space-between;
    overflow: hidden;
    // background-color: rgba(255, 255, 255, 0.4);
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

const CornerThumb = styled.View`
    background-color: blue;
    width: ${CORNER_THUMB_WIDTH}px;
    height: ${CORNERS_HEIGHT}px;
    margin-top: -${CORNERS_EXTRA_HEIGHT / 2}px;
`;

const PointerThumb = styled(Animated.View)`
    position: absolute;
    width: ${POINTER_THUMB_WIDTH}px;
    height: ${CORNERS_HEIGHT + POINTER_THUMB_EXTRA_HEIGHT}px;
    top: 0px;
    left: ${({ left }) => left}px;
    background-color: white;
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

export const Trimmer = () => {
    const { width: windowWidth } = useDimensions('window');
    const {
        currentLayout: { width },
        setCurrentLayout
    } = useLayout({ width: windowWidth });
    const { duration } = useVideoData();
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(duration);
    const [canSetEndTime, setCanSetEndTime] = useState(false);
    const videoComponentRef = useVideoComponentRef();
    const isVideoComponentBusy = useIsVideoComponentBusy();
    const setIsVideoComponentBusy = useSetIsVideoComponentBusy();
    const positionInMillis = usePositionInMillis();

    const isVideoComponentBusyRef = useRef();
    isVideoComponentBusyRef.current = isVideoComponentBusy;

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
        setStartTime(
            calculateCornerResult(duration, leftCornerPosRef.current, width - PADDING)
        );

        Animated.event([null, { dx: leftCorner }], { useNativeDriver: false })(e, gestureState);
    };

    handleLeftCornerReleaseRef.current = () => {
        if (leftCornerPosRef.current < 0) {
            setStartTime(0);
            leftCorner.setOffset(0);
        } else if (endTime - startTime < 1) {
            const startTime = endTime - 1;
            setStartTime(startTime);
            leftCorner.setOffset(calculateOffset(duration, startTime, width));
        } else {
            leftCorner.setOffset(leftCornerPosRef.current);
        }

        leftCorner.setValue(0);
    };

    handleRightCornerMoveRef.current = (e, gestureState) => {
        setEndTime(
            calculateCornerResult(duration, rightCornerPosRef.current, width - PADDING, true)
        );

        Animated.event([null, { dx: rightCorner }], { useNativeDriver: false })(e, gestureState);
    };

    handleRightCornerReleaseRef.current = () => {
        if (rightCornerPosRef.current > 0) {
            setEndTime(duration);
            rightCorner.setOffset(0);
        } else if (endTime - startTime < 1) {
            const endTime = startTime + 1;
            setEndTime(endTime);
            rightCorner.setOffset(calculateOffset(duration, endTime, width, true));
        } else {
            rightCorner.setOffset(rightCornerPosRef.current);
        }

        rightCorner.setValue(0);
    };

    useEffect(() => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        if (startTime != null && !Number.isNaN(startTime)) {
            setIsVideoComponentBusy(true);
            videoComponentRef.current.setPositionAsync(
                startTime * 1000,
                { toleranceMillisBefore: 0, toleranceMillisAfter: 0 }
            ).then(() => {
                setIsVideoComponentBusy(false);
            }).catch(noop);
        }
    }, [
        startTime,
        setIsVideoComponentBusy,
        videoComponentRef
    ]);

    const canSetEndTimeRef = useRef();
    canSetEndTimeRef.current = canSetEndTime;
    useEffect(() => {
        if (isVideoComponentBusyRef.current) {
            return;
        }

        if (endTime != null && !Number.isNaN(endTime)) {
            if (canSetEndTimeRef.current) {
                setIsVideoComponentBusy(true);
                videoComponentRef.current.setPositionAsync(
                    endTime * 1000,
                    { toleranceMillisBefore: 0, toleranceMillisAfter: 0 }
                ).then(() => {
                    setIsVideoComponentBusy(false);
                }).catch(noop);
            }
            setCanSetEndTime(true);
        }
    }, [endTime, setIsVideoComponentBusy, videoComponentRef]);

    const leftOffset = useMemo(
        () => calculateOffset(duration, startTime, width),
        [duration, startTime, width]
    );
    const rightOffset = useMemo(
        () => calculateOffset(duration, endTime, width, true),
        [duration, endTime, width]
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

    const trimmedDuration = endTime - startTime;
    const currentTime = positionInMillis / 1000;
    const trimmedCurrentTime = currentTime - startTime;
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
            currentTime,
            width
        ),
        leftOffset,
        width - CALCULATED_PADDING * 2 - CORNER_THUMB_WIDTH + rightOffset
    );

    return (
        <Root onLayout={event => setCurrentLayout(event.nativeEvent.layout)}>
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
                    <LeftSection
                        left={-width + PADDING}
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
                            <CornerThumb />
                        </Row>
                    </LeftSection>
                    <RightSection
                        right={-width + PADDING}
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
                            <CornerThumb />
                            <CornerLine width={width - PADDING} />
                        </Row>
                    </RightSection>
                    <PointerThumb left={pointerThumbOffset} />
                </Corners>
            </Container>
            <Spacer height={CORNERS_EXTRA_HEIGHT} />
            <Text>Test action</Text>
            <Spacer />
        </Root>
    );
};

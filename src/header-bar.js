import React from 'react';
import {
    Appbar,
    AppbarAction,
    AppbarContent
} from '@codexporer.io/expo-appbar';
import {
    useCloseVideoEditor,
    useIsReady,
    useVideoEditorConfigOnEditingComplete
} from './state';
import { useProcessVideo } from './process-video';

export const HeaderBar = () => {
    const closeVideoEditor = useCloseVideoEditor();
    const onEditingComplete = useVideoEditorConfigOnEditingComplete();
    const processVideo = useProcessVideo();
    const isReady = useIsReady();

    const shouldDisableDoneButton = false;

    const onFinishEditing = async () => {
        // Confirm manipulations, generate new video and save, generate data and send into onEditingComplete
        const videoData = await processVideo();
        onEditingComplete?.(videoData);
        closeVideoEditor();
    };

    const onPressBack = () => {
        closeVideoEditor();
    };

    return (
        <Appbar>
            <AppbarAction
                icon='close'
                onPress={onPressBack}
            />
            <AppbarContent />
            {isReady && (
                <AppbarAction
                    icon='check'
                    onPress={onFinishEditing}
                    disabled={shouldDisableDoneButton}
                />
            )}
        </Appbar>
    );
};

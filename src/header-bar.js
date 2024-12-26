import React from 'react';
import {
    Appbar,
    AppbarAction,
    AppbarContent
} from '@codexporer.io/expo-appbar';
import {
    useMessageDialogActions,
    MESSAGE_DIALOG_TYPE
} from '@codexporer.io/expo-message-dialog';
import { Paragraph } from 'react-native-paper';
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
    const {
        open: openMessageDialog,
        close: closeMessageDialog
    } = useMessageDialogActions();

    const onPressBack = () => {
        openMessageDialog({
            title: 'Discard Changes?',
            renderContent: () => (
                // eslint-disable-next-line max-len
                <Paragraph>Closing the video editor will discard all changes. Are you sure you want to proceed?</Paragraph>
            ),
            actions: [
                {
                    id: 'no',
                    handler: () => {
                        closeMessageDialog();
                    },
                    text: 'No'
                },
                {
                    id: 'yes',
                    handler: () => {
                        closeMessageDialog();
                        closeVideoEditor();
                    },
                    text: 'Yes'
                }
            ],
            type: MESSAGE_DIALOG_TYPE.warning
        });
    };

    const onFinishEditing = () => {
        openMessageDialog({
            title: 'Confirm Changes?',
            renderContent: () => (
                // eslint-disable-next-line max-len
                <Paragraph>By confirming, the video will be modified. Do you want to proceed?</Paragraph>
            ),
            actions: [
                {
                    id: 'no',
                    handler: () => {
                        closeMessageDialog();
                    },
                    text: 'No'
                },
                {
                    id: 'yes',
                    handler: async () => {
                        closeMessageDialog();
                        const videoData = await processVideo();
                        onEditingComplete?.(videoData);
                        closeVideoEditor();
                    },
                    text: 'Yes'
                }
            ],
            type: MESSAGE_DIALOG_TYPE.warning
        });
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
                />
            )}
        </Appbar>
    );
};

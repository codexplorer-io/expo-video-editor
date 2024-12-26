import { TransitionPresets } from '@react-navigation/stack';
import { VideoEditorScreen } from './video-editor-screen';
import { VIDEO_EDITOR_ROUTE_NAME } from './state';

export { processVideo } from './process-video';

export { getVideoSnapshotUri } from './get-video-cover-uri';

export {
    useInitializeNavigation,
    useOpenVideoEditor,
    useCloseVideoEditor
} from './state';

export { VideoEditor } from './video-editor-screen';

export const getRouteConfig = () => [
    {
        name: VIDEO_EDITOR_ROUTE_NAME,
        screen: VideoEditorScreen,
        screenOptions: {
            ...TransitionPresets.ModalSlideFromBottomIOS
        }
    }
];

import { FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import split from 'lodash/split';
import * as FileSystem from 'expo-file-system';
import { v4 as uuid } from 'uuid';

export const downloadVideo = ({
    url,
    isLocal
}) => {
    const targetUri = isLocal ? url : `${FileSystem.cacheDirectory}${uuid()}.mp4`;
    return Promise.all([
        isLocal ? Promise.resolve() : FileSystem.downloadAsync(url, targetUri),
        new Promise((resolve, reject) => {
            const ffprobeArgs = [
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration',
                '-of', 'csv=s=x:p=0',
                url
            ];
            FFprobeKit.executeAsync(
                ffprobeArgs.join(' '),
                async session => {
                    try {
                        const returnCode = await session.getReturnCode();
                        if (ReturnCode.isSuccess(returnCode)) {
                            const output = await session.getOutput();
                            const [
                                width,
                                height,
                                duration
                            ] = split(output.toString(), 'x');
                            resolve({
                                width: Math.ceil(width),
                                height: Math.ceil(height),
                                duration: +duration
                            });
                        }
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error(error);
                    }

                    reject();
                }
            );
        })
    ]).then(([
        ,
        videoData
    ]) => ({
        url: targetUri,
        ...videoData
    }));
};

import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { v4 as uuid } from 'uuid';

export const getVideoSnapshotUri = async ({
    url,
    maxImageSize,
    timeInSeconds = null
}) => {
    let videoCoverUri = `${FileSystem.cacheDirectory}${uuid()}.jpg`;
    timeInSeconds = timeInSeconds ?? (await new Promise(resolve => {
        const ffprobeArgs = [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=nw=1:nk=1',
            url
        ];

        FFprobeKit.executeAsync(
            ffprobeArgs.join(' '),
            async session => {
                try {
                    const returnCode = await session.getReturnCode();
                    if (ReturnCode.isSuccess(returnCode)) {
                        const output = await session.getOutput();
                        resolve(Math.ceil(output.toString()));
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }

                resolve(0);
            }
        );
    })) * 0.25;

    await new Promise(resolve => {
        const ffmpegArgs = [
            '-i', url,
            '-ss', timeInSeconds,
            // Scale bigger dimension to maxImageSize if bigger than maxImageSize
            '-vf', `scale=if(gt(iw\\,ih)\\,min(${maxImageSize}\\,iw)\\,-2):if(gt(iw\\,ih)\\,-2\\,min(${maxImageSize}\\,ih))`,
            '-qscale:v', '2',
            '-frames:v', '1',
            '-f', 'image2',
            '-c:v', 'mjpeg',
            videoCoverUri
        ];

        FFmpegKit.executeAsync(
            ffmpegArgs.join(' '),
            async session => {
                try {
                    const returnCode = await session.getReturnCode();
                    if (!ReturnCode.isSuccess(returnCode)) {
                        videoCoverUri = null;
                    }
                } catch {
                    videoCoverUri = null;
                }

                resolve();
            }
        );
    });

    return videoCoverUri;
};

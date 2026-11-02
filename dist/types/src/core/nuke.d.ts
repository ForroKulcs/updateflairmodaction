import type { T1, T3, T5 } from '@devvit/shared-types/tid.js';
export type NukeProps = {
    remove: boolean;
    lock: boolean;
    skipDistinguished: boolean;
    commentId: T1;
    subredditId: T5;
};
export type NukePostProps = {
    remove: boolean;
    lock: boolean;
    skipDistinguished: boolean;
    postId: T3;
    subredditId: T5;
};
export declare function handleNukePost(props: NukePostProps): Promise<{
    success: boolean;
    message: string;
}>;
export declare function handleNuke(props: NukeProps): Promise<{
    success: boolean;
    message: string;
}>;

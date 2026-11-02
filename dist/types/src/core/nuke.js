import { reddit } from '@devvit/web/server';
const shouldIncludeComment = (comment, skipDistinguished) => !skipDistinguished || !comment.isDistinguished();
async function* getAllCommentsInThread(comment, skipDistinguished) {
    if (shouldIncludeComment(comment, skipDistinguished)) {
        yield comment;
    }
    const replies = await comment.replies.all();
    for (const reply of replies) {
        yield* getAllCommentsInThread(reply, skipDistinguished);
    }
}
async function* getAllCommentsInPost(post, skipDistinguished) {
    const comments = await post.comments.all();
    for (const comment of comments) {
        yield* getAllCommentsInThread(comment, skipDistinguished);
    }
}
export async function handleNukePost(props) {
    const startTime = Date.now();
    let success;
    let message;
    const shouldLock = props.lock;
    const shouldRemove = props.remove;
    const skipDistinguished = props.skipDistinguished;
    try {
        const [user, post] = await Promise.all([
            reddit.getCurrentUser(),
            reddit.getPostById(props.postId),
        ]);
        if (!user) {
            return { success: false, message: "Can't get user" };
        }
        const modPermissions = await user.getModPermissionsForSubreddit(post.subredditName);
        const canManagePosts = modPermissions.includes('all') || modPermissions.includes('posts');
        console.log(`Mod Info: r/${post.subredditName} u/${user.username} permissions:${modPermissions}: ${canManagePosts ? 'Can mod' : 'Cannot mod'}`);
        if (!canManagePosts) {
            console.info('A user without the correct mod permissions tried to nuke all comments of a post.');
            return {
                message: 'You do not have the correct mod permissions to do this.',
                success: false,
            };
        }
        const comments = [];
        for await (const eachComment of getAllCommentsInPost(post, skipDistinguished)) {
            comments.push(eachComment);
        }
        if (shouldLock) {
            await Promise.all(comments.map((comment) => comment.locked || comment.lock()));
        }
        if (shouldRemove) {
            await Promise.all(comments.map((comment) => comment.removed || comment.remove()));
        }
        const verbage = shouldLock && shouldRemove
            ? 'removed and locked'
            : shouldLock
                ? 'locked'
                : 'removed';
        success = true;
        message = `Comments ${verbage}! Refresh the page to see the cleanup.`;
        const finishTime = Date.now();
        const timeElapsed = (finishTime - startTime) / 1000;
        console.info(`${comments.length} comment(s) handled in ${timeElapsed} seconds.`);
    }
    catch (err) {
        success = false;
        message = 'Mop failed! Please try again later.';
        console.error(err);
    }
    return { success, message };
}
export async function handleNuke(props) {
    const startTime = Date.now();
    let success;
    let message;
    const shouldLock = props.lock;
    const shouldRemove = props.remove;
    const skipDistinguished = props.skipDistinguished;
    try {
        const comment = await reddit.getCommentById(props.commentId);
        const user = await reddit.getCurrentUser();
        if (!user) {
            return { success: false, message: "Can't get user" };
        }
        const modPermissions = await user.getModPermissionsForSubreddit(comment.subredditName);
        const canManagePosts = modPermissions.includes('all') || modPermissions.includes('posts');
        console.log(`Mod Info: r/${comment.subredditName} u/${user.username} permissions:${modPermissions}: ${canManagePosts ? 'Can mod' : 'Cannot mod'}`);
        if (!canManagePosts) {
            console.info('A user without the correct mod permissions tried to comment mop.');
            return {
                message: 'You do not have the correct mod permissions to do this.',
                success: false,
            };
        }
        const comments = [];
        for await (const eachComment of getAllCommentsInThread(comment, skipDistinguished)) {
            comments.push(eachComment);
        }
        if (shouldLock) {
            await Promise.all(comments.map((comment) => comment.locked || comment.lock()));
        }
        if (shouldRemove) {
            await Promise.all(comments.map((comment) => comment.removed || comment.remove()));
        }
        const verbage = shouldLock && shouldRemove
            ? 'removed and locked'
            : shouldLock
                ? 'locked'
                : 'removed';
        success = true;
        message = `Comments ${verbage}! Refresh the page to see the cleanup.`;
        const finishTime = Date.now();
        const timeElapsed = (finishTime - startTime) / 1000;
        console.info(`${comments.length} comment(s) handled in ${timeElapsed} seconds.`);
    }
    catch (err) {
        success = false;
        message = 'Mop failed! Please try again later.';
        console.error(err);
    }
    return { success, message };
}
//# sourceMappingURL=nuke.js.map
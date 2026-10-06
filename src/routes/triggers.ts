import { Hono } from 'hono';
import { reddit, settings } from '@devvit/web/server';
import { redis } from '@devvit/redis';

import type {
  TriggerResponse,
} from '@devvit/web/shared';

export const triggers = new Hono();

function normalizeModeratorName(name: string): string {
  return name.trim().toLowerCase().replace(/^u\//, '');
}

triggers.post('/on-mod-action', async (c) => {
  const success = () => c.json<TriggerResponse>({ status: 'success' }, 200);

  const input = await c.req.json();
  const action = input.action;

  if (
    ![
      'addremovalreason',
      'approvelink',
      'lock',
      'removelink',
      'spamlink',
    ].includes(action)
  ) {
    return success();
  }

  const subreddit = input.subreddit;
  if (!subreddit) {
    console.error('Mod action received without subreddit', action);
    return success();
  }

  const subredditName = subreddit.name;
  if (!subredditName) {
    console.error('Mod action received without subreddit.name', action);
    return success();
  }

  const targetPost = input.targetPost;
  if (!targetPost) {
    console.error('Mod action received without targetPost', action);
    return success();
  }

  const targetPostId = targetPost.id;
  if (!targetPostId) {
    console.error('Mod action received without targetPost.id', action);
    return success();
  }

  const moderatorName =
    typeof input.moderator === 'string'
      ? input.moderator
      : input.moderator?.name;
  if (!moderatorName) {
    console.error('Mod action received without moderator', { action, targetPostId });
    return success();
  }

  try {
    const normalizedModerator = normalizeModeratorName(moderatorName);
    if (normalizedModerator === 'flairassistant') {
      return success();
    }

    const configuration = await settings.getAll();

    const ignoredModerators = String(configuration.ignoreModerators ?? '')
      .split(',')
      .map(normalizeModeratorName)
      .filter(Boolean);

    if (ignoredModerators.includes(normalizedModerator)) {
      return success();
    }

    let flairId: string | undefined;

    if (action === 'addremovalreason') {
      let removalReasonFlairs: Record<string, string>;
      try {
        removalReasonFlairs = JSON.parse(
          (await redis.get(`removalReasonFlairs:${subredditName}`)) ?? '{}'
        ) as Record<string, string>;
      } catch (error) {
        console.error('Failed to get removal reason post flair configuration', error);
        return success();
      }

      if (Object.keys(removalReasonFlairs).length === 0) {
        return success();
      }

      let removalReasonTitle: string | undefined = input.description;

      if (removalReasonTitle) {
        console.log('Removal reason title is available in modaction', removalReasonTitle);
      } else {
        let modLogItems;
        let itemIndex = -1;

        try {
          modLogItems = await reddit
            .getModerationLog({
              subredditName,
              limit: 5,
              pageSize: 5,
              moderatorUsernames: [moderatorName],
              type: 'addremovalreason',
            })
            .all();

            itemIndex = modLogItems.findIndex((modAction) => modAction.target.id === targetPostId);
        } catch (error) {
          console.error('Failed to get removal reason from modlog', error);
          return success();
        }

        if (itemIndex >= 0) {
          const modLogItem = modLogItems[itemIndex];

          removalReasonTitle = modLogItem.description;
          if (!removalReasonTitle) {
            console.log('Removal reason found in modlog without description', { index: itemIndex, modLogItem });
            return success();
          }

          console.log('Removal reason found in modlog', { index: itemIndex, removalReasonTitle, details: modLogItem.details });
        } else {
          console.log('No removal reason found in modlog', { action, targetPostId });
          return success();
        }
      }

      flairId = removalReasonFlairs[removalReasonTitle];
    } else {
      const flairByAction: Record<string, string | undefined> = {
        approvelink: configuration.approveFlairId,
        removelink: configuration.removeFlairId,
        spamlink: configuration.spamFlairId,
        lock: configuration.lockFlairId,
      };

      flairId = flairByAction[action];
    }

    if (flairId) {
      await reddit.setPostFlair({
        subredditName,
        postId: targetPostId,
        flairTemplateId: flairId,
      });
      console.log('Post flair applied', { action, targetPostId, moderatorName, flairId });
    }
  } catch (error) {
    console.error('Failed to process mod action', { action, targetPostId, moderatorName, error });
  }

  return success();
});
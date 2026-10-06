import { redis } from '@devvit/redis';
import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';

export const forms = new Hono();

forms.post('/removal-reason-flairs', async (c) => {
  const subredditName = context.subredditName;

  let removalTitles;
  try {
    const removalReasons = await reddit.getSubredditRemovalReasons(subredditName);

    removalTitles = new Set(
      removalReasons.map((reason) => reason.title)
    );
  } catch (error) {
    console.error('Failed to get subreddit removal reasons', error);

    return c.json<UiResponse>(
      {
        showToast: {
          text: 'Failed to get subreddit removal reasons'
        },
      },
      200
    );
  }

  try {
    const assignments: Record<string, string> = {};

    const input = await c.req.json<Record<string, string>>();
    for (const [fieldName, flairId] of Object.entries(input)) {
      if (flairId.trim() === '') {
        continue;
      }

      const title = fieldName.replace(/^flair_/, '');

      if (removalTitles.has(title)) {
        assignments[title] = flairId.trim();
      }
    }

    const key = `removalReasonFlairs:${subredditName}`;

    if (Object.keys(assignments).length === 0) {
      await redis.del(key);
    } else {
      await redis.set(key, JSON.stringify(assignments));
    }

    return c.json<UiResponse>(
      {
        showToast: {
          text: 'Removal reason post flair configuration saved',
          appearance: 'success',
        },
      },
      200
    );
  } catch (error) {
    console.error('Failed to save removal reason post flair configuration', error);

    return c.json<UiResponse>(
      {
        showToast: {
          text: 'Failed to save removal reason post flair configuration'
        },
      },
      200
    );
  }
});
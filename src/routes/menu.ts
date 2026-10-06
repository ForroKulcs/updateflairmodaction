import { redis } from '@devvit/redis';
import { context, reddit } from '@devvit/web/server';
import { Hono } from 'hono';

export const menu = new Hono();

menu.post('/configure-removal-reason-post-flairs', async (c) => {
  const subredditName = context.subredditName;

  let removalReasons;
  try {
    removalReasons = await reddit.getSubredditRemovalReasons(subredditName);
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

  let validRemovalReasonFlairs: Record<string, string>;
  let description: string;

  if (removalReasons.length === 0) {
    validRemovalReasonFlairs = {};

    description =
      'No removal reasons are currently configured for this subreddit.\n' +
      `Configure removal reasons here:\n` +
      `https://www.reddit.com/mod/${subredditName}/saved-responses/removals`;
  } else {
    try {
      const removalReasonFlairs = JSON.parse(
        (await redis.get(`removalReasonFlairs:${subredditName}`)) ?? '{}'
      ) as Record<string, string>;

      validRemovalReasonFlairs = Object.fromEntries(
        Object.entries(removalReasonFlairs).filter(([title]) =>
          removalReasons.some((reason) => reason.title === title)
        )
      );
    } catch (error) {
      console.error('Failed to get removal reason post flair configuration', error);

      return c.json<UiResponse>(
        {
          showToast: {
            text: 'Failed to get removal reason post flair configuration'
          },
        },
        200
      );
    }

    description =
      'Assign post flairs to removal reasons. Leave the flair ID empty if the post flair should not be changed.\n' +
      'Post flairs for basic mod actions can be configured on the config page:\n' +
      `https://developers.reddit.com/r/${subredditName}/apps/updateflairmodaction`;
  }
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'removal-reason-flairs',
        form: {
          title: 'Configure Removal Reason Post Flairs',
          description,
          fields: removalReasons.map((reason) => ({
            type: 'string',
            name: `flair_${reason.title}`,
            label: reason.title,
            helpText: reason.message,
            defaultValue: validRemovalReasonFlairs[reason.title] ?? '',
            required: false,
          })),
          acceptLabel: 'Save',
          cancelLabel: 'Cancel',
        },
      },
    },
    200
  );
});
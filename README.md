# Update Flair on Mod Action

A Reddit Devvit moderation app that automatically updates a post's flair when a moderator performs a configured moderation action.

Source: [https://github.com/ForroKulcs/updateflairmodaction](https://github.com/ForroKulcs/updateflairmodaction)

## Features

- Set a post flair for:
  - Approve
  - Remove
  - Spam
  - Lock
- Configure post flairs for subreddit removal reasons.
- Ignore selected moderators.
- `u/flairassistant` is always ignored to prevent infinite loops with [Flair Assistant](https://developers.reddit.com/apps/flairassistant).

## Configuration

The basic moderation actions are configured in the app's subreddit settings:

- Approve post flair ID
- Remove post flair ID
- Spam post flair ID
- Lock post flair ID
- Moderators to ignore

Removal reason flairs are configured from the subreddit menu.

## How It Works

When a moderator performs one of the configured actions, the app receives the Reddit mod action and applies the corresponding post flair.

For removal reasons, the app stores the configured flair assignments separately and uses them when a matching removal-reason event provides a reason title.

## Notes

For removal reasons, the app normally uses the removal reason supplied by the mod action event. If it is not available, the app looks up the corresponding action in the subreddit moderation log.

Removal reason assignments are matched by **removal reason title**, not by removal reason ID.

If the removal reason cannot be determined, the post flair is not changed.
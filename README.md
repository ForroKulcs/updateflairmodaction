# Update Flair on Mod Action

A Reddit Devvit moderation app that automatically updates a post's flair when a moderator performs a configured moderation action.

## Features

- Set a post flair for:
  - Approve
  - Remove
  - Spam
  - Lock
- Configure post flairs for subreddit removal reasons.
- Configure a different flair for each action.
- Ignore selected moderators.
- `u/flairassistant` is always ignored to prevent infinite loops with Flair Assistant.

## Configuration

The basic moderation actions are configured in the app's subreddit settings:

- Approve flair ID
- Remove flair ID
- Spam flair ID
- Lock flair ID
- Moderators to ignore

Removal reason flairs are configured from the subreddit menu.

## How It Works

When a moderator performs one of the configured actions, the app receives the Reddit mod action and applies the corresponding post flair.

For removal reasons, the app stores the configured flair assignments separately and uses them when a matching removal-reason event provides a reason title.

/**
 * A copy of Django's `SCENE_KEY_PATTERN` (webserver/scenes/models.py), the
 * authority for scene keys. Shared with the edge Worker, so it imports nothing.
 */
export const SCENE_KEY_PATTERN = /^(?![Aa][Pp][Pp]$)[A-Za-z0-9_-]{2,80}$/;

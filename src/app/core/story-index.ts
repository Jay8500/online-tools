/**
 * Spread Stories: just the addresses (collection + slug), small enough for the routes and the
 * prerender list. The texts and pictures live in stories.ts / story-art.ts and load on demand.
 */
export const STORY_COLS = ['krishna', 'rama', 'hanuman', 'bharata', 'rishi'] as const;
export type StoryCol = (typeof STORY_COLS)[number];

export const STORY_SLUGS: [StoryCol, string][] = [
  ['krishna', 'karma'], ['krishna', 'mind'], ['krishna', 'seasons'], ['krishna', 'example'], ['krishna', 'balance'],
  ['rama', 'promise'], ['rama', 'shabari'], ['rama', 'bharata'], ['rama', 'jatayu'], ['rama', 'squirrel'],
  ['hanuman', 'leap'], ['hanuman', 'good-news-first'], ['hanuman', 'sanjeevani'], ['hanuman', 'humble'], ['hanuman', 'words'],
  ['bharata', 'yaksha'], ['bharata', 'karna'], ['bharata', 'bird-eye'], ['bharata', 'peace'], ['bharata', 'bhishma'],
  ['rishi', 'valmiki'], ['rishi', 'vishwamitra'], ['rishi', 'vasishtha'], ['rishi', 'nachiketa'], ['rishi', 'parashurama'],
];

# Multi-Timer

## Context

The six developers at Dappit software development agency bill client work based on hourly rates. This requires tracking time across multiple projects and tasks throughout the day. Having a simple and elegant multi-timer web app with multiple stopwatches for different tasks will be hugely beneficial.

## MVP Requirements

1. Stopwatches work seamlessly: starting or resuming a certain watch pauses all other ones.
2. A central number shows how much time I’ve done for the day, which is the sum of the active watches.
3. The app keeps a history of timestamps when watches were started and stopped, so I can have a breakdown of what I did and when.
4. If I lose internet connection or close the browser, it keeps the progress. If I lose the watches, I lose my billing time for the day. This is another reason why point 3 is important (to store a cache of times stopped and started).

## Future Features

1. Integrate with ClickUp, Linear, or any other project management software to pull tasks in for the day that can give names to the watches.
2. Potentially sync with Zoho Books to make logging the hours easier at the end of the day.

## Work Completed So Far

- [x] Next.js project initialization
- [x] Connection with GitHub
- [x] Connection with Vercel
- [x] Consolidate app styling with Dappit brand guidelines
  - [x] Implemented Poppins font (primary Dappit typeface)
  - [x] Applied Dappit color palette (#202020, #F3F3F3, #01D9B5, #FF7F50)
  - [x] Set up proper typography with recommended letter spacing and line height
  - [x] Moved Dappit logos to public folder
  - [x] Created minimal, professional homepage design
  - [x] Configured Tailwind with Dappit brand colors

## Immediate Next Steps

1. ~~Consolidate app styling~~ ✅ **COMPLETED**
2. Create basic stopwatch component
3. Add stopwatch to the homepage
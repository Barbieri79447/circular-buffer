# Circular Buffer

A fixed-capacity ring buffer for JavaScript. Writes beyond capacity silently evict the oldest item. Reads consume items in insertion order (FIFO).

```js
import { CircularBuffer } from './src/index.js';

const buf = new CircularBuffer(3);
buf.push('a');
buf.push('b');
buf.push('c');
buf.push('d'); // evicts 'a', returns 'a'

buf.peek();     // 'b' (oldest, not removed)
buf.peekLast(); // 'd' (newest, not removed)
buf.shift();    // 'b' (consumed)
buf.toArray();  // ['c', 'd']
buf.clear();
```

## Why this exists

The goal is bounded memory for streaming or sliding-window workloads: telemetry, recent-event logs, debounce windows, anything where you want "the last N items" without unbounded array growth. The trade-off is that data is discarded silently once full, so this is wrong for anything that must not lose items.

## API

- `new CircularBuffer(capacity)` — `capacity` must be a positive integer; throws `RangeError` otherwise.
- `push(item)` — appends; returns the evicted item if the buffer was full, otherwise `undefined`.
- `shift()` — removes and returns the oldest item, or `undefined` if empty.
- `peek()` — returns the oldest item without removing it, or `undefined` if empty.
- `peekLast()` — returns the newest item without removing it, or `undefined` if empty.
- `toArray()` — returns a fresh array of live items, oldest first.
- `clear()` — empties the buffer; capacity is unchanged.
- `capacity`, `size`, `isEmpty`, `isFull` — read-only properties.

## Edge cases worth knowing

`push` returns `undefined` both when nothing was evicted **and** when the evicted item itself was `undefined`. If you need to distinguish the two, check `buf.isFull` before calling `push`. `peek`, `peekLast`, and `shift` likewise return `undefined` for an empty buffer, so `undefined` is ambiguous as a sentinel — if you store `undefined` as a real value, that is your responsibility to track.

Capacity must be a positive integer; zero-capacity is rejected because there is no sensible eviction target.

## Running the tests

```
node --test
```

ESM only. No dependencies.

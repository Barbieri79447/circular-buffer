/**
 * A fixed-capacity ring buffer. When full, writing a new item silently
 * evicts the oldest item. Reads consume items in insertion order.
 *
 * Storage is a single pre-allocated array and two cursors. We never
 * resize or copy; this is the whole point of a ring buffer — O(1) writes
 * and reads with zero allocation churn after construction.
 *
 * Capacity must be a positive integer. A zero-capacity buffer cannot
 * store anything and cannot decide *which* item to evict, so we reject it
 * up front rather than produce a silently-broken object.
 */
export class CircularBuffer {
  #capacity;
  #buf;
  #head; // index of the oldest live item
  #size;  // number of live items

  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `CircularBuffer capacity must be a positive integer; got ${String(capacity)}`
      );
    }
    this.#capacity = capacity;
    this.#buf = new Array(capacity);
    this.#head = 0;
    this.#size = 0;
  }

  get capacity() {
    return this.#capacity;
  }

  get size() {
    return this.#size;
  }

  get isFull() {
    return this.#size === this.#capacity;
  }

  get isEmpty() {
    return this.#size === 0;
  }

  /**
   * Appends `item`. If full, the oldest live item is overwritten first.
   * Returns the evicted item, or `undefined` if nothing was evicted.
   *
   * We return `undefined` (not a sentinel object) for the no-eviction case
   * because callers almost always want to know "did something get dropped?"
   * and a simple truthiness check is wrong when the stored item itself is
   * falsy. Use the returned value for logging; use `isFull` beforehand if
   * you need to branch before writing.
   */
  push(item) {
    const evicted = this.isFull ? this.#buf[this.#head] : undefined;
    const writeAt = this.isFull
      ? this.#head
      : (this.#head + this.#size) % this.#capacity;
    this.#buf[writeAt] = item;
    if (this.isFull) {
      this.#head = (this.#head + 1) % this.#capacity;
    } else {
      this.#size += 1;
    }
    return evicted;
  }

  /**
   * Removes and returns the oldest live item, or `undefined` if empty.
   */
  shift() {
    if (this.#size === 0) return undefined;
    const item = this.#buf[this.#head];
    this.#buf[this.#head] = undefined; // release reference, aid GC
    this.#head = (this.#head + 1) % this.#capacity;
    this.#size -= 1;
    return item;
  }

  /**
   * Returns the oldest live item without removing it, or `undefined` if empty.
   */
  peek() {
    if (this.#size === 0) return undefined;
    return this.#buf[this.#head];
  }

  /**
   * Returns the newest live item without removing it, or `undefined` if empty.
   */
  peekLast() {
    if (this.#size === 0) return undefined;
    const tail = (this.#head + this.#size - 1) % this.#capacity;
    return this.#buf[tail];
  }

  /**
   * Returns a fresh array of live items in insertion order (oldest first).
   * The returned array is a copy; mutating it does not affect the buffer.
   */
  toArray() {
    const out = new Array(this.#size);
    for (let i = 0; i < this.#size; i++) {
      out[i] = this.#buf[(this.#head + i) % this.#capacity];
    }
    return out;
  }

  /**
   * Removes all live items. Capacity is unchanged.
   */
  clear() {
    for (let i = 0; i < this.#size; i++) {
      this.#buf[(this.#head + i) % this.#capacity] = undefined;
    }
    this.#head = 0;
    this.#size = 0;
  }
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CircularBuffer } from '../src/index.js';

describe('CircularBuffer construction', () => {
  it('rejects non-positive capacity', () => {
    assert.throws(() => new CircularBuffer(0), RangeError);
    assert.throws(() => new CircularBuffer(-1), RangeError);
  });

  it('rejects non-integer capacity', () => {
    assert.throws(() => new CircularBuffer(3.5), RangeError);
    assert.throws(() => new CircularBuffer('3'), RangeError);
  });

  it('starts empty with the requested capacity', () => {
    const b = new CircularBuffer(3);
    assert.equal(b.capacity, 3);
    assert.equal(b.size, 0);
    assert.equal(b.isEmpty, true);
    assert.equal(b.isFull, false);
  });
});

describe('CircularBuffer push/shift ordering', () => {
  it('preserves FIFO order under capacity', () => {
    const b = new CircularBuffer(3);
    b.push('a'); b.push('b'); b.push('c');
    assert.deepEqual(b.toArray(), ['a', 'b', 'c']);
    assert.equal(b.shift(), 'a');
    assert.equal(b.shift(), 'b');
    assert.equal(b.shift(), 'c');
    assert.equal(b.shift(), undefined);
  });

  it('evicts the oldest item once at capacity', () => {
    const b = new CircularBuffer(3);
    assert.equal(b.push('a'), undefined);
    assert.equal(b.push('b'), undefined);
    assert.equal(b.push('c'), undefined);
    assert.equal(b.push('d'), 'a');
    assert.equal(b.push('e'), 'b');
    assert.deepEqual(b.toArray(), ['c', 'd', 'e']);
  });

  it('continues FIFO order after wraps and partial drains', () => {
    const b = new CircularBuffer(3);
    b.push('a'); b.push('b'); b.push('c'); b.push('d'); // evicts 'a'
    assert.equal(b.shift(), 'b');
    b.push('e'); b.push('f'); // evicts 'c'
    assert.deepEqual(b.toArray(), ['d', 'e', 'f']);
    b.push('g'); // evicts 'd'
    assert.deepEqual(b.toArray(), ['e', 'f', 'g']);
    b.push('h');
    assert.equal(b.shift(), 'f');
  });
});

describe('CircularBuffer peek', () => {
  it('peek returns the oldest item without removing it', () => {
    const b = new CircularBuffer(2);
    assert.equal(b.peek(), undefined);
    b.push('x'); b.push('y');
    assert.equal(b.peek(), 'x');
    assert.equal(b.size, 2);
  });

  it('peekLast returns the newest item without removing it', () => {
    const b = new CircularBuffer(2);
    b.push('x'); b.push('y');
    assert.equal(b.peekLast(), 'y');
    b.push('z');
    assert.equal(b.peekLast(), 'z');
    assert.equal(b.peek(), 'y');
  });

  it('peek/peekLast return undefined when empty', () => {
    const b = new CircularBuffer(2);
    assert.equal(b.peek(), undefined);
    assert.equal(b.peekLast(), undefined);
  });
});

describe('CircularBuffer edge values', () => {
  it('stores undefined as a real value', () => {
    const b = new CircularBuffer(2);
    b.push(undefined);
    assert.equal(b.size, 1);
    assert.equal(b.peek(), undefined);
    assert.equal(b.shift(), undefined);
    assert.equal(b.size, 0);
  });

  it('stores null and falsy values correctly', () => {
    const b = new CircularBuffer(3);
    b.push(null); b.push(0); b.push('');
    assert.deepEqual(b.toArray(), [null, 0, '']);
    assert.equal(b.push('x'), null);
    assert.deepEqual(b.toArray(), [0, '', 'x']);
  });

  it('clear empties the buffer but keeps capacity', () => {
    const b = new CircularBuffer(2);
    b.push('a'); b.push('b');
    b.clear();
    assert.equal(b.size, 0);
    assert.equal(b.capacity, 2);
    assert.equal(b.isEmpty, true);
    assert.equal(b.shift(), undefined);
    b.push('z');
    assert.equal(b.peek(), 'z');
  });
});

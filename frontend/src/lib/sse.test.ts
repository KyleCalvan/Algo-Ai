import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChat } from './sse';

const request = {
  model: 'beam',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true as const,
};

afterEach(() => vi.unstubAllGlobals());

describe('chat stream recovery', () => {
  it('retries a temporary HTTP 503 before reading the stream', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal('fetch', fetchMock);

    const events = [];
    for await (const event of streamChat(request)) events.push(event);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(1);
    expect(events[0].data).toContain('Hello');
  });

  it('does not retry an authorization error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(async () => {
      for await (const _event of streamChat(request)) { /* drain */ }
    }).rejects.toThrow('401');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

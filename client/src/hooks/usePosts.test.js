import { renderHook, waitFor, act } from "@testing-library/react";
import API from "../api";
import usePosts from "./usePosts";

jest.mock("../api");

function mockPosts(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({
    _id: `post-${i}`,
    bookTitle: `Book ${i}`,
    rating: i,
    createdAt: new Date(2024, 0, i + 1).toISOString(),
    ...overrides,
  }));
}

describe("usePosts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts in a loading state, then populates posts from the API", async () => {
    API.get.mockResolvedValueOnce({ data: mockPosts(3) });

    const { result } = renderHook(() => usePosts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.posts).toHaveLength(3);
    expect(API.get).toHaveBeenCalledWith(expect.stringContaining("/posts?"));
  });

  it("sets hasMore when a full page comes back, and clears it otherwise", async () => {
    API.get.mockResolvedValueOnce({ data: mockPosts(12) }); // PAGE_SIZE
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    API.get.mockResolvedValueOnce({ data: mockPosts(3) }); // short page
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("re-fetches with the new page/sort in the query string when they change", async () => {
    API.get.mockResolvedValue({ data: mockPosts(2) });
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSort("rating"));
    await waitFor(() => {
      const lastCallUrl = API.get.mock.calls[API.get.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain("sort=rating");
    });
  });

  it("resets to page 1 when the sort changes after paging forward", async () => {
    API.get.mockResolvedValue({ data: mockPosts(12) });
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.setSort("oldest"));
    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it("clears posts and stops loading without throwing when the API call fails", async () => {
    API.get.mockRejectedValueOnce(new Error("network down"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.posts).toEqual([]);
    expect(result.current.hasMore).toBe(false);

    consoleSpy.mockRestore();
  });

  it("includes username/category/search filters in the request when provided", async () => {
    API.get.mockResolvedValueOnce({ data: [] });

    renderHook(() => usePosts({ username: "alice", category: "Fiction", search: "dune" }));

    await waitFor(() => {
      const url = API.get.mock.calls[0][0];
      expect(url).toContain("user=alice");
      expect(url).toContain("category=Fiction");
      expect(url).toContain("search=dune");
    });
  });
});

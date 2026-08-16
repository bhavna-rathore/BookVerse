import { renderHook, waitFor, act } from "@testing-library/react";
import API from "../api";
import useComments from "./useComments";

jest.mock("../api");

const POST_ID = "post-123";

describe("useComments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches comments for the given postId on mount", async () => {
    API.get.mockResolvedValueOnce({ data: [{ _id: "c1", text: "Great book!", replies: [] }] });

    const { result } = renderHook(() => useComments(POST_ID));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.comments).toHaveLength(1);
    expect(API.get).toHaveBeenCalledWith(`/comments?postId=${POST_ID}`);
  });

  it("does nothing when postId is falsy", async () => {
    const { result } = renderHook(() => useComments(undefined));
    expect(API.get).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true); // never resolves without a postId
  });

  it("addComment posts the text/parentId and refreshes the list", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValueOnce({ data: { _id: "c1" } });

    const { result } = renderHook(() => useComments(POST_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addComment("Nice review", "parent-1");
    });

    expect(API.post).toHaveBeenCalledWith("/comments", {
      postId: POST_ID,
      text: "Nice review",
      parentId: "parent-1",
    });
    // initial mount fetch + refresh after posting
    expect(API.get).toHaveBeenCalledTimes(2);
  });

  it("deleteComment deletes by id and refreshes the list", async () => {
    API.get.mockResolvedValue({ data: [] });
    API.delete.mockResolvedValueOnce({ data: { message: "Comment deleted" } });

    const { result } = renderHook(() => useComments(POST_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteComment("c1");
    });

    expect(API.delete).toHaveBeenCalledWith("/comments/c1");
    expect(API.get).toHaveBeenCalledTimes(2);
  });

  it("clears comments and stops loading without throwing when the fetch fails", async () => {
    API.get.mockRejectedValueOnce(new Error("network down"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useComments(POST_ID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.comments).toEqual([]);
    consoleSpy.mockRestore();
  });
});

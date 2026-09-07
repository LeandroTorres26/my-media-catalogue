import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCatalogueStore } from "./catalogueStore";
import type { MediaDocument } from "@/models/Media";

// The store is a module singleton: it would leak from one test into the next.
// We capture the initial state here, before any test touches it.
const initialState = useCatalogueStore.getState();

// Shortcut so we don't repeat useCatalogueStore.getState() on every line.
const store = () => useCatalogueStore.getState();

const makeMedia = (overrides: Partial<MediaDocument> = {}) =>
  ({
    _id: "1",
    title: "The Godfather",
    category: "movie",
    status: "completed",
    ...overrides,
  }) as MediaDocument;

/** Replaces the global fetch with a mock returning the described response. */
const stubFetch = (response: { ok: boolean; json?: unknown }) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: async () => response.json,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  // replace: true swaps the whole state instead of merging into it.
  useCatalogueStore.setState(initialState, true);
  // The store logs on its error paths; we silence it so the test output
  // isn't polluted with false alarms.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("initial state", () => {
  it("starts with no filters, no medias and the form closed", () => {
    expect(store()).toMatchObject({
      searchTerm: "",
      categoryFilter: "",
      orderBy: "a-z",
      medias: [],
      loading: false,
      error: null,
      isFormOpen: false,
      mediaToEdit: null,
    });
  });
});

describe("filters", () => {
  it("setSearchTerm changes only the search term", () => {
    store().setSearchTerm("godfather");

    expect(store().searchTerm).toBe("godfather");
    // the merge is shallow: every other field stays untouched
    expect(store().categoryFilter).toBe("");
    expect(store().orderBy).toBe("a-z");
  });

  it("setCategoryFilter and setOrderBy update their own fields", () => {
    store().setCategoryFilter("anime");
    store().setOrderBy("z-a");

    expect(store().categoryFilter).toBe("anime");
    expect(store().orderBy).toBe("z-a");
  });
});

describe("form modal", () => {
  it("openEditForm opens the modal holding the media to edit", () => {
    const media = makeMedia();

    store().openEditForm(media);

    expect(store().isFormOpen).toBe(true);
    expect(store().mediaToEdit).toBe(media);
  });

  it("openCreateForm opens the modal clearing a previous edit", () => {
    store().openEditForm(makeMedia());

    store().openCreateForm();

    expect(store().isFormOpen).toBe(true);
    expect(store().mediaToEdit).toBeNull();
  });

  it("closeForm closes the modal and discards the media being edited", () => {
    store().openEditForm(makeMedia());

    store().closeForm();

    expect(store().isFormOpen).toBe(false);
    expect(store().mediaToEdit).toBeNull();
  });
});

describe("loadMedias — URL building", () => {
  it("reads the filters from the store instead of taking them as arguments", async () => {
    const fetchMock = stubFetch({ ok: true, json: [] });
    useCatalogueStore.setState({
      searchTerm: "godfather",
      categoryFilter: "movie",
      orderBy: "z-a",
    });

    await store().loadMedias();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/medias?search=godfather&category=movie&orderby=z-a",
    );
  });

  it("omits empty filters from the URL", async () => {
    const fetchMock = stubFetch({ ok: true, json: [] });
    useCatalogueStore.setState({
      searchTerm: "",
      categoryFilter: "",
      orderBy: "",
    });

    await store().loadMedias();

    expect(fetchMock).toHaveBeenCalledWith("/api/user/medias");
  });

  it("escapes special characters in the search term", async () => {
    const fetchMock = stubFetch({ ok: true, json: [] });
    useCatalogueStore.setState({
      searchTerm: "Lilo & Stitch",
      categoryFilter: "",
      orderBy: "",
    });

    await store().loadMedias();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/medias?search=Lilo+%26+Stitch",
    );
  });
});

describe("loadMedias — lifecycle", () => {
  it("turns loading on while the request is in flight and off when it settles", async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((resolve) => (resolveFetch = resolve))),
    );

    const pending = store().loadMedias();
    expect(store().loading).toBe(true);

    resolveFetch({ ok: true, json: async () => [] });
    await pending;

    expect(store().loading).toBe(false);
  });

  it("stores the medias returned on success", async () => {
    const medias = [makeMedia(), makeMedia({ _id: "2", title: "Amélie" })];
    stubFetch({ ok: true, json: medias });

    await store().loadMedias();

    expect(store().medias).toEqual(medias);
    expect(store().loading).toBe(false);
    expect(store().error).toBeNull();
  });

  it("clears a previous error when a new request starts", async () => {
    useCatalogueStore.setState({ error: "stale error" });
    stubFetch({ ok: true, json: [] });

    await store().loadMedias();

    expect(store().error).toBeNull();
  });
});

describe("loadMedias — failures", () => {
  it("records an error when the response is not ok (401, 500...)", async () => {
    stubFetch({ ok: false });

    await store().loadMedias();

    expect(store().error).toBe("Failed to load media. Please try again.");
    expect(store().loading).toBe(false);
  });

  it("records an error when fetch rejects (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await store().loadMedias();

    expect(store().error).toBe("Failed to load media. Please try again.");
    expect(store().loading).toBe(false);
  });

  it("keeps the already loaded medias when a refresh fails", async () => {
    const alreadyLoaded = [makeMedia()];
    useCatalogueStore.setState({ medias: alreadyLoaded });
    stubFetch({ ok: false });

    await store().loadMedias();

    expect(store().medias).toEqual(alreadyLoaded);
  });
});

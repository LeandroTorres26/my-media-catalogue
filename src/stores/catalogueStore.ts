"use client";

import { create } from 'zustand';
import { MediaDocument } from '@/models/Media';

interface CatalogueState {
    searchTerm: string;
    categoryFilter: string;
    orderBy: string;
    medias: MediaDocument[];
    loading: boolean;
    error: string | null;
    isFormOpen: boolean;
    mediaToEdit: MediaDocument | null;
    setSearchTerm: (term: string) => void;
    setCategoryFilter: (category: string) => void;
    setOrderBy: (order: string) => void;
    loadMedias: () => Promise<void>;
    openCreateForm: () => void;
    openEditForm: (media: MediaDocument) => void;
    closeForm: () => void;
}

export const useCatalogueStore = create<CatalogueState>()((set, get) => ({
    searchTerm: "",
    categoryFilter: "",
    orderBy: "a-z",
    medias: [],
    loading: false,
    error: null,
    isFormOpen: false,
    mediaToEdit: null,
    setSearchTerm: (term) => set({ searchTerm: term }),
    setCategoryFilter: (category) => set({ categoryFilter: category }),
    setOrderBy: (order) => set({ orderBy: order }),
    loadMedias: async () => {
        const { searchTerm, categoryFilter, orderBy } = get();

        set({ loading: true, error: null });

        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (categoryFilter) params.append("category", categoryFilter);
        if (orderBy) params.append("orderby", orderBy);

        const query = params.toString();
        const url = query ? `/api/user/medias?${query}` : "/api/user/medias";

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch user medias");
            set({ medias: await res.json(), loading: false });
        } catch (error) {
            console.error("Error fetching user medias:", error);
            set({ error: "Failed to load media. Please try again.", loading: false });
        }
    },
    openCreateForm: () => set({ isFormOpen: true, mediaToEdit: null }),
    openEditForm: (media) => set({ isFormOpen: true, mediaToEdit: media }),
    closeForm: () => set({ isFormOpen: false, mediaToEdit: null }),
}));
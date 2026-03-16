
import { useEffect, useState, useCallback } from "react";

export type ToolUsage = {
  id: string;
  name: string;
  url: string;
  count: number;
  lastUsed: number;
  favorite: boolean;
};

const STORAGE_KEY = "dev-toolbox-usage";

export function useToolTracking() {
  const [tools, setTools] = useState<ToolUsage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTools(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load tool usage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever tools change (but not on initial load)
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
    } catch (error) {
      console.error("Failed to save tool usage:", error);
    }
  }, [tools, isLoaded]);

  // Track tool visit
  const trackVisit = useCallback((id: string, name: string, url: string) => {
    setTools((prevTools) => {
      const now = Date.now();
      const existingIndex = prevTools.findIndex((t) => t.id === id);

      if (existingIndex >= 0) {
        // Update existing tool
        const updatedTools = [...prevTools];
        updatedTools[existingIndex] = {
          ...updatedTools[existingIndex],
          count: updatedTools[existingIndex].count + 1,
          lastUsed: now,
        };
        return updatedTools;
      } else {
        // Add new tool
        return [
          ...prevTools,
          {
            id,
            name,
            url,
            count: 1,
            lastUsed: now,
            favorite: false,
          },
        ];
      }
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string, name?: string) => {
    setTools((prevTools) => {
      const existing = prevTools.find((t) => t.id === id);
      if (existing) {
        return prevTools.map((tool) =>
          tool.id === id ? { ...tool, favorite: !tool.favorite } : tool
        );
      }
      // Tool hasn't been visited yet - create entry as favorite
      return [
        ...prevTools,
        {
          id,
          name: name || id,
          url: id,
          count: 0,
          lastUsed: 0,
          favorite: true,
        },
      ];
    });
  }, []);

  // Get favorites
  const getFavorites = useCallback(() => {
    return tools.filter((t) => t.favorite).sort((a, b) => b.lastUsed - a.lastUsed);
  }, [tools]);

  // Get most used (top 5)
  const getMostUsed = useCallback((limit = 5) => {
    return [...tools]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [tools]);

  // Get recently used (top 5)
  const getRecentlyUsed = useCallback((limit = 5) => {
    return [...tools]
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  }, [tools]);

  // Check if tool is favorite
  const isFavorite = useCallback((id: string) => {
    return tools.find((t) => t.id === id)?.favorite || false;
  }, [tools]);

  return {
    tools,
    trackVisit,
    toggleFavorite,
    getFavorites,
    getMostUsed,
    getRecentlyUsed,
    isFavorite,
  };
}

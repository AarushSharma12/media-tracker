import { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserMediaLists } from "../services/userService.js";

export const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const [watchlistItems, setWatchlistItems] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWatchlistItems();
    } else {
      setWatchlistItems(new Set());
    }
  }, [user]);

  async function loadWatchlistItems() {
    try {
      setLoading(true);
      const lists = await getUserMediaLists(user.uid);
      if (lists && lists.watchlist) {
        const itemIds = new Set(
          lists.watchlist.map((item) => `${item.mediaType}_${item.id}`)
        );
        setWatchlistItems(itemIds);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setLoading(false);
    }
  }

  function addToWatchlistCache(mediaId, mediaType) {
    const key = `${mediaType}_${mediaId}`;
    setWatchlistItems((prev) => new Set([...prev, key]));
  }

  function removeFromWatchlistCache(mediaId, mediaType) {
    const key = `${mediaType}_${mediaId}`;
    setWatchlistItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }

  function isInWatchlist(mediaId, mediaType) {
    const key = `${mediaType}_${mediaId}`;
    return watchlistItems.has(key);
  }

  const value = {
    isInWatchlist,
    addToWatchlistCache,
    removeFromWatchlistCache,
    refreshWatchlist: loadWatchlistItems,
    loading,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

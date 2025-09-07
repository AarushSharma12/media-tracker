import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "./firebaseConfig";

export async function createUserDocument(user) {
  if (!user) {
    return;
  }
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const userData = {
        displayName: user.displayName || user.email.split("@")[0],
        email: user.email,
        createdAt: new Date(),
        preferences: {
          theme: "light",
        },
      };
      await setDoc(userRef, userData);
      await createUserMediaLists(user.uid);
    }
    return userRef;
  } catch (err) {
    throw err;
  }
}

export async function createUserMediaLists(userId) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const mediaData = {
      watchlist: [],
      watching: [],
      completed: [],
      favorites: [],
      ratings: {},
      lastUpdated: new Date(),
    };
    await setDoc(userMediaRef, mediaData);
  } catch (err) {
    throw err;
  }
}

export async function updateUserDisplayName(user, newDisplayName) {
  try {
    await updateProfile(user, { displayName: newDisplayName });
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      displayName: newDisplayName,
      lastUpdated: new Date(),
    });
    return true;
  } catch (err) {
    throw err;
  }
}

export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

export async function addToWatchlist(userId, mediaData) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    let docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
      docSnap = await getDoc(userMediaRef);
    }

    // Check if item already exists to prevent duplicates
    const currentData = docSnap.data();
    const currentWatchlist = currentData.watchlist || [];

    const alreadyExists = currentWatchlist.some(
      (item) =>
        item.id === mediaData.id && item.mediaType === mediaData.mediaType
    );

    if (alreadyExists) {
      console.log("Item already in watchlist");
      return true; // Already in watchlist, no need to add
    }

    const mediaItem = {
      id: mediaData.id,
      mediaType: mediaData.mediaType,
      title: mediaData.title,
      poster_path: mediaData.poster_path,
      vote_average: mediaData.vote_average,
      release_date: mediaData.release_date,
      addedAt: new Date(),
    };

    await updateDoc(userMediaRef, {
      watchlist: arrayUnion(mediaItem),
      lastUpdated: new Date(),
    });

    console.log("Added to watchlist successfully");
    return true;
  } catch (err) {
    console.error("Error adding to watchlist:", err);
    throw err;
  }
}

export async function removeFromWatchlist(userId, mediaId, mediaType) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (docSnap.exists()) {
      const currentWatchlist = docSnap.data().watchlist || [];
      const itemToRemove = currentWatchlist.find(
        (item) => item.id === mediaId && item.mediaType === mediaType
      );

      if (itemToRemove) {
        await updateDoc(userMediaRef, {
          watchlist: arrayRemove(itemToRemove),
          lastUpdated: new Date(),
        });
      }
    }
    return true;
  } catch (err) {
    throw err;
  }
}

export async function getUserMediaStatus(userId, mediaId, mediaType) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      return {
        inWatchlist: false,
        watched: false,
        rating: 0,
      };
    }

    const data = docSnap.data();
    const watchlist = data.watchlist || [];
    const completed = data.completed || [];
    const ratings = data.ratings || {};

    const inWatchlist = watchlist.some(
      (item) => item.id === mediaId && item.mediaType === mediaType
    );

    const watched = completed.some(
      (item) => item.id === mediaId && item.mediaType === mediaType
    );

    const ratingKey = `${mediaType}_${mediaId}`;
    const rating = ratings[ratingKey] || 0;

    return {
      inWatchlist,
      watched,
      rating,
    };
  } catch (err) {
    return {
      inWatchlist: false,
      watched: false,
      rating: 0,
    };
  }
}

export async function updateWatchedStatus(
  userId,
  mediaId,
  mediaType,
  watched,
  mediaData = null
) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    if (watched) {
      // When marking as watched, we need the full media data
      let mediaItem;

      if (mediaData) {
        // If media data is provided, use it
        mediaItem = {
          id: mediaId,
          mediaType: mediaType,
          title: mediaData.title,
          poster_path: mediaData.poster_path,
          vote_average: mediaData.vote_average,
          release_date: mediaData.release_date,
          watchedAt: new Date(),
        };
      } else {
        // If no media data provided, try to get it from watchlist
        const data = docSnap.data();
        const watchlist = data.watchlist || [];
        const watchlistItem = watchlist.find(
          (item) => item.id === mediaId && item.mediaType === mediaType
        );

        if (watchlistItem) {
          mediaItem = {
            ...watchlistItem,
            watchedAt: new Date(),
          };
          // Remove addedAt since we're moving to completed
          delete mediaItem.addedAt;
        } else {
          // Fallback with minimal data
          mediaItem = {
            id: mediaId,
            mediaType: mediaType,
            title: "Unknown",
            watchedAt: new Date(),
          };
        }
      }

      await updateDoc(userMediaRef, {
        completed: arrayUnion(mediaItem),
        lastUpdated: new Date(),
      });
    } else {
      const data = docSnap.data();
      const completed = data.completed || [];
      const itemToRemove = completed.find(
        (item) => item.id === mediaId && item.mediaType === mediaType
      );

      if (itemToRemove) {
        await updateDoc(userMediaRef, {
          completed: arrayRemove(itemToRemove),
          lastUpdated: new Date(),
        });
      }
    }
    return true;
  } catch (err) {
    throw err;
  }
}

export async function addRating(userId, mediaId, mediaType, rating) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    const ratingKey = `${mediaType}_${mediaId}`;
    await updateDoc(userMediaRef, {
      [`ratings.${ratingKey}`]: rating,
      lastUpdated: new Date(),
    });
    return true;
  } catch (err) {
    throw err;
  }
}

export async function getUserMediaLists(userId) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create default lists if they don't exist
      await createUserMediaLists(userId);
      return {
        watchlist: [],
        watching: [],
        completed: [],
        favorites: [],
        ratings: {},
        lastUpdated: new Date(),
      };
    }
  } catch (err) {
    return {
      watchlist: [],
      watching: [],
      completed: [],
      favorites: [],
      ratings: {},
    };
  }
}

export async function addToFavorites(userId, mediaData) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    const mediaItem = {
      id: mediaData.id,
      mediaType: mediaData.mediaType,
      title: mediaData.title,
      poster_path: mediaData.poster_path,
      vote_average: mediaData.vote_average,
      release_date: mediaData.release_date,
      addedAt: new Date(),
    };

    await updateDoc(userMediaRef, {
      favorites: arrayUnion(mediaItem),
      lastUpdated: new Date(),
    });

    return true;
  } catch (err) {
    throw err;
  }
}

export async function removeFromFavorites(userId, mediaId, mediaType) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (docSnap.exists()) {
      const currentFavorites = docSnap.data().favorites || [];
      const itemToRemove = currentFavorites.find(
        (item) => item.id === mediaId && item.mediaType === mediaType
      );

      if (itemToRemove) {
        await updateDoc(userMediaRef, {
          favorites: arrayRemove(itemToRemove),
          lastUpdated: new Date(),
        });
      }
    }
    return true;
  } catch (err) {
    throw err;
  }
}

export async function moveToWatching(userId, mediaData) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    const mediaItem = {
      id: mediaData.id,
      mediaType: mediaData.mediaType,
      title: mediaData.title,
      poster_path: mediaData.poster_path,
      vote_average: mediaData.vote_average,
      release_date: mediaData.release_date,
      startedAt: new Date(),
    };

    await updateDoc(userMediaRef, {
      watching: arrayUnion(mediaItem),
      lastUpdated: new Date(),
    });

    return true;
  } catch (err) {
    throw err;
  }
}

export async function removeFromList(userId, mediaId, mediaType, listType) {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (docSnap.exists()) {
      const currentList = docSnap.data()[listType] || [];
      const itemToRemove = currentList.find(
        (item) => item.id === mediaId && item.mediaType === mediaType
      );

      if (itemToRemove) {
        await updateDoc(userMediaRef, {
          [listType]: arrayRemove(itemToRemove),
          lastUpdated: new Date(),
        });
      }
    }
    return true;
  } catch (err) {
    throw err;
  }
}

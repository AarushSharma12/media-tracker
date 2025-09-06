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

// Create user document when signing up
export const createUserDocument = async (user) => {
  console.log("Creating user document for:", user.uid);

  if (!user) {
    console.error("No user provided to createUserDocument");
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
      console.log("User document created successfully!");

      // Create user media lists
      await createUserMediaLists(user.uid);
    }

    return userRef;
  } catch (error) {
    console.error("Error in createUserDocument:", error);
    throw error;
  }
};

// Create initial media lists for user
export const createUserMediaLists = async (userId) => {
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
    console.log("User media lists created successfully!");
  } catch (error) {
    console.error("Error in createUserMediaLists:", error);
    throw error;
  }
};

// Update user display name
export const updateUserDisplayName = async (user, newDisplayName) => {
  try {
    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: newDisplayName,
    });

    // Update Firestore document
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      displayName: newDisplayName,
      lastUpdated: new Date(),
    });

    console.log("Display name updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating display name:", error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log("No user profile found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Add media to watchlist
export const addToWatchlist = async (userId, mediaData) => {
  try {
    const userMediaRef = doc(db, "userMedia", userId);

    // First check if document exists, create if not
    const docSnap = await getDoc(userMediaRef);
    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    await updateDoc(userMediaRef, {
      watchlist: arrayUnion({
        ...mediaData,
        addedAt: new Date(),
      }),
      lastUpdated: new Date(),
    });

    console.log("Added to watchlist successfully!");
    return true;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error;
  }
};

// Remove media from watchlist
export const removeFromWatchlist = async (userId, mediaId, mediaType) => {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (docSnap.exists()) {
      const currentWatchlist = docSnap.data().watchlist || [];
      const updatedWatchlist = currentWatchlist.filter(
        (item) => !(item.id === mediaId && item.mediaType === mediaType)
      );

      await updateDoc(userMediaRef, {
        watchlist: updatedWatchlist,
        lastUpdated: new Date(),
      });

      console.log("Removed from watchlist successfully!");
      return true;
    }
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error;
  }
};

// Get user's media status (watchlist, watched, rating)
export const getUserMediaStatus = async (userId, mediaId, mediaType) => {
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
  } catch (error) {
    console.error("Error getting user media status:", error);
    return {
      inWatchlist: false,
      watched: false,
      rating: 0,
    };
  }
};

// Update watched status
export const updateWatchedStatus = async (
  userId,
  mediaId,
  mediaType,
  watched
) => {
  try {
    const userMediaRef = doc(db, "userMedia", userId);
    const docSnap = await getDoc(userMediaRef);

    if (!docSnap.exists()) {
      await createUserMediaLists(userId);
    }

    const mediaItem = {
      id: mediaId,
      mediaType: mediaType,
      watchedAt: new Date(),
    };

    if (watched) {
      // Add to completed list
      await updateDoc(userMediaRef, {
        completed: arrayUnion(mediaItem),
        lastUpdated: new Date(),
      });
    } else {
      // Remove from completed list
      const data = docSnap.data();
      const completed = data.completed || [];
      const updatedCompleted = completed.filter(
        (item) => !(item.id === mediaId && item.mediaType === mediaType)
      );

      await updateDoc(userMediaRef, {
        completed: updatedCompleted,
        lastUpdated: new Date(),
      });
    }

    console.log("Watched status updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating watched status:", error);
    throw error;
  }
};

// Add or update rating
export const addRating = async (userId, mediaId, mediaType, rating) => {
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

    console.log("Rating added successfully!");
    return true;
  } catch (error) {
    console.error("Error adding rating:", error);
    throw error;
  }
};

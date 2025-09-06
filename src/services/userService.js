import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
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
    return true;
  } catch (err) {
    throw err;
  }
}

export async function removeFromWatchlist(userId, mediaId, mediaType) {
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
      return true;
    }
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

export async function updateWatchedStatus(userId, mediaId, mediaType, watched) {
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
      await updateDoc(userMediaRef, {
        completed: arrayUnion(mediaItem),
        lastUpdated: new Date(),
      });
    } else {
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

import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "./firebaseConfig";

// Debug version with lots of logging
export const createUserDocument = async (user) => {
  console.log("🔍 createUserDocument called with user:", user);

  if (!user) {
    console.error("❌ No user provided to createUserDocument");
    return;
  }

  console.log("✅ User ID:", user.uid);
  console.log("✅ User email:", user.email);
  console.log("✅ Database instance:", db);

  const userRef = doc(db, "users", user.uid);
  console.log("✅ User reference created:", userRef);

  try {
    // Check if user document already exists
    console.log("🔍 Checking if user document exists...");
    const userSnap = await getDoc(userRef);
    console.log("✅ getDoc completed. Document exists:", userSnap.exists());

    if (!userSnap.exists()) {
      console.log("🔍 Creating new user document...");

      const userData = {
        displayName: user.displayName || user.email.split("@")[0],
        email: user.email,
        createdAt: new Date(),
        preferences: {
          theme: "light",
        },
      };

      console.log("✅ User data to save:", userData);

      await setDoc(userRef, userData);
      console.log("🎉 User document created successfully!");

      // Try to create media lists
      console.log("🔍 Creating user media lists...");
      await createUserMediaLists(user.uid);
      console.log("🎉 Everything completed successfully!");
    } else {
      console.log("ℹ️ User document already exists, skipping creation");
    }

    return userRef;
  } catch (error) {
    console.error("❌ Error in createUserDocument:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    console.error("❌ Full error object:", error);
    throw error;
  }
};

// Debug version of media lists creation
export const createUserMediaLists = async (userId) => {
  console.log("🔍 createUserMediaLists called for user:", userId);

  try {
    const userMediaRef = doc(db, "userMedia", userId);
    console.log("✅ UserMedia reference created:", userMediaRef);

    const mediaData = {
      watchlist: [],
      watching: [],
      completed: [],
      favorites: [],
      lastUpdated: new Date(),
    };

    console.log("✅ Media data to save:", mediaData);

    await setDoc(userMediaRef, mediaData);
    console.log("🎉 User media lists created successfully!");
  } catch (error) {
    console.error("❌ Error in createUserMediaLists:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    throw error;
  }
};

// Update user display name in both Firebase Auth and Firestore
export const updateUserDisplayName = async (user, newDisplayName) => {
  console.log("🔍 Updating display name for user:", user.uid);
  console.log("🔍 New display name:", newDisplayName);

  try {
    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: newDisplayName,
    });
    console.log("✅ Firebase Auth profile updated");

    // Update Firestore document
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      displayName: newDisplayName,
      lastUpdated: new Date(),
    });
    console.log("✅ Firestore document updated");

    console.log("🎉 Display name updated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error updating display name:", error);
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

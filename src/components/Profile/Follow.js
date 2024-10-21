import React, { useState, useEffect } from "react";
import Button from "../../styles/Button";
import { displayError } from "../../utils";
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, 
         increment, getDoc, collection, addDoc } from "firebase/firestore"; // Firestore
import { getAuth } from "firebase/auth"; // Firebase Authentication

const Follow = ({ isFollowing, userId, sm = false, relative = false }) => {
  const [followState, setFollowState] = useState(isFollowing);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch the latest follow state on component mount to check if the user is already following
  useEffect(() => {
    const fetchFollowState = async () => {
      if (!currentUser || !userId) return;

      try {
        const currentUserRef = doc(db, "profiles", currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);

        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data();
          // Check if the current user is already following the profile
          if (currentUserData.following && currentUserData.following.includes(userId)) {
            setFollowState(true);
          } else {
            setFollowState(false);
          }
        }
      } catch (error) {
        console.error("Error fetching follow state: ", error);
        displayError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowState();
  }, [db, currentUser, userId]);

  const handleFollow = async () => {
    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userRef = doc(db, "profiles", userId); // The profile being followed/unfollowed
    const currentUserRef = doc(db, "profiles", currentUser.uid); // The current logged-in user's profile

    try {
      if (followState) {
        // Unfollow: remove from followers and following
        setFollowState(false);
        await updateDoc(userRef, {
          followers: arrayRemove(currentUser.uid), // Remove from followers of the target user
          followersCount: increment(-1), // Decrement followers count
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId), // Remove from following of the current user
          followingCount: increment(-1), // Decrement following count
        });
      } else {
        // Follow: add to followers and following
        setFollowState(true);
        await updateDoc(userRef, {
          followers: arrayUnion(currentUser.uid), // Add to followers of the target user
          followersCount: increment(1), // Increment followers count
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId), // Add to following of the current user
          followingCount: increment(1), // Increment following count
        });

        // Create a follow notification for the user being followed
        const notificationsRef = collection(db, "notifications"); 
        await addDoc(notificationsRef, {                        
          type: "follow",                                
          fromUserId: currentUser.uid, 
          userId: userId,
          createdAt: new Date(),
          isRead: false,
        });        
      }
    } catch (err) {
      displayError(err);
      setFollowState(!followState); // Revert state on error
    }
  };

  if (loading) return null; // Don't display anything while loading

  return (
    <Button outline sm={sm} relative={relative} onClick={handleFollow}>
      {followState ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default Follow;

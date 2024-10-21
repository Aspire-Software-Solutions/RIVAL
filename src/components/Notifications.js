import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { getFirestore, collection, query, where, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase Auth
import { Link } from "react-router-dom";
import { TrashIcon } from "./Icons";

// Animation for fading out the notification
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const Wrapper = styled.div`
  padding: 1rem;
`;

const NotificationItem = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${(props) => (props.isRead ? "#f0f0f0" : "#fff")};
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  cursor: pointer;
  position: relative; /* For positioning the dismiss button */

  &:hover {
    background-color: ${(props) => props.theme.tertiaryColor2};
  }

  p {
    margin: 0;
    font-size: 1rem;
  }

  span {
    color: ${(props) => props.theme.secondaryColor};
    font-size: 0.85rem;
  }

  // Apply fade-out animation if the item is dismissed
  &.fade-out {
    animation: ${fadeOut} 0.5s forwards;
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: green;
  cursor: pointer;
`;

const Notifications = ({ updateUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadingOutNotifications, setFadingOutNotifications] = useState({}); // Track which notifications are fading out
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchNotificationsWithHandlesAndUnreadCount = async () => {
      if (!currentUser) return;
  
      setLoading(true);
  
      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
  
        const notificationSnapshot = await getDocs(q);
  
        const notificationsList = await Promise.all(
          notificationSnapshot.docs.map(async (notificationDoc) => {
            const notificationData = notificationDoc.data();
  
            // Get the reference to the profile of the user who generated the notification
            const profileRef = doc(db, "profiles", notificationData.fromUserId);
            const profileSnap = await getDoc(profileRef);
  
            let fromUserHandle = notificationData.fromUserId;
            if (profileSnap.exists()) {
              fromUserHandle = profileSnap.data().handle || notificationData.fromUserId;
            }
  
            return {
              id: notificationDoc.id,
              ...notificationData,
              fromUserHandle,
            };
          })
        );
  
        setNotifications(notificationsList);
  
        // Calculate unread count based on the fetched notifications
        const unreadCount = notificationsList.filter(n => !n.isRead).length;
        updateUnreadCount(unreadCount); // Pass the unread count back to Nav.js
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };
  
    fetchNotificationsWithHandlesAndUnreadCount();
  }, [db, currentUser, updateUnreadCount]);
  

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });

      // Update the state to mark the notification as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      const unreadCount = notifications.filter(n => !n.isRead).length - 1;
      updateUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const dismissNotification = async (notificationId) => {
    // Start fade-out animation
    setFadingOutNotifications((prev) => ({ ...prev, [notificationId]: true }));

    // Wait for animation to finish (500ms)
    setTimeout(async () => {
      // Remove notification from Firestore
      try {
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);

        // Remove notification from the state
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      } catch (error) {
        console.error("Error deleting notification: ", error);
      }
    }, 500); // Match the fade-out duration
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <Wrapper>
      {notifications.length ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={fadingOutNotifications[notification.id] ? "fade-out" : ""}
          >
            <Link
              to={
                notification.type === "like" || notification.type === "comment"
                  ? `/${notification.fromUserHandle}/status/${notification.quickieId}`
                  : `/${notification.fromUserHandle}`
              }
              onClick={() => {
                markAsRead(notification.id);
              }}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <NotificationItem isRead={notification.isRead}>
              {notification.type === "like" && <p>Hey! {notification.fromUserHandle} liked your quickie.</p>}
              {notification.type === "follow" && <p>Good news! {notification.fromUserHandle} just followed you!</p>}
              {notification.type === "comment" && <p>{notification.fromUserHandle} commented on your quickie.</p>}

              {/* Handle content moderation-related notifications */}
              {notification.type === "moderation" && (
                <p style={{ color: 'red', fontWeight: 'bold' }}>{notification.message}</p>
              )}

              {/* Handle report updates */}
              {notification.type === "report_update" && (
                <p style={{ color: 'orange' }}>{notification.message}</p>
              )}

              {/* Handle content removed notifications */}
              {notification.type === "content_removed" && (
                <p style={{ color: 'darkred', fontWeight: 'bold' }}>
                  {notification.message}
                </p>
              )}

              {/* Handle account suspension notifications */}
              {notification.type === "account_suspended" && (
                <p style={{ color: 'purple', fontWeight: 'bold' }}>
                  {notification.message}
                </p>
              )}

              {/* Handle warning notifications */}
              {notification.type === "warning" && (
                <p style={{ color: 'darkorange' }}>
                  {notification.message}
                </p>
              )}

                {/* Dismiss button with checkmark */}
                <DismissButton onClick={(e) => {
                  e.preventDefault(); // Prevent navigation when dismissing
                  dismissNotification(notification.id);
                }}>
                  <TrashIcon />
                </DismissButton>
              </NotificationItem>
            </Link>
          </div>
        ))
      ) : (
        <p>No notifications yet.</p>
      )}
    </Wrapper>
  );
};

export default Notifications;

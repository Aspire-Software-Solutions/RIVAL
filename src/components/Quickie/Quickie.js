import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import DeleteQuickie from "./DeleteQuickie";
import LikeQuickie from "./LikeQuickie";
import { BmIcon, BmFillIcon, CommentIcon, ShareIcon, DangerIcon } from "../Icons"; // Added DangerIcon
import Avatar from "../../styles/Avatar";
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, 
         increment, onSnapshot, getDoc, setDoc, collection, addDoc,
        } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase Auth
import { toast } from "react-toastify";
import Modal from "../Modal"; // Added Modal import

const Wrapper = styled.div`
  display: flex;
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  padding: 1.5rem 1rem 1rem 1rem;

  .quickie-info-user {
    display: flex;
  }

  .quickie-info-user span.username {
    font-weight: 500;
  }

  .quickie-info-user span.secondary {
    padding-left: 0.5rem;
    color: ${(props) => props.theme.secondaryColor};
  }

  .tags {
    display: flex;
  }

  span.tag {
    color: ${(props) => props.theme.accentColor};
    margin-right: 0.4rem;
  }

  div.quickie-stats {
    display: flex;
    margin-top: 0.5rem;
    align-items: center;

    div {
      margin-right: 4rem;
      color: ${(props) => props.theme.secondaryColor};
    }

    svg {
      margin-right: 0.5rem;
    }

    span {
      display: flex;
      align-items: center;
    }

    span.comment {
      svg {
        position: relative;
        top: 4px;
      }
    }
  }

  @media screen and (max-width: 470px) {
    div.quickie-stats {
      div {
        margin-right: 2.5rem;
      }
    }
  }

  @media screen and (max-width: 430px) {
    flex-direction: column;

    .username {
      display: none;
    }

    .avatar {
      display: none;
    }

    .quickie-info-user span.secondary {
      padding-left: 0;
      padding-right: 0.7rem;
    }
  }
`;

const ReportButton = styled.button` // Added ReportButton styles
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.dangerColor}; // Assuming you have a danger color in your theme
  display: flex;
  align-items: center;
  margin-left: 1rem;
`;

const Quickie = ({ quickie }) => {
  const {
    id,
    text,
    tags,
    userId,
    handle,
    userName,
    mediaUrl,
    createdAt,
  } = quickie;

  const [quickieData, setQuickieData] = useState(quickie); // State to hold the real-time quickie data
  const [isBookmarked, setIsBookmarked] = useState(false); // Track bookmark state
  const [userAvatar, setUserAvatar] = useState(quickie.userAvatar || "/default-avatar.png");
  const [isModalOpen, setModalOpen] = useState(false); // Track modal state (Added)
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Real-time listener for changes to the individual quickie (including likes)
  useEffect(() => {
    const quickieRef = doc(db, "quickies", id);
    const unsubscribe = onSnapshot(quickieRef, (docSnap) => {
      if (docSnap.exists()) {
        setQuickieData(docSnap.data()); // Update the quickie data in real-time, including likes
      }
    });
    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, [db, id]);

  // Listen for avatar updates from the user's profile
  useEffect(() => {
    const profileRef = doc(db, "profiles", userId);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserAvatar(docSnap.data().avatarUrl || "/default-avatar.png"); // Update avatar in real-time
      }
    });
    return () => unsubscribe(); // Clean up listener
  }, [db, userId]);

  // Fetch bookmark status on component mount
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (currentUser) {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        const userProfile = profileSnap.data();
        if (userProfile?.bookmarks?.includes(id)) {
          setIsBookmarked(true);
        }
      }
    };
    fetchBookmarkStatus();
  }, [currentUser, db, id]);

  // Share the link to the quickie
  const handleShareQuickie = () => {
    const quickieLink = `${window.location.origin}/${handle}/status/${id}`;
    navigator.clipboard.writeText(quickieLink)
      .then(() => toast.success("Quickie link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleLikeQuickie = async () => {
    if (!currentUser) return; // Ensure user is authenticated
  
    try {
      const quickieRef = doc(db, "quickies", id);
      const quickieSnap = await getDoc(quickieRef);
      const postOwnerId = quickieSnap.data().userId; // Post owner's ID
  
      if (quickieData.likes.includes(currentUser.uid)) {
        // Remove the user's ID from the likes array and decrement likesCount
        await updateDoc(quickieRef, {
          likes: arrayRemove(currentUser.uid),
          likesCount: increment(-1),
        });
      } else {
        // Add the user's ID to the likes array and increment likesCount
        await updateDoc(quickieRef, {
          likes: arrayUnion(currentUser.uid),
          likesCount: increment(1),
        });
  
        // Create a notification for the post owner
        const notificationsRef = collection(db, "notifications");
        await addDoc(notificationsRef, {
          type: "like",
          quickieId: id, // The ID of the quickie that was liked
          fromUserId: currentUser.uid, // User who liked the quickie
          userId: postOwnerId, // Notify the post owner
          createdAt: new Date(),
          isRead: false,
        });
      }
    } catch (error) {
      console.error("Error liking quickie: ", error);
    }
  };
  

  const handleBookmarkQuickie = async () => {
    if (!currentUser) return; // Ensure user is authenticated

    try {
      const profileRef = doc(db, "profiles", currentUser.uid);
      if (isBookmarked) {
        await updateDoc(profileRef, {
          bookmarks: arrayRemove(id),
        });
        toast.success("Bookmark removed");
      } else {
        await updateDoc(profileRef, {
          bookmarks: arrayUnion(id),
        });
        toast.success("Quickie bookmarked");
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      toast.error("Error updating bookmark");
    }
  };

  const strList = text.split(" ");
  const processedText = strList.filter((str) => !str.startsWith("#")).join(" ");

  // Render media based on the content type (video or image)
  const renderMedia = () => {
    if (!mediaUrl) return null;

    // Check if the media URL includes video file formats
    const videoFormats = ['mp4', 'webm', 'ogg'];
    const imageFormats = ['jpeg', 'jpg', 'png', 'gif'];

    if (videoFormats.some(format => mediaUrl.includes(format))) {
      return <video controls width="100%" src={mediaUrl}></video>; // Render video
    } else if (imageFormats.some(format => mediaUrl.includes(format))) {
      return <img src={mediaUrl} alt="quickie-file" style={{ width: '100%' }} />; // Render image
    } else {
      return <p>Unsupported media type</p>; // Unsupported file type
    }
  } 

  const handleReportClick = () => { // Report modal handler (Added)
    setModalOpen(true);
  };

  const handleCloseModal = () => { // Close modal handler (Added)
    setModalOpen(false);
  };

  // Firestore submission logic (Added)
  const handleSubmitReport = async (reportMessage) => {
    try {
      const quickieDocRef = doc(db, "quickies", id);
      const reportDocRef = doc(db, "reports", id);

      const quickieSnap = await getDoc(quickieDocRef);
      if (quickieSnap.exists()) {
        const originalPosterId = quickieSnap.data().userId || "";
        const quickieContentType = quickieSnap.data().type || "Text";
        const quickieContent = quickieSnap.data().text || "No content provided";

        const reportSnap = await getDoc(reportDocRef);
        if (reportSnap.exists()) {
          await updateDoc(reportDocRef, {
            comments: arrayUnion({
              date: new Date(),
              message: reportMessage,
              user: auth.currentUser.uid
            }),
            numReports: increment(1),
            content: quickieContent,
            type: quickieContentType,
            user: originalPosterId
          });
        } else {
          await setDoc(reportDocRef, {
            comments: [{
              date: new Date(),
              message: reportMessage,
              user: auth.currentUser.uid
            }],
            numReports: 1,
            rejectReason: "",
            status: "Pending",
            type: quickieContentType,
            content: quickieContent,
            user: originalPosterId
          });
        }
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("There was an issue submitting your report.");
    }
  };

  return (
    <Wrapper>
      <Link to={`/${handle}`}>
        <Avatar className="avatar" src={userAvatar} alt="avatar" />
      </Link>

      <div className="quickie-info">
        <div className="quickie-info-user">
          <Link to={`/${handle}`}>
            <span className="username">{userName || "Unknown User"}</span> {/* Show fullname */}
            <span className="secondary">{`@${handle}`}</span> {/* Show handle */}
            <span className="secondary">{moment(createdAt?.toDate()).fromNow()}</span>
          </Link>
        </div>

        <Link to={`/${handle}/status/${id}`}>
          <p>{processedText}</p>
        </Link>

        <div className="tags">
          {tags.length ? tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          )) : null}
        </div>

        <Link to={`/${handle}/status/${id}`}>
          {renderMedia()} {/* Render video or image */}
        </Link>

        <div className="quickie-stats">
          <div>
            <span className="comment">
              <Link to={`/${handle}/status/${id}`}>
                <CommentIcon />
                {quickieData.commentsCount ? quickieData.commentsCount : null}
              </Link>
            </span>
          </div>

          <div>
            <LikeQuickie
              id={id}
              isLiked={quickieData.likes.includes(currentUser.uid)} // Check if current user liked
              likesCount={quickieData.likesCount}
              handleLikeQuickie={handleLikeQuickie}
            />
          </div>

          <div onClick={handleBookmarkQuickie} style={{ cursor: 'pointer' }}>
            {isBookmarked ? <BmFillIcon /> : <BmIcon />}
          </div>

          <div onClick={handleShareQuickie} style={{ cursor: "pointer" }}>
            <ShareIcon />
          </div>

          <div onClick={handleReportClick} style={{ cursor: 'pointer' }}> {/* Added Report button */}
            <DangerIcon />
          </div>

          <div>
            {currentUser && currentUser.uid === userId && (
              <DeleteQuickie id={id} />
            )}
          </div>
        </div>

        {isModalOpen && ( // Added Modal functionality
          <Modal onClose={handleCloseModal} onSubmit={handleSubmitReport} />
        )}
      </div>
    </Wrapper>
  );
};

export default Quickie;

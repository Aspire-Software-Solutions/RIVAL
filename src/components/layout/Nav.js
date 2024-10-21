import styled from "styled-components";
import { NavLink, useHistory, useLocation } from "react-router-dom"; // Import necessary hooks
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { getFirestore, collection, query, where, doc, getDocs, getDoc, onSnapshot } from "firebase/firestore"; // Firestore imports
import React, { useState, useEffect, useRef } from "react";
import { HomeIcon, ExploreIcon, NotificationIcon, ChatIcon, BackIcon, AdminIcon } from "../Icons"; // Add your BackIcon here
import ToggleTheme from "../ToggleTheme"; // Import the theme toggle component

const Wrapper = styled.nav`
  height: 4rem;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4); /* Soft shadow under navbar */
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  width: 100%;
  z-index: 2;
  background-color: #720000; /* Set a fixed navbar color */

  .nav-center {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    gap: 11rem; /* Adjust spacing between icons in the center */
    padding-left: 5rem;
  }

  .nav-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1.5rem; /* Adjust spacing between notification, chat, and profile icons */
  }

  .profile-menu {
    position: relative;
    display: flex;
    align-items: center;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.3s ease;
    background-color: white; /* Ensures profile avatar has a white circle background */
    padding: 4px; /* Space around the avatar image */
  }

  .profile-avatar img {
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }

  .profile-avatar:hover {
    transform: scale(1.1);
  }

  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: ${(props) => props.theme.background};
    border: 1px solid ${(props) => props.theme.tertiaryColor};
    padding: 0.5rem 1rem;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 5;
  }

  .dropdown a,
  .dropdown button {
    margin-bottom: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    color: ${(props) => props.theme.primaryColor};
  }

  .dropdown button:hover,
  .dropdown a:hover {
    color: ${(props) => props.theme.accentColor};
  }

  ul {
    display: flex;
    justify-content: space-around;
    width: 100%;
  }

  li {
    margin-right: 1.5rem;
  }

  svg {
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: transform 0.3s ease, fill 0.3s ease, stroke 0.3s ease; /* Smooth transition for fill and stroke */
    fill: white;
  }

  svg:hover {
    transform: scale(1.1);
    fill: ${(props) => props.theme.accentColor}; /* For filled icons */
    stroke: ${(props) => props.theme.accentColor}; /* For outline icons */
  }

  @media screen and (max-width: 530px) {
    .dropdown {
      right: 5px;
    }

    .profile-avatar {
      width: 30px;
      height: 30px;
    }
  }
`;

// Style for the notification count badge
const badgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-10px",
  backgroundColor: "red",
  color: "white",
  borderRadius: "50%",
  padding: "3px 6px",
  fontSize: "12px",
  fontWeight: "bold",
};

const Nav = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [handle, setHandle] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // State to hold the count of unread notifications
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status
  const dropdownRef = useRef(null);
  const db = getFirestore();
  const history = useHistory(); // To use history and navigate back
  const location = useLocation(); // To get the current route

  // Check if the current route should show a back button
  const showBackButton =
    location.pathname.includes("/followers") ||
    location.pathname.includes("/following") ||
    location.pathname.includes("/status");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setHandle(profileData.handle);
          setUserAvatar(profileData.avatarUrl || "/default-avatar.png");
          setIsAdmin(profileData.isAdmin || false); // Check if the user is an admin
        }
      }
    };
    fetchProfile();
  }, [user, db]);

  // Function to update unread notification count
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  useEffect(() => {
    if (!user) return;
  
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("isRead", "==", false) // Only unread notifications
    );
  
    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size); // Update unreadCount state in real-time
    });
  
    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [db, user]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Wrapper>
      {/* Conditionally render the back button */}
      {showBackButton && (
        <div onClick={() => history.goBack()} style={{ cursor: "pointer" }}>
          <BackIcon />
        </div>
      )}

      <div className="nav-center">
        <li>
          <NavLink exact activeClassName="selected" to="/">
            <HomeIcon />
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="selected" to="/explore">
            <ExploreIcon />
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink activeClassName="selected" to="/ContentModeration">
              <AdminIcon /> {/* Use any icon you want here */}
            </NavLink>
          </li>
        )}
      </div>

      <div className="nav-right">
      <NavLink activeClassName="selected" to="/notifications">
          <div style={{ position: "relative" }}>
            <NotificationIcon />
            {unreadCount > 0 && (
              <span style={badgeStyle}>
                {unreadCount}
              </span>
            )}
          </div>
        </NavLink>
        <NavLink activeClassName="selected" to="/conversations">
          <ChatIcon />
        </NavLink>

        <div className="profile-menu">
          <div className="profile-avatar" onClick={toggleDropdown}>
            <img src={userAvatar} alt="Profile" />
          </div>
          {isDropdownOpen && (
            <div className="dropdown" ref={dropdownRef}>
              <NavLink to={`/${handle}`}>Profile</NavLink>
              <NavLink to="/bookmarks">Bookmarks</NavLink>

              <ToggleTheme /> {/* Inserted theme toggle component */}
              <button onClick={() => auth.signOut()}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default Nav;

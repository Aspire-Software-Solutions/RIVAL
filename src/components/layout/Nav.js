import styled from "styled-components";
import { Link, NavLink } from "react-router-dom";
import MorePopup from "../MorePopup";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore imports
import React, { useState, useEffect } from "react";
import {
  Logo,
  HomeIcon,
  ExploreIcon,
  NotificationIcon,
  ProfileIcon,
  BmIcon,
} from "../Icons";

const Wrapper = styled.nav`
  width: 14.6%;
  padding: 1rem;
  border-right: 1px solid ${(props) => props.theme.tertiaryColor};
  height: 100vh;
  position: fixed;
  font-weight: 500;

  svg {
    width: 28px;
    height: 28px;
    margin-right: 0.5rem;
    position: relative;
    color: ${(props) => props.theme.accentColor};
    top: 7px;
  }

  .logo {
    margin-bottom: 1.3rem;
  }

  ul {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  li {
    margin-bottom: 2rem;
  }

  .selected,
  .selected svg {
    color: ${(props) => props.theme.accentColor};
    fill: ${(props) => props.theme.accentColor};
  }

  @media screen and (max-width: 1100px) {
    width: 10%;

    span {
      display: none;
    }

    svg {
      margin-right: 0;
    }

    li {
      margin: none;
    }

    button {
      display: none;
    }
  }

  @media screen and (max-width: 530px) {
    bottom: 0;
    width: 100vw;
    border-right: none;
    height: 4rem;
    border-top: 1px solid ${(props) => props.theme.tertiaryColor};
    z-index: 2;
    background: ${(props) => props.theme.background};

    ul {
      flex-direction: row;
      justify-content: space-between;
    }

    li {
    }

    svg {
      width: 22px;
      height: 22px;
    }
  }

  @media screen and (max-width: 500px) {
  }
`;

const Nav = () => {
  const auth = getAuth();
  const user = auth.currentUser; // Get the currently logged-in user
  const [handle, setHandle] = useState(null); // Store the handle
  const db = getFirestore(); // Initialize Firestore

  useEffect(() => {
    const fetchHandle = async () => {
      if (user) {
        // Fetch the handle from the profiles collection using the user ID
        const profileRef = doc(db, "profiles", user.uid); // Assuming user.uid is the document ID
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setHandle(profileSnap.data().handle); // Set the handle
        } else {
          console.log("No profile found!");
        }
      }
    };

    fetchHandle();
  }, [user, db]);

  return (
    <Wrapper>
      <ul>
        <Link to="/">
          <h3 className="logo">
            <Logo />
          </h3>
        </Link>
        <li>
          <NavLink exact activeClassName="selected" to="/">
            <HomeIcon /> <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="selected" to="/explore">
            <ExploreIcon /> <span>Explore</span>
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="selected" to="/notifications">
            <NotificationIcon /> <span>Notifications</span>
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="selected" to="/bookmarks">
            <BmIcon /> <span>Bookmarks</span>
          </NavLink>
        </li>
        <li>
          {/* Show the profile link even before the handle is loaded */}
          {user ? (
            <NavLink activeClassName="selected" to={handle ? `/${handle}` : "/"}>
              <ProfileIcon /> <span>{handle ? "Profile" : "Your Profile"}</span>
            </NavLink>
          ) : (
            <span>Sign in</span>
          )}
        </li>
        <li>
          <MorePopup />
        </li>
      </ul>
    </Wrapper>
  );
};

export default Nav;
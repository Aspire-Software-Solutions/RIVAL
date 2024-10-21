import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { getAuth } from "firebase/auth"; // Firebase Auth import
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore imports
import Layout from "./styles/Layout";
import Nav from "./components/layout/Nav";
import Home from "./pages/Home";
import MasterQuickie from "./components/Quickie/MasterQuickie";
import Profile from "./components/Profile/Profile";
import Bookmarks from "./pages/Bookmarks";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import EditProfile from "./components/Profile/EditProfile";
import FollowersFollowing from "./components/Profile/FollowersFollowing";
import ConversationsList from "./components/Conversations/ConversationsList";
import ConversationDetail from "./components/Conversations/ConversationDetail";
import ModerationDashboard from "./pages/ContentModeration"; // Content Moderation Page
import { AdminIcon } from "./components/Icons"; // AdminIcon import

const AppRouter = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setIsAdmin(profileData.isAdmin || false);
          }
          setIsProfileLoaded(true);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setIsProfileLoaded(true); // In case of error, allow other content to load
        }
      } else {
        setIsProfileLoaded(true);
      }
    };
    fetchProfile();
  }, [user, db]);

  if (!isProfileLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Switch>
        {/* Independent Admin-Only Route (No Nav, No Layout) */}
        {isAdmin && (
          <Route
            path="/ContentModeration"
            render={() => <ModerationDashboard user={user} isAdmin={isAdmin} />}
          />
        )}

        {/* Public Routes with Layout and Nav */}
        <Route>
          <Nav />
          <Layout>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/explore" component={Explore} />
              <Route exact path="/notifications" component={Notifications} />
              <Route exact path="/bookmarks" component={Bookmarks} />
              <Route exact path="/conversations" component={ConversationsList} />
              <Route
                exact
                path="/conversations/:conversationId"
                component={ConversationDetail}
              />
              <Route exact path="/settings/profile" component={EditProfile} />
              <Route exact path="/:handle/status/:quickieId" component={MasterQuickie} />
              <Route exact path="/:handle" component={Profile} />
              <Route exact path="/:handle/:type" component={FollowersFollowing} />

              {/* Catch-All Redirect */}
              <Redirect from="*" to="/" />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Router>
  );
};

export default AppRouter;

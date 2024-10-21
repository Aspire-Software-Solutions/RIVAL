import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import ProfileInfo from "./ProfileInfo";
import Quickie from "../Quickie/Quickie";
import Loader from "../Loader";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore"; // Firestore imports

const Wrapper = styled.div`
  padding-bottom: 5rem;

  .profile-top {
    display: flex;
    flex-direction: column;
    margin-left: 1rem;

    span.quickieCount {
      margin-top: 0.1rem;
      color: ${(props) => props.theme.secondaryColor};
      font-size: 0.9rem;
    }
  }
`;

const Profile = () => {
  const { handle } = useParams(); // Get the profile handle from the URL
  const [profileData, setProfileData] = useState(null);
  const [quickies, setQuickies] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(); // Initialize Firestore

  useEffect(() => {
    const fetchProfileAndQuickies = () => {
      setLoading(true);

      // Real-time listener for profile data
      const profileQuery = query(collection(db, "profiles"), where("handle", "==", handle));

      onSnapshot(profileQuery, (profileSnapshot) => {
        if (!profileSnapshot.empty) {
          const profileDoc = profileSnapshot.docs[0];
          setProfileData(profileDoc.data());

          // Fetch the user's quickies in real-time
          const quickiesQuery = query(collection(db, "quickies"), where("userId", "==", profileDoc.data().userId));
          onSnapshot(quickiesQuery, (quickiesSnapshot) => {
            const quickiesList = quickiesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setQuickies(quickiesList);
          });
        } else {
          console.log("No such profile!");
          setProfileData(null);
        }

        setLoading(false);
      });
    };

    fetchProfileAndQuickies();
  }, [handle, db]);

  if (loading) return <Loader />;

  // Check if profileData exists before rendering firstname and lastname
  return (
    <Wrapper>
      <Header>
        <div className="profile-top">
          {profileData ? (
            <>
              <span>{`${profileData.firstname} ${profileData.lastname}`}</span>
              <span className="quickieCount">
                {quickies.length ? `${quickies.length} Attacks` : "No Attacks"}
              </span>
            </>
          ) : (
            <span>Profile not found</span>
          )}
        </div>
      </Header>

      {profileData && <ProfileInfo profile={profileData} />}
      
      {quickies.length
        ? quickies.map((quickie) => (
            <Quickie key={quickie.id} quickie={quickie} />
          ))
        : null}
    </Wrapper>
  );
};

export default Profile;

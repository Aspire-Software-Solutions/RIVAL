// Mock Users Data
export const mockUser = {
    uid: "mockUserId",
    displayName: "Test User",
    email: "testuser@example.com",
    photoURL: "https://example.com/photo.jpg",
    avatarUrl: "https://firebasestorage.googleapis.com/v0/b/fbproject-c27b4.appspot.com/o/images%2FIMG_2156.jpg?alt=media&token=3f706b7a-64c1-449a-8cd0-bef66f04430b",
    bio: "",
    bookmarks: [""],
    coverPhoto: "https://firebasestorage.googleapis.com/v0/b/fbproject-c27b4.appspot.com/o/images%2F59c8d0c741937ad2a9cce9fa9f07d",
    createdAt: "September 10, 2024 at 2:57:39 PM UTC-7",
    firstname: "Brayan",
    followers: ["Z9roV71oUphcPk4sv5L5XMJOWwI2", "LjY9QBuRzKOXpjjk0VSM7fgmFMF3", "F39nXf3UYKPumPOk2NX1Yf0zY9o2"],
    followersCount: 3,
    following: [
      "rg9qftD9TUhspQTIho0ewwU6y2e2",
      "F39nXf3UYKPumPOk2NX1Yf0zY9o2",
      "3igtEYLNmLb4CTRUt8MpXOlQ3Ah1",
      "Z9roV71oUphcPk4sv5L5XMJOWwI2",
      "AHjQVeodx9NORS0NTrYhOk69WHn1",
      "LjY9QBuRzKOXpjjk0VSM7fgmFMF3",
      "Dcvgf2o0SYOkBNv5J6eyWp2rQFo1"
    ],
    followingCount: 7,
    fullname: "Brayan Quevedo Ramos",
    handle: "masterSgt",
    isActive: true,
    isAdmin: true,
    lastname: "Quevedo Ramos",
    likes: [""],
    location: "",
    phoneNumber: "+15036021258",
    quickieCount: 0,
    userId: "ElmD9lgDBOf8WOCYQcBPPVEKAib2",
    website: ""
};

export const mockAuthStateChanged = (callback) => {
   callback(mockUser);
};

export const mockFollowerData = {
    currentUserUd: {
        uid: "mockUserId",
        followers: ["user1", "user2"],
        followersCount: 2
    }
};

export const mockPost = {
    postId: "mockPostId",
    content: "This is a mock post.",
    authorId: "mockUserId",
    likes: 5,
    comments: [],
};
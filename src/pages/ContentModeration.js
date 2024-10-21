import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal, Dropdown, DropdownButton } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getAuth } from "firebase/auth"; // Add this import
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, doc, getDoc, getDocs, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase'; // Ensure this is your Firebase configuration file

const ModerationDashboard = () => {

  const [statusFilter, setStatusFilter] = useState('All');
  const [contentTypeFilter, setContentTypeFilter] = useState('All');
  const [imageUrl, setImageUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [originalContent, setOriginalContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [approvedContent, setApprovedContent] = useState([]);
  const [rejectedContent, setRejectedContent] = useState([]);
  const [loading, setLoading] = useState(true); // To show loading state
  const [isAdmin, setIsAdmin] = useState(false); // Admin state
  const auth = getAuth();
  const user = auth.currentUser;

  // Init storage (needed for handling images and videos)
  const storage = getStorage();

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (user) {
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            if (profileData.isAdmin) {
              setIsAdmin(true);
              console.log("Admin access granted.");
            }
          }
        } catch (error) {
          console.error("Error checking admin access:", error);
        }
      }
      setLoading(false); // End loading after checking
    };
    checkAdminAccess();
  }, [user]);

  // Fetch reports from Firestore (real-time updates included)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOriginalContent(reportsData);
      setFilteredContent(reportsData.filter(item => item.status === 'Pending'));
      setApprovedContent(reportsData.filter(item => item.status === 'Approved'));
      setRejectedContent(reportsData.filter(item => item.status === 'Rejected'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchReportsAndCheckQuickies = async () => {
      try {
        // Fetch all reports from Firestore
        const reportsRef = collection(db, "reports");
        const reportsSnapshot = await getDocs(reportsRef);
  
        // Loop through each report and check if the corresponding quickie exists
        for (const reportDoc of reportsSnapshot.docs) {
          const quickieId = reportDoc.id; // The quickieId is the same as the report ID
  
          // Check if the quickie exists in the 'quickies' collection
          const quickieRef = doc(db, "quickies", quickieId);
          const quickieSnap = await getDoc(quickieRef);
  
          if (!quickieSnap.exists()) {
            // If the quickie doesn't exist, delete the report and log a message
            console.log(`Quickie does not exist in the database (user probably deleted it). Deleting report ${quickieId} now!`);
            await deleteDoc(doc(db, "reports", quickieId));
          }
        }
      } catch (error) {
        console.error("Error fetching reports or checking quickies:", error);
      }
    };
  
    fetchReportsAndCheckQuickies(); // Call the function on component mount
  }, [db]); // Ensure this useEffect depends on the Firestore instance
  
  

  // Function to handle opening the modal
  const handleShowModal = (report) => {
    setSelectedReport(report);
    setShowModal(true);
    setViewOnlyMode(report.status === 'Approved' || report.status === 'Rejected');
    setRejectReason('');

    if (report.type === "Image") {
      const storageRef = ref(storage, report.content);
      getDownloadURL(storageRef)
        .then((url) => setImageUrl(url))
        .catch((error) => {
          console.error("Error fetching image URL:", error);
          setImageUrl('');
        });
    } else {
      setImageUrl('');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setImageUrl('');
    setRejectReason('');
  };

  const handleApplyFilters = () => {
    const filtered = originalContent.filter(item => {
      const isPending = item.status === 'Pending';
      const contentTypeMatch = contentTypeFilter === 'All' || item.type.toLowerCase() === contentTypeFilter.toLowerCase().trim();
      return isPending && contentTypeMatch;
    });
    setFilteredContent(filtered);
  };

  const getUserHandle = async (userId) => {
    const profileRef = doc(db, "profiles", userId);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      return profileSnap.data().handle;  // Return the user's handle
    } else {
      console.error(`No profile found for user ${userId}`);
      return userId;  // Fallback to userId if no handle is found
    }
  };

  const notifyApproved = async (postOwnerId, quickieId) => {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      fromUserId: "Moderation",  // Indicating that the notification is from the moderator
      message: "Report from Content Moderator. Your post was reported, but no action was taken.",
      userId: postOwnerId,  // Notify the original post owner
      quickieId: quickieId,  // Include quickieId for consistency
      type: "moderation",  // Type to differentiate from other notifications
      createdAt: new Date(),
      isRead: false,
    });
  };
  
  

  const notifyDismissReport = async (postOwnerId, reportingUsers, quickieId) => {
    const notificationsRef = collection(db, "notifications");
    const postOwnerHandle = await getUserHandle(postOwnerId);
  
    // Notify post owner
    await addDoc(notificationsRef, {
      fromUserId: "Moderation",
      message: "Report from Content Moderator: Your post violated the community guidelines, but no action was taken at this moment. Consider this a warning.",
      userId: postOwnerId,
      quickieId: quickieId,  // Include quickieId for consistency
      type: "warning",  // Type to indicate warning notification
      createdAt: new Date(),
      isRead: false,
    });
  
    // Notify all reporting users
    for (let reporterId of reportingUsers) {
      await addDoc(notificationsRef, {
        fromUserId: "Moderation",
        message: `Report update: Your report on ${postOwnerHandle}'s was deemed unacceptable and they have been issued a warning.`,
        userId: reporterId,
        quickieId: quickieId,  // Include quickieId for consistency
        type: "report_update",  // Type for report update
        createdAt: new Date(),
        isRead: false,
      });
    }
  };
  
  

  const notifyRemoveContent = async (postOwnerId, reportingUsers, quickieId) => {
    const notificationsRef = collection(db, "notifications");
    const postOwnerHandle = await getUserHandle(postOwnerId);

    // Notify post owner
    await addDoc(notificationsRef, {
      fromUserId: "Moderation",
      message: "Report from Content Moderator: One of your posts has been deleted due to violating community guidelines. Subsequent violations may suspend your account.",
      userId: postOwnerId,
      quickieId: quickieId,  // Include quickieId for consistency
      type: "content_removed",  // Type for content removal
      createdAt: new Date(),
      isRead: false,
    });
  
    // Notify all reporting users
    for (let reporterId of reportingUsers) {
      await addDoc(notificationsRef, {
        fromUserId: "Moderation",
        message: `Report update: ${postOwnerHandle}'s content was removed and they received a warning. Thank you for keeping our community safe!`,
        userId: reporterId,
        quickieId: quickieId,  // Include quickieId for consistency
        type: "report_update",  // Type for report update
        createdAt: new Date(),
        isRead: false,
      });
    }
  
    // Delete post from quickies collection
    const quickieRef = doc(db, "quickies", quickieId);
    await deleteDoc(quickieRef);
  };

  const notifySuspendAccount = async (postOwnerId, reportingUsers, quickieId) => {
    const notificationsRef = collection(db, "notifications");
    const postOwnerHandle = await getUserHandle(postOwnerId);

    // Notify post owner
    await addDoc(notificationsRef, {
      fromUserId: "Moderation",
      message: "Content Moderator: Your content is unacceptable and your account has been suspended.",
      userId: postOwnerId,
      quickieId: quickieId,  // Include quickieId for consistency
      type: "account_suspended",  // Type for account suspension
      createdAt: new Date(),
      isRead: false,
    });
  
    // Notify all reporting users
    for (let reporterId of reportingUsers) {
      await addDoc(notificationsRef, {
        fromUserId: "Moderation",
        message: `Report update: ${postOwnerHandle}'s has been suspended for violating community guidelines. Thanks for keeping this community safe!`,
        userId: reporterId,
        quickieId: quickieId,  // Include quickieId for consistency
        type: "report_update",  // Type for report update
        createdAt: new Date(),
        isRead: false,
      });
    }
  
    // Delete post from quickies collection
    const quickieRef = doc(db, "quickies", quickieId);
    await deleteDoc(quickieRef);
  };
  
  
  const handleModerationAction = async (action) => {
    const reportId = selectedReport.id;  // This is the report document ID, also the quickieId
    const quickieId = reportId;  // Use the reportId as the quickieId since it's the same
    const postOwnerId = selectedReport.user;  // User who posted the quickie
    const reportingUsers = selectedReport.comments.map(comment => comment.user);  // Users who reported the quickie
  
    try {
      // Moderation actions
      if (action === 'approve') {
        await notifyApproved(postOwnerId, quickieId);
      } else if (rejectReason === 'dismiss') {
        await notifyDismissReport(postOwnerId, reportingUsers, quickieId);
      } else if (rejectReason === 'warn') {
        await notifyRemoveContent(postOwnerId, reportingUsers, quickieId);
      } else if (rejectReason === 'suspend') {
        await notifySuspendAccount(postOwnerId, reportingUsers, quickieId);
      }
  
      // Update the status of the report in Firestore
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        ...(action === 'reject' && { rejectReason }),
      });
  
      handleCloseModal();
    } catch (error) {
      console.error("Error processing moderation action:", error);
    }
  };
  
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <h1>ACCESS DENIED</h1>;
  }

  return (
    <>
      {/* Sticky Navigation Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#f8f9fa',
        padding: '10px',
        zIndex: 1000,
        boxShadow: '0px 2px 5px rgba(0,0,0,0.1)'
      }}>
        <Container fluid>
          <Link to="/" style={{
            textDecoration: 'none',
            color: '#007bff',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            Return to main website
          </Link>
        </Container>
      </div>

      {/* Main Content */}
      <Container fluid className="mt-4">
        <Row>
          <Col md={3}>
            <Card>
              <Card.Header>Filters</Card.Header>
              <Card.Body>
                <Form onSubmit={(e) => e.preventDefault()}>
                  {/* Filters to filter reports by */}
                  <Form.Group className="mb-3">
                    <Form.Label>Content Type</Form.Label>
                    <Form.Control 
                      as="select" 
                      value={contentTypeFilter} 
                      onChange={(e) => setContentTypeFilter(e.target.value)}
                    >
                      <option>All</option>
                      <option>Image</option>
                      <option>Video</option>
                      <option>Text</option>
                    </Form.Control>
                  </Form.Group>

                  <Button variant="primary" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Card>
              <Card.Header>Content Moderation</Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>User Handle</th>
                      <th># Reports</th>
                      <th>Type</th>
                      <th>Content</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.user}</td>
                        <td>{item.numReports}</td>
                        <td>{item.type}</td>
                        <td>
                          {item.type === 'Image' ? '*image*' : 
                          item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
                        </td>
                        <td>
                          <Button 
                            variant="info" 
                            onClick={() => handleShowModal(item)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          {/* Approved Actions Table */}
          <Col xs={12} md={6}>
            <Card>
              <Card.Header>Recent Approved Actions</Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User Handle</th>
                      <th># Reports</th>
                      <th>Type</th>
                      <th>Content</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedContent.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.user}</td>
                        <td>{item.numReports}</td>
                        <td>{item.type}</td>
                        <td>
                          {item.type === 'Image' ? '*image*' : 
                          item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
                        </td>
                        <td>
                          <Button 
                            variant="success"
                            onClick={() => handleShowModal(item)}
                          >
                            {item.status}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Rejected Actions Table */}
          <Col xs={12} md={6}>
            <Card>
              <Card.Header>Recent Rejected Actions</Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User Handle</th>
                      <th># Reports</th>
                      <th>Type</th>
                      <th>Content</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedContent.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.user}</td>
                        <td>{item.numReports}</td>
                        <td>{item.type}</td>
                        <td>
                          {item.type === 'Image' ? '*image*' : 
                          item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
                        </td>
                        <td>
                          <Button 
                            variant="danger"
                            onClick={() => handleShowModal(item)}
                          >
                            {item.status}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

     {/* Modal for Viewing Details */}
     <Modal show={showModal} onHide={handleCloseModal} style={{color: 'black'}}>
      <Modal.Header closeButton>
        <Modal.Title>
          {selectedReport && `${selectedReport.user} Report #${selectedReport.id}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedReport ? (
          <>
            <div>
              <strong>Type: </strong> {selectedReport.type}
            </div>
            <div>
              <strong>Content: </strong>
              {selectedReport.type === 'Image' && imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Reported content"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : selectedReport.type === 'Video' && imageUrl ? (
                <video controls style={{ maxWidth: '100%', height: 'auto' }}>
                  <source src={imageUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                selectedReport.content.length > 50
                  ? `${selectedReport.content.substring(0, 50)}...`
                  : selectedReport.content
              )}
            </div>
            <div>
              <strong>Comments: </strong>
              {selectedReport.comments && selectedReport.comments.length > 0 ? (
                selectedReport.comments.map((comment, index) => {
                  // Convert Firestore timestamp to JavaScript Date object
                  const timestamp = new Date(comment.date.seconds * 1000 + comment.date.nanoseconds / 1000000);
                  const formattedDate = timestamp.toLocaleString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });

                  return (
                    <div key={index}>
                      {`${formattedDate} - ${comment.user}: ${comment.message}`}
                    </div>
                  );
                })
              ) : (
                <div>No comments available.</div>
              )}
            </div>
          </>
        ) : (
          <div>Loading report details...</div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {selectedReport && (
          <>
            {!viewOnlyMode ? (
              <>
                {/* Approve Button */}
                <Button variant="success" onClick={() => handleModerationAction('approve')}>
                  Approve
                </Button>

                {/* Reject Dropdown and Confirm Button */}
                <DropdownButton id="dropdown-rejection" title="Reject" variant="danger">
                  <Dropdown.Item onClick={() => setRejectReason('dismiss')}>
                    Dismiss report
                    <br />
                    <small className="text-muted">There's no violation of ToS.</small>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setRejectReason('warn')}>
                    Remove content and warn user
                    <br />
                    <small className="text-muted">There is a minor violation of ToS.</small>
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setRejectReason('suspend')}>
                    Remove content and suspend user
                    <br />
                    <small className="text-muted">There is a MAJOR violation of ToS.</small>
                  </Dropdown.Item>
                </DropdownButton>

                {/* Confirm Rejection Button */}
                <Button
                  variant="danger"
                  onClick={() => handleModerationAction('reject')}
                  disabled={!rejectReason} // Ensure rejectReason is set before confirming
                >
                  Confirm Rejection
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            )}
          </>
        )}
      </Modal.Footer>

    </Modal>
    </>
  );
};

export default ModerationDashboard;
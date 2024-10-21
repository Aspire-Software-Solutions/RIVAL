import React, { useState } from "react";
import styled from "styled-components";

// Modal styles
const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  color: black;
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
  max-width: 80%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  color: black; /* Make the 'X' black */
  font-weight: bold; /* Make it stand out */
`;

const SubmitButton = styled.button`
  background-color: red;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  margin-top: 10px;
  border-radius: 5px;
`;

const Modal = ({ onClose, onSubmit }) => {
  const [reportMessage, setReportMessage] = useState("");

  const handleSubmit = () => {
    onSubmit(reportMessage);  // Pass the message to the parent component for Firestore handling
    setReportMessage("");
    onClose(); // Close the modal after submission
  };

  return (
    <ModalWrapper>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>Report Content</h2>
        <textarea
          placeholder="Why are you reporting this?"
          value={reportMessage}
          onChange={(e) => setReportMessage(e.target.value)}
          rows="4"
          style={{ width: "100%", padding: "10px" }}
        />
        <SubmitButton onClick={handleSubmit}>Submit Report</SubmitButton>
      </ModalContent>
    </ModalWrapper>
  );
};

export default Modal;
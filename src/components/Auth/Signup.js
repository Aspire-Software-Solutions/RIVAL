import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Form, Button, ProgressBar } from "react-bootstrap";
import HexagonBox from "../ui/HexagonBox"; 
import { displayError } from "../../utils";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const SignUp = ({ changeToLogin }) => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [verificationId, setVerificationId] = useState(null);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true); // Add state for password matching

  const inputStyle = {
    height: '32px',
    width: '60%',
    padding: '0.25rem 0.5rem',
    fontSize: '0.9rem'
  };

  const labelStyle = {
    width: '40%',
    textAlign: 'right',
    paddingRight: '10%',
    fontSize: '0.9rem'
  };

  const auth = getAuth();
  const db = getFirestore();

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

  const checkPasswordStrength = (pass) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*]/.test(pass),
    };

    setPasswordRequirements(requirements);

    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength * 20);
  };

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      return toast.error("Please enter your phone number.");
    }

    if (typeof window !== "undefined") {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => {
          console.log("reCAPTCHA solved.");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired.");
        },
      });
    }

    try {
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        `+${phoneNumber}`,
        window.recaptchaVerifier
      );
      setVerificationId(verificationId);
      setIsCodeSent(true);
      toast.success("Verification code sent to your phone.");
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
      if (typeof window !== "undefined" && window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    }
  };

  const verifyAndCreateAccount = async (e) => {
    e.preventDefault();

    if (
      !firstname ||
      !lastname ||
      !handle ||
      !email ||
      !password ||
      !verificationId ||
      !code
    ) {
      return toast.error("Please fill in all the fields and verify your phone number.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must meet all the requirements."
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      await updateProfile(user, { displayName: `${firstname} ${lastname}` });

      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        userId: user.uid,
        fullname: `${firstname} ${lastname}`,
        handle,
        avatarUrl: user.photoURL || "",
        createdAt: serverTimestamp(),
        quickieCount: 0,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        bio: "",
        location: "",
        website: "",
        bookmarks: [],
        likes: [],
      });

      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem("token", await user.getIdToken());
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success("You are signed up and logged in");
    } catch (err) {
      console.error("Error signing up:", err);
      return displayError(err);
    }
  };

  return (
    <HexagonBox backgroundColor="rgb(114, 0, 0)" textColor="white" padding="10rem 5rem">
      <h2 className="text-center mb-4" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>Sign Up</h2>
      <Form onSubmit={verifyAndCreateAccount} className="signup-form">
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>First Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter first name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
            style={inputStyle}
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Last Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter last name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
            style={inputStyle}
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Handle</Form.Label>
          <Form.Control
            type="text"
            placeholder="Choose handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            style={inputStyle}
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Phone</Form.Label>
          <PhoneInput
            country={'us'}
            value={phoneNumber}
            onChange={(phone) => setPhoneNumber(phone)}
            containerStyle={{width: '60%'}}
            inputStyle={{...inputStyle, width: '100%'}}
            dropdownStyle={{width: '260px'}}
            required
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Password</Form.Label>
          <div style={{width: '60%'}}>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{...inputStyle, width: '100%'}}
            />
            <ProgressBar now={passwordStrength} className="mt-1" style={{height: '4px'}} />
            <div className="password-requirements mt-1">
              <small className={passwordRequirements.length ? "text-success" : "text-danger"}>
                ✓ 8+ chars
              </small>
              <small className={passwordRequirements.uppercase ? "text-success" : "text-danger"}>
                ✓ Uppercase
              </small>
              <small className={passwordRequirements.lowercase ? "text-success" : "text-danger"}>
                ✓ Lowercase
              </small>
              <small className={passwordRequirements.number ? "text-success" : "text-danger"}>
                ✓ Number
              </small>
              <small className={passwordRequirements.special ? "text-success" : "text-danger"}>
                ✓ Special
              </small>
            </div>
          </div>
        </Form.Group>
        <Form.Group className="mb-2 d-flex align-items-center">
          <Form.Label style={labelStyle}>Confirm</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </Form.Group>

        <div className="d-flex justify-content-center mb-2">
          <div id="recaptcha-container" style={{ transform: 'scale(0.9)', transformOrigin: '0 0' }}></div>
        </div>

        {!isCodeSent ? (
          <div className="d-flex justify-content-center mt-3">
            <Button
              variant="primary"
              className="w-60"
              onClick={sendVerificationCode}
              style={{height: '32px', fontSize: '0.9rem', padding: '0.25rem 0.5rem'}}
              disabled={!passwordsMatch}  // Disable the button if passwords don't match
            >
              Send Verification Code
            </Button>
          </div>
        ) : (
          <>
            <Form.Group className="mb-2 d-flex align-items-center">
              <Form.Label style={labelStyle}>Code</Form.Label>
              <Form.Control
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={inputStyle}
              />
            </Form.Group>
            <div className="d-flex justify-content-center">
              <Button 
                variant="success" 
                type="submit" 
                className="w-60"
                style={{height: '32px', fontSize: '0.9rem', padding: '0.25rem 0.5rem'}}
                disabled={!passwordsMatch}  // Disable the button if passwords don't match
              >
                Verify and Sign Up
              </Button>
            </div>
          </>
        )}
        <div className="text-center mt-3 mb-15">
          <span style={{ cursor: "pointer", fontSize: '0.9rem' }} onClick={changeToLogin}>
            Already have an account? Login
          </span>
        </div>
      </Form>
    </HexagonBox>
  );
};

export default SignUp;

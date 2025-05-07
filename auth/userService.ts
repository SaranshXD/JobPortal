import { getFirestore, doc, setDoc, getDoc, updateDoc,collection,serverTimestamp} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { Alert } from "react-native";
import React from "react";
import Toast from "react-native-toast-message";

interface ProfileData {
  name: string;
  phone: string;
  location?: string;   // ✅ Optional
  resume: string;
  skills: string[];
  countryCode: string;  // ✅ Fix
  countryName: string;  // ✅ Fix
}

export const saveProfileData = async (profileData: ProfileData) => {
  if (!auth.currentUser) {
    console.error("No authenticated user found!");
    return;
  }

  const userDocRef = doc(db, "users", auth.currentUser.uid);
  await setDoc(userDocRef, { ...profileData, isProfileComplete: true }, { merge: true });

  console.log("Profile saved successfully!");
};

export interface RecruiterProfileData {
  companyName: string;
  companyWebsite?: string;
  recruiterName: string;
  companyPlace: string;
  phone: string;
  companyLogo?: string | null;
}


export const saveRecruiterProfile = async (profileData: RecruiterProfileData) => {
  if (!auth.currentUser) {
    console.error("No authenticated user found!");
    return;
  }

  const recruiterDocRef = doc(db, "recruiters", auth.currentUser.uid);
  await setDoc(recruiterDocRef, { ...profileData, isProfileComplete: true }, { merge: true });

  console.log("Recruiter profile saved successfully!");
};



/** ✅ Update Existing Recruiter Profile */
export const updateRecruiterProfile = async (profileData: Partial<RecruiterProfileData>) => {
  if (!auth.currentUser) {
    console.error("No authenticated user found!");
    return;
  }

  const recruiterDocRef = doc(db, "recruiters", auth.currentUser.uid);

  try {
    const docSnap = await getDoc(recruiterDocRef);
    if (!docSnap.exists()) {
      console.error("Recruiter profile not found!");
      return;
    }

    await updateDoc(recruiterDocRef, { ...profileData });
    console.log("Recruiter profile updated successfully!");
  } catch (error) {
    console.error("Error updating recruiter profile:", error);
  }
};

interface JobApplication {
  jobID: string;
  seekerID: string;
  recruiterID: string;
  resumeLink?: string ; 
  recruiterName:string;// Add 'string' type for resumeLink
  seekerName:string;
}

/** ✅ Submit Job Application */
export const applyForJob = async (applicationData: JobApplication) => {
  if (!auth.currentUser) {
    console.error("No authenticated user found!");
    return;
  }

  const { jobID, seekerID, recruiterID, resumeLink,recruiterName,seekerName } = applicationData;

  if (!recruiterID) {
    console.error("No recruiter ID found!");
    Alert.alert("Error", "Recruiter ID is missing.");
    return;
  }

  const applicationRef = doc(db, "applications", `${jobID}_${seekerID}`);

  try {
    // Check if the user has already applied
    const existingApplication = await getDoc(applicationRef);
    if (existingApplication.exists()) {
      console.warn("You have already applied for this job!");
      // Alert.alert("Already Applied", "You have already applied for this job can't forward your application.");
        Toast.show({
        type: 'error',
        text1: 'Already Applied!',
        text2: "You have already applied for this job can't forward your application.",
      });
      return;
    }

    // Store application data
    await setDoc(applicationRef, {
      jobID,
      seekerID,
      recruiterID,
      status: "Pending", // Initial status
      appliedAt: serverTimestamp(),
      resumeLink: resumeLink,
      recruiterName: recruiterName,
      seekerName: seekerName,
    });
    Toast.show({
      type: 'success',
      text1: 'Application Submitted!',
      text2: 'Your application was successfully sent.',
    });

    console.log("Job application submitted successfully!");
  } catch (error) {
    console.error("Error submitting job application:", error);
  }
};




































// import { getFirestore, doc, setDoc, getDoc} from "firebase/firestore";
// import { auth, db } from "../firebaseConfig";

// interface ProfileData {
//   name: string;
//   phone: string;
//   location?: string;   // ✅ Optional
//   resume: string;
//   skills: string[];
//   countryCode: string;  // ✅ Fix
//   countryName: string;  // ✅ Fix
// }

// export const saveProfileData = async (profileData: ProfileData) => {
//   if (!auth.currentUser) {
//     console.error("No authenticated user found!");
//     return;
//   }

//   const userDocRef = doc(db, "users", auth.currentUser.uid);
//   await setDoc(userDocRef, { ...profileData, isProfileComplete: true }, { merge: true });

//   console.log("Profile saved successfully!");
// };


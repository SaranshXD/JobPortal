import { createUserWithEmailAndPassword, signInWithEmailAndPassword , sendEmailVerification,sendPasswordResetEmail} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Toast from "react-native-toast-message";

// 🆕 Sign Up User with Role
export const signUpUser = async (email: string, password: string, role: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user); // ✅ Send verification email
    console.log(user.emailVerified)
    const formattedRole = role.toLowerCase();
    const collection = formattedRole === "recruiter" ? "recruiters" : "users";
     
    await setDoc(doc(db, collection, user.uid), { 
      email, 
      role: formattedRole, 
      isProfileComplete: false,
      isEmailVerified: user.emailVerified, // ✅ Store email verification status
    });

    Toast.show({
      type: "success",
      text1: "Verify Your Email!",
      text2: "Check your inbox to verify your email before logging in.",
    });

    return user;
  } catch (error: any) {
    let errorMessage = "Sign Up Failed! Something went wrong.";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email Already in Use!";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Weak Password! Must be at least 6 characters.";
    }

    Toast.show({ type: "error", text1: errorMessage });
    console.error("Error signing up:", error);

    return null;
  }
};

// 🔐 Login User and Fetch Role + Profile Status
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await user.reload();

    if (!user.emailVerified) { // ✅ Check if email is verified
      Toast.show({ type: "error", text1: "Email Not Verified!", text2: "Please check your inbox." });
      return null;
    }

    // 🔍 Fetch user data from Firestore (Job Seeker & Recruiter)
    const [userDoc, recruiterDoc] = await Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getDoc(doc(db, "recruiters", user.uid))
    ]);

    // 🏷️ Determine Role and Profile Data
    let role: "job_seeker" | "recruiter" | null = null;
    let userData = null;

    if (userDoc.exists()) {
      role = "job_seeker";
      userData = userDoc.data();
    } else if (recruiterDoc.exists()) {
      role = "recruiter";
      userData = recruiterDoc.data();
    } else {
      Toast.show({ type: "error", text1: "User Not Found!", text2: "Please sign up first." });
      return null;
    }

    const { isProfileComplete } = userData;

    const userRef = doc(db, role === "job_seeker" ? "users" : "recruiters", user.uid);
    await setDoc(userRef, { isEmailVerified: user.emailVerified }, { merge: true });

    // 🎉 Success Toast
    Toast.show({
      type: "success",
      text1: "🎉 Welcome Back!",
      text2: "Great to see you again!",
      visibilityTime: 4000,
      position: "top",
      topOffset: 50,
      bottomOffset: 40,
      swipeable: true,
    });

    return { user, role, isProfileComplete };
  } catch (error: any) {
    let errorMessage = "Something went wrong! Please try again.";

    if (error.code === "auth/invalid-credential") {
      errorMessage = "Login Failed! Invalid email or password.";
    }

    Toast.show({ type: "error", text1: errorMessage });
    console.error("Error logging in:", error);

    return null;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    Toast.show({
      type: "success",
      text1: "Password Reset Email Sent!",
      text2: "Check your inbox to reset your password.",
    });
  } catch (error: any) {
    let errorMessage = "Something went wrong. Please try again.";

    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found! Please check your email.";
    }

    Toast.show({ type: "error", text1: errorMessage });
    console.error("Error resetting password:", error);
  }
};




























// import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc, getDoc } from "firebase/firestore";
// import { auth, db } from "../firebaseConfig";
// import Toast from "react-native-toast-message";

// // 🆕 Sign Up User with Role
// export const signUpUser = async (email: string, password: string, role: string) => {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     await setDoc(doc(db, "users", user.uid), { email, role });

//     Toast.show({
//       type: "success",
//       text1: "Success!",
//       text2: "Account created successfully. You can now log in.",
//     });

//     return user;
//   } catch (error: any) {
//     if (error.code === "auth/email-already-in-use") {
//       Toast.show({ type: "error", text1: "Email Already in Use!" });
//     } else if (error.code === "auth/weak-password") {
//       Toast.show({ type: "error", text1: "Weak Password!", text2: "Must be at least 6 characters." });
//     } else {
//       Toast.show({ type: "error", text1: "Sign Up Failed!", text2: "Something went wrong." });
//     }
//     console.error("Error signing up:", error);
//     return null;
//   }
// };

// // 🔐 Login User and Fetch Role
// export const loginUser = async (email: string, password: string) => {
//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);

//     Toast.show({
//       type: "success",
//       text1: "🎉 Welcome Back!",
//       text2: "Great to see you again!",
//       visibilityTime: 4000,  // How long it stays visible
//       position: "top",      // "top" | "bottom"
//       topOffset: 50,        // Space from top (useful for not overlapping status bar)
//       bottomOffset: 40,     // Space from bottom
//       swipeable: true,      // Can be dismissed by swiping
//     });
    

//     return userCredential.user;
//   } catch (error: any) {
//     if (error.code === "auth/invalid-credential") {
//       Toast.show({ type: "error", text1: "Login Failed!", text2: "Invalid email or password." });
//     } else {
//       Toast.show({ type: "error", text1: "Something went wrong!", text2: "Please try again." });
//     }
//     console.error("Error logging in:", error);
//     return null;
//   }
// };
// //commit
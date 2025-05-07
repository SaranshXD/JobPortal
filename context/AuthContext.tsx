import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface User {
  uid: string;
  companyName: string;
  recruiterName: string
}

interface AuthContextProps {
  user: User | null;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log(currentUser.uid)
        const userDoc = await getDoc(doc(db, "recruiters", currentUser.uid));
        
        console.log(userDoc.exists())
        const companyName = userDoc.exists() ? userDoc.data().companyName : "Unknown Company";
        const recruiterName = userDoc.exists() ? userDoc.data().recruiterName : "Unknown Company";

        setUser({
          uid: currentUser.uid,
          companyName: companyName || "Unknown Company",
          recruiterName : recruiterName

        });
      } else {
        setUser(null); // Ensure user is null when logged out
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { getServerIP } from "./fetchServerIP";

export const uploadResumeAndParse = async (fileUri: string): Promise<{ skills: string[], resumeUrl: string }> => {
  try {
    const serverIP = await getServerIP(); // 🔹 Fetch latest IP dynamically


    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: "resume.pdf",
      type: "application/pdf",
    } as any);

    const response = await fetch(`${serverIP}/parse-resume`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error parsing resume");

    const { skills, resume_url } = data;

    // ✅ Store resume link in Firestore
    // if (resume_url) {
    //   await updateDoc(doc(db, "users", userId), { resumeUrl: resume_url });
    // }

    return { skills: skills || [], resumeUrl: resume_url || "" };
  } catch (error) {
    console.error("Error parsing resume:", error);
    return { skills: [], resumeUrl: "" };
  }
};












































// export const uploadResumeAndParse = async (fileUri: string): Promise<string[]> => {
//     try {
//       const formData = new FormData();
//       formData.append("file", {
//         uri: fileUri,
//         name: "resume.pdf",
//         type: "application/pdf",
//       } as any); // ✅ Fix TypeScript issue
//       console.log(formData);
  
//       const response = await fetch("http://192.168.43.218:5000/parse-resume", {
//         method: "POST",
//         body: formData,
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
  
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.error || "Error parsing resume");
  
//       return data.skills || [];
//     } catch (error) {
//       console.error("Error parsing resume:", error);
//       return [];
//     }
//   };
  
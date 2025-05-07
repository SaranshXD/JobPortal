import { db } from "../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// ✅ Function to Add a New Job Post with Expiry Time
export const addJobPost = async (
  title: string,
  company: string,
  description: string,
  skills: string[],
  location: string,
  salary: string,
  recruiterUID: string,
  recruiterName: string,
  validUntil: Date // Job expiry time
) => {
  try {
    const jobRef = await addDoc(collection(db, "job_posts"), {
      title,
      company,
      description,
      skills,
      location,
      salary,
      recruiterID: recruiterUID,
      recruiterName : recruiterName,
      timestamp: Timestamp.now(),
      validUntil: Timestamp.fromDate(validUntil), // 🔹 Store expiry time
    });

    console.log("Job posted with ID:", jobRef.id);
    return { success: true, jobId: jobRef.id };
  } catch (error) {
    console.error("Error adding job:", error);
    return { success: false, error };
  }
};

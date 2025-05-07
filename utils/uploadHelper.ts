import axios from "axios";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { getServerIP } from "./fetchServerIP";

// let API_URL = "http://192.168.43.218:5000/upload-logo"; // Flask server

export const uploadToCloudinary = async (fileUri: string) => {
  try {
    const serverIP = await getServerIP();

    const API_URL = `${serverIP}/upload-logo`; // ✅ Use dynamic IP
    // 🔹 Convert file to Blob (React Native fix)
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      console.log("File does not exist:", fileUri);
      return null;
    } 

    const formData = new FormData();

    const file = {
      uri: fileUri,
      name: "company_logo.jpg",
      type: "image/jpeg", // Ensure correct MIME type
    };

    if (Platform.OS === "ios") {
      file.uri = fileUri.replace("file://", ""); // Fix for iOS
    }

    formData.append("file", file as any); // ✅ Correct append

    console.log("Uploading file:", fileUri);

    const response = await axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Upload success:", response.data);
    return response.data.logo_url;
  } catch (error: any) {
    console.error("Backend Upload Error:", error.response?.data || error.message);
    return null;
  }
};

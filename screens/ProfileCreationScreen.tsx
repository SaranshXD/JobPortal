import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  BackHandler,
} from "react-native";
import { TextInput, Button, ProgressBar, Card, Chip } from "react-native-paper";
import PhoneInput from "react-native-phone-number-input";
import { getCountryCallingCode } from "libphonenumber-js";
import * as DocumentPicker from "expo-document-picker";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { CountryCode } from "libphonenumber-js";
import countries from "i18n-iso-countries";
import { uploadResumeAndParse } from "../utils/resumeParser";

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

type ProfileCreationScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { fromDashboard?: boolean } }, "params">;
};

type JobSeekerProfileData = {
  name: string;
  phone: string;
  countryCode: string;
  countryName: string;
  resume: string;
  skills: string[];
};

const ProfileCreationScreen = ({ navigation, route }: ProfileCreationScreenProps) => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  const fromDashboard = route.params?.fromDashboard || false;

  const phoneInputRef = useRef<PhoneInput>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [callingCode, setCallingCode] = useState("+1");
  const [countryName, setCountryName] = useState("United States");
  const [resume, setResume] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user]);

  // ✅ Only calculate completion for first-time setup
  useEffect(() => {
    if (!fromDashboard) {
      let completion = 0;
      if (name) completion += 25;
      if (phone && isValid) completion += 25;
      if (resume) completion += 25;
      if (skills.length > 0) completion += 25;
      setProfileCompletion(completion);
    }
  }, [name, phone, isValid, resume, skills, fromDashboard]);

  useEffect(() => {
    try {
      const code = getCountryCallingCode(countryCode as CountryCode);
      setCallingCode(`+${code}`);
      setCountryName(getCountryName(countryCode));
    } catch (error) {
      console.error("Error getting country details:", error);
    }
  }, [countryCode]);

  // ✅ Handle Back Navigation
  useEffect(() => {
    const backAction = () => {
      if (fromDashboard) {
        navigation.goBack();
      } else {
        navigation.navigate("Login");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [fromDashboard, navigation]);

  const getCountryName = (code: string): string => {
    return countries.getName(code, "en") || "Unknown Country";
  };

  const fetchProfileData = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      const profileRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as JobSeekerProfileData;
        setName(profileData.name || "");
        setPhone(profileData.phone || "");
        setResume(profileData.resume || "");
        setSkills(profileData.skills || []);
        setCountryCode(profileData.countryCode || "US");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCountryChange = (country: any) => {
    setCountryCode(country.cca2);
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    setIsValid(phoneInputRef.current?.isValidNumber(text) || false);
  };

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setIsUploading(true);
      const { skills: parsedSkills, resumeUrl } = await uploadResumeAndParse(result.assets[0].uri);
      setResume(resumeUrl);
      setSkills(parsedSkills);
    } catch (error) {
      console.error("Resume upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fromDashboard && (!isValid || profileCompletion < 100)) {
       alert("Complete Required Fields, Please fill all mandatory fields");
      return;
    }

    try {
      if (!user) return;
      const profileRef = doc(db, "users", user.uid);
      const profileData: Partial<JobSeekerProfileData> = {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(countryCode && { countryCode }),
        ...(countryName && { countryName }),
        ...(resume && { resume }),
        ...(skills.length > 0 && { skills }),
      };

      if (fromDashboard) {
        await updateDoc(profileRef, profileData);
        navigation.goBack();
      } else {
        await setDoc(profileRef, profileData as JobSeekerProfileData);
        navigation.replace("JobSeekerDashboard");
      }
    } catch (error) {
      console.error("Profile save error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {fromDashboard ? "Update Profile" : "Complete Your Profile"}
      </Text>

      <TextInput
        label="Full Name"
        mode="outlined"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <PhoneInput
        ref={phoneInputRef}
        defaultValue={phone}
        defaultCode="US"
        layout="first"
        onChangeFormattedText={handlePhoneChange}
        onChangeCountry={handleCountryChange}
        containerStyle={styles.phoneContainer}
        textContainerStyle={styles.phoneTextContainer}
        withShadow
      />

      <Card style={styles.countryCard}>
        <Text style={styles.countryText}>{countryName} ({callingCode})</Text>
      </Card>

      <TouchableOpacity 
        onPress={handleResumeUpload} 
        style={styles.uploadButton}
        disabled={isUploading}
      >
        <Text style={styles.uploadText}>
          {resume ? "Resume Uploaded ✅" : isUploading ? "Processing..." : "Upload Resume 📄"}
        </Text>
      </TouchableOpacity>

      {skills.length > 0 && (
        <Card style={styles.skillsCard}>
          <Card.Title title="Your Skills" titleStyle={styles.cardTitle} />
          <Card.Content>
            <FlatList
              data={skills}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Chip style={styles.chip} textStyle={styles.chipText}>{item}</Chip>
              )}
            />
          </Card.Content>
        </Card>
      )}

      {!fromDashboard && (
        <>
          <ProgressBar 
            progress={profileCompletion / 100} 
            color="#4CAF50"
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            Profile {profileCompletion}% Complete
          </Text>
        </>
      )}

      <Button
        mode="contained"
        onPress={handleSaveProfile}
        loading={isUploading}
        style={styles.button}
        disabled={!fromDashboard && profileCompletion < 100}
      >
        <Text>{fromDashboard ? "Save Changes" : "Complete Profile"}</Text>
      
      </Button>
    </View>
  );
};

// Keep the same styles as previous version
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: { 
    marginBottom: 15, 
    backgroundColor: "#fff" 
  },
  phoneContainer: { 
    width: "100%", 
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  phoneTextContainer: { 
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  countryCard: {
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  countryText: { 
    fontSize: 16, 
    fontWeight: "500",
    color: "#2196F3",
  },
  uploadButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
  skillsCard: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  cardTitle: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  chip: {
    margin: 4,
    backgroundColor: "#E3F2FD",
  },
  chipText: {
    color: "#2196F3",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  progressText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 5,
  },
});

export default ProfileCreationScreen;

// import React, { useState, useEffect } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
// import { TextInput, Button, ProgressBar, Card, Chip } from "react-native-paper";
// import * as DocumentPicker from "expo-document-picker";
// import { uploadResumeAndParse } from "../utils/resumeParser"; // ✅ AI-based Resume Parsing
// import { saveProfileData } from "../auth/userService";
// import { StackNavigationProp } from "@react-navigation/stack";

// type ProfileCreationScreenProps = {
//   navigation: StackNavigationProp<any>;
// };

// const ProfileCreationScreen = ({ navigation }: ProfileCreationScreenProps) => {
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [location, setLocation] = useState("");
//   const [resume, setResume] = useState<string>("");
//   const [skills, setSkills] = useState<string[]>([]);
//   const [profileCompletion, setProfileCompletion] = useState(0);

//   // 🔥 Dynamically update profile completion
//   useEffect(() => {
//     let completion = 0;
//     if (name) completion += 25;
//     if (phone) completion += 25;
//     if (location) completion += 25;
//     if (resume) completion += 25;
//     setProfileCompletion(completion);
//   }, [name, phone, location, resume]);

//   // ✅ Handle Resume Upload
//   const handleResumeUpload = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
//       });

//       if (result.canceled || !result.assets || result.assets.length === 0) {
//         console.log("Resume upload canceled.");
//         return;
//       }

//       const fileUri = result.assets[0].uri;
//       console.log("Selected file:", fileUri);

//       // 🔹 Upload & Parse Resume for Skills
//       const parsedSkills = await uploadResumeAndParse(fileUri);
//       setResume(fileUri);
//       setSkills(parsedSkills);
//     } catch (error) {
//       console.error("Error uploading resume:", error);
//     }
//   };

//   // ✅ Save Profile Data & Navigate
//   const handleSaveProfile = async () => {
//     try {
//       await saveProfileData({ name, phone, location, resume, skills });
//       navigation.replace("JobSeekerDashboard"); // 🚀 Redirect to Dashboard
//     } catch (error) {
//       console.error("Error saving profile:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Complete Your Profile</Text>
//       <TextInput label="Full Name" mode="outlined" value={name} onChangeText={setName} style={styles.input} />
//       <TextInput label="Phone Number" mode="outlined" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.input} />
//       <TextInput label="Location" mode="outlined" value={location} onChangeText={setLocation} style={styles.input} />

//       {/* Resume Upload */}
//       <TouchableOpacity onPress={handleResumeUpload} style={styles.uploadButton}>
//         <Text style={styles.uploadText}>{resume ? "Resume Uploaded ✅" : "Upload Resume 📄"}</Text>
//       </TouchableOpacity>

//       {/* Extracted Skills in a Beautiful Card View */}
//       {skills.length > 0 && (
//         <Card style={styles.skillsCard}>
//           <Card.Title title="Extracted Skills" subtitle="AI-Powered Resume Parsing" titleStyle={styles.cardTitle} />
//           <Card.Content>
//             <FlatList
//               data={skills}
//               keyExtractor={(item, index) => index.toString()}
//               numColumns={2} // Show skills in two columns
//               renderItem={({ item }) => (
//                 <Chip style={styles.chip} textStyle={styles.chipText}>
//                   {item}
//                 </Chip>
//               )}
//             />
//           </Card.Content>
//         </Card>
//       )}

//       {/* Profile Completion Progress */}
//       <ProgressBar progress={profileCompletion / 100} style={styles.progressBar} color="#4CAF50" />
//       <Text style={styles.progressText}>Profile {profileCompletion}% Complete</Text>

//       {/* Save Profile Button */}
//       <Button mode="contained" onPress={handleSaveProfile} disabled={profileCompletion < 100} style={styles.button}>
//         Save & Continue
//       </Button>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f9f9f9" },
//   title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
//   input: { marginBottom: 15, backgroundColor: "#fff" },
//   uploadButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 15 },
//   uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   skillsCard: { marginTop: 20, backgroundColor: "#fff", borderRadius: 10, padding: 15, elevation: 3 },
//   cardTitle: { fontWeight: "bold", fontSize: 18, color: "#007bff" },
//   chip: { margin: 5, backgroundColor: "#E0F7FA", borderRadius: 20 },
//   chipText: { fontSize: 14, fontWeight: "600", color: "#00796B" },
//   progressBar: { height: 10, marginBottom: 10, borderRadius: 5 },
//   progressText: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 10 },
//   button: { marginVertical: 10, backgroundColor: "#4CAF50" },
// });

// export default ProfileCreationScreen;

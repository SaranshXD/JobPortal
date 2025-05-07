import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { TextInput, Button, ProgressBar, Avatar } from "react-native-paper";
import PhoneInput from "react-native-phone-number-input";
import * as ImagePicker from "expo-image-picker";
import { getCountryCallingCode } from "libphonenumber-js";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { uploadToCloudinary } from "../utils/uploadHelper";
import {
  saveRecruiterProfile,
  updateRecruiterProfile,
} from "../auth/userService"; // ✅ Added update function
import { CountryCode } from "libphonenumber-js";
import { RecruiterProfileData } from "../auth/userService";

type RecruiterProfileScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { fromDashboard?: boolean } }, "params">; // New Param
};

const RecruiterProfileScreen = ({
  navigation,
  route,
}: RecruiterProfileScreenProps) => {
  const phoneInputRef = useRef<PhoneInput>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [callingCode, setCallingCode] = useState("+1");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyPlace, setCompanyPlace] = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fromDashboard = route.params?.fromDashboard || false; // Check where user came from
  if (fromDashboard === false) {
    useEffect(() => {
      let completion = 0;
      if (companyName) completion += 25;
      if (recruiterName) completion += 25;
      if (companyPlace) completion += 25;
      if (phone && isValid) completion += 25;
      setProfileCompletion(completion);
    }, [companyName, recruiterName, phone, isValid, companyLogo, companyPlace]);
  }
  useEffect(() => {
    try {
      const code = getCountryCallingCode(countryCode as CountryCode);
      setCallingCode(`+${code}`);
    } catch (error) {
      console.error("Error getting calling code:", error);
    }
  }, [countryCode]);

  // ✅ Handle Back Navigation Correctly
  useEffect(() => {
    const backAction = () => {
      if (fromDashboard) {
        navigation.goBack(); // ✅ Go back to Dashboard if editing profile
      } else {
        navigation.navigate("Login"); // ✅ Use navigate instead of replace
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [fromDashboard, navigation]);

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    const isValidNumber = phoneInputRef.current?.isValidNumber(text) || false;
    setIsValid(isValidNumber);
  };

  const handleLogoUpload = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "livePhotos", "videos"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setIsUploading(true);

        const uploadedUrl = await uploadToCloudinary(uri);
        if (uploadedUrl) {
          setCompanyLogo(uploadedUrl);
        } else {
          alert("Failed to upload image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Save Profile (Create or Update)
  const handleSaveProfile = async () => {
    if (!fromDashboard && !isValid) {
      alert("Invalid phone number for selected country!");
      return;
    }
  
    try {
      // ✅ Create an object with only NON-EMPTY fields
      const profileData: Partial<RecruiterProfileData> = {};
  
      if (companyName.trim()) profileData.companyName = companyName;
      if (companyWebsite.trim()) profileData.companyWebsite = companyWebsite;
      if (recruiterName.trim()) profileData.recruiterName = recruiterName;
      if (companyPlace.trim()) profileData.companyPlace = companyPlace;
      if (phone.trim()) profileData.phone = phone;
      if (companyLogo) profileData.companyLogo = companyLogo;
  
      // ✅ Ensure at least one field is updated
      if (Object.keys(profileData).length === 0) {
        alert("No changes detected!");
        return;
      }
  
      if (fromDashboard) {
        // ✅ Updates only non-empty fields
        await updateRecruiterProfile(profileData);
        navigation.goBack();
      } else {
        // ✅ Ensure required fields exist before saving
        const completeProfileData: RecruiterProfileData = {
          companyName: companyName.trim() || "",  // Ensure a default value
          companyWebsite: companyWebsite.trim() || "",
          recruiterName: recruiterName.trim() || "",
          companyPlace: companyPlace.trim() || "",
          phone: phone.trim() || "",
          companyLogo: companyLogo || null,
        };
      
        await saveRecruiterProfile(completeProfileData);
        navigation.replace("RecruiterDashboardScreen");
      }
      
    } catch (error) {
      console.error("Error saving recruiter profile:", error);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Recruiter Profile</Text>
      <TextInput
        label="Company Name"
        mode="outlined"
        value={companyName}
        onChangeText={setCompanyName}
        style={styles.input}
          textColor="#64748b"
           outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5"
      />
      <TextInput
        label="Company Website"
        mode="outlined"
        value={companyWebsite}
        onChangeText={setCompanyWebsite}
        style={styles.input}
        textColor="#64748b"
        outlineColor="#e2e8f0"
       activeOutlineColor="#4f46e5"
      />
      <TextInput
        label="Your Name"
        mode="outlined"
        value={recruiterName}
        onChangeText={setRecruiterName}
        style={styles.input}
        textColor="#64748b"
        outlineColor="#e2e8f0"
       activeOutlineColor="#4f46e5"
      />
      <TextInput
        label="City"
        mode="outlined"
        value={companyPlace}
        onChangeText={setCompanyPlace}
        style={styles.input}
        textColor="#64748b"
        outlineColor="#e2e8f0"
       activeOutlineColor="#4f46e5"
      />
      <PhoneInput
        ref={phoneInputRef}
        defaultValue={phone}
        defaultCode="IN"
        layout="first"
        onChangeFormattedText={handlePhoneChange}
        onChangeCountry={(country) => setCountryCode(country.cca2)}
        containerStyle={styles.phoneContainer}
        textContainerStyle={styles.phoneTextContainer}
        withShadow
      />
      <Text style={styles.callingCodeText}>Calling Code: {callingCode}</Text>
      <TouchableOpacity
        onPress={handleLogoUpload}
        style={styles.uploadButton}
        disabled={isUploading}
      >
        {companyLogo ? (
          <Avatar.Image
            source={{ uri: companyLogo }}
            size={100}
            style={styles.avatar}
          />
        ) : (
          <Text style={styles.uploadText}>
            {isUploading ? "Uploading..." : "Upload Company Logo 📷"}
          </Text>
        )}
      </TouchableOpacity>
      <ProgressBar
        progress={profileCompletion / 100}
        style={[styles.progressBar, fromDashboard && { display: "none" }]} // ✅ Hide if fromDashboard
        color="#4CAF50"
      />
      <Text style={[styles.progressText, fromDashboard && { display: "none" }]}>
        Profile {profileCompletion}% Complete
      </Text>
      {/* // ✅ Remove progress restriction when updating profile */}
      <Button
        mode="contained"
        onPress={handleSaveProfile}
        disabled={!fromDashboard && profileCompletion < 100} // ✅ Only restrict on first-time setup
        style={styles.button}
      >
        <Text>Save & Continue</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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
  input: { marginBottom: 15, backgroundColor: "#fff" },
  phoneContainer: {
    marginBottom: 15,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  phoneTextContainer: { borderRadius: 10, backgroundColor: "#fff" },
  callingCodeText: {
    fontSize: 16,
    color: "#007bff",
    textAlign: "center",
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  avatar: { alignSelf: "center", backgroundColor: "#ddd", marginBottom: 10 },
  progressBar: { height: 10, marginBottom: 10, borderRadius: 5 },
  progressText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  button: { marginVertical: 10, backgroundColor: "#4CAF50" },
});

export default RecruiterProfileScreen;

// import React, { useState, useEffect, useRef } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from "react-native";
// import { TextInput, Button, ProgressBar, Avatar } from "react-native-paper";
// import PhoneInput from "react-native-phone-number-input";
// import * as ImagePicker from "expo-image-picker";
// import { getCountryCallingCode } from "libphonenumber-js";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RouteProp } from "@react-navigation/native";
// import { uploadToCloudinary } from "../utils/uploadHelper";
// import { saveRecruiterProfile } from "../auth/userService";
// import { CountryCode } from "libphonenumber-js";

// type RecruiterProfileScreenProps = {
//   navigation: StackNavigationProp<any>;
//   route: RouteProp<{ params: { fromDashboard?: boolean } }, "params">; // New Param
// };

// const RecruiterProfileScreen = ({ navigation, route }: RecruiterProfileScreenProps) => {
//   const phoneInputRef = useRef<PhoneInput>(null);
//   const [companyName, setCompanyName] = useState("");
//   const [companyWebsite, setCompanyWebsite] = useState("");
//   const [recruiterName, setRecruiterName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [countryCode, setCountryCode] = useState("US");
//   const [callingCode, setCallingCode] = useState("+1");
//   const [companyLogo, setCompanyLogo] = useState<string | null>(null);
//   const [companyPlace, setCompanyPlace] = useState("");
//   const [profileCompletion, setProfileCompletion] = useState(0);
//   const [isValid, setIsValid] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);

//   const fromDashboard = route.params?.fromDashboard || false; // Check where user came from

//   useEffect(() => {
//     let completion = 0;
//     if (companyName) completion += 25;
//     if (recruiterName) completion += 25;
//     if (companyPlace) completion += 25;
//     if (phone && isValid) completion += 25;
//     setProfileCompletion(completion);
//   }, [companyName, recruiterName, phone, isValid, companyLogo, companyPlace]);

//   useEffect(() => {
//     try {
//       const code = getCountryCallingCode(countryCode as CountryCode);
//       setCallingCode(`+${code}`);
//     } catch (error) {
//       console.error("Error getting calling code:", error);
//     }
//   }, [countryCode]);

//   // ✅ Handle Back Navigation Correctly
//   useEffect(() => {
//     const backAction = () => {
//       if (fromDashboard) {
//         navigation.goBack(); // ✅ Go back to Dashboard if editing profile
//       } else {
//         navigation.replace("Login"); // ✅ Go back to Login if first-time setup
//       }
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
//     return () => backHandler.remove();
//   }, [fromDashboard, navigation]);

//   const handlePhoneChange = (text: string) => {
//     setPhone(text);
//     const isValidNumber = phoneInputRef.current?.isValidNumber(text) || false;
//     setIsValid(isValidNumber);
//   };

//   const handleLogoUpload = async () => {
//     try {
//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ["images", "livePhotos", "videos"],
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       if (!result.canceled && result.assets.length > 0) {
//         const uri = result.assets[0].uri;
//         setIsUploading(true);

//         const uploadedUrl = await uploadToCloudinary(uri);
//         if (uploadedUrl) {
//           setCompanyLogo(uploadedUrl);
//         } else {
//           alert("Failed to upload image. Please try again.");
//         }
//       }
//     } catch (error) {
//       console.error("Error uploading logo:", error);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleSaveProfile = async () => {
//     if (!isValid) {
//       alert("Invalid phone number for selected country!");
//       return;
//     }

//     try {
//       await saveRecruiterProfile({
//         companyName,
//         companyWebsite,
//         recruiterName,
//         companyPlace,
//         phone,
//         companyLogo,
//       });

//       navigation.replace("RecruiterDashboardScreen");
//     } catch (error) {
//       console.error("Error saving recruiter profile:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Complete Your Recruiter Profile</Text>
//       <TextInput label="Company Name" mode="outlined" value={companyName} onChangeText={setCompanyName} style={styles.input} />
//       <TextInput label="Company Website" mode="outlined" value={companyWebsite} onChangeText={setCompanyWebsite} style={styles.input} />
//       <TextInput label="Your Name" mode="outlined" value={recruiterName} onChangeText={setRecruiterName} style={styles.input} />
//       <TextInput label="City" mode="outlined" value={companyPlace} onChangeText={setCompanyPlace} style={styles.input} />

//       <PhoneInput
//         ref={phoneInputRef}
//         defaultValue={phone}
//         defaultCode="IN"
//         layout="first"
//         onChangeFormattedText={handlePhoneChange}
//         onChangeCountry={(country) => setCountryCode(country.cca2)}
//         containerStyle={styles.phoneContainer}
//         textContainerStyle={styles.phoneTextContainer}
//         withShadow
//       />

//       <Text style={styles.callingCodeText}>Calling Code: {callingCode}</Text>

//       <TouchableOpacity onPress={handleLogoUpload} style={styles.uploadButton} disabled={isUploading}>
//         {companyLogo ? (
//           <Avatar.Image source={{ uri: companyLogo }} size={100} style={styles.avatar} />
//         ) : (
//           <Text style={styles.uploadText}>{isUploading ? "Uploading..." : "Upload Company Logo 📷"}</Text>
//         )}
//       </TouchableOpacity>

//       <ProgressBar progress={profileCompletion / 100} style={styles.progressBar} color="#4CAF50" />
//       <Text style={styles.progressText}>Profile {profileCompletion}% Complete</Text>

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
//   phoneContainer: { marginBottom: 15, width: "100%", borderRadius: 10, backgroundColor: "#fff" },
//   phoneTextContainer: { borderRadius: 10, backgroundColor: "#fff" },
//   callingCodeText: { fontSize: 16, color: "#007bff", textAlign: "center", marginBottom: 10 },
//   uploadButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 15 },
//   uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   avatar: { alignSelf: "center", backgroundColor: "#ddd", marginBottom: 10 },
//   progressBar: { height: 10, marginBottom: 10, borderRadius: 5 },
//   progressText: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 10 },
//   button: { marginVertical: 10, backgroundColor: "#4CAF50" },
// });

// export default RecruiterProfileScreen;

// import React, { useState, useEffect, useRef } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
// import { TextInput, Button, ProgressBar, Avatar } from "react-native-paper";
// import PhoneInput from "react-native-phone-number-input";
// import * as ImagePicker from "expo-image-picker";
// import { getCountryCallingCode } from "libphonenumber-js";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { uploadImage } from "../utils/uploadHelper";
// import { saveRecruiterProfile } from "../auth/userService";
// import { CountryCode } from "libphonenumber-js";

// type RecruiterProfileScreenProps = {
//   navigation: StackNavigationProp<any>;
// };

// const RecruiterProfileScreen = ({ navigation }: RecruiterProfileScreenProps) => {
//   const phoneInputRef = useRef<PhoneInput>(null);
//   const [companyName, setCompanyName] = useState("");
//   const [companyWebsite, setCompanyWebsite] = useState("");
//   const [recruiterName, setRecruiterName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [countryCode, setCountryCode] = useState("US");
//   const [callingCode, setCallingCode] = useState("+1");
//   const [companyLogo, setCompanyLogo] = useState<string | null>(null);
//   const [profileCompletion, setProfileCompletion] = useState(0);
//   const [isValid, setIsValid] = useState(false);
//   const [companyPlace, setCompanyPlace] = useState("");

//   useEffect(() => {
//     let completion = 0;
//     if (companyName) completion += 25;
//     if (recruiterName) completion += 25;
//     if (companyPlace) completion += 25;
//     if (phone && isValid) completion += 25;
//     // if (companyLogo) completion += ;
//     setProfileCompletion(completion);
//   }, [companyName, recruiterName, phone, isValid, companyLogo,companyPlace]);

//   useEffect(() => {
//     try {
//       const code = getCountryCallingCode(countryCode as CountryCode);
//       setCallingCode(`+${code}`);
//     } catch (error) {
//       console.error("Error getting calling code:", error);
//     }
//   }, [countryCode]);

//   const handlePhoneChange = (text: string) => {
//     setPhone(text);
//     const isValidNumber = phoneInputRef.current?.isValidNumber(text) || false;
//     setIsValid(isValidNumber);
//   };

//   const handleLogoUpload = async () => {
//     try {
//        let result = await ImagePicker.launchImageLibraryAsync({
//     mediaTypes: ImagePicker.MediaType.IMAGE, // ✅ Use MediaType instead of MediaTypeOptions
//     allowsEditing: true,
//     aspect: [4, 3],
//     quality: 1,
//       });

//       if (!result.canceled && result.assets.length > 0) {
//         const uri = result.assets[0].uri;
//         const uploadedUrl = await uploadImage(uri);
//         setCompanyLogo(uploadedUrl);
//       }
//     } catch (error) {
//       console.error("Error uploading logo:", error);
//     }
//   };

//   const handleSaveProfile = async () => {
//     if (!isValid) {
//       alert("Invalid phone number for selected country!");
//       return;
//     }

//     try {
//       await saveRecruiterProfile({
//         companyName,
//         companyWebsite,
//         recruiterName,
//         companyPlace,
//         phone,
//         companyLogo,
//       });

//       navigation.replace("RecruiterDashboard");
//     } catch (error) {
//       console.error("Error saving recruiter profile:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Complete Your Recruiter Profile</Text>
//       <TextInput label="Company Name" mode="outlined" value={companyName} onChangeText={setCompanyName} style={styles.input} />
//       <TextInput label="Company Website" mode="outlined" value={companyWebsite} onChangeText={setCompanyWebsite} style={styles.input} />
//       <TextInput label="Your Name" mode="outlined" value={recruiterName} onChangeText={setRecruiterName} style={styles.input} />
//       <TextInput label="City" mode="outlined" value={companyPlace} onChangeText={setCompanyPlace} style={styles.input} />

//       <PhoneInput
//         ref={phoneInputRef}
//         defaultValue={phone}
//         defaultCode="IN"
//         layout="first"
//         onChangeFormattedText={handlePhoneChange}
//         onChangeCountry={(country) => setCountryCode(country.cca2)}
//         containerStyle={styles.phoneContainer}
//         textContainerStyle={styles.phoneTextContainer}
//         withShadow
//       />

//       <Text style={styles.callingCodeText}>Calling Code: {callingCode}</Text>

//       <TouchableOpacity onPress={handleLogoUpload} style={styles.uploadButton}>
//         {companyLogo ? (
//           <Avatar.Image source={{ uri: companyLogo }} size={100} style={styles.avatar} />
//         ) : (
//           <Text style={styles.uploadText}>Upload Company Logo 📷</Text>
//         )}
//       </TouchableOpacity>

//       <ProgressBar progress={profileCompletion / 100} style={styles.progressBar} color="#4CAF50" />
//       <Text style={styles.progressText}>Profile {profileCompletion}% Complete</Text>

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
//   phoneContainer: { marginBottom: 15, width: "100%", borderRadius: 10, backgroundColor: "#fff" },
//   phoneTextContainer: { borderRadius: 10, backgroundColor: "#fff" },
//   callingCodeText: { fontSize: 16, color: "#007bff", textAlign: "center", marginBottom: 10 },
//   uploadButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 15 },
//   uploadText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
//   avatar: { alignSelf: "center", backgroundColor: "#ddd", marginBottom: 10 },
//   progressBar: { height: 10, marginBottom: 10, borderRadius: 5 },
//   progressText: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 10 },
//   button: { marginVertical: 10, backgroundColor: "#4CAF50" },
// });

// export default RecruiterProfileScreen;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  // TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { addJobPost } from "../auth/jobService";
import { useAuth } from "../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { TextInput } from "react-native-paper";

type JobPostingScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, any>; // To receive jobId if editing
};

const JobPostingScreen = ({ navigation, route }: JobPostingScreenProps) => {
  const { user } = useAuth();
  const jobId = route.params?.jobId || null; // Check if editing an existing job

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [validUntil, setValidUntil] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(jobId ? true : false); // Show loader if editing

  // ✅ Fetch Job Details if Editing
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const jobRef = doc(getFirestore(), "job_posts", jobId);
      const jobSnap = await getDoc(jobRef);

      if (jobSnap.exists()) {
        const jobData = jobSnap.data();
        setTitle(jobData.title);
        setDescription(jobData.description);
        setSkills(jobData.skills.join(", "));
        setLocation(jobData.location);
        setSalary(jobData.salary);
        setValidUntil(jobData.validUntil.toDate());
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      Alert.alert("Error", "Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Back Navigation
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const normalizeString = (str: string) => {
    return str
      .trim()
      .replace(/\u0000/g, "") // ❌ Remove NULL character
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // ❌ Remove Zero-Width, Non-Breaking Spaces
      .replace(/\s+/g, " ") // ✅ Convert multiple spaces to single space
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // ✅ Convert to Title Case
  };

  // ✅ Handle Job Posting/Updating
  const handleSubmitJob = async () => {
    if (!user) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }
    console.log(user.recruiterName)

    if (!title.trim() || !description.trim() || !skills.trim() || !location.trim() || !salary.trim()) {
      Alert.alert("Error", "Please fill all fields properly!");
      return;
    }

    const skillArray = skills.split(",").map((s) => normalizeString(s));

    try {
      if (jobId) {
        // 🔹 Update Existing Job
        const jobRef = doc(getFirestore(), "job_posts", jobId);
        await updateDoc(jobRef, {
          title,
          description,
          skills: skillArray,
          location,
          salary,
          validUntil,
        });
        Alert.alert("Success", "Job updated successfully!");
      } else {
        // 🔹 Post New Job
        const result = await addJobPost(
          title,
          user.companyName || "Unknown Company",
          description,
          skillArray,
          location,
          salary,
          user.uid,
          user.recruiterName,
          validUntil
        );

        if (result.success) {
          Alert.alert("Success", "Job posted successfully!");
          resetForm();
        } else {
          Alert.alert("Error", "Failed to post job. Try again!");
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error submitting job:", error);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  // 🔹 Reset Form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSkills("");
    setLocation("");
    setSalary("");
    setValidUntil(new Date());
  };

  // 🔹 Handle Date Change
  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setValidUntil(selectedDate);
    }
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{jobId ? "Edit Job" : "Post a New Job"}</Text>

      {/* 🔹 Job Title */}
      <TextInput placeholder="Job Title" value={title} onChangeText={setTitle} style={styles.input}   textColor="#64748b"
           outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5" />

      {/* 🔹 Job Description */}
      <TextInput
        placeholder="Job Description"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 100 }]}
          textColor="#64748b"
           outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5"
        multiline
      />

      {/* 🔹 Required Skills */}
      <TextInput
        placeholder="Required Skills (comma separated)"
        value={skills}
        onChangeText={setSkills}
        style={styles.input}
        textColor="#64748b"
        outlineColor="#e2e8f0"
       activeOutlineColor="#4f46e5"
      />

      {/* 🔹 Location */}
      <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input}   textColor="#64748b"
           outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5" />

      {/* 🔹 Salary */}
      <TextInput placeholder="Salary Range" value={salary} onChangeText={setSalary} style={styles.input}   textColor="#64748b"
           outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5" />

      {/* 🔹 Job Expiry Date */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text style={styles.dateText}>Expiry Date: {validUntil.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={validUntil}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      {/* 🔹 Submit Button */}
      <TouchableOpacity style={styles.postButton} onPress={handleSubmitJob}>
        <Text style={styles.postButtonText}>{jobId ? "Update Job" : "Post Job"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  datePicker: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  postButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default JobPostingScreen;

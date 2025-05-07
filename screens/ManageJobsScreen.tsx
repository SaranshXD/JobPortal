import React, { useEffect, useState ,useCallback,useRef} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
} from "react-native";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native"; // ✅ Import useFocusEffect
import Toast from "react-native-toast-message"; // ✅ Import Toast
import AlertPro from "react-native-alert-pro";



type Job = {
  id: string;
  title: string;
  location: string;
  validUntil: Date;
  status: "Active" | "Closed";
};

type ManageJobsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ManageJobsScreen = ({ navigation }: ManageJobsScreenProps) => {
    const alertRef = useRef<AlertPro | null>(null); // ✅ FIXED TYPE ISSUE
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null); // ✅ Store job ID for deletion

  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // ✅ Handle Back Navigation
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );
  // ✅ Fetch Jobs When User is Available
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    const db = getFirestore();
    const jobsRef = collection(db, "job_posts");
    const q = query(jobsRef, where("recruiterID", "==", user.uid));

    try {
      const querySnapshot = await getDocs(q);
      const jobList: Job[] = querySnapshot.docs.map((doc) => {
        const jobData = doc.data();
        const validUntil = jobData.validUntil.toDate(); // Firestore Timestamp to JS Date

        return {
          id: doc.id,
          title: jobData.title,
          location: jobData.location,
          validUntil,
          status: validUntil > new Date() ? "Active" : "Closed", // ✅ Determine status dynamically
        };
      });

      setJobs(jobList);
      setFilteredJobs(jobList);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteJob = (jobId: string) => {
    setSelectedJobId(jobId); // Store job ID
    alertRef.current?.open(); // ✅ Open AlertPro dialog
  };
  
  // ✅ Confirm Deletion
  const confirmDeleteJob = async () => {
    if (!selectedJobId) return;
  
    try {
      await deleteDoc(doc(getFirestore(), "job_posts", selectedJobId));
  
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== selectedJobId));
      setFilteredJobs((prevFiltered) => prevFiltered.filter((job) => job.id !== selectedJobId));
  
      // ✅ Show Success Toast
      Toast.show({
        type: "success",
        text1: "Job Deleted ✅",
        text2: "The job has been removed successfully.",
        visibilityTime: 3000,
        autoHide: true,
      });
  
      alertRef.current?.close();
    } catch (error) {
      console.error("Error deleting job:", error);
  
      // ❌ Show Error Toast
      Toast.show({
        type: "error",
        text1: "Deletion Failed ❌",
        text2: "Something went wrong. Please try again.",
        visibilityTime: 3000,
        autoHide: true,
      });
  
      alertRef.current?.close();
    }
  };
  

  // ✅ Handle Search
  const handleSearch = (text: string) => {
    setSearchText(text);
    setFilteredJobs(jobs.filter((job) => job.title.toLowerCase().includes(text.toLowerCase())));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Manage Jobs</Text>

      {/* 🔹 Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* 🔹 Job List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : filteredJobs.length === 0 ? (
        <Text style={styles.noJobsText}>No jobs found.</Text>
      ) : (
        filteredJobs.map((job) => (
          <Card key={job.id} style={[styles.jobCard, { borderLeftColor: job.status === "Active" ? "#10b981" : "#ef4444" }]}>
  <View style={styles.cardContent}>
    <Text style={styles.jobTitle}>{job.title}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="map-marker" size={16} color="#64748b" />
      <Text style={styles.jobLocation}>{job.location}</Text>
    </View>
    <Text style={[styles.jobStatus, job.status === "Active" ? styles.activeStatus : styles.closedStatus]}>
      {job.status.toUpperCase()}
    </Text>
  </View>
  <View style={styles.cardActions}>
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => navigation.navigate("JobPostingScreen", { jobId: job.id })}
    >
      <Icon name="pencil" size={18} color="#fff" />
      <Text style={styles.buttonText}>Edit</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteJob(job.id)}>
      <Icon name="trash-can-outline" size={18} color="#fff" />
      <Text style={styles.buttonText}>Delete</Text>
    </TouchableOpacity>
  </View>

  {/* Delete Confirmation Popup - Remain unchanged */}
  <AlertPro
    ref={alertRef}
    title="Confirm Deletion"
    message="Are you sure you want to delete this job? This action cannot be undone."
    showCancel={true}
    textCancel="Cancel"
    textConfirm="Delete"
    customStyles={{
      mask: { backgroundColor: "rgba(0,0,0,0.5)" },
      container: { borderRadius: 10 },
      title: { fontSize: 20, fontWeight: "bold" },
      message: { fontSize: 16 },
      buttonCancel: { backgroundColor: "#ddd" },
      buttonConfirm: { backgroundColor: "red" },
    }}
    onCancel={() => alertRef.current?.close()}
    onConfirm={confirmDeleteJob}
  />
</Card>
        ))
      )}
    </ScrollView>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 25,
    textAlign: "center",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  jobCard: {
    backgroundColor: "#FFF",
    marginBottom: 16,
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 6,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
    marginTop:6
  },
  jobStatus: {
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    textAlign: "center",
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
  },
  activeStatus: {
    borderColor: "#10b981",
    color: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  closedStatus: {
    borderColor: "#ef4444",
    color: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  editButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noJobsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 40,
    fontWeight: "500",
  },
  cardContent: {
    padding: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
});

export default ManageJobsScreen;


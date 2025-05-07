// screens/JobDetailsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { Card, Chip } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { auth, db } from "@/firebaseConfig";
import Toast from 'react-native-toast-message';
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { applyForJob } from "@/auth/userService";

type RootStackParamList = {
  JobDetailsScreen: { jobId: string };    // <— only the ID
};

type Props = {
  route: RouteProp<RootStackParamList, "JobDetailsScreen">;
};

type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  recruiterID: string;
  recruiterName: string;
  salary: string;
  skills: string[];
  validUntil: Date; // now a JS Date in local state
};

export default function JobDetailsScreen({ route }: Props) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { jobId } = route.params;
  const userId = auth.currentUser?.uid;

  // Local state for the fetched job
  const [job, setJob] = useState<Job | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Resume + Save state
  const [resumeLink, setResumeLink] = useState<string | null>(null);
  const [seekerName, setSeekerName] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  // Fetch the job document by ID
  useEffect(() => {
    (async () => {
      try {
        const jobSnap = await getDoc(doc(db, "job_posts", jobId));
        if (!jobSnap.exists()) throw new Error("Job not found");
        const data = jobSnap.data();
        setJob({
          id: jobSnap.id,
          title: data.title,
          company: data.company,
          description: data.description,
          location: data.location,
          recruiterID: data.recruiterID,
          recruiterName: data.recruiterName,
          salary: data.salary,
          skills: data.skills,
          validUntil: data.validUntil.toDate(), // convert Firestore Timestamp
        });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load job.");
        navigation.goBack();
      } finally {
        setDataLoading(false);
      }
    })();
  }, [jobId]);

  // Fetch resume link & check saved state once job + user are known
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Resume
      const uSnap = await getDoc(doc(db, "users", userId));
      if (uSnap.exists()) {
        const d = uSnap.data();
        setResumeLink(d.resume || null);
        setSeekerName(d.name || "");
      }
      // Saved?
      const q = query(
        collection(db, "saved_jobs"),
        where("userId", "==", userId),
        where("jobId", "==", jobId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsSaved(true);
        setSavedDocId(snap.docs[0].id);
      }
    })();
  }, [userId, jobId]);

  // Back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [navigation]);

  // Apply
  const handleApply = async () => {
    if (!userId || !job) return;
    if (!resumeLink) {
      Toast.show({
        type: 'error',
        text1: 'Resume Required',
        text2: 'Upload a resume first.',
      });
      return;
    }
    try {
      await applyForJob({
        jobID: job.id,
        seekerID: userId,
        seekerName,
        recruiterID: job.recruiterID,
        resumeLink,
        recruiterName: job.recruiterName,
      });
      // Toast.show({
      //   type: 'success',
      //   text1: 'Application Submitted!',
      //   text2: 'Your application was successfully sent.',
      // });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not submit application.',
      });
    }
  };

  // Save / Unsave
  const toggleSave = async () => {
    if (!userId || !job) return;
    try {
      if (isSaved && savedDocId) {
        await deleteDoc(doc(db, "saved_jobs", savedDocId));
        setIsSaved(false);
        setSavedDocId(null);
        Toast.show({
          type: 'success',
          text1: 'Job Removed',
          text2: 'Removed from saved list',
        });
      } else {
        const ref = await addDoc(collection(db, "saved_jobs"), {
          userId,
          jobId: job.id,
          savedAt: serverTimestamp(),
        });
        setIsSaved(true);
        setSavedDocId(ref.id);
        Toast.show({
          type: 'success',
          text1: 'Job Saved',
          text2: 'Added to your saved list',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Operation Failed',
        text2: 'Could not update saved status.',
      });
    }
  };

  // Loading state
  if (dataLoading || !job) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Render
  return (
    <View style={styles.container}>
      <Card style={styles.detailCard}>
        <Card.Title
          title={job.title}
          titleStyle={styles.jobTitle}
          subtitle={job.company}
          subtitleStyle={styles.companySubtitle}
        />
        <Card.Content>
          <View style={styles.deadlineContainer}>
            <Chip
              mode="outlined"
              style={styles.deadlineChip}
              icon="clock-outline"
            >
              {job.validUntil.toLocaleDateString()}
            </Chip>
          </View>

          <View style={styles.sectionHeader}>
            <Icon name="text-long" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Job Description</Text>
          </View>
          <Text style={styles.description}>{job.description}</Text>

          <View style={styles.sectionHeader}>
            <Icon name="tools" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Key Requirements</Text>
          </View>
          <View style={styles.skillsContainer}>
            {job.skills.map((skill, i) => (
              <Chip key={i} mode="outlined" style={styles.skillChip}>
                {skill}
              </Chip>
            ))}
          </View>

          <View style={styles.infoBox}>
  <Icon name="office-building" size={24} color="#4f46e5" />
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoLabel}>Company</Text>
    <Text style={styles.infoValue}>{job.company}</Text>
  </View>
</View>

<View style={styles.infoBox}>
  <Icon name="account-tie" size={24} color="#4f46e5" />
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoLabel}>Posted By</Text>
    <Text style={styles.infoValue}>{job.recruiterName}</Text>
  </View>
</View>
        </Card.Content>
      </Card>
      {/* COMPANY & RECRUITER */}



      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: isSaved ? "#db2777" : "#4f46e5" },
        ]}
        onPress={toggleSave}
      >
        <Icon
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={20}
          color="white"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.saveText}>
          {isSaved ? "Unsave Job" : "Save Job"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
        <Text style={styles.buttonText}>Submit Application</Text>
        <Icon name="send-check" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f8faff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  detailCard: {
    borderRadius: 16,
    backgroundColor: "white",
    marginBottom: 16,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  jobTitle: { fontSize: 24, fontWeight: "700", color: '#1a1a1a', marginTop:10 },
  companySubtitle: { fontSize: 16, color: "#64748b", fontWeight: '500' },
  deadlineContainer: { flexDirection: "row", marginVertical: 1,  },
  deadlineChip: {  
    backgroundColor: "#f3f4f6",
    borderRadius: 15,
    paddingHorizontal: 12,
    marginTop:15 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectionTitle: {   
    fontSize: 18, 
    fontWeight: "600", 
    marginLeft: 8,
    color: '#1a1a1a'},
    description: { 
      marginTop: 12, 
      fontSize: 15, 
      lineHeight: 20,
      color: '#444444'
    },
  skillsContainer: { 
    flexDirection: "row", 
    justifyContent:"center",
    flexWrap: "wrap", 
    gap: 15,
    marginTop: 12},
  skillChip: {  
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 0.20 },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: "#4f46e5",
  },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  applyButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#10b985",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: { color: "#fff", marginRight: 8, fontSize: 15,fontWeight: "600" },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  
});

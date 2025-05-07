import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  StatusBar,
  Alert,
} from "react-native";
import { Avatar, Card, Title, Paragraph, Button } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  where,
  getDocs,
  query,
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import { useFocusEffect } from "@react-navigation/native"; // ✅ Import useFocusEffect
import { signOut } from "firebase/auth";
import { hide } from "expo-splash-screen";

const screenWidth = Dimensions.get("window").width;

type JobSeekerDashboardProps = {
  navigation: StackNavigationProp<any>;
};

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#7c3aed",
    fill: "#fff",
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: "#f1f5f9",
  },
  fillShadowGradient: "#a78bfa",
  fillShadowGradientOpacity: 0.1,
};

const marketData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [{ data: [150, 230, 180, 300, 270], strokeWidth: 2 }],
};

const JobSeekerDashboard = ({ navigation }: JobSeekerDashboardProps) => {
  const [jobSeekerName, setJobSeekerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [applicationsSent, setApplicationsSent] = useState(0);
  const [interviewsScheduled, setInterviewsScheduled] = useState(0);

  useEffect(() => {
    fetchJobSeekerData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobSeekerData();
    }, [])
  );
  const fetchJobSeekerData = async () => {
    if (!auth.currentUser) return;
    const db = getFirestore();
    const jobSeekerDocRef = doc(db, "users", auth.currentUser.uid);

    try {
      // Fetch job seeker name
      const docSnap = await getDoc(jobSeekerDocRef);
      if (docSnap.exists()) {
        const jobSeekerData = docSnap.data();
        setJobSeekerName(jobSeekerData.name || "Job Seeker");
      }

      // Fetch applications sent by this job seeker
      const applicationsRef = collection(db, "applications");
      const q = query(
        applicationsRef,
        where("seekerID", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      let totalApplications = 0;
      let acceptedApplications = 0;

      querySnapshot.forEach((doc) => {
        totalApplications++;
        const data = doc.data();
        if (data.status === "Accepted") {
          acceptedApplications++;
        }
      });

      setApplicationsSent(totalApplications); // 👈 Make sure these state variables are defined
      setInterviewsScheduled(acceptedApplications); // 👈 ^
    } catch (error) {
      console.error("Error fetching job seeker data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been successfully logged out.");
      navigation.replace("Login"); // 🔄 Redirect to login screen
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", "Something went wrong. Please try again.");
    }
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }} // 👈 Ensures space at the bottom
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Avatar.Image
            size={65}
            source={{ uri: "https://via.placeholder.com/100" }}
            style={{ backgroundColor: "#ede9fe" }}
          />
          <View style={{ marginLeft: 15 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.greeting}>
                Welcome {"\n"}
                <Text style={styles.subtitle}>{jobSeekerName}</Text>
              </Text>
            )}
            {/* <Text style={styles.subtitle}>Software Developer</Text> */}
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() =>
            navigation.navigate("ProfileCreationScreen", {
              fromDashboard: true,
            })
          }
        >
          <Icon name="account-edit" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* APPLICATION STATS */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View
              style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}
            >
              <Icon name="send-check" size={28} color="#7c3aed" />
            </View>
            <Title style={styles.statNumber}>{applicationsSent}</Title>
            <Paragraph style={styles.statText}>Applications Sent</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View
              style={[styles.iconContainer, { backgroundColor: "#fce7f3" }]}
            >
              <Icon name="calendar-check" size={28} color="#db2777" />
            </View>
            <Title style={styles.statNumber}>{interviewsScheduled}</Title>
            <Paragraph style={styles.statText}>Interviews Scheduled</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* JOB MARKET TRENDS */}
      <Text style={styles.sectionTitle}>Job Market Trends</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={marketData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          withVerticalLines={false}
          withHorizontalLines={false}
        />
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("AvailableJobsScreen")}
          style={styles.primaryButton}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => (
            <Icon name="briefcase-search" size={20} color="#fff" />
          )}
        >
          Find Jobs
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("AppliedJobs")}
          style={styles.secondaryButton}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => (
            <Icon name="clipboard-list" size={20} color="#fff" />
          )}
        >
          Applications
        </Button>

         {/* 🎯 NEW: Saved Jobs */}
        <Button
          mode="contained"
          onPress={() => navigation.navigate("SavedJobsScreen")}
          style={styles.primaryButton}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => (
            <Icon name="bookmark-outline" size={20} color="#fff" />
          )}
        >
          Saved Jobs
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate("JobseekerProfileScreen")}
          style={styles.profileButton}
          labelStyle={styles.buttonLabelSecondary}
          icon={({ size, color }) => (
            <Icon name="account" size={20} color="#7c3aed" />
          )}
        >
          My Profile
        </Button>
        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButtonFull}
            labelStyle={styles.logoutLabel}
            icon={({ size, color }) => (
              <Icon name="logout" size={20} color="#7c3aed" />
            )}
          >
            Logout
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#7c3aed",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    flexDirection: "column",
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#ede9fe",
    fontWeight: "500",
  },
  editProfileButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 8,
    textAlign: "center",
  },
  statText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    marginLeft: 8,
  },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    paddingLeft:0
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "48%",
    elevation: 3,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: "#db2777",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "48%",
    elevation: 3,
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  profileButton: {
    borderColor: "#c4b5fd",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "100%",
    backgroundColor: "#fff",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
  buttonLabelSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7c3aed",
    letterSpacing: 0.5,
  },
  logoutSection: {
    marginTop: 24,
    alignItems: "center",
  },
  logoutButtonFull: {
    borderColor: "#c4b5fd",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    backgroundColor: "#fff",
    width: "100%",
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7c3aed",
    letterSpacing: 0.5,
  },
});

export default JobSeekerDashboard;

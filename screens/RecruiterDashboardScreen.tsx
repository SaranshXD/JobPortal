import React, { useEffect, useState,useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  BackHandler,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { Avatar, Card, Title, Paragraph, Button } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { StackNavigationProp } from "@react-navigation/stack";
import { getFirestore, doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";



const screenWidth = Dimensions.get("window").width;

type RecruiterDashboardScreenProps = {
  navigation: StackNavigationProp<any>;
};

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#4f46e5",
    fill: "#fff"
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: "#f1f5f9"
  },
  fillShadowGradient: "#818cf8",
  fillShadowGradientOpacity: 0.1,
};

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [{ data: [10, 20, 15, 30, 25], strokeWidth: 2 }],
};

const RecruiterDashboardScreen = ({ navigation }: RecruiterDashboardScreenProps) => {
  const [recruiterName, setRecruiterName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0);
  const [totalApplicants, setTotalApplicants] = useState<number>(0);


    useFocusEffect(
      useCallback(() => {
        fetchRecruiterData()
      }, [])
    );
    const fetchRecruiterData = async () => {
      if (!auth.currentUser) return;
      const db = getFirestore();
      const recruiterID = auth.currentUser.uid;
      const recruiterDocRef = doc(db, "recruiters", recruiterID);
    
      try {
        // Recruiter Name
        const docSnap = await getDoc(recruiterDocRef);
        if (docSnap.exists()) {
          const recruiterData = docSnap.data();
          setRecruiterName(recruiterData.recruiterName || "Recruiter");
        } else {
          console.warn("No recruiter data found!");
        }
    
        // Active Jobs Count
        const jobQuerySnap = await getDocs(
          query(collection(db, "job_posts"), where("recruiterID", "==", recruiterID))
        );
        
        // Filter out expired jobs based on validUntil
        const now = new Date();
        const activeJobs = jobQuerySnap.docs.filter((doc) => {
          const data = doc.data();
          const validUntil = data.validUntil?.toDate ? data.validUntil.toDate() : new Date(data.validUntil);
          return validUntil > now;
        });
        
        setActiveJobsCount(activeJobs.length);
    
        // Total Applicants Count
        const applicationsQuerySnap = await getDocs(
          query(collection(db, "applications"), where("recruiterID", "==", recruiterID))
        );
        setTotalApplicants(applicationsQuerySnap.size);
      } catch (error) {
        console.error("Error fetching recruiter dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    const backAction = () => {
      navigation.replace("Login");
      return true;
    };


    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Avatar.Image
            size={65}
            source={{ uri: "https://via.placeholder.com/100" }}
            style={{ backgroundColor: "#e0e7ff" }}
          />
          <View style={{ marginLeft: 15 }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.greeting}>Hi, {recruiterName}</Text>
            )}
            <Text style={styles.subtitle}>Talent Acquisition Manager</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("RecruiterProfileScreen", { fromDashboard: true })}
        >
          <Icon name="account-edit" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <Icon name="briefcase-outline" size={28} color="#4f46e5" />
            </View>
            <Title style={styles.statNumber}>{activeJobsCount}</Title>
            <Paragraph style={styles.statText}>Active Jobs</Paragraph>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}>
              <Icon name="account-group-outline" size={28} color="#d97706" />
            </View>
            <Title style={styles.statNumber}>{totalApplicants}</Title>
            <Paragraph style={styles.statText}>Total Applications</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* APPLICATION TRENDS */}
      <Text style={styles.sectionTitle}>Application Trends</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          withVerticalLines={false}
          withHorizontalLines={false}
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("JobPostingScreen")}
          style={styles.primaryButton}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => <Icon name="plus" size={20} color="#fff" />}
        >
          Post a Job
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("ManageJobsScreen")}
          style={styles.manageButton}
          labelStyle={styles.buttonLabel}
          icon={({ size, color }) => <Icon name="clipboard-list" size={20} color="#fff" />}
        >
          Manage Jobs
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate("JobWiseApplicationsScreen")}
          style={styles.secondaryButton}
          labelStyle={styles.buttonLabelSecondary}
          icon={({ size, color }) => <Icon name="eye" size={20} color="#4f46e5" />}
        >
          View Applications
        </Button>
        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButtonFull}
            labelStyle={styles.logoutLabel}
            icon={({ size, color }) => <Icon name="logout" size={20} color="#7c3aed" />}
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
    backgroundColor: "#F8F9FF",
    padding: 24
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center"
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 12,
    color: "#e0e7ff",
    fontWeight: "300"
  },
  editProfileButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24
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
    backgroundColor: "#eef2ff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 8,
    textAlign: 'center'
  },
  statText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    marginLeft: 8
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
    paddingLeft:'auto'
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "48%",
    elevation: 3,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  manageButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "48%",
    elevation: 3,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  secondaryButton: {
    borderColor: "#c7d2fe",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
    minWidth: "100%",
    backgroundColor: "#fff"
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5
  },
  buttonLabelSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4f46e5",
    letterSpacing: 0.5
  }, logoutSection: {
    marginTop: 24,
    alignItems: "center"
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
    letterSpacing: 0.5
  },
});

export default RecruiterDashboardScreen;



















// import React, { useEffect } from "react";
// import { View, Text, ScrollView, StyleSheet, Dimensions, BackHandler, StatusBar, TouchableOpacity } from "react-native";
// import { Avatar, Card, Title, Paragraph, Button } from "react-native-paper";
// import { LineChart } from "react-native-chart-kit";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
// import { StackNavigationProp } from "@react-navigation/stack";

// const screenWidth = Dimensions.get("window").width;

// type RecruiterDashboardScreenProps = {
//   navigation: StackNavigationProp<any>;
// };

// const chartConfig = {
//   backgroundGradientFrom: "#ffffff",
//   backgroundGradientTo: "#ffffff",
//   decimalPlaces: 0,
//   color: (opacity = 1) => `rgba(78, 116, 289, ${opacity})`,
//   labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//   style: { borderRadius: 16 },
//   propsForDots: { r: "6", strokeWidth: "2", stroke: "#4E74E1" },
// };

// const data = {
//   labels: ["Jan", "Feb", "Mar", "Apr", "May"],
//   datasets: [{ data: [10, 20, 15, 30, 25], strokeWidth: 2 }],
// };

// const RecruiterDashboardScreen = ({ navigation }: RecruiterDashboardScreenProps) => {
//   useEffect(() => {
//     const backAction = () => {
//       navigation.replace("Login"); // Go back to Login screen instead of exiting
//       return true;
//     };

//     const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
//     return () => backHandler.remove();
//   }, []);

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F8F9FD" />

//       {/* HEADER */}
//       <View style={styles.header}>
//         <View style={styles.profileSection}>
//           <Avatar.Image size={60} source={{ uri: "https://via.placeholder.com/100" }} />
//           <View style={{ marginLeft: 12 }}>
//             <Text style={styles.greeting}>Hi, Sami Ahmed</Text>
//             <Text style={styles.subtitle}>Talent Acquisition Manager</Text>
//           </View>
//         </View>

//         {/* Edit Profile Button */}
//         <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate("RecruiterProfileScreen", { fromDashboard: true })}>
//           <Icon name="account-edit" size={24} color="#4E74E1" />
//         </TouchableOpacity>
//       </View>

//       {/* STATS ROW */}
//       <View style={styles.statsRow}>
//         <Card style={styles.statCard}>
//           <Card.Content>
//             <Icon name="briefcase-outline" size={35} color="#4E74E1" />
//             <Title style={styles.statNumber}>10</Title>
//             <Paragraph style={styles.statText}>Active Jobs</Paragraph>
//           </Card.Content>
//         </Card>
//         <Card style={styles.statCard}>
//           <Card.Content>
//             <Icon name="account-group-outline" size={35} color="#F2994A" />
//             <Title style={styles.statNumber}>250</Title>
//             <Paragraph style={styles.statText}>Total Applicants</Paragraph>
//           </Card.Content>
//         </Card>
//       </View>

//       {/* APPLICATION TRENDS */}
//       <Text style={styles.sectionTitle}>Application Trends</Text>
//       <View style={styles.chartContainer}>
//         <LineChart data={data} width={screenWidth - 40} height={220} chartConfig={chartConfig} />
//       </View>

//       {/* ACTION BUTTONS */}
//       <View style={styles.buttonRow}>
//         <Button
//           mode="contained"
//           icon="plus"
//           onPress={() => navigation.navigate("JobPostingScreen")}
//           style={[styles.actionButton, styles.primaryButton]}
//           labelStyle={styles.buttonLabel}
//         >
//           Post a Job
//         </Button>
//         <Button
//           mode="outlined"
//           icon="eye"
//           onPress={() => navigation.navigate("ApplicationsScreen")}
//           style={[styles.actionButton, styles.secondaryButton]}
//           labelStyle={styles.buttonLabelSecondary}
//         >
//           View Applications
//         </Button>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8F9FD", padding: 20, paddingTop: StatusBar.currentHeight || 20 },
//   header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
//   profileSection: { flexDirection: "row", alignItems: "center" },
//   greeting: { fontSize: 22, fontWeight: "bold", color: "#333" },
//   subtitle: { fontSize: 14, color: "#666" },
//   editProfileButton: { backgroundColor: "#E5E5F5", padding: 8, borderRadius: 20 },
//   statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
//   statCard: {
//     flex: 1,
//     backgroundColor: "#FFF",
//     borderRadius: 15,
//     padding: 15,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     alignItems: "center",
//     marginHorizontal: 5,
//   },
//   statNumber: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 5 },
//   statText: { fontSize: 14, color: "#666" },
//   sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
//   chartContainer: {
//     backgroundColor: "#FFF",
//     borderRadius: 15,
//     padding: 15,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     marginBottom: 20,
//   },
//   buttonRow: { flexDirection: "row", justifyContent: "space-between" },
//   actionButton: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 10 },
//   primaryButton: { backgroundColor: "#4E74E1" },
//   secondaryButton: { borderColor: "#4E74E1", borderWidth: 1 },
//   buttonLabel: { fontSize: 16, fontWeight: "bold", color: "#fff" },
//   buttonLabelSecondary: { fontSize: 16, fontWeight: "bold", color: "#4E74E1" },
// });

// export default RecruiterDashboardScreen;

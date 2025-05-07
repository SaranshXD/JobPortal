import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { Card, Avatar } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  getFirestore,
  collection,
  query,
  where,
  getDoc,
  doc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";

type ApplicationsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ApplicationsScreen = ({ navigation }: ApplicationsScreenProps) => {
  // Get the passed jobID from route parameters
  const route = useRoute<RouteProp<{ params: { jobID: string } }, "params">>();
  const passedJobId = route.params?.jobID;

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSmartSortingEnabled, setIsSmartSortingEnabled] = useState(false);
  // Declare filterStatus only once
  const [filterStatus, setFilterStatus] = useState("All");
  const isFirstLoad = useRef(true);

  const toggleScale = useSharedValue(1);

  const normalizeString = (str: string) => {
    return str
      .trim()
      .replace(/\u0000/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [])
  );

  // ApplicationCard component renders each application
  const ApplicationCard = ({ item, index, navigation }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const getStatusColor = (status: string) => {
      switch (status) {
        case "Pending":
          return "#F59E0B";
        case "Reviewed":
          return "#3B82F6";
        case "Accepted":
          return "#10B981";
        case "Rejected":
          return "#EF4444";
        default:
          return "#6B7280";
      }
    };

    return (
      <Animated.View
        entering={FadeIn.delay(index * 50)}
        style={{ marginBottom: 16 }}
      >
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPressIn={() => (scale.value = withSpring(0.97))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={() =>
              navigation.navigate("ApplicationDetailsScreen", {
                application: item,
              })
            }
            activeOpacity={0.95}
          >
            <Card style={styles.card}>
              <View
                style={[
                  styles.statusAccent,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Card.Content style={styles.cardContent}>
                <Avatar.Text
                  size={48}
                  label={item.seekerName.charAt(0)}
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.textContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.seekerName}>
                      {item.seekerName}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.appliedAt.seconds * 1000).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>

                  <View style={styles.jobInfo}>
                    <Icon name="briefcase-outline" size={22} color="#78909C" />
                    <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                  </View>

                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${getStatusColor(item.status)}22` },
                      ]}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: getStatusColor(item.status),
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(item.status) },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {item.matchScore !== undefined && isSmartSortingEnabled && (
                    <>
                      <Text style={styles.matchScore}>
                        🔥 Match Score: {item.scorePercent}%
                      </Text>
                      <Text style={styles.aiBadge}>
                        ⚡ AI-POWERED PRIORITIZATION
                      </Text>
                    </>
                  )}
                </View>
                <Icon
                  name="chevron-right"
                  size={24}
                  color="#CFD8DC"
                  style={styles.chevron}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  const fetchApplications = async () => {
    const db = getFirestore();
    if (!passedJobId) {
      console.error("No jobID passed to ApplicationsScreen");
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("jobID", "==", passedJobId)
    );

    try {
      const querySnapshot = await getDocs(q);

      const fetchedApplications = await Promise.all(
        querySnapshot.docs.map(async (applicationDoc) => {
          const applicationData = applicationDoc.data();
          const seekerID = applicationData.seekerID;

          let jobTitle = "Unknown Job";
          let matchScore = 0;
          let appliedAt: Timestamp;
          let requiredSkills: string[] = [];
          let seekerSkills: string[] = [];

          // Fetch job details (for title and skills)
          const jobDocSnap = await getDoc(doc(db, "job_posts", passedJobId));
          if (jobDocSnap.exists()) {
            const jobData = jobDocSnap.data();
            jobTitle = jobData.title || "Unknown Job";
            requiredSkills = jobData.skills || [];
          }

          // Fetch seeker profile details
          if (seekerID) {
            const seekerDocSnap = await getDoc(doc(db, "users", seekerID));
            if (seekerDocSnap.exists()) {
              const seekerData = seekerDocSnap.data();
              seekerSkills = seekerData.skills || [];
            }
          }

          // Calculate match score and percentage
          const matchedSkills = seekerSkills.filter((skill) =>
            requiredSkills
              .map(normalizeString)
              .includes(normalizeString(skill))
          );
          matchScore = matchedSkills.length;
          const scorePercentage =
            requiredSkills.length > 0
              ? (matchedSkills.length / requiredSkills.length) * 100
              : 0;
          const scorePercent = scorePercentage.toFixed(2);
          appliedAt = applicationData.appliedAt;

          return {
            id: applicationDoc.id,
            ...applicationData,
            jobTitle,
            matchScore,
            appliedAt,
            scorePercent,
          };
        })
      );

      // Sort applications based on enabled sorting mode
      const finalApplications = isSmartSortingEnabled
        ? fetchedApplications.sort((a, b) => b.matchScore - a.matchScore)
        : fetchedApplications.sort((a, b) => b.appliedAt.seconds - a.appliedAt.seconds);

      setApplications(finalApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Filter the applications based on selected status
  const filteredApplications =
    filterStatus === "All"
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  // Render filter options at the top
  const renderFilterOptions = () => {
    const statuses = ["All", "Reviewed", "Accepted", "Rejected"];
    return (
      <View style={styles.filterContainer}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === status && styles.filterTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <ApplicationCard item={item} index={index} navigation={navigation} />
  );

  const toggleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toggleScale.value }],
  }));

  const onToggleSmartSort = () => {
    toggleScale.value = withSpring(0.95, {}, () => {
      toggleScale.value = withSpring(1);
    });
    setIsSmartSortingEnabled((prev) => !prev);
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#4f46e5" style={styles.loader} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Toggle for smart sorting */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={onToggleSmartSort} activeOpacity={0.9}>
          <Animated.View style={[{ flexDirection: "row", alignItems: "center" }, toggleAnimatedStyle]}>
            <Icon
              name={isSmartSortingEnabled ? "robot-happy" : "robot-confused"}
              size={24}
              color={isSmartSortingEnabled ? "#4F46E5" : "#9CA3AF"}
            />
            <Text style={styles.toggleLabel}>
              {isSmartSortingEnabled ? "HireSence" : "HireSence"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Filter row for status */}
      {renderFilterOptions()}

      <FlatList
        data={filteredApplications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statusAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingLeft: 20,
  },
  avatar: {
    backgroundColor: "#EEF2FF",
    marginRight: 16,
  },
  avatarLabel: {
    color: "#4F46E5",
    fontSize: 20,
    fontFamily: "Inter-Bold",
    marginTop: -2,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  seekerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-ExtraBold",
  },
  date: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  jobInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontFamily: "Inter-SemiBold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-ExtraBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  chevron: {
    marginLeft: 8,
  },
  toggleContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: "center",
    width: "100%",
    padding: 12,
  },
  toggleLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    fontFamily: "Inter-SemiBold",
  },
  matchScore: {
    fontSize: 12,
    color: "#4F46E5",
    fontFamily: "Inter-SemiBold",
    marginTop: 8,
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadge: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    marginTop: 4,
    letterSpacing: 0.8,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterButtonActive: {
    backgroundColor: "#4F46E5",
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#4F46E5",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
});

export default ApplicationsScreen;

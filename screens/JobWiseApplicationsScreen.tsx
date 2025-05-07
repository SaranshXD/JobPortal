import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";

type Props = {
  navigation: StackNavigationProp<any>;
};

const JobWiseApplicationsScreen = ({ navigation }: Props) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scale = useSharedValue(1);

  const fetchJobs = async () => {
    const db = getFirestore();
    const recruiterID = auth.currentUser?.uid;
    if (!recruiterID) return;

    const q = query(collection(db, "job_posts"), where("recruiterID", "==", recruiterID));
    try {
      const querySnapshot = await getDocs(q);
      const jobsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobsList);
    } catch (error) {
      console.error("Error fetching jobs: ", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

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
  }, []);

  const renderJobCard = ({ item, index }: { item: any; index: number }) => (
    <JobCard
      item={item}
      index={index}
      onPress={() => navigation.navigate("ApplicationsScreen", { jobID: item.id })}
    />
  );
  

  const JobCard = ({ item, index, onPress }: any) => {
    const cardScale = useSharedValue(1);
  
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));
  
    return (
      <Animated.View entering={FadeIn.delay(index * 60)} style={{ marginBottom: 16 }}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPressIn={() => (cardScale.value = withSpring(0.97))}
            onPressOut={() => (cardScale.value = withSpring(1))}
            onPress={onPress}
            activeOpacity={0.95}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <Icon name="briefcase" size={28} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.subInfo}>
                    📍 {item.location || "Remote"} | 💰 {item.salary || "N/A"}
                  </Text>
                  {/* <Text style={styles.subInfo}>
                    📍 {item.id || "id"} | 💰 {item.salary || "N/A"}
                  </Text> */}
                  <Text style={styles.subInfo}>
                    🗓️ Valid Until:{" "}
                    {new Date(item.validUntil.seconds * 1000).toLocaleDateString()}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#9CA3AF" />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };
  

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
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
    borderRadius: 20,
    elevation: 6,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter-Bold",
    marginBottom: 4,
  },
  subInfo: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
});
export default JobWiseApplicationsScreen;
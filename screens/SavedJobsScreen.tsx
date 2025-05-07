// screens/SavedJobsScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from "react-native-reanimated";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function SavedJobsScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedJobs = async () => {
    setLoading(true);
    const db = getFirestore();
    const userId = auth.currentUser?.uid;
    if (!userId) return setLoading(false);

    // 1️⃣ Load saved_jobs entries
    const savedSnap = await getDocs(
      query(
        collection(db, "saved_jobs"),
        where("userId", "==", userId)
      )
    );

    const savedEntries = savedSnap.docs.map(d => ({
      jobId: d.data().jobId as string,
      savedAt: d.data().savedAt
    }));

    if (savedEntries.length === 0) {
      setJobs([]);
      return setLoading(false);
    }

    // 2️⃣ Chunk IDs
    const allIds = savedEntries.map(e => e.jobId);
    const chunks: string[][] = [];
    for (let i = 0; i < allIds.length; i += 10) {
      chunks.push(allIds.slice(i, i + 10));
    }

    // 3️⃣ Batch fetch job_posts
    const promises = chunks.map(ids =>
      getDocs(
        query(
          collection(db, "job_posts"),
          where(documentId(), "in", ids)
        )
      )
    );
    const snaps = await Promise.all(promises);

    // 4️⃣ Merge savedAt
    const merged: any[] = [];
    snaps.forEach(snap => {
      snap.docs.forEach(jobDoc => {
        const data = jobDoc.data();
        const entry = savedEntries.find(e => e.jobId === jobDoc.id);
        if (entry) {
          merged.push({
            id: jobDoc.id,
            ...data,
            savedAt: entry.savedAt
          });
        }
      });
    });

    setJobs(merged);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedJobs();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You haven’t saved any jobs yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={({ item, index }) => (
          <SavedJobCard
            item={item}
            index={index}
            onPress={() => navigation.navigate("JobDetailsScreen", { jobId: item.id })}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Pull this out as its own component ────────────────────────────────
function SavedJobCard({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: () => void;
}) {
  // ✅ Hooks at top level of a component
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 60)}
      style={{ marginBottom: 16 }}
    >
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPressIn={() => (scale.value = withSpring(0.95))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={onPress}
          activeOpacity={0.9}
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
                <Text style={styles.subInfo}>
                  Saved on:{" "}
                  {new Date(item.savedAt.seconds * 1000).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#9CA3AF" />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    elevation: 4,
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
    marginBottom: 4,
  },
  subInfo: {
    fontSize: 13,
    color: "#6B7280",
  },
});

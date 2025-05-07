// screens/AppliedJobs.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth } from "../firebaseConfig";
import moment from "moment";

type ApplicationStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

const statusColors: Record<ApplicationStatus, string> = {
  Pending: "#facc15",
  Reviewed: "#38bdf8",
  Accepted: "#4ade80",
  Rejected: "#f87171",
};

type Application = {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: Date;
  recruiterName : string;
};

const AppliedJobs = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const db = getFirestore();

    try {
      const q = query(
        collection(db, "applications"),
        where("seekerID", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const apps: Application[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const jobRef = doc(db, "job_posts", data.jobID);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          apps.push({
            id: docSnap.id,
            jobTitle: jobSnap.data().title ?? "Untitled Job",
            company: jobSnap.data().company ?? "Unknown Company",
            status: data.status as ApplicationStatus ?? "Pending",
            appliedAt: data.appliedAt?.toDate?.() ?? new Date(),
            recruiterName: jobSnap.data().recruiterName
          });
        }
      }

      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const renderItem = ({ item }: { item: Application }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Icon name="briefcase-check" size={24} color="#7c3aed" />
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.jobTitle}>{item.jobTitle}</Text>
        
        <View style={styles.detailRow}>
          <Icon name="office-building" size={18} color="#64748b" />
          <Text style={styles.company}>{item.company}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="account-tie" size={18} color="#64748b" />
          <Text style={styles.recruiter}>{item.recruiterName}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dateBadge}>
            <Icon name="calendar-month" size={16} color="#94a3b8" />
            <Text style={styles.dateText}>
              {moment(item.appliedAt).format("DD MMM YYYY")}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#7c3aed" />
      ) : applications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="briefcase-remove" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No Applications Found</Text>
          <Text style={styles.emptySubText}>Your job applications will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#7c3aed"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  company: {
    fontSize: 16,
    color: "#475569",
    marginLeft: 12,
    fontWeight: "500",
  },
  recruiter: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 12,
    fontWeight: "500",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 8,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    color: "#94a3b8",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 14,
    color: "#cbd5e1",
    marginTop: 8,
    textAlign: "center",
  },
});

export default AppliedJobs;
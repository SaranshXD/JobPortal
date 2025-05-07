import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  BackHandler,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Card, Button } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";


type ApplicationStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

type ApplicationDetailsProps = {
  navigation: StackNavigationProp<any>;
  route: { params: { application: any } };
};

const ApplicationDetailsScreen = ({ navigation, route }: ApplicationDetailsProps) => {
  const { application } = route.params;
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [jobTitle, setjobTitle] = useState<String>("Unknown Job")
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);



  const db = getFirestore();

  const statusColors: Record<ApplicationStatus, string> = {
    Pending: "#FFA726",
    Reviewed: "#42A5F5",
    Accepted: "#66BB6A",
    Rejected: "#EF5350",
  };


  useEffect(() => {

    const getName = async () => {
      const applicationRef = doc(db, "applications", application.id);
      const jobsnap = await getDoc(applicationRef)
      if (jobsnap.exists()) {

        const jobData = jobsnap.data();
        const jobID = jobData.jobID;

        try {
          if (jobID) {
            const jobDocRef = doc(db, "job_posts", jobID);
            const jobDocSnap = await getDoc(jobDocRef);
            if (jobDocSnap.exists()) {
              setjobTitle(jobDocSnap.data().title); // Fetch job title
              // console.log(jobTitle)
            }
          }
        } catch (error) {
          console.log("Error fetching name", error)
        } finally {
          // setLoading(false)
        }

      }

    }


    const getApplicationDetails = async () => {
      const applicationRef = doc(db, "applications", application.id);
      const applicationSnap = await getDoc(applicationRef);

      if (applicationSnap.exists()) {
        const appData = applicationSnap.data();
        const jobID = appData.jobID;
        const seekerID = appData.seekerID;

        try {
          // Fetch job title
          if (jobID) {
            const jobDocRef = doc(db, "job_posts", jobID);
            const jobDocSnap = await getDoc(jobDocRef);
            if (jobDocSnap.exists()) {
              setjobTitle(jobDocSnap.data().title);
            }
          }

          // Fetch seeker contact details
          if (seekerID) {
            const seekerRef = doc(db, "users", seekerID);
            const seekerSnap = await getDoc(seekerRef);
            if (seekerSnap.exists()) {
              const seekerData = seekerSnap.data();
              setPhone(seekerData.phone || null);
              setEmail(seekerData.email || null);
            }
          }
        } catch (error) {
          console.log("Error fetching application or seeker data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    getName();
    getApplicationDetails();


  }, [])

  const updateStatus = async (newStatus: ApplicationStatus) => {
    try {
      const applicationRef = doc(db, "applications", application.id);
      await updateDoc(applicationRef, { status: newStatus });
      setStatus(newStatus);
      Alert.alert("Success", `Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);


  if (loading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.applicantName}>{application.seekerName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColors[status] + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
            <Text style={[styles.statusText, { color: statusColors[status] }]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Icon name="briefcase-outline" size={20} color="#78909C" />
          <Text style={styles.detailText}>Job Profile: {jobTitle}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="briefcase-outline" size={20} color="#78909C" />
          <Text style={styles.detailText}>Job ID: {application.jobID}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="account-outline" size={20} color="#78909C" />
          <Text style={styles.detailText}>Seeker Mail: {email}</Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="calendar-month-outline" size={20} color="#78909C" />
          <Text style={styles.detailText}>
            Applied: {new Date(application.appliedAt.seconds * 1000).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="account-outline" size={20} color="#78909C" />
          <Text style={styles.detailText}>Recruiter: {application.recruiterName}</Text>
        </View>

        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => Linking.openURL(application.resumeLink)}
        >
          <Icon name="file-pdf-box" size={24} color="#EF5350" />
          <Text style={styles.resumeText}>View Resume PDF</Text>
          <Icon name="open-in-new" size={18} color="#42A5F5" />
        </TouchableOpacity>
      </Card>

      {phone && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL(`tel:${phone}`)}
        >
          <Icon name="phone" size={20} color="red" />
          <Text style={styles.contactText}>Call Job Seeker</Text>
        </TouchableOpacity>
      )}

      {email && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL(`mailto:${email}`)}
        >
          <Icon name="email" size={20} color="#7012fc" />
          <Text style={styles.contactText}>Email Job Seeker</Text>
        </TouchableOpacity>
      )}
      {phone && (
  <TouchableOpacity 
    style={styles.contactButton}
    onPress={() => {
      const phoneNumber = phone.replace("+", "").replace(/\s/g, ""); // Clean the number
      const message = `Hello ${application.seekerName}, I'm contacting you regarding your job application.`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Make sure WhatsApp is installed on your device");
      });
    }}
  >
    <Icon name="whatsapp" size={20} color="red" />
    <Text style={[styles.contactText, { color: "crimson" }]}>WhatsApp Job Seeker</Text>
  </TouchableOpacity>
)}


      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#66BB6A' }]}
          onPress={() => updateStatus("Accepted")}
        >
          <Icon name="check-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#42A5F5' }]}
          onPress={() => updateStatus("Reviewed")}
        >
          <Icon name="eye-check" size={20} color="white" />
          <Text style={styles.buttonText}>Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#EF5350' }]}
          onPress={() => updateStatus("Rejected")}
        >
          <Icon name="close-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#30475E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },
  applicantName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#263238',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dedbff',
    padding: 14,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },

  contactText: {
    fontSize: 16,
    color: '#7a25fa',
    marginLeft: 12,
    fontWeight: '600',
  },

  detailText: {
    fontSize: 16,
    color: '#546E7A',
    marginLeft: 12,
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  resumeText: {
    flex: 1,
    fontSize: 16,
    color: '#EF5350',
    fontWeight: '500',
    marginHorizontal: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
});

export default ApplicationDetailsScreen;
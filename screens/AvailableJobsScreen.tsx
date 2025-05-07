import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  Switch,
  BackHandler,
} from "react-native";
import {
  TextInput,
  Chip,
  Button,
  ActivityIndicator,
  Menu,
  Text,
  Divider,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuth } from "firebase/auth";


export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  description: string;
  validUntil: Date;
  recruiterName: string;
  recruiterID: string;  // ✅ Add this field

}

type RootStackParamList = {
  JobDetailsScreen: { jobId: string };  // ✅ Change param to jobId
};

const AvailableJobsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const auth = getAuth();
  const db = getFirestore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [aiFilteredJobs, setaiFilteredJobs] = useState<Job[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const buttonScale = new Animated.Value(1);

  useEffect(() => {
    fetchUserSkills();

    fetchJobs();
    
    
  }, []);
 useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

    // Fetch Current User's Skills
    const fetchUserSkills = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      const userRef = collection(db, "users");
      const snapshot = await getDocs(userRef);
      
      snapshot.forEach((doc) => {
        if (doc.id === user.uid) {
          setUserSkills(doc.data().skills || []);
        }
      });
    };

  const fetchJobs = async () => {
    try {
      
      const jobsRef = collection(db, "job_posts");
      const jobQuery = query(jobsRef, where("validUntil", ">", new Date()));
      const jobSnapshot = await getDocs(jobQuery);

      const jobList: Job[] = jobSnapshot.docs.map(doc => {
        const jobData = doc.data();
        // console.log(jobData.recruiterID)
        return {
          id: doc.id,
          title: jobData.title,
          company: jobData.company,
          location: normalizeString(jobData.location),
          salary: jobData.salary,
          skills: jobData.skills || [],
          description: jobData.description,
          validUntil: jobData.validUntil.toDate(),
          recruiterName: jobData.recruiterName,
          recruiterID: jobData.recruiterID // ✅ Ensure recruiterId is included


        };
        
      });

      setJobs(jobList.filter(job => job.location));
      console.log("this is job ist",jobList.forEach(job => console.log(job.recruiterID,"    " ,job.title)))

    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

   // Get AI-Powered Recommended Jobs
   const getRecommendedJobs = () => {
    if (userSkills.length === 0) return jobs; // No filtering if no skills
    
    return jobs
      .map((job) => {
        const matchedSkills = job.skills?.filter((skill) =>
          userSkills.includes(skill.toLowerCase())
        ) || [];
        
        return { ...job, matchCount: matchedSkills.length };
      })
      .filter((job) => job.matchCount > 0) // Only jobs with at least 1 match
      .sort((a, b) => b.matchCount - a.matchCount); // Sort by match count
  };

  // Toggle AI Recommendation Mode
  const toggleAiRecommendations = () => {
    setAiRecommendations(!aiRecommendations);
    setaiFilteredJobs(aiRecommendations ? jobs : getRecommendedJobs());
  };

  const normalizeString = (str: string) => {
    return str
      .trim()
      .replace(/\u0000/g, "") // ❌ Remove NULL character
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // ❌ Remove Zero-Width, Non-Breaking Spaces
      .replace(/\s+/g, " ") // ✅ Convert multiple spaces to single space
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()); // ✅ Convert to Title Case
  };

  const { uniqueLocations, uniqueSkills } = useMemo(() => {
    const locations = new Set<string>();
    const skills = new Set<string>();
    const refinedSkills = new Set<string>();

    jobs.forEach(job => {
      locations.add(job.location);
      
      
      job.skills.forEach(skill => skills.add(normalizeString(skill)));
      // console.log(skills)
      skills.forEach(skill =>refinedSkills.add(normalizeString(skill)))
      // console.log("refine",refinedSkills)
    });

    return {
      uniqueLocations: Array.from(locations).sort(),
      uniqueSkills: Array.from(refinedSkills).sort(),
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normSearch = searchQuery.toLowerCase();
    const normLocation = selectedLocation.toLowerCase();
    const normSkills = selectedSkills.map(s => s.toLowerCase());

    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(normSearch) ||
                          job.company.toLowerCase().includes(normSearch);
      const matchesLocation = !selectedLocation || job.location.toLowerCase() === normLocation;
      const jobSkills = job.skills.map(sk => normalizeString(sk).toLowerCase());

const matchesSkills = selectedSkills.length === 0 ||
  normSkills.every(s => jobSkills.includes(s));


      return matchesSearch && matchesLocation && matchesSkills;
    });
  }, [jobs, searchQuery, selectedLocation, selectedSkills]);

  const animateButton = () => {
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleFilterPress = () => {
    animateButton();
    setMenuVisible(!menuVisible);
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    
    <View style={styles.jobCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Icon name="chevron-right" size={24} color="#4f46e5" />
      </View>
      <Text style={styles.companyName}>{item.company}</Text>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoChip}>
          <Icon name="map-marker" size={16} color="#4f46e5" />
          <Text style={styles.chipText}>{item.location}</Text>
        </View>
        <View style={styles.infoChip}>
          <Icon name="cash" size={16} color="#4f46e5" />
          <Text style={styles.chipText}>{item.salary}</Text>
        </View>
      </View>

      {item.skills?.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills.map((skill, index) => (
            <View key={`${skill}-${index}`} style={styles.skillBadge}>
              <Text style={styles.skillBadgeText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
       onPress={() => navigation.navigate("JobDetailsScreen", { jobId: item.id })}
        
        style={styles.detailsButton}
      >
        <Text style={styles.buttonText}>View Details</Text>
        <Icon name="arrow-right" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderFilterMenu = () => (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity onPress={handleFilterPress} style={styles.filterButton}>
            <Icon name="filter" size={20} color='darkblue' />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </Animated.View>
      }
      contentStyle={styles.menuContent}
    >
      <ScrollView contentContainerStyle={styles.menuScrollContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Filter Jobs</Text>
          <TouchableOpacity onPress={() => setMenuVisible(false)}>
            <Icon name="close" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionHeader}>Location</Text>
          <View style={styles.chipGroup}>
            {uniqueLocations.map(location => (
              <TouchableOpacity
                key={location}
                onPress={() => {
                  setSelectedLocation(prev => (prev === location ? "" : location));
                  setTimeout(() => setMenuVisible(false), 100); // Small delay before closing menu
                }}
                style={[
                  styles.locationChip,
                  selectedLocation === location && styles.selectedChip
                ]}
              >
                <Text style={[
                  styles.chipText,
                  selectedLocation === location && styles.selectedChipText
                ]}>
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.filterSection}>
          <Text style={styles.sectionHeader}>Required Skills</Text>
          <View style={styles.chipGroup}>
            {uniqueSkills.map(skill => (
              <TouchableOpacity
                key={skill}
                onPress={() => {
                  setSelectedSkills(prev =>
                    prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                  );
                  setTimeout(() => setMenuVisible(false), 100); // Small delay before closing menu
                }}
                style={[
                  styles.skillChip,
                  selectedSkills.includes(skill) && styles.selectedChip
                ]}
              >
                <Text style={[
                  styles.chipText,
                  selectedSkills.includes(skill) && styles.selectedChipText
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedLocation('');
              setSelectedSkills([]);
              setTimeout(() => setMenuVisible(false), 100);
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Menu>
  );

  return (
    <View style={styles.container}>
    {/* AI Recommendations Toggle */}
    {/* <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>AI Recommendations</Text>
      <Switch 
        value={aiRecommendations} 
        onValueChange={toggleAiRecommendations} 
        // color={"#4f46e5"}
      />
    </View> */}

    {/* Search Bar */}
    <TextInput
      placeholder="Search jobs..."
      placeholderTextColor="#64748b"
      value={searchQuery}
      onChangeText={setSearchQuery}
      left={<TextInput.Icon icon="magnify" color="#4f46e5" />}
      style={styles.searchBar}
    />
    <View style={styles.buttonRow}>
  {/* AI Recommendations Button */}
  <TouchableOpacity 
    style={[styles.filterButton, aiRecommendations && styles.activeButton]}
    onPress={toggleAiRecommendations}
  >
    <Icon name="lightbulb-on" size={20} color={aiRecommendations ? "white" : "darkblue"} />
    <Text style={[styles.filterButtonText, aiRecommendations && styles.activeText]}>
    {/* NeuralHire */}
    CareerSense
    </Text>
  </TouchableOpacity>

  {renderFilterMenu()}
</View>
    

    {/* Job List */}
    <FlatList
      data={aiRecommendations ? aiFilteredJobs : filteredJobs} // AI Recommendations toggle effect
      renderItem={renderJobCard}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyState}>
            <Icon name="briefcase-remove" size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>No jobs match your criteria</Text>
          </View>
        ) : null
      }
      refreshing={loading}
      onRefresh={fetchJobs}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 10,
  },
  activeButton: {
    backgroundColor: "#4f46e5",
  },
  activeText: {
  color: "#ffffff",
},
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fe',
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  jobCard: {
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  companyName: {
    color: '#64748b',
    marginBottom: 16,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    color: '#475569',
    fontSize: 14,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  skillBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skillBadgeText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  filterButton: {
    // alignSelf:'flex-end',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent:'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    marginBottom:10,
    // width:'30%',
    
  },
  filterButtonText: {
    color: 'darkblue',
    fontSize: 16,
    fontWeight: '500',
  },
  menuContent: {
    width: Dimensions.get('window').width - 48,
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 6,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  filterSection: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skillChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedChip: {
    backgroundColor: '#4f46e5',
  },
  selectedChipText: {
    color: 'white',
  },
  filterActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  detailsButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#e2e8f0',
  },
  menuScrollContainer: {
    paddingBottom: 24,
  },
});

export default AvailableJobsScreen;



















// import React, { useState, useEffect, useMemo } from 'react';
// import { View, FlatList, StyleSheet, ScrollView, Dimensions } from 'react-native';
// import { TextInput, Card, Chip, Button, ActivityIndicator, Menu, Text, Divider } from 'react-native-paper';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { useNavigation } from '@react-navigation/native';
// import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
// import { StackNavigationProp } from '@react-navigation/stack';

// export interface Job {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   salary: string;
//   skills: string[];
//   description: string;
//   validUntil: Date;
//   recruiterName: string;
// }

// type RootStackParamList = {
//   JobDetailsScreen: { job: Job };
// };

// const AvailableJobsScreen = () => {
//   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedLocation, setSelectedLocation] = useState('');
//   const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [menuVisible, setMenuVisible] = useState(false);

//   // Debugging effect
//   useEffect(() => {
//     // console.log('Raw jobs data:', jobs);
//     // console.log('Unique locations:', uniqueLocations);
//     // console.log('Unique skills:', uniqueSkills);
//     console.log('Selected skills:', selectedSkills);
//     console.log('Selected location:', selectedLocation);
//   }, [jobs, selectedLocation, selectedSkills]);

//   useEffect(() => { fetchJobs(); }, []);

//   useEffect(() => {
//     console.log("Raw job locations:", jobs.map(j => j.location));
//     console.log("Unique locations after filtering:", uniqueLocations);
//   }, [jobs]);

//   const fetchJobs = async () => {
//     try {
//       const db = getFirestore();
//       const jobsRef = collection(db, "job_posts");
//       const jobQuery = query(jobsRef, where("validUntil", ">", new Date()));
//       const jobSnapshot = await getDocs(jobQuery);
  
//       const jobList: Job[] = [];
  
//       jobSnapshot.docs.forEach(doc => {
//         const jobData = doc.data();
//         const normalizedLocation = jobData.location?.trim().toLowerCase() || '';
  
//         if (!jobList.some(j => j.id === doc.id)) { 
//           jobList.push({
//             id: doc.id,
//             title: jobData.title,
//             company: jobData.company,
//             location: normalizedLocation, // 🔥 Fix location format here
//             salary: jobData.salary,
//             skills: jobData.skills || [],
//             description: jobData.description,
//             validUntil: jobData.validUntil.toDate(),
//             recruiterName: jobData.recruiterName
//           });
//         }
//       });
  
//       setJobs(jobList);
//     } catch (error) {
//       console.error("Error fetching jobs:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   // Normalization and deduplication logic
//   const normalizeString = (str: string) => {
//     return str.replace(/\s+/g, ' ')  // Collapse multiple spaces
//     .trim()                // Remove leading/trailing spaces
//     .toLowerCase();   
//   };

//   const { uniqueLocations, uniqueSkills } = useMemo(() => {
//     const locationSet = new Set<string>();
//     const skillSet = new Set<string>();
  
//     jobs.forEach(job => {
//       if (job.location) {
//         const cleanLocation = job.location.trim().toLowerCase(); // ✅ Normalize location
//         locationSet.add(cleanLocation.charAt(0).toUpperCase() + cleanLocation.slice(1));
//       }
  
//       (job.skills || []).forEach(skill => {
//         const cleanSkill = skill.trim().toLowerCase();
//         skillSet.add(cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1));
//       });
//     });
  
//     return {
//       uniqueLocations: Array.from(locationSet), // ✅ Convert Set to array (removes duplicates)
//       uniqueSkills: Array.from(skillSet)
//     };
//   }, [jobs]);
  
  
//   const filteredJobs = useMemo(() => {
//     return jobs.filter(job => {
//       const normSearch = normalizeString(searchQuery);
//       const normJobTitle = normalizeString(job.title);
//       const normJobCompany = normalizeString(job.company);
//       const matchesSearch = normJobTitle.includes(normSearch) || normJobCompany.includes(normSearch);

//       const normSelectedLocation = normalizeString(selectedLocation);
//       const normJobLocation = normalizeString(job.location);
//       const matchesLocation = !selectedLocation || normJobLocation === normSelectedLocation;

//       const normSelectedSkills = selectedSkills.map(normalizeString);
//       const jobSkills = (job.skills || []).map(normalizeString);
//       const matchesSkills = normSelectedSkills.length === 0 || 
//                           normSelectedSkills.every(s => jobSkills.includes(s));

//       return matchesSearch && matchesLocation && matchesSkills;
//     });
//   }, [jobs, searchQuery, selectedLocation, selectedSkills]);

//   const renderSkillChip = (skill: string) => {
//     const isSelected = selectedSkills.some(s => 
//       normalizeString(s) === normalizeString(skill)
//     );
    
//     return (
//       <Chip
//         key={`skill-${normalizeString(skill)}`}
//         mode={isSelected ? "flat" : "outlined"}
//         selected={isSelected}
//         onPress={() => {
//           setSelectedSkills(prev => {
//             const normalizedSkill = normalizeString(skill);
//             return prev.some(s => normalizeString(s) === normalizedSkill)
//               ? prev.filter(s => normalizeString(s) !== normalizedSkill)
//               : [...prev, skill];
//           });
//         }}
//         style={styles.skillChip}
//         textStyle={styles.chipText}
//       >
//         {skill}
//       </Chip>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput
//         placeholder="Search jobs..."
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//         left={<TextInput.Icon icon="magnify" />}
//         style={styles.searchBar}
//       />

//       <View style={styles.filterContainer}>
//         <Menu
//           visible={menuVisible}
//           onDismiss={() => setMenuVisible(false)}
//           anchor={
//             <Button 
//               mode="contained-tonal"
//               onPress={() => setMenuVisible(true)}
//               style={styles.filterButton}
//               icon="filter"
//             >
//               Filters
//             </Button>
//           }
//           contentStyle={styles.menuContent}
//           style={styles.menuWrapper}
//         >
//           <ScrollView contentContainerStyle={styles.menuScrollContainer}>
//             <View style={styles.filterSection}>
//               <Text variant="titleSmall" style={styles.sectionHeader}>
//                 Location
//               </Text>
//               <View style={styles.chipGroup}>
//                 {uniqueLocations.map(location => (
//                   <Chip
//                     key={`loc-${normalizeString(location)}`}
//                     mode={selectedLocation === location ? "flat" : "outlined"}
//                     selected={selectedLocation === location}
//                     onPress={() => setSelectedLocation(prev => 
//                       prev === location ? "" : location
//                     )}
//                     style={styles.locationChip}
//                     textStyle={styles.chipText}
//                   >
//                     {location}
//                   </Chip>
//                 ))}
//               </View>
//             </View>

//             <Divider style={styles.divider} />

//             <View style={styles.filterSection}>
//               <Text variant="titleSmall" style={styles.sectionHeader}>
//                 Required Skills
//               </Text>
//               <View style={styles.chipGroup}>
//                 {uniqueSkills.map(skill => renderSkillChip(skill))}
//               </View>
//             </View>
//           </ScrollView>
//         </Menu>
//       </View>

//       <FlatList
//         data={filteredJobs}
//         renderItem={({ item }) => (
//           <Card style={styles.jobCard}>
//             <Card.Title
//               title={item.title}
//               subtitle={item.company}
//               right={() => (
//                 <Text style={styles.deadline}>
//                   Apply by: {item.validUntil.toLocaleDateString()}
//                 </Text>
//               )}
//             />
//             <Card.Content>
//               <View style={styles.chipContainer}>
//                 <Chip icon="map-marker">{item.location}</Chip>
//                 <Chip icon="cash">{item.salary}</Chip>
//                 <Chip icon="account">{item.recruiterName}</Chip>
//               </View>

//               {item.skills?.length > 0 && (
//                 <View style={styles.skillsContainer}>
//                   {item.skills.map((skill, index) => (
//                     <Chip 
//                       key={`${normalizeString(skill)}-${index}`} 
//                       style={styles.skillChip}
//                     >
//                       {skill}
//                     </Chip>
//                   ))}
//                 </View>
//               )}

//               <Button
//                 mode="contained"
//                 onPress={() => navigation.navigate('JobDetailsScreen', { job: item })}
//                 style={styles.detailsButton}
//               >
//                 View Details
//               </Button>
//             </Card.Content>
//           </Card>
//         )}
//         keyExtractor={(item) => item.id}
//         ListEmptyComponent={
//           !loading ? (
//             <View style={styles.emptyState}>
//               <Icon name="briefcase-remove" size={60} />
//               <Text>No jobs match your criteria</Text>
//             </View>
//           ) : null
//         }
//         refreshing={loading}
//         onRefresh={fetchJobs}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f8f9fa'
//   },
//   searchBar: {
//     marginBottom: 16,
//     backgroundColor: 'white'
//   },
//   filterRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     marginBottom: 16
//   },
//   jobCard: {
//     marginBottom: 16,
//     borderRadius: 12,
//     elevation: 2,
//     backgroundColor: 'white',

//   },
//   chipContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginVertical: 8,
//   },
//   skillsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginVertical: 12
//   },
 
//   deadline: {
//     color: '#666',
//     fontSize: 12,
//     marginRight: 8
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40
//   },
//   menuSection: {
//     padding: 8,
//     maxHeight: 200,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
    
//   },
//   filterChip: {
//     margin: 2
//   },
//   detailsButton: {
//     marginTop: 16,
//     backgroundColor: '#4f46e5'
//   },

//   hiddenAnchor: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: 1,
//     height: 1,
//   },
  
//   menuScrollContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 24,
//   },
//   filterSection: {
//     marginVertical: 12,
//   },
//   sectionHeader: {
//     color: '#2d3b4e',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   chipGroup: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   locationChip: {
//     borderRadius: 6,
//     backgroundColor: '#f8f9fe',
//   },
//   skillChip: {
//     borderRadius: 20,
//     backgroundColor: '#f8f9fe',
    
//   },
//   chipText: {
//     fontSize: 14,
//     color: '#3f51b5',
//   },
//   salaryInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   salaryInput: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   salarySeparator: {
//     fontSize: 16,
//     color: '#666',
//   },
//   divider: {
//     marginVertical: 16,
//     backgroundColor: '#e0e0e0',
//   },
//   filterContainer: {
//     marginBottom: 16,
//     zIndex: 1,
//     alignItems: 'flex-end',
//   },
//   filterButton: {
//     borderRadius: 8,
//     backgroundColor: '#f0f4ff',
//     width: 100, // Set explicit width
//   },
//   menuWrapper: {
//     marginTop: 8, // Reduced from 45
//     marginRight: 16,
//   },
//   menuContent: {
//     width: Dimensions.get('window').width - 32,
//     maxHeight: Dimensions.get('window').height * 0.7,
//     borderRadius: 12,
//     paddingVertical: 8,
//     elevation: 4,
//   },
// });

// export default AvailableJobsScreen;
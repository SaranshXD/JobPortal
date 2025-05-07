import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import { registerRootComponent } from "expo";
import Toast from "react-native-toast-message";
import ProfileCreationScreen from "./screens/ProfileCreationScreen";
import RecruiterProfileScreen from "./screens/RecruiterProfileScreen";
import JobPostingScreen from "./screens/JobPostingScreen"; // ✅ Job Posting added
import { AuthProvider } from "./context/AuthContext";
import RecruiterDashboardScreen from "./screens/RecruiterDashboardScreen";
import ManageJobsScreen from "./screens/ManageJobsScreen";
import JobSeekerDashboardScreen from "./screens/JobSeekerDashboardScreen";
import AvailableJobsScreen from "./screens/AvailableJobsScreen";
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import JobDetailsScreen from "./screens/JobDetailsScreen";
import ApplicationsScreen from "./screens/ApplicationsScreen";
import ApplicationDetailsScreen from "./screens/ApplicationDetailsScreen";
import AppliedJobs from "./screens/AppliedJobs";
import JobWiseApplicationsScreen from "./screens/JobWiseApplicationsScreen";
import SavedJobsScreen from "./screens/SavedJobsScreen";




const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PaperProvider>
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ProfileCreationScreen" component={ProfileCreationScreen} />
          <Stack.Screen name="RecruiterProfileScreen" component={RecruiterProfileScreen} />
          <Stack.Screen name="JobPostingScreen" component={JobPostingScreen} />
          <Stack.Screen name="RecruiterDashboardScreen" component={RecruiterDashboardScreen} />
          <Stack.Screen name="ManageJobsScreen" component={ManageJobsScreen} />
          <Stack.Screen name="JobSeekerDashboardScreen" component={JobSeekerDashboardScreen} />
          <Stack.Screen name="AvailableJobsScreen" component={AvailableJobsScreen} />
          <Stack.Screen name="JobDetailsScreen" component={JobDetailsScreen} />
          <Stack.Screen name="ApplicationsScreen" component={ApplicationsScreen} />
          <Stack.Screen name="ApplicationDetailsScreen" component={ApplicationDetailsScreen} />
          <Stack.Screen name="AppliedJobs" component={AppliedJobs} />
          <Stack.Screen name="JobWiseApplicationsScreen" component={JobWiseApplicationsScreen} />
          <Stack.Screen name="SavedJobsScreen" component={SavedJobsScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* ✅ Make sure no text is floating outside */}
      <Toast />
    </AuthProvider>
    </PaperProvider>
    </GestureHandlerRootView>

  );
}
registerRootComponent(App);
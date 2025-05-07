import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { loginUser } from "../auth/authService";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";
import { resetPassword } from "../auth/authService";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const user = await loginUser(email, password);
    setLoading(false);

    if (user) {
      Toast.show({
        type: "success",
        text1: "🎉 Welcome Back!",
        text2: "Redirecting...",
      });

      if (user.role === "job_seeker") {
        // ✅ Redirect job seekers
        if (user.isProfileComplete) {
          navigation.replace("JobSeekerDashboardScreen");
        } else {
          navigation.replace("ProfileCreationScreen");
        }
      } else if (user.role === "recruiter") {
        // ✅ Check if recruiter profile exists before redirecting

        if (user.isProfileComplete) {
          navigation.replace("RecruiterDashboardScreen");
        } else {
          navigation.replace("RecruiterProfileScreen");
        }
      } else {
        setErrorMessage("Invalid user role. Please contact support.");
        setShowSnackbar(true);
      }
    } else {
      setErrorMessage("Invalid email or password. Please try again.");
      setShowSnackbar(true);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Toast.show({ type: "error", text1: "Enter your email first!" });
      return;
    }
    await resetPassword(email);
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>
      </View>

      {/* Add this form container */}
      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input} // Add this
         textColor="#64748b" // Direct prop for text color

          left={<TextInput.Icon icon="email" color="#64748b" />}
          theme={{ colors: { primary: '#4f46e5' } }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5"
        />

        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input} // Add this
          textColor="#64748b" // Direct prop for text color 
        
          left={<TextInput.Icon icon="lock" color="#64748b" />}
          theme={{ colors: { primary: '#4f46e5' } }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5"
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          labelStyle={{ 
            color: "#fff", 
            fontSize: 16, 
            fontWeight: "600", 
            letterSpacing: 0.5 
          }}
          icon="login"
        >
          {loading ? "Signing In..." : "Continue"}
        </Button>

        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.link}>
              Don't have an account? {' '}
              <Text style={styles.linkHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        action={{ label: "OK", onPress: () => setShowSnackbar(false) }}
      >
        {errorMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fafafa',
    padding: 24,
    paddingTop: 80
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    paddingTop: 40
  },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    textAlign: "center", 
    marginBottom: 8, // Reduced margin
    color: "#1e293b", // Darker color
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center'
  },
  // Add form container styles
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12 // Matched radius
  },
  button: { 
    marginVertical: 10,
    borderRadius: 50, // Matched radius
    paddingVertical: 6, // Taller button
    backgroundColor: '#4f46e5',
  },
  linksContainer: {
    marginTop: 10,
    gap: 12
  },
  link: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14
  },
  linkHighlight: {
    color: '#4f46e5',
    fontWeight: '600',
    textDecorationLine: 'underline'
  }, 
   snackbar: {
    backgroundColor: '#1e293b',
    marginBottom: 24
  }

});
export default LoginScreen;














































// import React, { useState } from "react";
// import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
// import { TextInput, Button } from "react-native-paper";
// import { loginUser } from "../auth/authService";
// import { StackNavigationProp } from "@react-navigation/stack";

// type SignUpScreenProps = {
//   navigation: StackNavigationProp<any>; // ✅ Minimal change
// };

// const LoginScreen = ({ navigation }: SignUpScreenProps) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = async () => {
//     const role = await loginUser(email, password);
//     console.log("User Role:", role);
//   };

//   return (
//     <View style={styles.container}>
//       {/* <Image source={require("../assets/login.png")} style={styles.image} /> */}
//       <Text style={styles.title}>Login</Text>
//       <TextInput
//         label="Email"
//         mode="outlined"
//         value={email}
//         onChangeText={setEmail}
//         style={styles.input}
//       />
//       <TextInput
//         label="Password"
//         mode="outlined"
//         secureTextEntry
//         value={password}
//         onChangeText={setPassword}
//         style={styles.input}
//       />
//       <Button mode="contained" onPress={handleLogin} style={styles.button}>
//         Login
//       </Button>
//       <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
//         <Text style={styles.link}>Don't have an account? Sign Up</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
//   image: { width: 200, height: 200, alignSelf: "center", marginBottom: 20 },
//   title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
//   input: { marginBottom: 15 },
//   button: { marginVertical: 10 },
//   link: { color: "blue", textAlign: "center", marginTop: 10 },
// });

// export default LoginScreen;

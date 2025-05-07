import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { signUpUser } from "../auth/authService";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

const SignUpScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("job_seeker");

  const handleSignUp = async () => {
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    await signUpUser(email, password, role);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Join Our Community</Text>
        <Text style={styles.subtitle}>Create your account to get started</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          textColor="#64748b"
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
          style={styles.input}
          textColor="#64748b"
          left={<TextInput.Icon icon="lock" color="#64748b" />}
          theme={{ colors: { primary: '#4f46e5' } }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4f46e5"
        />

        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[
              styles.roleButton, 
              role === 'job_seeker' && styles.selectedRole
            ]}
            onPress={() => setRole("job_seeker")}
          >
            <Icon 
              name={role === 'job_seeker' ? "account-check" : "account"} 
              size={24} 
              color={role === 'job_seeker' ? '#4f46e5' : '#64748b'} 
            />
            <Text style={[
              styles.roleText,
              role === 'job_seeker' && styles.selectedRoleText
            ]}>
              Job Seeker
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.roleButton, 
              role === 'recruiter' && styles.selectedRole
            ]}
            onPress={() => setRole("recruiter")}
          >
            <Icon 
              name={role === 'recruiter' ? "briefcase-check" : "briefcase"} 
              size={24} 
              color={role === 'recruiter' ? '#4f46e5' : '#64748b'} 
            />
            <Text style={[
              styles.roleText,
              role === 'recruiter' && styles.selectedRoleText
            ]}>
              Recruiter
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={handleSignUp}
        >
          <Text style={styles.registerText}>Create Account</Text>
          <Icon name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.linkText}>
            Already have an account? {' '}
            <Text style={styles.linkHighlight}>Login here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fafafa',
    padding: 24,
    paddingTop: 60

  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    paddingTop: 40
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center'
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 1
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  selectedRole: {
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff'
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b'
  },
  selectedRoleText: {
    color: '#4f46e5'
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    marginTop: 16
  },
  registerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center'
  },
  linkText: {
    color: '#64748b',
    fontSize: 14
  },
  linkHighlight: {
    color: '#4f46e5',
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});

export default SignUpScreen;

// // NotificationService.ts
// import messaging from '@react-native-firebase/messaging';
// import { getFirestore, doc, setDoc } from 'firebase/firestore';
// import { auth } from './firebaseConfig';

// export async function registerForPushNotifications() {
//   const authStatus = await messaging().requestPermission();
//   if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//       authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
//     const fcmToken = await messaging().getToken();
//     if (fcmToken && auth.currentUser) {
//       const db = getFirestore();
//       // Save token under users/{uid}/fcmToken
//       await setDoc(doc(db, 'users', auth.currentUser.uid), { fcmToken }, { merge: true });
//     }
//   }
// }

// // Call this once (e.g. in App.tsx after login)

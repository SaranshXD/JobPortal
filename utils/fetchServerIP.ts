// import { discoverServerIP } from "./discoverServerIP";

// export const getServerIP = async (): Promise<string> => {
//   try {
//     const response = await fetch("http://192.168.150.66:5000/get-ip"); // Replace with static initial IP
//     const data = await response.json();
//     return data.server_ip; // ✅ Get latest IP dynamically
//   } catch (error) {
//     console.error("Server IP fetch error:", error);
//     return "http://192.168.43.1:5000"; // ✅ Use fallback IP
//   }
// };
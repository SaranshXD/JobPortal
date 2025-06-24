# 🚀 Welcome to Your Expo App 👋

This project was created with [create-expo-app](https://www.npmjs.com/package/create-expo-app) and uses [Expo](https://expo.dev) to enable cross-platform React Native development.

---

## 📦 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npx expo start
   ```
   Then choose to run on:
   - 📱 **Expo Go** (mobile preview)
   - 🤖 **Android Emulator**
   - 🍎 **iOS Simulator**
   - 🧪 **Development Build**

You can begin editing code in the **`app/`** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction) for navigation.

---

## 🛠️ Reset Project (Optional)

If you want a fresh start:

```bash
npm run reset-project
```

This moves boilerplate code into **`app-example/`** and leaves a clean **`app/`** directory.

---

## 📁 Project Structure

```
MYJOBPORTAL/
├── .expo/                      # Expo internals
├── .venv/                      # Python virtual environment
├── app/                        # Main app source with file-based routing
├── assets/                     # Static assets (images, fonts, etc.)
├── auth/                       # Authentication-related logic
├── backend/
│   ├── uploads/                # Uploaded files (e.g. resumes)
│   │   └── <resume-file>
│   ├── app.py                  # Python backend entrypoint
│   └── requirements.txt        # Python dependencies
├── components/                 # Reusable UI components
├── constants/                  # App constants (e.g. strings, colors)
├── context/                    # Global React contexts
├── hooks/                      # Custom React hooks
├── node_modules/               # Installed npm packages
├── screens/                    # All app screens
├── scripts/                    # Dev/utility scripts
├── utils/                      # Utility functions
│   ├── fetchServerIP.ts
│   ├── NotificationService.ts
│   ├── resumeParser.ts
│   └── uploadHelper.ts
├── .gitignore
├── android.os.Handler          # Placeholder file (check usage)
├── app.json                    # Expo app configuration
├── App.tsx                     # Root component
├── expo-env.d.ts               # TypeScript env declarations
├── firebaseConfig.ts           # Firebase configuration
├── index.js                    # Entry point for some JS runtime
├── java.lang.Thread            # Placeholder file (check usage)
├── package.json
├── package-lock.json
├── README.md                   # Project documentation
├── render.yaml                 # Render deployment config
├── test.py                     # Python test script for backend
├── tsconfig.json               # TypeScript config
```

---

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Guides](https://docs.expo.dev/guides)
- [Learn Expo Tutorial](https://docs.expo.dev/tutorial/introduction)

---

## 💬 Community

- [Expo GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)

---

## 📸 Screenshots
<p float="left">
  <img src="https://github.com/user-attachments/assets/cd15d1d6-4e75-45e8-922d-f14cd9785eaa" width="200" />
  <img src="https://github.com/user-attachments/assets/3b1da7fd-1cfb-4b03-bcfc-ca8dba94712a" width="200" />
  <img src="https://github.com/user-attachments/assets/60f7d17c-70e4-4d7a-9ecb-aa84d505ec62" width="200" />
  <img src="https://github.com/user-attachments/assets/e72a05a8-0636-48a8-8da5-7ecd999c580a" width="200" />
  <img src="https://github.com/user-attachments/assets/1ffe2d03-efad-44a3-8654-0c85ac8666f3" width="200" />
  <img src="https://github.com/user-attachments/assets/f9b0719f-e669-4e33-8c0d-b4c1ef7edf67" width="200" />
</p>

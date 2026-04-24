import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyA4pcqP1U5r8dRka2zFlUhfB4KRjCW7I30",
  authDomain: "gerenjizhang-457a3.firebaseapp.com",
  projectId: "gerenjizhang-457a3",
  storageBucket: "gerenjizhang-457a3.firebasestorage.app",
  messagingSenderId: "189285457005",
  appId: "1:189285457005:web:3164bde98dd6517a7fb364",
  measurementId: "G-7J941DKSCX"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 匿名登录
const signInAnonymouslyUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous sign-in failed:", error);
    return null;
  }
};

// 数据同步相关函数
export const syncData = {
  // 保存数据到 Firestore（带重试机制）
  saveData: async (userId: string, data: any, retries = 3) => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        await setDoc(doc(db, "users", userId), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log("Data saved to Firestore");
        return true;
      } catch (error) {
        lastError = error;
        console.error(`Error saving data to Firestore (attempt ${i + 1}/${retries}):`, error);
        if (i < retries - 1) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    console.error("Failed to save data to Firestore after multiple attempts:", lastError);
    throw lastError;
  },

  // 从 Firestore 获取数据
  getData: async (userId: string) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("Data retrieved from Firestore");
        return docSnap.data();
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error getting data from Firestore:", error);        
      return null;
    }
  },

  // 监听数据变化
  listenToData: (userId: string, callback: (data: any) => void) => {     
    const docRef = doc(db, "users", userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }
};

export { auth, db, signInAnonymouslyUser };
export default app;

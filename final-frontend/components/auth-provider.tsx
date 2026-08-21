"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth" // Import from client SDK
import { auth } from "../firebase" // Import client-side firebase auth instance

type Clinic = {
  id: string
  name: string
  address: string
  phone: string
  email: string
  created_at: string
  doctors: Doctor[]
  accessToken?: string
}

type Doctor = {
  id: string
  name: string
  gender: string
  specialty: string
  email: string
  qualification?: string
  phone?: string
  date_of_birth?: string
  experience_years?: number
  avatar_url?: string
  schedules: DoctorSchedule[]
}

type DoctorSchedule = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
}

type AuthContextType = {
  clinic: Clinic | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean // Indicates if auth state is being determined
  user: any
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clinic, setClinic] = React.useState<Clinic | null>(null)
  const [isLoading, setIsLoading] = React.useState(true) // Start as true
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<any>(null);

  // 1. Load clinic data from localStorage on initial render
  React.useEffect(() => {
    const savedClinicData = localStorage.getItem("clinicData")
    console.log("AuthProvider: Initializing - savedClinicData:", savedClinicData);
    if (savedClinicData) {
      setClinic(JSON.parse(savedClinicData))
      console.log("AuthProvider: Initial clinic from localStorage:", JSON.parse(savedClinicData));
    }
    setIsLoading(false) // Once loaded from localStorage (or not found), set to false
  }, []) // Run only once on mount

  // 2. Handle navigation based on auth state and loading status
  React.useEffect(() => {
    console.log("AuthProvider: Navigation useEffect - isLoading:", isLoading, "pathname:", pathname, "isAuthenticated:", !!clinic);
    if (isLoading) { // Do nothing while authentication state is being determined
      return
    }

    const isOnLoginPage = pathname === "/login"
    const isAuthenticated = !!clinic // Check if clinic data exists

    if (!isAuthenticated && !isOnLoginPage) {
      // If not authenticated and not on login page, redirect to login
      console.log("AuthProvider: Redirecting to /login");
      router.push("/login")
    } else if (isAuthenticated && isOnLoginPage) {
      // If authenticated and on login page, redirect to dashboard
      console.log("AuthProvider: Redirecting to /dashboard");
      router.push("/dashboard")
    }
  }, [clinic, isLoading, pathname, router]) // Depend on clinic, isLoading, pathname

  // Listen to Firebase auth state changes
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true) // Set loading true during login attempt
    try {
      // 1. Authenticate with Firebase on the client-side
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      console.log("Frontend: Firebase ID Token acquired:", idToken);

      // 2. Send the ID token to your backend for verification and clinic data
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/clinics/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Send ID token in Authorization header
        },
        body: JSON.stringify({ email }), // Only email is needed now, password is handled client-side
      })

      const data = await response.json()

      if (!response.ok) {
        // Backend error response will be caught here
        throw new Error(data.message || "Backend login failed");
      }

      localStorage.setItem("clinicToken", data.data.token)
      // Add the accessToken to the clinic object before storing
      const clinicWithToken = {
        ...data.data.clinic,
        accessToken: data.data.token
      }
      localStorage.setItem("clinicData", JSON.stringify(clinicWithToken))
      setClinic(clinicWithToken) // Update clinic state with token, which will trigger the useEffect for navigation
      console.log("AuthProvider: Login successful, clinic data set:", data.data.clinic);
      return true
    } catch (error: any) { // Explicitly type error as 'any' for simpler handling of Firebase errors
      console.error("Login error:", error);
      // Firebase authentication errors
      if (error.code === "auth/invalid-email" || error.code === "auth/user-disabled" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        // Specific Firebase errors that mean invalid credentials
        console.error("Firebase Auth Error:", error.message);
        // We will let the login page display the toast for these errors
      } else if (error instanceof Error) {
        // General JavaScript errors or backend errors
        console.error("General Error during login:", error.message);
      }
    return false
    } finally {
      setIsLoading(false) // Always set loading to false after attempt
    }
  }

  const logout = async () => {
    await auth.signOut();
    setClinic(null);
    localStorage.removeItem("clinicToken");
    localStorage.removeItem("clinicData");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ clinic, login, logout, isLoading, user }}>
      {/* Render children only when not loading, or if the route is /login to avoid blank screen */}
      {isLoading && !pathname?.startsWith("/login") ? (
        <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"



export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password);

      if (success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to Care Q!',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Login Failed',
        description: errorMessage || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left side - Medical image */}
      <div className="hidden md:block md:w-1/2 relative">
        <Image
          src="/medical-background.jpg"
          alt="Medical professional with stethoscope"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/careq-logo.jpg" alt="CareQ Logo" width={180} height={50} priority />
          </div>

          {/* Login form */}
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-800">Sign In for CatchQ</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demoadmin@gmail.com"
                  className="w-full p-2 border rounded-md bg-gray-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gray-50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-2 px-4 rounded-md text-white font-medium"
                style={{ backgroundColor: "#164772" }}
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

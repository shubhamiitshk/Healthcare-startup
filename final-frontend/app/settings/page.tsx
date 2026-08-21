"use client"

import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import * as React from "react"
import { auth } from "@/firebase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCheck } from "lucide-react"

export default function SettingsPage() {
  const { clinic } = useAuth()
  const [showChangePasswordModal, setShowChangePasswordModal] = React.useState(false)
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get the current Firebase user and their ID token
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/clinics/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed");
      }

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });

      setShowChangePasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Password change failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setShowChangePasswordModal(false)
  }

  return (
    <Layout>
      <style jsx global>{`
        @media (min-width: 768px) {
          .appointments-sidebar {
            width: 12rem !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] py-10 px-2 md:px-8 flex flex-col items-center">
        {/* Profile Card */}
        <Card className="w-full max-w-2xl mb-8 shadow-lg border-0 bg-white/90">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
            <Avatar className="w-20 h-20 border-4 border-[#1BBA8D] shadow-md bg-white">
              <AvatarFallback className="w-full h-full flex items-center justify-center text-[#1BBA8D] bg-white">
                <UserCheck className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="text-2xl font-bold text-[#164772]">{clinic?.name || "Clinic Name"}</div>
              <div className="text-gray-500 mt-1">{clinic?.email || "demoadmin@gmail.com"}</div>
              {clinic?.address && <div className="text-gray-400 text-sm mt-1">{clinic.address}</div>}
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <div className="w-full max-w-2xl space-y-8">
          {/* Login Credentials Card */}
          <Card className="shadow border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#164772]">Login Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-600">
                    Email Address
                  </Label>
                  <div className="text-gray-900 font-medium">{clinic?.email || "demoadmin@gmail.com"}</div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-600">
                    Password
                  </Label>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 font-medium tracking-widest">••••••••••••</div>
                    <Button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="bg-[#164772] hover:bg-[#164772]/90 text-white px-6 py-2 rounded-md transition-all duration-200 hover:scale-105 shadow"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-[#164772]">Change Password</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Old Password */}
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-sm text-gray-600">
                    Old Password
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    placeholder="Enter old password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border-gray-300 focus:border-[#164772] focus:ring-[#164772] transition-all duration-200"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm text-gray-600">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border-gray-300 focus:border-[#164772] focus:ring-[#164772] transition-all duration-200"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm text-gray-600">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-Enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border-gray-300 focus:border-[#164772] focus:ring-[#164772] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="bg-[#164772] hover:bg-[#164772]/90 text-white px-6 py-2 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

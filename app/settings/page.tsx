// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUserDisplayName,
  getUserPhotoUrl,
  onAuthStateChanged,
  signOutUser,
  updateUserProfile,
  type AppUser,
} from "@/lib/auth";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempPhotoURL, setTempPhotoURL] = useState(""); 
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setName(getUserDisplayName(currentUser));
        setEmail(currentUser.email || "");

        const savedPhoto = localStorage.getItem(`profilePhoto_${currentUser.id}`);
        if (savedPhoto) {
          setTempPhotoURL(savedPhoto);
        } else {
          setTempPhotoURL(getUserPhotoUrl(currentUser) || "/hmq.jpeg");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Please select an image smaller than 500KB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setTempPhotoURL(base64);

      if (user) {
        localStorage.setItem(`profilePhoto_${user.id}`, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedUser = await updateUserProfile({
        name,
        email: email !== user.email ? email : undefined,
      });

      setUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const router = useRouter();

const handleSignOut = async () => {
  try {
    await signOutUser();
    router.push("/");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};


  

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500">Please sign in to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account */}
        <Card className="rounded-2xl shadow">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar 
                  src={isEditing ? tempPhotoURL : (tempPhotoURL || "/hmq.jpeg")} 
                  alt="Profile" 
                  className="w-12 h-12"
                />
                {isEditing && (
                  <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full text-xs cursor-pointer">
                    ✎
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">Account</h2>
                <p className="text-sm text-gray-500">Manage your personal information</p>
              </div>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Name</span>
                    <span className="text-gray-600">{getUserDisplayName(user)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Email</span>
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">User ID</span>
                    <span className="text-gray-600 text-xs">{user.id.slice(0, 8)}...</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setName(getUserDisplayName(user));
                      setEmail(user.email || "");
                      const savedPhoto = localStorage.getItem(`profilePhoto_${user.id}`);
                      setTempPhotoURL(savedPhoto || getUserPhotoUrl(user) || "/hmq.jpeg");
                    }}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Edit Account
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="rounded-2xl shadow">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Appearance</h2>
            <p className="text-sm text-gray-500">Customize the look and feel of the app.</p>
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl shadow">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-gray-500">Control how you receive alerts.</p>
            <div className="flex items-center justify-between">
              <span>Email Receipts</span>
              <Switch checked={emailReceipts} onCheckedChange={setEmailReceipts} />
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card className="rounded-2xl shadow">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">General</h2>
            <p className="text-sm text-gray-500">Application details and support.</p>
            <Button className="w-full">Help & Support</Button>
            <Button variant="outline" className="w-full">
              About App
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

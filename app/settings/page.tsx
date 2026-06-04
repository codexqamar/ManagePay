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
      <div className="p-6 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500">Please sign in to manage your account settings.</p>
        <Button onClick={() => router.push("/")}>Return to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-10 px-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm font-medium text-slate-500">Manage your profile, billing, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Navigation Tabs Placeholder - Modern SaaS style sidebar settings */}
        <div className="lg:col-span-1 space-y-1">
          <Button variant="ghost" className="w-full justify-start font-bold bg-slate-100 text-primary">General</Button>
          <Button variant="ghost" className="w-full justify-start font-semibold text-slate-500 hover:text-slate-900">Billing</Button>
          <Button variant="ghost" className="w-full justify-start font-semibold text-slate-500 hover:text-slate-900">Security</Button>
          <Button variant="ghost" className="w-full justify-start font-semibold text-slate-500 hover:text-slate-900">API Keys</Button>
          <Button variant="ghost" className="w-full justify-start font-semibold text-slate-500 hover:text-slate-900">Members</Button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Public Profile</h2>
                <p className="text-xs text-slate-500 font-medium">This information will be visible across your enterprise.</p>
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="font-bold">{saving ? "Saving..." : "Save"}</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="font-bold">Cancel</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="font-bold">Edit Profile</Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar 
                  src={isEditing ? tempPhotoURL : (tempPhotoURL || "/hmq.jpeg")} 
                  alt="Profile" 
                  className="w-20 h-20 ring-4 ring-white shadow-sm border border-slate-200"
                />
                {isEditing && (
                  <label htmlFor="photo-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 transition-colors">
                    Change Photo
                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                  {isEditing ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-slate-200 font-semibold" />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 h-10 flex items-center">{getUserDisplayName(user)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                  {isEditing ? (
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 border-slate-200 font-semibold" />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 h-10 flex items-center">{user.email}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="space-y-6 pt-8 border-t border-slate-200">
             <div>
                <h2 className="text-xl font-bold text-slate-900">Application Preferences</h2>
                <p className="text-xs text-slate-500 font-medium">Customize your dashboard experience.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 bg-white pro-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-700">Dark Mode</p>
                      <p className="text-[11px] text-slate-400 font-medium">Toggle between light and dark UI.</p>
                    </div>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white pro-shadow">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-700">Email Alerts</p>
                      <p className="text-[11px] text-slate-400 font-medium">Receive real-time payment notifications.</p>
                    </div>
                    <Switch checked={emailReceipts} onCheckedChange={setEmailReceipts} />
                  </CardContent>
                </Card>
              </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-10">
            <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-xl space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider">Security Actions</h3>
                <p className="text-xs text-rose-600/70 font-medium">Protect your account and managed sessions.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleSignOut} className="bg-white text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-xs h-9">
                  Sign Out of All Sessions
                </Button>
                <Button variant="ghost" className="text-rose-400 hover:text-rose-600 font-bold text-xs h-9">
                  Reset API Keys
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

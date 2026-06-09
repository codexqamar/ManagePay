// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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
  updateUserProfile,
} from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/lib/store";
import { 
  getInvoiceServices, 
  createInvoiceService, 
  deleteInvoiceServiceRecord 
} from "@/lib/database";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { invoiceServices, setInvoiceServices } = useAppStore();
  const { user, loading, logout } = useAuth();
  
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPhotoURL, setTempPhotoURL] = useState(""); 
  const [saving, setSaving] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (user) {
      setName(getUserDisplayName(user));
      setEmail(user.email || "");

      const savedPhoto = localStorage.getItem(`profilePhoto_${user.id}`);
      if (savedPhoto) {
        setTempPhotoURL(savedPhoto);
      } else {
        setTempPhotoURL(getUserPhotoUrl(user) || "");
      }

      // Fetch services from Supabase
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const services = await getInvoiceServices();
          setInvoiceServices(services.map(s => ({ id: s.id, name: s.name })));
        } catch (error) {
          console.error("Error fetching services:", error);
        } finally {
          setLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [user, setInvoiceServices]);

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
      await updateUserProfile({
        name,
        email: email !== user.email ? email : undefined,
        photoUrl: tempPhotoURL || undefined,
      });

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
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAddService = async () => {
    const serviceName = newServiceName.trim();
    if (!serviceName) return;

    try {
      const newService = await createInvoiceService({ name: serviceName, description: null, default_rate: 0 });
      if (newService) {
        setInvoiceServices([...invoiceServices, { id: newService.id, name: newService.name }]);
        setNewServiceName("");
      }
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service. Check console for details.");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const success = await deleteInvoiceServiceRecord(id);
      if (success) {
        setInvoiceServices(invoiceServices.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service.");
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 px-4 py-8 sm:px-6 animate-pulse">
        <div className="h-8 w-48 bg-hairline rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-canvas rounded mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h1 className="text-heading-lg font-bold text-ink">Access Denied</h1>
        <p className="text-body-md text-ink-mute">Please sign in to manage your account settings.</p>
        <Button onClick={() => router.push("/")} className="rounded-md">Return to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-6 sm:px-6 lg:py-8">
      {/* Page Header */}
      <div className="space-y-1 border-b border-hairline pb-6">
        <h1 className="text-display-md font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-body-md font-medium text-ink-mute">Manage your profile, billing, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Navigation Tabs Placeholder - Modern SaaS style sidebar settings */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-hairline bg-canvas p-1.5 shadow-sm">
            <Button variant="ghost" className="w-full justify-start rounded-md bg-canvas-soft font-bold text-primary">General</Button>
            <Button variant="ghost" className="w-full justify-start rounded-md font-semibold text-ink-mute hover:text-ink">Billing</Button>
            {user.role === "admin" && (
              <Button
                variant="ghost"
                onClick={() => scrollToSection("invoice-services")}
                className="w-full justify-start rounded-md font-semibold text-ink-mute hover:text-ink"
              >
                Invoice Services
              </Button>
            )}
            <Button variant="ghost" className="w-full justify-start rounded-md font-semibold text-ink-mute hover:text-ink">Security</Button>
            <Button variant="ghost" className="w-full justify-start rounded-md font-semibold text-ink-mute hover:text-ink">API Keys</Button>
            <Button variant="ghost" className="w-full justify-start rounded-md font-semibold text-ink-mute hover:text-ink">Members</Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <section className="space-y-6 rounded-lg border border-hairline bg-canvas p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-hairline pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-heading-lg font-bold text-ink">Public Profile</h2>
                <p className="text-caption font-medium text-ink-mute">This information will be visible across your enterprise.</p>
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-md font-bold">{saving ? "Saving..." : "Save"}</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="rounded-md border-hairline font-bold">Cancel</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="rounded-md border-hairline font-bold">Edit Profile</Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar 
                  src={tempPhotoURL} 
                  alt="Profile" 
                  className="w-20 h-20 ring-4 ring-canvas-soft shadow-sm border border-hairline"
                />
                {isEditing && (
                  <label htmlFor="photo-upload" className="cursor-pointer bg-canvas-soft hover:bg-canvas text-ink-secondary px-3 py-1.5 rounded-md text-xs font-bold border border-hairline transition-colors">
                    Change Photo
                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-ink-mute">Full name</Label>
                  {isEditing ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-hairline font-semibold" />
                  ) : (
                    <p className="text-sm font-bold text-ink-secondary h-10 flex items-center">{getUserDisplayName(user)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-ink-mute">Email Address</Label>
                  {isEditing ? (
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 border-hairline font-semibold" />
                  ) : (
                    <p className="text-sm font-bold text-ink-secondary h-10 flex items-center">{user.email}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="space-y-6 rounded-lg border border-hairline bg-canvas p-5 shadow-sm sm:p-6">
             <div>
                <h2 className="text-heading-lg font-bold text-ink">Application Preferences</h2>
                <p className="text-caption font-medium text-ink-mute">Customize your dashboard experience.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-hairline bg-canvas-soft shadow-none rounded-lg">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-ink-secondary">Dark Mode</p>
                      <p className="text-[11px] text-ink-mute font-medium">Toggle between light and dark UI.</p>
                    </div>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </CardContent>
                </Card>

                <Card className="border-hairline bg-canvas-soft shadow-none rounded-lg">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-ink-secondary">Email Alerts</p>
                      <p className="text-[11px] text-ink-mute font-medium">Receive real-time payment notifications.</p>
                    </div>
                    <Switch checked={emailReceipts} onCheckedChange={setEmailReceipts} />
                  </CardContent>
                </Card>
              </div>
          </section>

          {user.role === "admin" && (
            <section id="invoice-services" className="scroll-mt-6 space-y-5 rounded-lg border border-hairline bg-canvas p-5 shadow-sm sm:p-6">
              <div>
                <h2 className="text-heading-lg font-bold text-ink">Invoice Services</h2>
                <p className="text-caption font-medium text-ink-mute">Services shown in invoice line item pickers.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={newServiceName}
                  onChange={(event) => setNewServiceName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddService();
                    }
                  }}
                  placeholder="Service name"
                  className="h-10 border-hairline font-semibold"
                />
                <Button onClick={handleAddService} className="h-10 rounded-md font-bold sm:w-36">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="rounded-lg border border-hairline bg-canvas-soft">
                {invoiceServices.length > 0 ? (
                  <div className="divide-y divide-hairline">
                    {invoiceServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-bold text-ink-secondary">{service.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          className="h-8 w-8 rounded-md text-ink-mute hover:text-ruby"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm font-medium text-ink-mute">
                    No services added yet.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section>
            <div className="p-5 bg-ruby/5 border border-ruby/15 rounded-lg space-y-4 sm:p-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-ruby uppercase tracking-wider">Security Actions</h3>
                <p className="text-xs text-ruby/70 font-medium">Protect your account and managed sessions.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={handleSignOut} className="bg-canvas text-ruby border-ruby/20 hover:bg-ruby/10 font-bold text-xs h-9 rounded-md">
                  Sign Out of All Sessions
                </Button>
                <Button variant="ghost" className="text-ruby/60 hover:text-ruby hover:bg-ruby/10 font-bold text-xs h-9 rounded-md">
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

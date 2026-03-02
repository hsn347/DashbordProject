import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    User, Mail, Camera, Save, Loader2, CheckCircle2, Shield
} from "lucide-react";
import { supabase111 } from "../lib/supabaseq";
import { useProfile } from "../hooks/useProfiles"; // Now exports useProfile
import { useManageProfile } from "../hooks/useManageProfile";

export default function Profiles() {
    // Auth State
    const [session, setSession] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch Profile
    const { data: profile, isLoading } = useProfile(currentUser?.id);
    const manageProfile = useManageProfile();

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        avatar_url: ""
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Load Session
    useEffect(() => {
        supabase111.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setCurrentUser(session?.user || null);
        });

        const {
            data: { subscription },
        } = supabase111.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setCurrentUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load Profile Data into Form
    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || "",
                full_name: profile.full_name || "",
                avatar_url: profile.avatar_url || ""
            });
            setAvatarPreview(profile.avatar_url);
        }
    }, [profile]);

    // Handle File Upload
    const handleFileChange = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            setAvatarPreview(URL.createObjectURL(file));

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Bucket: profiles-images
            let { error: uploadError } = await supabase111.storage
                .from('products-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase111.storage
                .from('products-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            alert("Error uploading avatar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Handle Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (formData.username.length < 3) {
            alert("Username must be at least 3 characters long.");
            return;
        }
        if (!currentUser?.id) {
            alert("You must be logged in to update your profile.");
            return;
        }

        manageProfile.mutate({
            id: currentUser.id,
            profileData: {
                username: formData.username,
                full_name: formData.full_name,
                avatar_url: formData.avatar_url
                // updated_at is handled by trigger
            }
        }, {
            onSuccess: () => {
                alert("Profile updated successfully!");
            },
            onError: (err) => {
                alert("Error: " + err.message);
            }
        });
    };

    if (isLoading && currentUser) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-accent-primary" size={40} /></div>;
    }

    if (!currentUser) {
        return <div className="p-20 text-text-muted text-center">Please log in to view your profile.</div>;
    }

    return (
        <div className="space-y-8 mx-auto max-w-4xl">
            <div>
                <h1 className="mb-1 font-bold text-text-primary text-3xl">My Profile</h1>
                <p className="text-text-muted">Manage your personal information and settings.</p>
            </div>

            <div className="bg-bg-surface/50 shadow-xl backdrop-blur-xl p-8 border border-border-subtle rounded-3xl">
                <div className="flex items-center gap-3 mb-8 pb-6 border-border-subtle/50 border-b">
                    <div className="p-3 rounded-xl bg-accent-primary/10 text-accent-primary">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-text-primary text-lg">Profile Details</h2>
                        <p className="text-text-muted text-sm">Update your photo and personal details here.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Avatar Selection */}
                    <div className="flex md:flex-row flex-col items-center gap-8">
                        <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex justify-center items-center bg-bg-main shadow-2xl border-4 border-bg-surface rounded-full w-40 h-40 overflow-hidden group-hover:scale-105 transition-transform">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-text-muted/30" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 flex justify-center items-center bg-black/50">
                                        <Loader2 className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="right-1 bottom-1 absolute shadow-lg p-3 border-4 border-bg-surface rounded-full text-white transition-colors bg-accent-primary group-hover:bg-accent-secondary">
                                <Camera size={20} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2 md:text-left text-center">
                            <h3 className="font-medium text-text-primary">Profile Photo</h3>
                            <p className="max-w-xs text-text-muted text-sm">
                                This will be displayed on your profile.
                                <br />Allowed formats: JPG, PNG.
                            </p>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6 max-w-2xl">
                        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                        placeholder="@username"
                                    />
                                    <CheckCircle2 size={18} className={`absolute right-4 top-3.5 transition-opacity ${formData.username.length >= 3 ? "text-green-500 opacity-100" : "opacity-0"}`} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block ml-1 font-bold text-text-secondary text-xs uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="bg-input-bg px-4 py-3.5 border border-transparent focus:border-accent-primary rounded-xl focus:outline-none focus:ring-1 w-full text-text-primary placeholder:text-text-muted/50 transition-all focus:ring-accent-primary"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        {/* Read-Only Info */}
                        <div className="flex justify-between items-center bg-bg-surface opacity-70 p-4 border border-border-subtle rounded-xl">
                            <div>
                                <label className="block mb-1 font-bold text-text-secondary text-xs uppercase tracking-wider">User ID</label>
                                <code className="block font-mono text-text-muted text-xs">{currentUser?.id}</code>
                            </div>
                            <div className="bg-bg-main p-2 rounded-lg text-text-muted">
                                <Shield size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-6 border-border-subtle border-t">
                        <button
                            type="submit"
                            disabled={manageProfile.isPending || uploading}
                            className="flex items-center gap-2 bg-gradient-to-r disabled:opacity-70 hover:shadow-lg px-8 py-3.5 rounded-xl font-bold text-white active:scale-95 transition-all from-accent-primary to-accent-secondary hover:shadow-accent-primary/25 disabled:cursor-not-allowed"
                        >
                            {manageProfile.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
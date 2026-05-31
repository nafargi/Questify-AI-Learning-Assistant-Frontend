import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const BASE_URL = "http://0.0.0.0:8000/api";

export interface FullProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  peak_performance_time: string | null;
  total_study_hours: number;
  exams_completed: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await api.get<FullProfile>("/auth/user/profile/full");
    if (res.success) {
      setProfile(res.data);
      fetchAvatar();
    }
    setLoading(false);
  };

  const fetchAvatar = async () => {
    const token = localStorage.getItem("questify-token");
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/user/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
        const blob = await res.blob();
        setAvatarUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
      } else {
        setAvatarUrl(null);
      }
    } catch {
      setAvatarUrl(null);
    }
  };

  const updateProfile = async (data: { full_name?: string; peak_performance_time?: string }) => {
    const res = await api.patch<FullProfile>("/auth/user/profile", data);
    if (!res.success) { toast.error(res.message); return false; }
    setProfile(res.data);
    toast.success("Profile updated");
    return true;
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.putForm("/auth/user/profile/avatar", form);
    if (!res.success) { toast.error(res.message); return false; }
    await fetchAvatar();
    toast.success("Avatar updated");
    return true;
  };

  const deleteAvatar = async () => {
    const res = await api.delete("/auth/user/profile/avatar");
    if (!res.success) { toast.error(res.message); return false; }
    setAvatarUrl(null);
    setProfile((p) => p ? { ...p, avatar_url: null } : p);
    toast.success("Avatar removed");
    return true;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const res = await api.patch("/auth/user/password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
    if (!res.success) { toast.error(res.message); return false; }
    toast.success("Password changed");
    return true;
  };

  const deleteAccount = async () => {
    const res = await api.delete("/auth/user");
    if (!res.success) { toast.error(res.message); return false; }
    return true;
  };

  useEffect(() => { fetchProfile(); }, []);

  return {
    profile,
    loading,
    avatarUrl,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    changePassword,
    deleteAccount,
  };
}

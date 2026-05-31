import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────

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

export interface Collection {
  collection_id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  confidence: number;
  created_at: string;
}

export interface Material {
  material_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: "processing" | "processed" | "failed";
  collection_id: string | null;
  created_at: string;
}

// ── Context type ───────────────────────────────────────────────────────────

interface GlobalStateContextType {
  // Profile
  profile: FullProfile | null;
  profileLoading: boolean;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { full_name?: string; peak_performance_time?: string }) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;

  // Collections
  collections: Collection[];
  collectionsLoading: boolean;
  refreshCollections: () => Promise<void>;
  deleteCollection: (id: string) => Promise<boolean>;

  // Materials
  materials: Material[];
  materialsLoading: boolean;
  refreshMaterials: () => Promise<void>;
  uploadMaterial: (file: File) => Promise<Material | null>;
  deleteMaterial: (id: string) => Promise<boolean>;
}

// ── Context ────────────────────────────────────────────────────────────────

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

const BASE_URL = "http://0.0.0.0:8000/api";

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatar = useCallback(async () => {
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
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    const res = await api.get<FullProfile>("/auth/user/profile/full");
    if (res.success) {
      setProfile(res.data);
      fetchAvatar();
    }
    setProfileLoading(false);
  }, [token, fetchAvatar]);

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

  // ── Collections ───────────────────────────────────────────────────────────
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const refreshCollections = useCallback(async () => {
    if (!token) return;
    setCollectionsLoading(true);
    const res = await api.get<Collection[]>("/collections/");
    if (res.success) setCollections(res.data);
    setCollectionsLoading(false);
  }, [token]);

  const deleteCollection = async (id: string) => {
    const res = await api.delete(`/collections/${id}`);
    if (!res.success) { toast.error(res.message); return false; }
    setCollections((prev) => prev.filter((c) => c.collection_id !== id));
    toast.success("Collection deleted");
    return true;
  };

  // ── Materials ─────────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const refreshMaterials = useCallback(async () => {
    if (!token) return;
    setMaterialsLoading(true);
    const res = await api.get<Material[]>("/material/");
    if (res.success) setMaterials(res.data);
    setMaterialsLoading(false);
  }, [token]);

  const uploadMaterial = async (file: File): Promise<Material | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.postForm<Material>("/material/upload", form);
    if (!res.success) { toast.error(res.message); return null; }
    setMaterials((prev) => [res.data, ...prev]);
    toast.success("Material uploaded");
    return res.data;
  };

  const deleteMaterial = async (id: string) => {
    const res = await api.delete(`/material/${id}`);
    if (!res.success) { toast.error(res.message); return false; }
    setMaterials((prev) => prev.filter((m) => m.material_id !== id));
    toast.success("Material deleted");
    return true;
  };

  // ── Bootstrap on login ────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      refreshProfile();
      refreshCollections();
      refreshMaterials();
    } else {
      setProfile(null);
      setAvatarUrl(null);
      setCollections([]);
      setMaterials([]);
    }
  }, [token]);

  return (
    <GlobalStateContext.Provider value={{
      profile, profileLoading, avatarUrl,
      refreshProfile, updateProfile, uploadAvatar, deleteAvatar,
      collections, collectionsLoading, refreshCollections, deleteCollection,
      materials, materialsLoading, refreshMaterials, uploadMaterial, deleteMaterial,
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext);
  if (!ctx) throw new Error("useGlobalState must be used within GlobalStateProvider");
  return ctx;
}

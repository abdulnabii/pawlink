"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dog, ArrowLeft, Loader2, Sparkles, ShieldCheck, Heart, AlertTriangle, Crown, CreditCard } from "lucide-react";

export default function NewPetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null);
  const [currentPetCount, setCurrentPetCount] = useState(0);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("Male");
  const [color, setColor] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [microchipNumber, setMicrochipNumber] = useState("");
  const [personality, setPersonality] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [allowWhatsApp, setAllowWhatsApp] = useState(true);
  const [allowInAppChat, setAllowInAppChat] = useState(true);
  const [hideOwnerPhone, setHideOwnerPhone] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pets").then((res) => res.json()).catch(() => ({ pets: [] })),
      fetch("/api/subscription").then((res) => res.json()).catch(() => ({})),
    ]).then(([petsData, subData]) => {
      if (Array.isArray(petsData?.pets)) {
        setCurrentPetCount(petsData.pets.length);
      }
      if (subData?.subscription) {
        setSubscription(subData.subscription);
      }
      setPageLoading(false);
    }).catch(() => setPageLoading(false));
  }, []);

  const planId = (subscription?.plan || "FREE").toUpperCase();
  const maxAllowedPets = planId === "PRO" ? 999 : planId === "PLUS" ? 5 : 1;
  const isLimitReached = currentPetCount >= maxAllowedPets;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) {
      setError(`Your ${planId === "FREE" ? "Basic ID" : "Plus Recovery"} plan allows a maximum of ${maxAllowedPets} pet(s). Upgrade your plan to add more.`);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          species,
          breed: breed || null,
          gender: gender || null,
          color: color || null,
          photoUrl: photoUrl || null,
          microchipNumber: microchipNumber || null,
          personality: personality || null,
          specialInstructions: specialInstructions || null,
          allowWhatsApp,
          allowInAppChat,
          hideOwnerPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create pet profile");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pawlink-pets-updated"));
      }

      router.push(`/dashboard/pets/${data.pet.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/pets"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Pets</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-3" />
            <h4 className="font-black text-lg text-slate-900">Creating Pet Profile...</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Generating secure cryptographic QR collar tag and linking digital emergency profile.
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Pet Profile</h1>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              isLimitReached
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              {currentPetCount} / {maxAllowedPets === 999 ? "∞" : maxAllowedPets} Pets Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fill in your pet&apos;s recovery details. A unique QR collar tag will be generated automatically.
          </p>
        </div>

        {isLimitReached && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-sm text-amber-950">
                  Plan Pet Limit Reached ({currentPetCount}/{maxAllowedPets})
                </p>
                <p className="text-amber-800">
                  Your <strong>{planId === "FREE" ? "Basic ID" : "Plus Recovery"} Plan</strong> allows up to <strong>{maxAllowedPets} pet profile</strong>. To add additional pets and generate new collar tags, please upgrade your membership plan.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Upgrade Plan via Meezan Bank QR</span>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Max"
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Species *
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Breed (Optional)
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Golden Retriever"
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Color / Markings
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Golden, white chest"
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pet Photograph URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">A clear photo helps finders identify your pet immediately.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Microchip ID (Private - Not Shown Publicly)
            </label>
            <input
              type="text"
              value={microchipNumber}
              onChange={(e) => setMicrochipNumber(e.target.value)}
              placeholder="e.g. 985141001234567"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Personality & Behavior Notes
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. Friendly, loves children, responds well to 'sit'."
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Privacy & Contact Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Privacy & Finder Contact Preferences</h4>
            
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={allowWhatsApp}
                onChange={(e) => setAllowWhatsApp(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Allow finders to open direct WhatsApp conversation</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={allowInAppChat}
                onChange={(e) => setAllowInAppChat(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Allow anonymous in-app finder messaging</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={hideOwnerPhone}
                onChange={(e) => setHideOwnerPhone(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span><strong>Mask personal phone number</strong> (Recommended for privacy)</span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Save Profile & Generate QR Collar Tag</span>
          </button>
        </form>
      </div>
    </div>
  );
}

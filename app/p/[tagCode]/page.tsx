"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  MessageCircle,
  Phone,
  CheckCircle2,
  Navigation,
  Heart,
  Send,
  Loader2,
  Lock,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";
import { PublicPetResponse } from "@/lib/dto";

export default function PublicFinderPage({ params }: { params?: { tagCode: string } }) {
  const routeParams = useParams();
  const rawTagCode = params?.tagCode || (routeParams?.tagCode as string) || "";
  const tagCode = rawTagCode.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [petData, setPetData] = useState<PublicPetResponse | null>(null);

  // Location sharing states
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationSharedSuccess, setLocationSharedSuccess] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // In-app chat / contact states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFoundForm, setShowFoundForm] = useState(false);
  const [finderName, setFinderName] = useState("");
  const [finderPhone, setFinderPhone] = useState("");
  const [finderMessage, setFinderMessage] = useState("");
  const [isSafeWithMe, setIsSafeWithMe] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (!tagCode) return;

    fetch(`/api/scan/${tagCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.message || data.error);
        } else if (data.pet) {
          setPetData(data.pet);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Unable to connect to recovery servers. Please check your internet connection.");
        setLoading(false);
      });
  }, [tagCode]);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setSharingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;

          // Perform reverse geocoding via OpenStreetMap Nominatim for human-readable neighborhood
          let addressName = "Approximate Finder Area";
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const geoData = await geoRes.json();
            if (geoData?.address) {
              const addr = geoData.address;
              addressName = [addr.suburb || addr.neighbourhood || addr.road, addr.city || addr.town || addr.county, addr.country]
                .filter(Boolean)
                .join(", ");
            }
          } catch {
            addressName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          const res = await fetch("/api/location-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tagCode,
              latitude,
              longitude,
              accuracy,
              addressName,
            }),
          });

          if (res.ok) {
            setLocationSharedSuccess(true);
            setShowLocationConsent(false);
          } else {
            setLocationError("Failed to transmit coordinates. Please try again.");
          }
        } catch {
          setLocationError("Error processing location data.");
        } finally {
          setSharingLocation(false);
        }
      },
      (err) => {
        setSharingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission was denied. You can still message or call the owner below.");
        } else {
          setLocationError("Could not retrieve precise location. You can still contact the owner.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForm(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagCode,
          finderName: finderName || "Helpful Finder",
          finderPhone: finderPhone || null,
          initialMessage: `[I Found This Pet] Status: ${isSafeWithMe ? "The pet is currently safe with me." : "Spotted the pet."} Note: ${finderMessage}`,
        }),
      });

      if (res.ok) {
        setFormSuccess(true);
      }
    } catch {
      // Ignore
    } finally {
      setSubmittingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Scanning PawLink Tag...</h2>
        <p className="text-sm text-slate-400 mt-1">Connecting to pet recovery profile</p>
      </div>
    );
  }

  if (error || !petData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tag Not Found</h2>
        <p className="text-slate-400 max-w-sm mb-6 text-sm">
          {error || "This PawLink tag code does not exist or has been deactivated."}
        </p>
        <a
          href="/"
          className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl border border-slate-700"
        >
          Return to PawLink Home
        </a>
      </div>
    );
  }

  const isLost = petData.isLost;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 selection:bg-teal-500 selection:text-white">
      {/* Top Emergency Banner if Lost */}
      {isLost ? (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-4 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2 font-black tracking-wide uppercase text-sm sm:text-base animate-pulse">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>EMERGENCY: {petData.petName.toUpperCase()} IS MISSING!</span>
          </div>
          {petData.recoveryCase?.rewardAmount && petData.recoveryCase.rewardAmount > 0 ? (
            <div className="mt-1 inline-block bg-white text-red-700 font-extrabold text-xs px-3 py-1 rounded-full shadow">
              💰 ${petData.recoveryCase.rewardAmount} REWARD OFFERED
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-emerald-600 text-white p-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Official PawLink Digital Pet ID</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Pet Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center relative overflow-hidden">
          {/* Pet Photo */}
          <div className="w-36 h-36 rounded-full mx-auto p-1.5 bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-xl relative mb-4">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
              {petData.photoUrl ? (
                <img
                  src={petData.photoUrl}
                  alt={petData.petName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {petData.species.toLowerCase() === "cat" ? "🐈" : "🐕"}
                </div>
              )}
            </div>
            {isLost && (
              <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow">
                LOST
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{petData.petName}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {petData.breed ? `${petData.breed} • ` : ""}
            {petData.species}
            {petData.color ? ` • ${petData.color}` : ""}
          </p>

          {/* Lost Details Box */}
          {isLost && petData.recoveryCase && (
            <div className="mt-5 p-4 rounded-2xl bg-red-50/80 border border-red-200 text-left space-y-2 text-xs">
              {petData.recoveryCase.lastSeenLocation && (
                <div className="flex items-start gap-2 text-red-950 font-medium">
                  <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-900">Last Seen:</span> {petData.recoveryCase.lastSeenLocation}
                  </div>
                </div>
              )}
              {petData.recoveryCase.description && (
                <div className="pt-2 border-t border-red-200/80 text-red-900 font-normal leading-relaxed">
                  <strong>Special Instructions:</strong> {petData.recoveryCase.description}
                </div>
              )}
            </div>
          )}

          {/* Public Medical Alerts */}
          {petData.publicMedicalAlerts.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Emergency Medical Information:</span>
              </div>
              {petData.publicMedicalAlerts.map((alert, idx) => (
                <p key={idx} className="text-xs text-amber-800 leading-snug">
                  • <strong>{alert.title}</strong>: {alert.description}
                </p>
              ))}
            </div>
          )}

          {/* Personality / Notes if safe */}
          {!isLost && petData.personality && (
            <p className="mt-4 text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              &ldquo;{petData.personality}&rdquo;
            </p>
          )}
        </div>

        {/* PRIMARY ACTIONS SECTION */}
        <div className="space-y-3">
          {/* Action 1: Share Location Button */}
          {locationSharedSuccess ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-left text-xs">
                <p className="font-bold text-sm text-emerald-950">Location Shared!</p>
                <p className="text-emerald-800">
                  Your coordinates were securely transmitted to {petData.petName}&apos;s family.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLocationConsent(true)}
              className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Navigation className="w-5 h-5 text-teal-200 animate-pulse" />
              <span>📍 Share My Location with Owner</span>
            </button>
          )}

          {locationError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Action 2: Contact Owner Button */}
          <button
            onClick={() => setShowContactModal(true)}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-teal-400" />
            <span>Contact {petData.petName}&apos;s Owner</span>
          </button>

          {/* Action 3: I Found This Pet Form */}
          <button
            onClick={() => setShowFoundForm(true)}
            className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>I Found This Pet / Safe With Me</span>
          </button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Lock className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Privacy-Preserving Recovery Platform</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            PawLink protects both finders and owners. No account is required to help this pet. Personal contact details remain masked unless explicitly shared.
          </p>
        </div>
      </main>

      {/* LOCATION CONSENT MODAL */}
      {showLocationConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Share Your Current Location?</h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              Your GPS coordinates will be sent <strong>privately to {petData.petName}&apos;s owner</strong> so they can navigate directly to where you found their pet. Coordinates are never made public.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleShareLocation}
                disabled={sharingLocation}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {sharingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>Allow & Share Location</span>
              </button>
              <button
                onClick={() => setShowLocationConsent(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Continue Without Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Contact {petData.petName}&apos;s Family
            </h3>

            <div className="space-y-3">
              {petData.contactOptions.allowWhatsApp && (
                <button
                  onClick={() => {
                    // Open WhatsApp trigger
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        `Hi, I just scanned ${petData.petName}'s PawLink tag (${petData.tagCode})! I would like to help reunite your pet.`
                      )}`,
                      "_blank"
                    );
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat via WhatsApp</span>
                </button>
              )}

              {petData.contactOptions.directPhone && (
                <a
                  href={`tel:${petData.contactOptions.directPhone}`}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Owner: {petData.contactOptions.directPhone}</span>
                </a>
              )}

              <button
                onClick={() => {
                  setShowContactModal(false);
                  setShowFoundForm(true);
                }}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4 text-teal-600" />
                <span>Send In-App Anonymous Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I FOUND THIS PET FORM MODAL */}
      {showFoundForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              onClick={() => setShowFoundForm(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            {formSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-xl font-black text-slate-900">Message Sent to Owner!</h4>
                <p className="text-xs text-slate-600 mt-2 mb-6">
                  Thank you for helping {petData.petName}! The owner has received an alert and will review your note.
                </p>
                <button
                  onClick={() => {
                    setShowFoundForm(false);
                    setFormSuccess(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Report Found Pet: {petData.petName}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Send a quick message to the owner. No account required.
                </p>

                <form onSubmit={handleFoundSubmit} className="space-y-3.5">
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950">Is {petData.petName} safe with you?</span>
                    <button
                      type="button"
                      onClick={() => setIsSafeWithMe(!isSafeWithMe)}
                      className={`text-xs font-extrabold px-3 py-1 rounded-lg transition-colors ${
                        isSafeWithMe
                          ? "bg-teal-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isSafeWithMe ? "Yes, Safe With Me" : "No, Just Spotted"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={finderName}
                      onChange={(e) => setFinderName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Your Contact Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={finderPhone}
                      onChange={(e) => setFinderPhone(e.target.value)}
                      placeholder="e.g. +1 555 0192"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Message for the Owner
                    </label>
                    <textarea
                      required
                      value={finderMessage}
                      onChange={(e) => setFinderMessage(e.target.value)}
                      placeholder={`Describe where you found ${petData.petName} or your current location...`}
                      rows={3}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    {submittingForm ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Alert to Owner</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

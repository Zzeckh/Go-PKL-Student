import React, { useState, useEffect } from 'react';
import {
  UserRound, Phone, School, MapPin, IdCard, LogOut,
  Pencil, Check, X, Loader2, AlertCircle, CheckCircle2,
  ShieldCheck, BadgeCheck,
} from 'lucide-react';
import { TopoPattern } from './Decor';
import { profileService } from '../services/profile';

interface ProfileViewProps {
  user: any;
  onLogout: () => void;
  onUserUpdate?: (u: any) => void;
}

/* ═══════════ helpers ═══════════ */
const val = (v: unknown) =>
  v === null || v === undefined || v === '' ? 'Belum diisi' : String(v);

const dateFmt = (v: unknown) =>
  v
    ? new Date(String(v)).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Belum diisi';

const isoVal = (v: unknown) => (v ? String(v).slice(0, 10) : '');

/* field mandiri (tanggung jawab siswa) — dihitung untuk kelengkapan */
const SELF_KEYS = [
  'gender', 'birthPlace', 'birthDate', 'concentration', 'address',
  'whatsapp', 'parentName', 'parentAddress', 'parentPhone',
];
const countFilled = (d: any) =>
  SELF_KEYS.filter((k) => {
    const v = d?.[k];
    return v !== null && v !== undefined && String(v).trim() !== '';
  }).length;

/* ═══════════ chip hero ═══════════ */
const Badge: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <span className="shrink-0 max-w-[55%] px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-white/80 flex items-center gap-1">
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{text}</span>
  </span>
);

/* ═══════════ kartu kelengkapan ═══════════ */
const CompletenessBar: React.FC<{ filled: number; total: number }> = ({ filled, total }) => {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const done = pct === 100;
  return (
    <section className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-[0.14em] flex items-center gap-1.5">
            <BadgeCheck className={`w-3.5 h-3.5 ${done ? 'text-navy' : 'text-navy/40'}`} />
            Kelengkapan Profil
          </p>
          <p className="text-[11px] font-semibold text-navy/55 leading-snug mt-1">
            {done
              ? 'Semua data mandiri sudah terisi.'
              : `Lengkapi data mandiri kamu — ${total - filled} kolom lagi.`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[24px] font-extrabold text-navy tabular-nums leading-none">{pct}<span className="text-[13px] text-navy/40">%</span></p>
          <p className="text-[8px] font-extrabold text-navy/40 uppercase tracking-wide mt-1">{filled}/{total} terisi</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-mist overflow-hidden">
        <div
          className="h-full rounded-full bg-navy transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
};

/* ═══════════ kartu section ═══════════ */
const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  solid?: boolean;
  badge?: string;
  delay?: string;
  children: React.ReactNode;
}> = ({ title, icon, solid, badge, delay, children }) => (
  <section
    className="rise-in bg-white rounded-[20px] border border-mist/60 shadow-sm overflow-hidden"
    style={delay ? { animationDelay: delay } : undefined}
  >
    <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-mist/60">
      <span
        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
          solid ? 'bg-navy text-white shadow-md shadow-navy/20' : 'bg-navy/5 text-navy/70'
        }`}
      >
        {icon}
      </span>
      <h2 className="text-[13px] font-extrabold text-navy flex-1">{title}</h2>
      {badge && (
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-shell border border-mist/60 text-[8px] font-extrabold text-navy/50 uppercase tracking-wide flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5" /> {badge}
        </span>
      )}
    </div>
    <div className="divide-y divide-mist/60">{children}</div>
  </section>
);

/* ═══════════ row field ═══════════ */
const FieldRow: React.FC<{
  label: string;
  value: string;
  editing?: boolean;
  readOnly?: boolean;
  input?: React.ReactNode;
}> = ({ label, value, editing, readOnly, input }) => {
  const locked = editing && readOnly;
  return (
    <div className="px-4 py-3">
      <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">{label}</p>
      {editing && !readOnly ? (
        <div className="mt-1.5">{input}</div>
      ) : (
        <p
          className={`text-[13px] font-semibold leading-snug mt-1 break-words transition-colors ${
            value === 'Belum diisi' ? 'text-navy/35' : locked ? 'text-navy/50' : 'text-navy'
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
};

/* input teks standar */
const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
}> = ({ value, onChange, placeholder, type = 'text', inputMode }) => (
  <input
    type={type}
    inputMode={inputMode}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder || 'Belum diisi'}
    className="w-full rounded-[12px] border border-mist bg-shell/50 px-3.5 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy focus:bg-white outline-none transition-colors"
  />
);

const TextArea: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Belum diisi"
    rows={2}
    className="w-full rounded-[12px] border border-mist bg-shell/50 px-3.5 py-2.5 text-[12px] font-semibold text-navy placeholder:text-navy/30 focus:border-navy focus:bg-white outline-none resize-none transition-colors"
  />
);

/* ══════════════════════════════════════════════════════
   PROFILE VIEW — hero navy → sheet → kelengkapan live →
   3 kartu (mode edit fokus + sticky save di thumb-zone).
   ══════════════════════════════════════════════════════ */
export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onUserUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [draft, setDraft] = useState<any>(user);
  useEffect(() => { setDraft(user); }, [user]);

  const set = (key: string, value: string) => setDraft((d: any) => ({ ...d, [key]: value }));

  const startEdit = () => { setError(null); setSavedFlash(false); setEditing(true); };
  const cancelEdit = () => { setDraft(user); setError(null); setEditing(false); };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile({
        gender: draft.gender || null,
        birthPlace: draft.birthPlace || null,
        birthDate: draft.birthDate || null,
        concentration: draft.concentration || null,
        address: draft.address || null,
        whatsapp: draft.whatsapp || null,
        parentName: draft.parentName || null,
        parentAddress: draft.parentAddress || null,
        parentPhone: draft.parentPhone || null,
      });
      onUserUpdate?.(updated);
      setEditing(false);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'Gagal menyimpan profile.');
    } finally {
      setSaving(false);
    }
  };

  const name = val(user?.name);
  const initials = name.split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
  const filled = countFilled(draft);

  return (
    <div className="relative -mx-5 min-h-full flex flex-col bg-white">

      {/* ═══ HERO navy ═══ */}
      <div className="rise-in relative bg-navy px-5 pt-6 pb-16 shrink-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden"><TopoPattern /></div>
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-28 -left-24 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/15 border-[3px] border-white/25 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-black/20">
              {initials}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 border-[3px] border-navy" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-[19px] font-extrabold tracking-tight leading-tight truncate">{name}</h1>
            <p className="text-white/65 text-[11px] font-semibold mt-0.5 truncate">
              {val(user?.className)} · {val(user?.major)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 min-w-0 flex-wrap">
              <Badge icon={<IdCard className="w-3 h-3" />} text={`NIS ${val(user?.nis)}`} />
              {user?.companyName && (
                <Badge icon={<MapPin className="w-3 h-3" />} text={user.companyName} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WHITE SHEET ═══ */}
      <div className={`relative -mt-10 flex-1 bg-white rounded-t-[32px] px-5 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-[padding] duration-300 ${editing ? 'pb-40' : 'pb-24'}`}>

        {/* baris header: konteks + aksi */}
        <div className="flex items-center justify-between gap-2">
          {!editing ? (
            <>
              <p className="text-[10px] font-bold text-navy/50 uppercase tracking-wide">Profil Siswa</p>
              <div className="flex items-center gap-2">
                {savedFlash && (
                  <span className="px-2.5 py-1 rounded-full bg-navy/10 border border-navy/15 text-[9px] font-extrabold text-navy flex items-center gap-1">
                    <Check className="w-3 h-3" /> Tersimpan
                  </span>
                )}
                <button
                  onClick={startEdit}
                  className="px-3.5 py-2 rounded-full bg-navy text-white text-[10px] font-extrabold shadow-md shadow-navy/25 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Pencil className="w-3 h-3" /> Ubah Profile
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="px-2.5 py-1 rounded-full bg-navy text-white text-[9px] font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Sedang Mengedit
              </span>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-3.5 py-2 rounded-full bg-white text-navy/60 text-[10px] font-extrabold border border-mist/60 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <X className="w-3 h-3" /> Batal
              </button>
            </>
          )}
        </div>

        {/* banner editing */}
        {editing && (
          <div className="rise-in mt-3 px-3.5 py-2.5 rounded-[14px] bg-navy/5 border border-navy/15 flex items-start gap-2">
            <Pencil className="w-3.5 h-3.5 text-navy/60 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-navy/70 leading-relaxed">
              Ubah data lalu tekan <span className="font-extrabold text-navy">Simpan</span>. Data dari sekolah (bertanda perisai) tidak dapat diubah.
            </p>
          </div>
        )}

        {error && (
          <div className="rise-in mt-3 p-3 bg-red-50 border border-red-200 rounded-[14px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── KELENGKAPAN ── */}
        <div className="mt-3">
          <CompletenessBar filled={filled} total={SELF_KEYS.length} />
        </div>

        {/* ── KARTU 1: DATA PRIBADI ── */}
        <div className="mt-3">
          <SectionCard title="Data Pribadi" icon={<UserRound className="w-4 h-4" />} delay="100ms">
            <FieldRow label="Nama Lengkap" value={name} editing={editing} readOnly />
            <FieldRow label="NIS" value={val(user?.nis)} editing={editing} readOnly />

            {/* jenis kelamin — segmented monokrom */}
            <div className="px-4 py-3">
              <p className="text-[9px] font-extrabold text-navy/45 uppercase tracking-wide">Jenis Kelamin</p>
              {editing ? (
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {([{ key: 'L', label: 'Laki-laki' }, { key: 'P', label: 'Perempuan' }] as const).map((g) => {
                    const active = draft?.gender === g.key;
                    return (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => set('gender', g.key)}
                        className={`py-2.5 rounded-[12px] border text-[11px] font-extrabold transition-all active:scale-[0.97] ${
                          active ? 'bg-navy text-white border-navy shadow-md shadow-navy/20' : 'bg-shell/50 text-navy/50 border-mist'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] font-semibold text-navy mt-1">
                  {user?.gender === 'L' ? 'Laki-laki' : user?.gender === 'P' ? 'Perempuan' : 'Belum diisi'}
                </p>
              )}
            </div>

            <FieldRow label="Tempat Lahir" value={val(user?.birthPlace)} editing={editing}
              input={<TextInput value={draft?.birthPlace || ''} onChange={(v) => set('birthPlace', v)} />} />
            <FieldRow label="Tanggal Lahir" value={dateFmt(user?.birthDate)} editing={editing}
              input={<TextInput type="date" value={isoVal(draft?.birthDate)} onChange={(v) => set('birthDate', v)} />} />

            <FieldRow label="Program Keahlian" value={val(user?.major)} editing={editing} readOnly />
            <FieldRow label="Konsentrasi Keahlian" value={val(user?.concentration)} editing={editing}
              input={<TextInput value={draft?.concentration || ''} onChange={(v) => set('concentration', v)} />} />
            <FieldRow label="Alamat Tinggal" value={val(user?.address)} editing={editing}
              input={<TextArea value={draft?.address || ''} onChange={(v) => set('address', v)} />} />
          </SectionCard>
        </div>

        {/* ── KARTU 2: KONTAK & ORANG TUA ── */}
        <div className="mt-3">
          <SectionCard title="Kontak & Orang Tua" icon={<Phone className="w-4 h-4" />} delay="200ms">
            <FieldRow label="No. Telepon / HP" value={val(user?.whatsapp)} editing={editing}
              input={<TextInput inputMode="tel" value={draft?.whatsapp || ''} onChange={(v) => set('whatsapp', v)} />} />
            <FieldRow label="Nama Orang Tua" value={val(user?.parentName)} editing={editing}
              input={<TextInput value={draft?.parentName || ''} onChange={(v) => set('parentName', v)} />} />
            <FieldRow label="Alamat Orang Tua" value={val(user?.parentAddress)} editing={editing}
              input={<TextArea value={draft?.parentAddress || ''} onChange={(v) => set('parentAddress', v)} />} />
            <FieldRow label="No. Telepon Orang Tua" value={val(user?.parentPhone)} editing={editing}
              input={<TextInput inputMode="tel" value={draft?.parentPhone || ''} onChange={(v) => set('parentPhone', v)} />} />
          </SectionCard>
        </div>

        {/* ── KARTU 3: SEKOLAH & PEMBIMBING (read-only, resmi) ── */}
        <div className="mt-3">
          <SectionCard
            title="Sekolah & Pembimbing"
            icon={<School className="w-4 h-4" />}
            solid
            badge="Ditetapkan sekolah"
            delay="300ms"
          >
            <FieldRow label="Sekolah" value={`${val(user?.schoolName)} · ${val(user?.schoolAddress)}`} editing={editing} readOnly />
            <FieldRow label="Pembimbing Sekolah" value={val(user?.teacherName)} editing={editing} readOnly />
            <FieldRow label="NIP Pembimbing" value={val(user?.teacherNip)} editing={editing} readOnly />
          </SectionCard>
        </div>

        {/* ── LOGOUT (hanya saat idle) ── */}
        {!editing && (
          <button
            onClick={onLogout}
            className="rise-in mt-4 w-full border-2 border-navy/15 text-navy rounded-[16px] py-3.5 text-[13px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ animationDelay: '400ms' }}
          >
            <LogOut className="w-4 h-4" /> Keluar dari Akun
          </button>
        )}

        <p className="rise-in mt-3 text-center text-[10px] font-semibold text-navy/40" style={{ animationDelay: '450ms' }}>
          Go-PKL v1.0 · © 2026
        </p>
      </div>

      {/* ═══ STICKY SAVE — thumb-zone, hanya saat editing ═══ */}
      {editing && (
        <div className="fixed inset-x-0 bottom-24 z-30 px-5">
          <div className="rise-in bg-white/95 backdrop-blur rounded-[18px] border border-mist/60 shadow-[0_10px_34px_rgba(10,25,60,0.20)] p-2.5">
            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-navy text-white rounded-[13px] py-3.5 text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-md shadow-navy/25 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
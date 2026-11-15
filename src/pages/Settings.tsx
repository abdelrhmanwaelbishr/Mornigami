import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KeyRound, Palette, LogOut, Camera, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const DANGER_FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const Settings: React.FC = () => {
  const { user, userDoc, userRole, userNumber, updateUserProfile, resetPassword, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profilePic = userDoc?.profilePicUrl || userDoc?.photoURL || user?.photoURL;

  const resizeImageToBase64 = (file: File, maxDimension = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    setUploadingPic(true);
    try {
      const base64 = await resizeImageToBase64(file, 160);
      await updateUserProfile(displayName || user?.displayName || 'User', base64);
      toast.success('Profile picture updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(`Failed to update picture: ${msg}`);
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    const ok = await confirm({
      title: 'Remove Profile Picture',
      message: 'Are you sure you want to remove your profile picture?',
      confirmText: 'Remove Picture',
      variant: 'danger',
    });
    if (!ok) return;
    setUploadingPic(true);
    try {
      await updateUserProfile(displayName || user?.displayName || 'User', '');
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(displayName.trim(), profilePic || undefined);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPass = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success(`Password reset link dispatched to ${user.email}`);
    } catch {
      toast.error('Failed to send reset email.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="font-display text-3xl font-black text-primary">Account Settings</h1>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          Manage your Mornigami identity, password security, and theme preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="space-y-5 rounded-2xl p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Avatar Upload Area */}
          <div className="shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePictureUpload}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPic}
              aria-label={profilePic ? 'Change profile picture' : 'Upload profile picture'}
              className={cn(
                'group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-border shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
                FOCUS_RING
              )}
            >
              {profilePic ? (
                <img src={profilePic} alt="" className="h-20 w-20 object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center bg-primary text-3xl font-black text-primary-foreground">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-primary/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </span>
            </button>
            <span className="mt-1.5 block text-center text-xs text-text-secondary">
              {uploadingPic ? 'Uploading…' : 'Change photo'}
            </span>
          </div>

          {/* User Details and Picture Upload Controls */}
          <div className="flex-1 space-y-2">
            <h2 className="font-display text-xl font-bold text-text-primary">
              {user?.displayName || 'Anonymous Folder'}
            </h2>
            <p className="text-xs text-text-secondary">{user?.email}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {userNumber && (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  User ID: #{userNumber}
                </span>
              )}
              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-bold text-text-secondary">
                Role: {userRole}
              </span>
            </div>

            {/* Picture Upload Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingPic}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'h-9 cursor-pointer gap-1.5 px-3 text-xs font-bold transition-all active:scale-[0.98]',
                  FOCUS_RING
                )}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{uploadingPic ? 'Uploading...' : 'Upload Picture'}</span>
              </Button>

              {profilePic && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploadingPic}
                  onClick={handleRemovePicture}
                  className={cn(
                    'h-9 cursor-pointer gap-1.5 px-2.5 text-xs font-bold text-danger transition-all hover:bg-danger/10 active:scale-[0.98]',
                    DANGER_FOCUS_RING
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3 border-t border-border/60 pt-3">
          <div className="space-y-1.5">
            <label
              htmlFor="display-name"
              className="block text-sm font-semibold text-text-primary"
            >
              Display Name
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your username"
              autoComplete="name"
              className="focus-visible:ring-offset-background"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            size="sm"
            className={cn(
              'h-10 cursor-pointer text-xs font-bold transition-all active:scale-[0.98]',
              FOCUS_RING
            )}
          >
            {saving ? 'Saving...' : 'Update Display Name'}
          </Button>
        </form>
      </Card>

      {/* Security & Password */}
      <Card className="space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-text-primary">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-display text-base font-bold">Password &amp; Security</h2>
        </div>
        <p className="text-xs text-text-secondary">
          Dispatch an automated password reset email link to update your secure login credentials.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetPass}
          className={cn(
            'h-10 cursor-pointer text-xs font-bold transition-all active:scale-[0.98]',
            FOCUS_RING
          )}
        >
          Send Password Reset Email
        </Button>
      </Card>

      {/* Preferences */}
      <Card className="space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-text-primary">
          <Palette className="h-5 w-5 text-secondary" aria-hidden="true" />
          <h2 className="font-display text-base font-bold">Theme Appearance</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor="theme-switch" className="block text-sm font-semibold text-text-primary">
              Dark mode
            </label>
            <p className="text-xs text-text-secondary">
              Currently using the <span className="capitalize">{theme}</span> theme.
            </p>
          </div>
          <button
            id="theme-switch"
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 active:scale-[0.98]',
              FOCUS_RING,
              theme === 'dark' ? 'border-primary bg-primary' : 'border-border bg-background'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm ring-1 ring-border transition-transform duration-200 motion-reduce:transition-none',
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </Card>

      {/* Danger Zone / Logout */}
      <Card className="space-y-3 rounded-2xl border-danger/30 bg-danger/5 p-6">
        <h2 className="font-display text-base font-bold text-danger">Session Control</h2>
        <p className="text-xs text-text-secondary">
          Sign out of your Mornigami session. Your data remains safely persisted in Cloud Firestore.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            'h-10 cursor-pointer gap-1.5 text-xs font-bold shadow-sm transition-all hover:bg-danger/90 hover:shadow-md active:scale-[0.98]',
            DANGER_FOCUS_RING
          )}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign Out of Hub</span>
        </Button>
      </Card>
    </div>
  );
};

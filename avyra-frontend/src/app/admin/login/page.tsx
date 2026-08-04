"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { toApiError, type ApiErrorShape } from "@/lib/api";
import { useLogin } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login.mutateAsync({ email, password, remember });
      router.replace("/admin");
    } catch (err) {
      setError(toApiError(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold text-primary">Avyra</p>
          <p className="mt-1 text-sm text-muted-foreground">Admin sign in</p>
        </div>

        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" required error={error?.errors?.email?.[0]}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                invalid={Boolean(error?.errors?.email)}
              />
            </Field>

            <Field label="Password" required error={error?.errors?.password?.[0]}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                invalid={Boolean(error?.errors?.password)}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Keep me signed in
            </label>

            {error && !error.errors && (
              <p role="alert" className="text-sm text-red-600">
                {error.message}
              </p>
            )}

            <Button type="submit" block size="lg" disabled={login.isPending}>
              {login.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

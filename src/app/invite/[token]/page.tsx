import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getInviteByToken } from "@/lib/orgs";
import { Logo } from "@/components/logo";
import { AcceptInviteButton } from "./accept-button";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const user = await getCurrentUser();

  const invalid = !invite || !invite.is_valid;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-card/70 border border-card-border rounded-2xl p-8 text-center">
          {invalid ? (
            <>
              <h1 className="text-xl font-semibold mb-2">
                This invite is no longer valid
              </h1>
              <p className="text-sm text-muted mb-6">
                It may have expired or already been used. Ask your teammate to
                send a fresh invitation.
              </p>
              <Link
                href="/"
                className="inline-block bg-card border border-card-border hover:border-foreground/30 text-foreground font-medium px-5 py-2.5 rounded-xl"
              >
                Go to DeckRanker
              </Link>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-accent mb-3">
                Organization invite
              </p>
              <h1 className="text-2xl font-semibold mb-2">
                Join {invite.org_name}
              </h1>
              <p className="text-sm text-muted mb-8">
                {invite.inviter_name ?? "A teammate"} invited you to share the{" "}
                <strong className="text-foreground">{invite.org_name}</strong>{" "}
                deal dashboard — everyone can add decks, record decisions, and
                track outcomes together.
              </p>
              {user ? (
                <AcceptInviteButton token={token} />
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                    className="block w-full py-3 px-4 bg-accent hover:bg-accent-light text-background font-semibold rounded-xl"
                  >
                    Sign in to accept
                  </Link>
                  <Link
                    href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
                    className="block w-full py-3 px-4 bg-card border border-card-border hover:border-foreground/30 text-foreground font-medium rounded-xl"
                  >
                    Create an account
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

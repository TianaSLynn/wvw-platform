import { SignUp } from "@clerk/nextjs";
import { db } from "@/lib/db";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const { invite } = await searchParams;

  let prefillEmail: string | undefined;
  if (invite) {
    const inv = await db.invite.findUnique({
      where:  { token: invite },
      select: { email: true, expiresAt: true, acceptedAt: true },
    });
    if (inv && !inv.acceptedAt && inv.expiresAt > new Date() && inv.email) {
      prefillEmail = inv.email;
    }
  }

  return (
    <SignUp
      initialValues={prefillEmail ? { emailAddress: prefillEmail } : undefined}
      afterSignUpUrl={invite ? `/welcome?invite=${invite}` : "/dashboard"}
    />
  );
}

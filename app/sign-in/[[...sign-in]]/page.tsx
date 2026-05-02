import { SignIn } from "@clerk/nextjs"
import { AuthLeftPanel } from "@/components/auth/auth-left-panel"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex font-sans">
      <AuthLeftPanel />
      <div className="flex flex-1 items-center justify-center bg-base p-6">
        <SignIn />
      </div>
    </div>
  )
}

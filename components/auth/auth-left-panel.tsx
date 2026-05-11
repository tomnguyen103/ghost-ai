import { Network, Users, FileText } from "lucide-react"

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-elevated border border-border-default">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-copy-primary mb-0.5">{title}</p>
        <p className="text-xs text-copy-muted leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex w-2/5 bg-surface border-r border-border-default flex-col px-12 py-10 font-sans">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold"
          style={{ color: "var(--bg-base)" }}
        >
          D
        </div>
        <span className="text-sm font-medium text-copy-primary">Development Plan Tools</span>
      </div>

      {/* Main content — vertically centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        <div>
          <h1 className="text-5xl font-bold text-copy-primary leading-tight mb-5">
            Design systems at the speed of thought.
          </h1>
          <p className="text-sm text-copy-muted leading-relaxed">
            Describe your architecture in plain English. Development Plan Tools maps it to a
            shared canvas your whole team can refine in real time.
          </p>
        </div>

        <div className="space-y-5">
          <FeatureItem
            icon={<Network className="h-4 w-4 text-brand" />}
            title="AI Architecture Generation"
            description="Describe your system, AI maps it to nodes and edges on a live canvas."
          />
          <FeatureItem
            icon={<Users className="h-4 w-4 text-brand" />}
            title="Real-time Collaboration"
            description="Live cursors, presence indicators, and shared node editing across your team."
          />
          <FeatureItem
            icon={<FileText className="h-4 w-4 text-brand" />}
            title="Instant Spec Generation"
            description="Export a complete Markdown technical spec directly from the canvas graph."
          />
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-copy-faint">© 2026 Development Plan Tools. All rights reserved.</p>
    </div>
  )
}

import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

export interface StoredCollaborator {
  id: string
  email: string
  createdAt: Date
}

export interface CollaboratorView {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
}

interface ClerkProfile {
  displayName: string | null
  avatarUrl: string | null
}

export function normalizeCollaboratorEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidCollaboratorEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function enrichCollaborators(
  collaborators: StoredCollaborator[]
): Promise<CollaboratorView[]> {
  const emails = collaborators.map((collaborator) =>
    normalizeCollaboratorEmail(collaborator.email)
  )
  const profiles = await getClerkProfilesByEmail(emails)

  return collaborators.map((collaborator) => {
    const email = normalizeCollaboratorEmail(collaborator.email)
    const profile = profiles.get(email)

    return {
      id: collaborator.id,
      email,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      createdAt: collaborator.createdAt.toISOString(),
    }
  })
}

async function getClerkProfilesByEmail(
  emails: string[]
): Promise<Map<string, ClerkProfile>> {
  if (emails.length === 0) return new Map()

  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ emailAddress: emails })
    const profiles = new Map<string, ClerkProfile>()

    for (const user of users.data) {
      const displayName = user.fullName ?? user.username ?? null
      const profile: ClerkProfile = {
        displayName,
        avatarUrl: user.imageUrl || null,
      }

      for (const emailAddress of user.emailAddresses) {
        profiles.set(
          normalizeCollaboratorEmail(emailAddress.emailAddress),
          profile
        )
      }
    }

    return profiles
  } catch {
    return new Map()
  }
}

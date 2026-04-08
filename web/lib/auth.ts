import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()) ?? []
      return allowedEmails.includes(user.email ?? "")
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
})

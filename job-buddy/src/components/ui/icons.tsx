import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  check: CheckCircle,
  x: XCircle,
  eye: Eye,
  eyeOff: EyeOff,
  // Add more icons as needed
}

export type Icon = keyof typeof Icons

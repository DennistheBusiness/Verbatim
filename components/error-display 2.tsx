import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, XCircle, Wifi, ServerCrash, Clock, Lock, FileQuestion } from "lucide-react"

export type ErrorType = "network" | "server" | "timeout" | "auth" | "notfound" | "generic"

interface ErrorDisplayProps {
  error: Error | unknown
  type?: ErrorType
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ 
  error, 
  type = "generic", 
  title,
  onRetry,
  className 
}: ErrorDisplayProps) {
  const errorInfo = getErrorInfo(type, error)
  
  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-start gap-3">
        {errorInfo.icon}
        <div className="flex-1 space-y-2">
          <AlertTitle>{title || errorInfo.title}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{errorInfo.message}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

interface ErrorPageProps {
  error: Error | unknown
  type?: ErrorType
  onGoBack?: () => void
  onRetry?: () => void
}

export function ErrorPage({ error, type = "generic", onGoBack, onRetry }: ErrorPageProps) {
  const errorInfo = getErrorInfo(type, error)
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          {errorInfo.iconLarge}
        </div>
        <h1 className="text-2xl font-bold">{errorInfo.title}</h1>
        <p className="text-muted-foreground">{errorInfo.message}</p>
        <div className="flex gap-3 justify-center pt-4">
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              Go Back
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function getErrorInfo(type: ErrorType, error: Error | unknown) {
  const errorMessage = getErrorMessage(error)
  
  switch (type) {
    case "network":
      return {
        icon: <Wifi className="h-5 w-5" />,
        iconLarge: <Wifi className="h-16 w-16 text-muted-foreground" />,
        title: "Connection Problem",
        message: "Unable to connect to the server. Please check your internet connection and try again."
      }
    case "server":
      return {
        icon: <ServerCrash className="h-5 w-5" />,
        iconLarge: <ServerCrash className="h-16 w-16 text-muted-foreground" />,
        title: "Server Error",
        message: "Something went wrong on our end. We're working to fix it. Please try again later."
      }
    case "timeout":
      return {
        icon: <Clock className="h-5 w-5" />,
        iconLarge: <Clock className="h-16 w-16 text-muted-foreground" />,
        title: "Request Timeout",
        message: "The request took too long to complete. Please try again."
      }
    case "auth":
      return {
        icon: <Lock className="h-5 w-5" />,
        iconLarge: <Lock className="h-16 w-16 text-muted-foreground" />,
        title: "Authentication Required",
        message: "Please sign in to continue."
      }
    case "notfound":
      return {
        icon: <FileQuestion className="h-5 w-5" />,
        iconLarge: <FileQuestion className="h-16 w-16 text-muted-foreground" />,
        title: "Not Found",
        message: "The item you're looking for doesn't exist or has been removed."
      }
    default:
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        iconLarge: <XCircle className="h-16 w-16 text-muted-foreground" />,
        title: "Something Went Wrong",
        message: errorMessage
      }
  }
}

export function getErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred"
  
  if (error instanceof Error) {
    return error.message || "An unexpected error occurred"
  }
  
  if (typeof error === "string") {
    return error
  }
  
  if (typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  
  return "An unexpected error occurred"
}

// Supabase-specific error message mapping
export function getSupabaseErrorMessage(error: unknown): string {
  const message = getErrorMessage(error)
  const lowerMessage = message.toLowerCase()
  
  // Check for specific Supabase error patterns
  if (lowerMessage.includes("unique constraint") || lowerMessage.includes("23505")) {
    return "This item already exists. Please use a different name."
  }
  
  if (lowerMessage.includes("foreign key") || lowerMessage.includes("23503")) {
    return "Cannot complete this action because it would affect related data."
  }
  
  if (lowerMessage.includes("permission denied") || lowerMessage.includes("42501")) {
    return "You don't have permission to perform this action."
  }
  
  if (lowerMessage.includes("not found") || lowerMessage.includes("pgrst116")) {
    return "The item you're looking for doesn't exist."
  }
  
  if (lowerMessage.includes("invalid") && lowerMessage.includes("login")) {
    return "Invalid email or password. Please try again."
  }
  
  if (lowerMessage.includes("email") && lowerMessage.includes("exists")) {
    return "An account with this email already exists."
  }
  
  if (lowerMessage.includes("jwt") || lowerMessage.includes("token")) {
    return "Your session has expired. Please sign in again."
  }
  
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Connection problem. Please check your internet connection."
  }
  
  // Return original message if no specific pattern matched
  return message
}

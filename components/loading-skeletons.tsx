import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function LibrarySkeletons() {
  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Count row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full" />

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-l-[3px] border-l-border">
            <CardContent className="flex flex-col gap-4 p-4">
              {/* Title + pill */}
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 flex-1 max-w-[60%]" />
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>

              {/* Step track: 3 dots + 2 lines */}
              <div className="flex items-start">
                {[0, 1, 2].map((dot) => (
                  <div key={dot} className="flex flex-1 items-start">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="h-2.5 w-7" />
                    </div>
                    {dot < 2 && (
                      <div className="flex-1 pt-4 px-1">
                        <Skeleton className="h-0.5 w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Metadata row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
                <Skeleton className="h-7 w-12 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function SetDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 max-w-2xl" />
        <Skeleton className="h-6 w-full max-w-3xl" />
        <Skeleton className="h-6 w-5/6 max-w-3xl" />
        
        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guided flow tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function AdminSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* User list */}
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

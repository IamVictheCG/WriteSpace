export function calculateResponseDeadline(windowHours: number): string {
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + windowHours)
  return deadline.toISOString()
}

export function isResponseWindowOpen(deadline: string): boolean {
  return new Date() < new Date(deadline)
}

export function canAcceptMoreResponses(
  currentCount: number,
  maxResponses: number,
  deadline: string
): boolean {
  return currentCount < maxResponses && isResponseWindowOpen(deadline)
}

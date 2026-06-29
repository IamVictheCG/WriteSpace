import type { TransactionStatus, ProjectStatus } from '@/types/models'

export function canReleaseEscrow(
  transactionStatus: TransactionStatus,
  projectStatus: ProjectStatus
): boolean {
  return transactionStatus === 'held' && projectStatus === 'writer_completed'
}

export function canRefundEscrow(
  transactionStatus: TransactionStatus,
  projectStatus: ProjectStatus
): boolean {
  return (
    transactionStatus === 'held' &&
    (projectStatus === 'disputed' || projectStatus === 'cancelled')
  )
}

export function calculateCommission(amount: number, rate: number) {
  const commission = Math.round(amount * rate * 100) / 100
  return {
    commission_amount_ngn: commission,
    writer_amount_ngn: amount - commission,
  }
}

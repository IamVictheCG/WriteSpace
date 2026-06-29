'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function ApproveWorkButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    if (!confirm('Are you sure you want to approve this work and release payment?')) return
    setLoading(true)

    const res = await fetch('/api/client/projects/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to approve')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Approving...' : 'Approve & Release Payment'}
    </button>
  )
}

export function ClientFileUpload({ projectId }: { projectId: string }) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!selectedFile) return
    setMessage(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('project_id', projectId)

      const res = await fetch('/api/projects/files', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Upload failed' })
        return
      }

      setMessage({ type: 'success', text: 'File uploaded successfully' })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload file' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-3 rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
        />
        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>
    </div>
  )
}

export function FileDisputeButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    setLoading(true)

    const res = await fetch('/api/client/projects/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, reason }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to file dispute')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        File Dispute
      </button>
    )
  }

  return (
    <form onSubmit={handleDispute} className="mt-3 space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue (min 10 characters)..."
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || reason.trim().length < 10}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Filing...' : 'Submit Dispute'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

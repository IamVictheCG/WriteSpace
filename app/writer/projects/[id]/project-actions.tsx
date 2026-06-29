'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function ProjectActions({
  projectId,
  status,
}: {
  projectId: string
  status: string
}) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleMarkComplete() {
    if (!confirm('Are you sure you want to mark this project as complete? The client will be notified for approval.')) {
      return
    }

    setError(null)
    setSuccess(null)
    setCompleting(true)

    try {
      const res = await fetch('/api/writer/projects/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to mark as complete')
        return
      }

      setSuccess(data.message)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setCompleting(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  async function handleFileUpload() {
    if (!selectedFile) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('project_id', projectId)

      const res = await fetch('/api/writer/projects/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to upload file')
        return
      }

      setSuccess('File uploaded successfully')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      setError('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  if (status !== 'active') {
    return null
  }

  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Project Actions</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {/* File Upload */}
      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Upload Deliverable</h3>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
          />
          {selectedFile && (
            <button
              onClick={handleFileUpload}
              disabled={uploading}
              className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      {/* Mark as Complete */}
      <div className="border-t pt-4">
        <button
          onClick={handleMarkComplete}
          disabled={completing}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completing ? 'Marking complete...' : 'Mark as Complete'}
        </button>
        <p className="mt-2 text-xs text-gray-500">
          This will notify the client to review and approve your work.
        </p>
      </div>
    </div>
  )
}

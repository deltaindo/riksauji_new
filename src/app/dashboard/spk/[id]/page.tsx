'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SPK {
  id: string
  nomor_spk: string
  status: 'draft' | 'submitted' | 'verified'
  tanggal_spk: string
  deskripsi_pekerjaan: string
  clients: { id: string; nama_client: string; pic_phone: string }
  aircrafttypes: { id: string; jenis_pesawat: string; form_checklist: any[] }
  spkdocuments: any[]
}

export default function SPKDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [spk, setSpk] = useState<SPK | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [missingDocs, setMissingDocs] = useState<string[]>([])

  const spkId = params.id as string

  useEffect(() => {
    fetchSPKDetail()
  }, [spkId])

  const fetchSPKDetail = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('spks')
        .select(
          `
          *,
          clients(id, nama_client, pic_phone),
          aircrafttypes(id, jenis_pesawat, form_checklist),
          spkdocuments(*)
        `
        )
        .eq('id', spkId)
        .single()

      if (fetchError) throw fetchError

      setSpk(data)

      // Generate checklist from aircraft type
      if (data?.aircrafttypes?.form_checklist) {
        const checklistItems = data.aircrafttypes.form_checklist.map(
          (item: any) => ({
            ...item,
            status: data.spkdocuments?.some(
              (doc: any) => doc.document_type === item.name
            )
              ? 'verified'
              : 'missing',
          })
        )
        setChecklist(checklistItems)

        // Find missing docs
        const missing = checklistItems
          .filter(
            (item: any) =>
              item.isRequired && item.status !== 'verified'
          )
          .map((item: any) => item.name)
        setMissingDocs(missing)
      }
    } catch (err) {
      console.error('Failed to fetch SPK:', err)
      setError('Failed to load SPK')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploadedDocs = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}`)
        }
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}`)
        }

        // Generate filename
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
        const sanitizedName = file.name
          .split('.')[0]
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 50)
        const ext = file.name.split('.').pop()
        const newFilename = `${spk?.nomor_spk}-${dateStr}-${sanitizedName}.${ext}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`${spkId}/${newFilename}`, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Save metadata to database
        const { error: insertError } = await supabase
          .from('spkdocuments')
          .insert({
            spk_id: spkId,
            document_type: sanitizedName,
            filename: newFilename,
            fileurl: uploadData.path,
            mimetype: file.type,
            filesize: file.size,
            verification_status: 'pending',
          })

        if (insertError) throw insertError
        uploadedDocs.push(newFilename)
      }

      // Refresh SPK data
      await fetchSPKDetail()
    } catch (err: any) {
      setError(err.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('spks')
        .update({ status: newStatus })
        .eq('id', spkId)

      if (updateError) throw updateError
      await fetchSPKDetail()
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
    }
  }

  const generateWALink = () => {
    if (!spk?.clients?.pic_phone) {
      setError('Client phone number not found')
      return
    }

    const message = `Halo, kami ingin mengingatkan bahwa dokumen berikut masih diperlukan untuk SPK ${spk.nomor_spk}: ${missingDocs.join(', ')}. Mohon segera mengirimkan dokumen tersebut.`
    const waLink = `https://wa.me/${spk.clients.pic_phone}?text=${encodeURIComponent(message)}`
    window.open(waLink, '_blank')
  }

  if (loading) {
    return <div className="card text-center text-gray-500">Loading...</div>
  }

  if (!spk) {
    return <div className="card text-center text-red-500">SPK not found</div>
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      verified: 'badge-verified',
    }
    return badges[status] || 'badge'
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{spk.nomor_spk}</h1>
          <p className="text-gray-600 mt-2">
            {spk.clients?.nama_client} • {spk.aircrafttypes?.jenis_pesawat}
          </p>
        </div>
        <span className={`badge ${getStatusBadge(spk.status)} text-lg`}>
          {spk.status.toUpperCase()}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>
      )}

      {missingDocs.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Missing Documents</h3>
          <ul className="list-disc list-inside text-yellow-700 mb-3">
            {missingDocs.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
          <button
            onClick={generateWALink}
            className="btn-primary btn-sm"
          >
            Send WhatsApp Reminder
          </button>
        </div>
      )}

      {/* Checklist */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Checklist</h2>
        <div className="space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                {item.isRequired && (
                  <p className="text-xs text-gray-500">Required</p>
                )}
              </div>
              <span className={`badge ${
                item.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Upload */}
      {spk.status !== 'verified' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="block cursor-pointer">
              <p className="text-gray-600 mb-2">
                Drag and drop files or click to select
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG • Max 50MB each
              </p>
            </label>
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      {spk.spkdocuments?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
          <div className="space-y-2">
            {spk.spkdocuments.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {(doc.filesize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <span className={`badge ${
                  doc.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                  doc.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {doc.verification_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Actions */}
      <div className="card space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
        {spk.status === 'draft' && (
          <button
            onClick={() => handleStatusChange('submitted')}
            className="btn-primary w-full"
          >
            Submit SPK
          </button>
        )}
        {spk.status === 'submitted' && (
          <button
            onClick={() => handleStatusChange('verified')}
            className="btn-primary w-full"
            disabled={missingDocs.length > 0}
          >
            {missingDocs.length > 0
              ? 'Complete all documents first'
              : 'Verify SPK'}
          </button>
        )}
      </div>
    </div>
  )
}

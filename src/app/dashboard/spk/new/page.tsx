'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

interface Client {
  id: string
  nama_client: string
}

interface AircraftType {
  id: string
  jenis_pesawat: string
}

export default function CreateSPKPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [aircrafts, setAircrafts] = useState<AircraftType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nomor_spk: '',
    client_id: '',
    aircraft_type_id: '',
    tanggal_spk: new Date().toISOString().split('T')[0],
    deskripsi_pekerjaan: '',
  })

  useEffect(() => {
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    try {
      const [clientsRes, aircraftsRes] = await Promise.all([
        supabase.from('clients').select('id, nama_client'),
        supabase.from('aircrafttypes').select('id, jenis_pesawat'),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (aircraftsRes.data) setAircrafts(aircraftsRes.data)
    } catch (err) {
      console.error('Failed to fetch master data:', err)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await supabase
        .from('spks')
        .insert({
          nomor_spk: formData.nomor_spk,
          client_id: formData.client_id,
          aircraft_type_id: formData.aircraft_type_id,
          tanggal_spk: formData.tanggal_spk,
          deskripsi_pekerjaan: formData.deskripsi_pekerjaan,
          created_by: user.id,
          status: 'draft',
        })
        .select()

      if (insertError) throw insertError

      // Create notification for admin
      if (data?.[0]) {
        const profiles = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'admin_dokumen')

        if (profiles.data) {
          for (const profile of profiles.data) {
            await supabase.from('notifications').insert({
              spk_id: data[0].id,
              user_id: profile.user_id,
              message: `SPK ${formData.nomor_spk} baru telah dibuat`,
              type: 'info',
            })
          }
        }
      }

      router.push(`/dashboard/spk/${data?.[0]?.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create SPK')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New SPK</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="nomor_spk" className="block text-sm font-medium text-gray-700 mb-2">
            SPK Number <span className="text-red-600">*</span>
          </label>
          <input
            id="nomor_spk"
            type="text"
            value={formData.nomor_spk}
            onChange={(e) =>
              setFormData({ ...formData, nomor_spk: e.target.value })
            }
            required
            className="input"
            placeholder="SPK-2026-001"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-600">*</span>
            </label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) =>
                setFormData({ ...formData, client_id: e.target.value })
              }
              required
              className="input"
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nama_client}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aircraft_type_id" className="block text-sm font-medium text-gray-700 mb-2">
              Aircraft Type <span className="text-red-600">*</span>
            </label>
            <select
              id="aircraft_type_id"
              value={formData.aircraft_type_id}
              onChange={(e) =>
                setFormData({ ...formData, aircraft_type_id: e.target.value })
              }
              required
              className="input"
            >
              <option value="">Select Aircraft</option>
              {aircrafts.map((aircraft) => (
                <option key={aircraft.id} value={aircraft.id}>
                  {aircraft.jenis_pesawat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tanggal_spk" className="block text-sm font-medium text-gray-700 mb-2">
            Date <span className="text-red-600">*</span>
          </label>
          <input
            id="tanggal_spk"
            type="date"
            value={formData.tanggal_spk}
            onChange={(e) =>
              setFormData({ ...formData, tanggal_spk: e.target.value })
            }
            required
            className="input"
          />
        </div>

        <div>
          <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="deskripsi"
            value={formData.deskripsi_pekerjaan}
            onChange={(e) =>
              setFormData({ ...formData, deskripsi_pekerjaan: e.target.value })
            }
            rows={4}
            className="input"
            placeholder="Deskripsi pekerjaan..."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create SPK'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

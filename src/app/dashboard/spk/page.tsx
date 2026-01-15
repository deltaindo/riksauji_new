'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SPK {
  id: string
  nomor_spk: string
  status: 'draft' | 'submitted' | 'verified'
  tanggal_spk: string
  clients: { nama_client: string }
  aircrafttypes: { jenis_pesawat: string }
}

export default function SPKListPage() {
  const supabase = createClient()
  const [spks, setSpks] = useState<SPK[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'verified'>('all')

  useEffect(() => {
    fetchSPKs()
  }, [filter])

  const fetchSPKs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('spks')
        .select(
          `
          id,
          nomor_spk,
          status,
          tanggal_spk,
          clients(nama_client),
          aircrafttypes(jenis_pesawat)
        `
        )
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setSpks(data || [])
    } catch (error) {
      console.error('Failed to fetch SPKs:', error)
    } finally {
      setLoading(false)
    }
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">SPK Management</h1>
        <Link href="/dashboard/spk/new" className="btn-primary">
          + Create SPK
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['all', 'draft', 'submitted', 'verified'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center text-gray-500">Loading...</div>
      ) : spks.length === 0 ? (
        <div className="card text-center text-gray-500">No SPK found</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nomor SPK</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Aircraft</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {spks.map((spk) => (
                <tr key={spk.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{spk.nomor_spk}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {(spk.clients as any)?.nama_client || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(spk.aircrafttypes as any)?.jenis_pesawat || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(spk.tanggal_spk).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusBadge(spk.status)}`}>
                      {spk.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/spk/${spk.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

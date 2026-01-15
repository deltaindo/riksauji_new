import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedDocs = []

    for (const file of files) {
      // Validate
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}` },
          { status: 400 }
        )
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}` },
          { status: 400 }
        )
      }

      // Generate filename
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
      const sanitizedName = file.name
        .split('.')[0]
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50)
      const ext = file.name.split('.').pop()
      const newFilename = `${dateStr}-${sanitizedName}.${ext}`

      // Upload to storage
      const buffer = await file.arrayBuffer()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${params.id}/${newFilename}`, buffer, {
          contentType: file.type,
        })

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 400 }
        )
      }

      // Save metadata
      const { error: insertError } = await supabase
        .from('spkdocuments')
        .insert({
          spk_id: params.id,
          document_type: sanitizedName,
          filename: newFilename,
          fileurl: uploadData.path,
          mimetype: file.type,
          filesize: file.size,
        })

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 }
        )
      }

      uploadedDocs.push({
        filename: newFilename,
        size: file.size,
      })
    }

    return NextResponse.json({ uploaded: uploadedDocs }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

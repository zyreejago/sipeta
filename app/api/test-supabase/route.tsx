import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test connection tanpa aggregate function
    const { data: connectionTest, error: connectionError } = await supabase.from("surat_masuk").select("id").limit(1)

    if (connectionError) {
      return NextResponse.json(
        {
          success: false,
          error: connectionError.message,
          details: "Koneksi ke tabel surat_masuk gagal",
        },
        { status: 500 },
      )
    }

    // Test insert with fixed created_by UUID
    const testData = {
      nomor_surat: "TEST-API-" + Date.now(),
      perihal: "Test Insert dari API",
      tanggal_surat: new Date().toISOString().split("T")[0],
      jenis_surat: "internal",
      instansi_pengirim: "API Test",
      diterima_tanggal: new Date().toISOString().split("T")[0],
      bagian: "sdm",
      file_url: "https://example.com/test.pdf",
      file_name: "test.pdf",
      file_path: "test/test.pdf",
      created_by: "4685c1cb-2550-48ba-883a-1c8d5cf8c0a8", // Using the provided UUID
    }

    const { data: insertTest, error: insertError } = await supabase.from("surat_masuk").insert(testData).select()

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          details: "Insert data test gagal",
          connectionTest,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Koneksi dan insert berhasil",
      connectionTest,
      insertTest,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
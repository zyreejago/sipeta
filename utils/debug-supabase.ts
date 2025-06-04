import { createClient } from "@/utils/supabase/client"

export async function checkSupabaseConnection() {
  const supabase = createClient()

  try {
    // Cek koneksi ke Supabase tanpa menggunakan aggregate function
    const { data, error } = await supabase.from("surat_masuk").select("id").limit(1)

    if (error) {
      console.error("Error checking table:", error)
      return {
        connected: false,
        tableExists: false,
        error: error.message,
      }
    }

    return {
      connected: true,
      tableExists: true,
      rowsFound: data?.length || 0,
    }
  } catch (error: any) {
    console.error("Error connecting to Supabase:", error)
    return {
      connected: false,
      tableExists: false,
      error: error.message,
    }
  }
}

export async function testInsertData() {
  const supabase = createClient()

  try {
    // Coba insert data test
    const testData = {
      nomor_surat: "TEST-" + Date.now(),
      perihal: "Test Insert Data",
      tanggal_surat: new Date().toISOString().split("T")[0],
      jenis_surat: "internal",
      instansi_pengirim: "Test",
      diterima_tanggal: new Date().toISOString().split("T")[0],
      bagian: "sdm",
      file_url: "https://example.com/test.pdf",
      file_name: "test.pdf",
      file_path: "test/test.pdf",
      created_by: "00000000-0000-0000-0000-000000000000", // Dummy UUID
    }

    const { data, error } = await supabase.from("surat_masuk").insert(testData).select()

    if (error) {
      console.error("Error inserting test data:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error testing insert:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

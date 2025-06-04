import { createClient } from "@/utils/supabase/client"

export async function uploadFile(file: File, bucket = "sipeta", folder = "documents") {
  const supabase = createClient()

  // Create a unique file name
  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw error
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return {
    path: filePath,
    url: publicUrl,
    name: file.name,
  }
}

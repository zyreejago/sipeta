"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileIcon, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string, filePath: string) => void
  acceptedFileTypes?: string
  maxSizeMB?: number
  folder?: string
}

export function FileUpload({
  onUploadComplete,
  acceptedFileTypes = ".pdf,.docx,.doc,.xls,.xlsx,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  folder = "documents",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadDetails, setUploadDetails] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)
    setUploadDetails(null)

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`)
      return
    }

    // Check file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    const acceptedTypes = acceptedFileTypes.split(",")

    if (
      !acceptedTypes.some((type) => {
        // Handle wildcards like image/*
        if (type.includes("*")) {
          const mimePrefix = type.split("/")[0]
          return file.type.startsWith(`${mimePrefix}/`)
        }
        return type === fileExtension || type === file.type
      })
    ) {
      setError(`Tipe file tidak didukung. Format yang didukung: ${acceptedFileTypes}`)
      return
    }

    setFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)
    setUploadDetails(null)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      console.log("Uploading file:", {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type,
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress >= 95 ? 95 : newProgress
        })
      }, 100)

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage.from("sipeta").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      clearInterval(progressInterval)

      if (error) {
        console.error("Error uploading file:", error)
        throw error
      }

      console.log("File uploaded successfully:", data)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("sipeta").getPublicUrl(filePath)

      console.log("Public URL:", publicUrl)

      setProgress(100)
      setUploadDetails({
        publicUrl,
        fileName: file.name,
        filePath,
        uploadedAt: new Date().toISOString(),
      })

      onUploadComplete(publicUrl, file.name, filePath)

      // Reset after a short delay
      setTimeout(() => {
        setFile(null)
        setProgress(0)
      }, 1000)
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Terjadi kesalahan saat mengupload file")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setUploadDetails(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = () => {
    if (!file) return null

    const fileType = file.type
    if (fileType.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file) || "/placeholder.svg"}
          alt={file.name}
          className="h-8 w-8 object-cover rounded"
        />
      )
    }

    return <FileIcon className="h-6 w-6 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      <div
        className={cn("file-drop-area", isDragging && "drag-active")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          accept={acceptedFileTypes}
        />
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-center">
          <span className="font-medium text-primary">Klik untuk upload</span> atau drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Format yang didukung: {acceptedFileTypes.replace(/\./g, "")}
        </p>
        <p className="text-xs text-muted-foreground">Ukuran maksimal: {maxSizeMB}MB</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      {file && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-right mt-1 text-muted-foreground">{progress}%</p>
            </div>
          )}

          {uploadDetails && (
            <div className="mt-2 p-2 bg-green-50 rounded-md text-xs text-green-700">
              <p>File berhasil diupload!</p>
              <p className="truncate">Path: {uploadDetails.filePath}</p>
            </div>
          )}

          {!uploading && (
            <Button
              className="w-full mt-2"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleUpload()
              }}
              disabled={uploading}
              type="button"
            >
              {uploading ? "Mengupload..." : "Upload File"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

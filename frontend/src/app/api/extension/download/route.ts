import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'

export async function GET() {
  try {
    // In production, the cwd is /app, and extension is at /app/../extension or similar.
    // Let's check both process.cwd() / ../extension and process.cwd() / extension.
    let extensionDir = path.join(process.cwd(), '../extension')
    if (!fs.existsSync(extensionDir)) {
      extensionDir = path.join(process.cwd(), 'extension')
    }
    if (!fs.existsSync(extensionDir)) {
      // In monorepos/standalone output:
      extensionDir = path.join(process.cwd(), 'public/extension')
    }
    
    if (!fs.existsSync(extensionDir)) {
      return NextResponse.json({ error: 'Extension source folder not found' }, { status: 404 })
    }

    const zip = new AdmZip()
    zip.addLocalFolder(extensionDir)
    const buffer = zip.toBuffer()

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="giftwise-quick-clip.zip"',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

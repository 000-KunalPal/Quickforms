"use client"

import { FormBuilder } from '@/components/form-builder'

export default function Home() {
  return (
      <main className=" py-8 mx-8">
        <h1 className="text-3xl font-bold mb-8">Simple Form Builder with dnd</h1>
        <FormBuilder />
      </main>
  )
}


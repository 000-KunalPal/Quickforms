"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeDisplayProps {
  code: string
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({
        title: "Code Copied",
        description: "The form code has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Form Code</CardTitle>
      </CardHeader>
      <CardContent>
        <SyntaxHighlighter 
          language="tsx" 
          style={vscDarkPlus}
          customStyle={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </CardContent>
      <CardFooter>
        <Button onClick={copyToClipboard}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </CardFooter>
    </Card>
  )
}


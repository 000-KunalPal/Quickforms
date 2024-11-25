"use client"

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { DatePicker } from "@/components/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Trash2, GripVertical, Plus, Save, Code, Sun, Moon, Undo, Redo } from 'lucide-react'
import { CodeDisplay } from './code-display'
import { useTheme } from 'next-themes'

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'checkbox' | 'radio' | 'slider' | 'date' | 'file' | 'color'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  options?: string[]
  required: boolean
  min?: number
  max?: number
  step?: number
  accept?: string
}

export function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([])
  const [currentField, setCurrentField] = useState<FormField>({
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showGeneratedCode, setShowGeneratedCode] = useState(false)
  const [history, setHistory] = useState<FormField[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (fields.length > 0) {
      setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), fields])
      setHistoryIndex(prevIndex => prevIndex + 1)
    }
  }, [fields])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prevIndex => prevIndex - 1)
      setFields(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prevIndex => prevIndex + 1)
      setFields(history[historyIndex + 1])
    }
  }

  const addOrUpdateField = () => {
    if (currentField.label) {
      if (editingIndex !== null) {
        const updatedFields = [...fields]
        updatedFields[editingIndex] = { ...currentField, id: fields[editingIndex].id }
        setFields(updatedFields)
        setEditingIndex(null)
      } else {
        setFields([...fields, { ...currentField, id: Date.now().toString() }])
      }
      setCurrentField({
        id: '',
        type: 'text',
        label: '',
        placeholder: '',
        required: false
      })
      toast({
        title: editingIndex !== null ? "Field Updated" : "Field Added",
        description: `The field "${currentField.label}" has been ${editingIndex !== null ? 'updated' : 'added'} successfully.`,
      })
    }
  }

  const editField = (index: number) => {
    setCurrentField(fields[index])
    setEditingIndex(index)
  }

  const deleteField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    toast({
      title: "Field Deleted",
      description: "The field has been removed from the form.",
      variant: "destructive",
    })
  }

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return <Input type={field.type} placeholder={field.placeholder} required={field.required} />
      case 'textarea':
        return <Textarea placeholder={field.placeholder} required={field.required} />
      case 'select':
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'switch':
        return <Switch />
      case 'checkbox':
        return <Checkbox />
      case 'radio':
        return (
          <RadioGroup>
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case 'slider':
        return <Slider min={field.min} max={field.max} step={field.step} />
      case 'date':
        return <DatePicker />
      case 'file':
        return <Input type="file" accept={field.accept} required={field.required} />
      case 'color':
        return <Input type="color" required={field.required} />
      default:
        return null
    }
  }

  const SortableField = ({ field, index }: { field: FormField; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center space-x-4 bg-secondary p-4 rounded-md">
        <GripVertical className="text-muted-foreground" />
        <div className="flex-grow space-y-2">
          <Label htmlFor={field.id}>{field.label}{field.required && ' *'}</Label>
          {renderField(field)}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => editField(index)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => deleteField(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const saveForm = () => {
    // In a real application, you would save this to a backend or local storage
    console.log(JSON.stringify(fields, null, 2))
    toast({
      title: "Form Saved",
      description: "Your form configuration has been saved successfully.",
    })
  }

  const generateFormCode = () => {
    let imports = `import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { DatePicker } from "@/components/ui/date-picker"\n\n`

    let formCode = `export default function GeneratedForm() {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Handle form submission
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generated Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
`

    fields.forEach((field) => {
      formCode += `          <div className="space-y-2">
            <Label htmlFor="${field.id}">${field.label}${field.required ? ' *' : ''}</Label>
`

      switch (field.type) {
        case 'text':
        case 'number':
        case 'file':
        case 'color':
          formCode += `            <Input type="${field.type}" id="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.accept ? `accept="${field.accept}"` : ''} />\n`
          break
        case 'textarea':
          formCode += `            <Textarea id="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />\n`
          break
        case 'select':
          formCode += `            <Select>
              <SelectTrigger id="${field.id}">
                <SelectValue placeholder="${field.placeholder || 'Select an option'}" />
              </SelectTrigger>
              <SelectContent>
                ${(field.options || []).map(option => `<SelectItem value="${option}">${option}</SelectItem>`).join('\n                ')}
              </SelectContent>
            </Select>\n`
          break
        case 'switch':
          formCode += `            <Switch id="${field.id}" />\n`
          break
        case 'checkbox':
          formCode += `            <Checkbox id="${field.id}" />\n`
          break
        case 'radio':
          formCode += `            <RadioGroup>
              ${(field.options || []).map(option => `<div className="flex items-center space-x-2">
                <RadioGroupItem value="${option}" id="${option}" />
                <Label htmlFor="${option}">${option}</Label>
              </div>`).join('\n              ')}
            </RadioGroup>\n`
          break
        case 'slider':
          formCode += `            <Slider id="${field.id}" min={${field.min || 0}} max={${field.max || 100}} step={${field.step || 1}} />\n`
          break
        case 'date':
          formCode += `            <DatePicker id="${field.id}" />\n`
          break
      }

      formCode += `          </div>\n`
    })

    formCode += `          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  )
}\n`

    return imports + formCode
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{editingIndex !== null ? 'Edit Field' : 'Add New Field'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldType">Field Type</Label>
            <Select
              value={currentField.type}
              onValueChange={(value: FieldType) => setCurrentField({ ...currentField, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="radio">Radio</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="file">File Upload</SelectItem>
                <SelectItem value="color">Color Picker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fieldLabel">Field Label</Label>
            <Input
              id="fieldLabel"
              value={currentField.label}
              onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>
          {currentField.type !== 'switch' && currentField.type !== 'checkbox' && currentField.type !== 'date' && currentField.type !== 'color' && (
            <div className="space-y-2">
              <Label htmlFor="fieldPlaceholder">Placeholder</Label>
              <Input
                id="fieldPlaceholder"
                value={currentField.placeholder}
                onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
          )}
          {(currentField.type === 'select' || currentField.type === 'radio') && (
            <div className="space-y-2">
              <Label htmlFor="fieldOptions">Options (comma-separated)</Label>
              <Input
                id="fieldOptions"
                value={currentField.options?.join(', ') || ''}
                onChange={(e) => setCurrentField({ ...currentField, options: e.target.value.split(',').map(o => o.trim()) })}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}
          {currentField.type === 'slider' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fieldMin">Minimum Value</Label>
                <Input
                  id="fieldMin"
                  type="number"
                  value={currentField.min || 0}
                  onChange={(e) => setCurrentField({ ...currentField, min: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldMax">Maximum Value</Label>
                <Input
                  id="fieldMax"
                  type="number"
                  value={currentField.max || 100}
                  onChange={(e) => setCurrentField({ ...currentField, max: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldStep">Step</Label>
                <Input
                  id="fieldStep"
                  type="number"
                  value={currentField.step || 1}
                  onChange={(e) => setCurrentField({ ...currentField, step: Number(e.target.value) })}
                />
              </div>
            </>
          )}
          {currentField.type === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="fieldAccept">Accepted File Types</Label>
              <Input
                id="fieldAccept"
                value={currentField.accept || ''}
                onChange={(e) => setCurrentField({ ...currentField, accept: e.target.value })}
                placeholder=".pdf,.doc,.docx"
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={currentField.required}
              onCheckedChange={(checked) => setCurrentField({ ...currentField, required: checked })}
            />
            <Label htmlFor="required">Required</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addOrUpdateField}>
            {editingIndex !== null ? 'Update Field' : 'Add Field'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map(field => field.id)} strategy={verticalListSortingStrategy}>
              <form className="space-y-4">
                {fields.map((field, index) => (
                  <SortableField key={field.id} field={field} index={index} />
                ))}
              </form>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="actions" className="space-y-4">
              <div className="flex justify-between">
                <Button onClick={saveForm}>
                  <Save className="mr-2 h-4 w-4" /> Save Form
                </Button>
                <Button onClick={() => setShowGeneratedCode(!showGeneratedCode)}>
                  <Code className="mr-2 h-4 w-4" /> {showGeneratedCode ? 'Hide' : 'Show'} Code
                </Button>
              </div>
              <div className="flex justify-between">
                <Button onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="mr-2 h-4 w-4" /> Undo
                </Button>
                <Button onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="mr-2 h-4 w-4" /> Redo
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showGeneratedCode && (
        <CodeDisplay code={generateFormCode()} />
      )}
    </div>
  )
}


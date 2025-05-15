"use client"

import { useState, useRef, useEffect } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Trash2, Plus, Copy, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { BentoGrid } from "./bento-grid"
import "react-resizable/css/styles.css"

// Types
export type BentoItem = {
  id: string
  x: number
  y: number
  w: number
  h: number
  content: string
}

export type BentoGridSettings = {
  gap: number
  columns: number
  rows: number
  backgroundColor: string
}

export type GridCell = {
  x: number
  y: number
  occupied: boolean
}

const BentoGenerator = () => {
  const [items, setItems] = useState<BentoItem[]>([])
  const [nextId, setNextId] = useState(1)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState("")
  const [showGeneratedCode, setShowGeneratedCode] = useState(false)
  const gridSettings: BentoGridSettings = {
    gap: 4,
    columns: 12,
    rows: 12,
    backgroundColor: "transparent",
  }
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState("")
  const [gridCells, setGridCells] = useState<GridCell[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Initialize grid cells
  useEffect(() => {
    // Initialize empty grid
    const cells: GridCell[] = []
    for (let y = 0; y < gridSettings.rows; y++) {
      for (let x = 0; x < gridSettings.columns; x++) {
        cells.push({ x, y, occupied: false })
      }
    }

    // Mark occupied cells
    items.forEach((item) => {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          const cellIndex = cells.findIndex((cell) => cell.x === x && cell.y === y)
          if (cellIndex !== -1) {
            cells[cellIndex].occupied = true
          }
        }
      }
    })

    setGridCells(cells)
  }, [gridSettings.columns, gridSettings.rows, items])

  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Find first available position for a new block
  const findAvailablePosition = (width: number, height: number): { x: number; y: number } | null => {
    // Create a temporary grid to check occupancy
    const tempGrid: boolean[][] = Array(gridSettings.rows)
      .fill(false)
      .map(() => Array(gridSettings.columns).fill(false))

    // Mark occupied cells
    items.forEach((item) => {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          if (y >= 0 && y < gridSettings.rows && x >= 0 && x < gridSettings.columns) {
            tempGrid[y][x] = true
          }
        }
      }
    })

    // Find first available position
    for (let y = 0; y < gridSettings.rows - height + 1; y++) {
      for (let x = 0; x < gridSettings.columns - width + 1; x++) {
        let canPlace = true

        // Check if all cells in this area are unoccupied
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            if (tempGrid[y + dy][x + dx]) {
              canPlace = false
              break
            }
          }
          if (!canPlace) break
        }

        if (canPlace) {
          return { x, y }
        }
      }
    }

    return null
  }

  const addNewItem = () => {
    const defaultWidth = 2
    const defaultHeight = 2

    const position = findAvailablePosition(defaultWidth, defaultHeight)

    if (!position) {
      alert("No space available for a new block. Try removing some blocks or increasing the grid size.")
      return
    }

    const newItem: BentoItem = {
      id: `item-${nextId}`,
      x: position.x,
      y: position.y,
      w: defaultWidth,
      h: defaultHeight,
      content: `Block ${nextId}`,
    }
    

    setItems([...items, newItem])
    setNextId(nextId + 1)
    setSelectedItemId(newItem.id)
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    if (selectedItemId === id) {
      setSelectedItemId(null)
    }
  }

  const updateItem = (id: string, updates: Partial<BentoItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  // Check if a move would cause overlap
  const canMoveItem = (itemId: string, newX: number, newY: number): boolean => {
    const item = items.find((item) => item.id === itemId)
    if (!item) return false

    // Check if the new position is within grid bounds
    if (newX < 0 || newY < 0 || newX + item.w > gridSettings.columns || newY + item.h > gridSettings.rows) {
      return false
    }

    // Check if the new position would overlap with any other item
    for (const otherItem of items) {
      if (otherItem.id === itemId) continue

      // Check for overlap
      if (
        newX < otherItem.x + otherItem.w &&
        newX + item.w > otherItem.x &&
        newY < otherItem.y + otherItem.h &&
        newY + item.h > otherItem.y
      ) {
        return false
      }
    }

    return true
  }

  // Move an item to a new position if valid
  const moveItem = (id: string, newX: number, newY: number) => {
    if (canMoveItem(id, newX, newY)) {
      updateItem(id, { x: newX, y: newY })
    }
  }

  // Check if a resize would cause overlap
  const canResizeItem = (itemId: string, newWidth: number, newHeight: number): boolean => {
    const item = items.find((item) => item.id === itemId)
    if (!item) return false

    // Check if the new size is within grid bounds
    if (item.x + newWidth > gridSettings.columns || item.y + newHeight > gridSettings.rows) {
      return false
    }

    // Check if the new size would overlap with any other item
    for (const otherItem of items) {
      if (otherItem.id === itemId) continue

      // Check for overlap
      if (
        item.x < otherItem.x + otherItem.w &&
        item.x + newWidth > otherItem.x &&
        item.y < otherItem.y + otherItem.h &&
        item.y + newHeight > otherItem.y
      ) {
        return false
      }
    }

    return true
  }

  // Resize an item if valid
  const resizeItem = (id: string, newWidth: number, newHeight: number) => {
    if (canResizeItem(id, newWidth, newHeight)) {
      updateItem(id, { w: newWidth, h: newHeight })
    }
  }

  const startEditingItemName = (id: string) => {
    const item = items.find((item) => item.id === id)
    if (item) {
      setEditingItemId(id)
      setEditingItemName(item.content)
    }
  }

  const saveItemName = () => {
    if (editingItemId) {
      updateItem(editingItemId, { content: editingItemName })
      setEditingItemId(null)
      setEditingItemName("")
    }
  }

  const selectedItem = items.find((item) => item.id === selectedItemId)

  const generateCode = () => {
    const indent = (str: string, spaces: number) => {
      const indentation = " ".repeat(spaces)
      return str
        .split("\n")
        .map((line) => `${indentation}${line}`)
        .join("\n")
    }

    let code = `<section className="w-full max-w-7xl mx-auto">\n`
    code += `  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-${gridSettings.columns} gap-${gridSettings.gap} p-4" style={{}}>\n`

    items.forEach((item) => {
      const borderRadiusMap: Record<string, string> = {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      }

      // Make column spans responsive
      let colSpanClasses = "col-span-1"
      if (item.w > 1) {
        colSpanClasses = `col-span-1 sm:col-span-${Math.min(item.w, 2)} md:col-span-${Math.min(item.w, 4)} lg:col-span-${item.w}`
      }

      // Make row spans responsive - on mobile, we don't want extremely tall items
      let rowSpanClasses = "row-span-1"
      if (item.h > 1) {
        rowSpanClasses = `row-span-1 md:row-span-${item.h}`
      }

      const itemCode = `<div 
      className="${colSpanClasses} ${rowSpanClasses} rounded-md overflow-hidden border border-white"
    >
      <div className="h-full w-full p-4 flex items-center justify-center">
        ${item.content}
      </div>
    </div>`;

      code += indent(itemCode, 4) + "\n"
    })

    code += `  </div>\n`
    code += `</section>`

    setGeneratedCode(code)
    setShowGeneratedCode(true)
  }

  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset after 2s
  }

  const clearAllItems = () => {
    setItems([]);
    setSelectedItemId(null);
    setNextId(1); // 🔄 Reset ID counter
  };

  

  return (
    <DndProvider backend={HTML5Backend}>
<div className="flex flex-col lg:flex-row w-full h-auto gap-4 mb-20 border border-white/20 shadow-2xl shadow-black/50 rounded-3xl p-4 backdrop-blur-3xl">
<div className={`flex-1 relative ${gridSettings.backgroundColor !== 'transparent' ? `bg-${gridSettings.backgroundColor}` : ''}`} ref={containerRef}>
  <BentoGrid
    items={items}
    gridSettings={gridSettings}
    containerSize={containerSize}
    selectedItemId={selectedItemId}
    onSelectItem={setSelectedItemId}
    onMoveItem={moveItem}
    onRemoveItem={removeItem}
    onResizeItem={resizeItem}
    gridRef={containerRef}
  />
</div>


  <div className="w-full lg:w-[400px] h-full flex flex-col space-y-4 mt-4 lg:mt-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4">
                <Button onClick={addNewItem} className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Block
                </Button>
                <Button variant="destructive" onClick={clearAllItems} title="Clear All Blocks">
  <Trash2 className="h-4 w-4" /> <p>Clear All</p>
</Button>
              </div>

              <Button variant="secondary" className="w-full bg-transparent hover:bg-white/10 text-white border border-white/20" onClick={generateCode}>
                Generate Code
              </Button>
            </CardContent>
          </Card>

          <Card>
                <CardContent className="p-4 space-y-4">
                  {selectedItem ? (
                    <>

                      {/* Column Span Setting */}
                      <div className="space-y-2">
                        <Label>Column Span</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[selectedItem.w]}
                            min={1}
                            max={gridSettings.columns - selectedItem.x}
                            step={1}
                            onValueChange={(value) => resizeItem(selectedItem.id, value[0], selectedItem.h)}
                          />
                          <span className="w-8 text-center">{selectedItem.w}</span>
                        </div>
                      </div>

                      {/* Row Span Setting */}
                      <div className="space-y-2">
                        <Label>Row Span</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[selectedItem.h]}
                            min={1}
                            max={gridSettings.rows - selectedItem.y}
                            step={1}
                            onValueChange={(value) => resizeItem(selectedItem.id, selectedItem.w, value[0])}
                          />
                          <span className="w-8 text-center">{selectedItem.h}</span>
                        </div>
                      </div>

                    </>
                  ) : (
                    <div className="text-center py-4 text-white/20">Select a block to edit its properties</div>
                  )}
                </CardContent>
              </Card>

          {/* Block List */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Block List</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-2 text-white/20">No blocks added yet</div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-2 py-1 border border-white/20 rounded cursor-pointer ${
                      selectedItemId === item.id ? "bg-white/10" : "bg-transparent"
                    }`}
                    

                    onClick={() => setSelectedItemId(item.id)}
                  >
                    {editingItemId === item.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                        className="bg-white/10 border border-white/20"
                          value={editingItemName}
                          onChange={(e) => setEditingItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveItemName()
                            if (e.key === "Escape") {
                              setEditingItemId(null)
                              setEditingItemName("")
                            }
                          }}
                          autoFocus
                        />
                        <Button className="bg-transparent hover:bg-white/20 border border-white/20 text-white h-auto" size="sm" onClick={saveItemName}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{item.content}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingItemName(item.id)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem(item.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

              {showGeneratedCode && (
  <Card>
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Generated Code:</h3>
        <Button
          variant="ghost"
          className="bg-white/10 border border-white/20 hover:bg-white/20"
          size="sm"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <Textarea
        value={generatedCode}
        readOnly
        className="font-mono text-sm h-48 bg-black/10 border border-white/20"
      />
    </CardContent>
  </Card>
)}
        </div>
      </div>
    </DndProvider>
  )
}

export default BentoGenerator

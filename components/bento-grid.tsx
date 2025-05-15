"use client"

import { useState, useEffect, useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { X, ArrowDownRight, Move } from "lucide-react"
import type { BentoItem, BentoGridSettings } from "./bento-generator"
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useDragLayer } from 'react-dnd'

const CustomDragLayer = ({
  items,
  gridRef,
  columns,
  rows,
  containerSize,
}: {
  items: BentoItem[],
  gridRef: React.RefObject<HTMLDivElement | null>,
  columns: number,
  rows: number,
  containerSize: { width: number, height: number },
}) => {
  const { item, isDragging, clientOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    clientOffset: monitor.getClientOffset(),
  }))

  if (!isDragging || !item || !clientOffset) return null

  const draggedItem = items.find((i) => i.id === item.id)
  if (!draggedItem) return null
  
  const gridRect = gridRef.current?.getBoundingClientRect()
  if (!gridRect) return null
  
  const blockWidth = (draggedItem.w / columns) * gridRect.width
  const blockHeight = (draggedItem.h / rows) * gridRect.height
  
  const clickOffset = { x: blockWidth / 2, y: blockHeight / 2 }
  
  const left = clientOffset.x - clickOffset.x - gridRect.left
  const top = clientOffset.y - clickOffset.y - gridRect.top
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: blockWidth,
    height: blockHeight,
    pointerEvents: 'none',
    zIndex: 1000,
    opacity: 0.8,
  }
  
  return (
    <div style={style} className="bg-white/20 border border-white rounded-md flex items-center justify-center">
      {draggedItem.content}
    </div>
  )
}


export default CustomDragLayer


const ItemTypes = {
  BENTO_ITEM: "bentoItem",
}

type BentoGridProps = {
  items: BentoItem[]
  gridSettings: BentoGridSettings
  containerSize: { width: number; height: number }
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onMoveItem: (id: string, x: number, y: number) => void
  onRemoveItem: (id: string) => void
  onResizeItem: (id: string, newWidth: number, newHeight: number) => void
  gridRef: React.RefObject<HTMLDivElement | null>
}

export const BentoGrid = ({
  items,
  gridSettings,
  containerSize,
  selectedItemId,
  onSelectItem,
  onMoveItem,
  onRemoveItem,
  onResizeItem,
}: BentoGridProps) => {

  const cellSize = (containerSize.height - (gridSettings.rows - 1) * gridSettings.gap) / gridSettings.rows
  const gridRef = useRef<HTMLDivElement>(null)
const [, drop] = useDrop({
  accept: ItemTypes.BENTO_ITEM,
  drop: (item: { id: string, clickOffset: { x: number, y: number } }, monitor) => {
    const clientOffset = monitor.getClientOffset()
    const gridRect = gridRef.current?.getBoundingClientRect()
    if (!clientOffset || !gridRect) return
  
    const draggedItem = items.find((i) => i.id === item.id)
    if (!draggedItem) return
  
    const blockWidth = gridRect.width / gridSettings.columns
    const blockHeight = gridRect.height / gridSettings.rows
  
    // Calculate exact position relative to grid
    const relativeX = clientOffset.x - gridRect.left
    const relativeY = clientOffset.y - gridRect.top
  
    // Snap based on center of block relative to grid
    const newX = Math.max(0, Math.min(
      gridSettings.columns - draggedItem.w,
      Math.round((relativeX - blockWidth / 2) / blockWidth)
    ))
  
    const newY = Math.max(0, Math.min(
      gridSettings.rows - draggedItem.h,
      Math.round((relativeY - blockHeight / 2) / blockHeight)
    ))
  
    onMoveItem(item.id, newX, newY)
  },
})

  return (
<div ref={(node) => { drop(node); gridRef.current = node }} 
  className="relative w-full max-w-[800px] aspect-square rounded-lg mx-auto"
  style={{
    backgroundColor: gridSettings.backgroundColor,
  }}
>
      <div
        className="grid absolute inset-0"
        style={{
          gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
          gridTemplateRows: `repeat(${gridSettings.rows}, 1fr)`,
          gap: `${gridSettings.gap}px`,
        }}
      >
        {Array.from({ length: gridSettings.rows * gridSettings.columns }).map((_, index) => (
          <div key={index} className="border border-white opacity-10 rounded-md" />
        ))}

        {items.map((item) => (
          <BentoItemComponent
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onClick={() => onSelectItem(item.id)}
            onRemove={() => onRemoveItem(item.id)}
            columns={gridSettings.columns}
            rows={gridSettings.rows}
            onResize={onResizeItem}
            onMoveItem={onMoveItem}
            containerSize={containerSize}
          />
        ))}
      </div>
      
      <CustomDragLayer
  items={items}
  gridRef={gridRef}
  columns={gridSettings.columns}
  rows={gridSettings.rows}
  containerSize={containerSize}
/>
    </div>
    
  )
}


const BentoItemComponent = ({
  item,
  isSelected,
  onClick,
  onRemove,
  onResize,
  onMoveItem,
  columns,
  rows,
  containerSize,
}: {
  item: BentoItem
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
  onResize: (id: string, newWidth: number, newHeight: number) => void
  onMoveItem: (id: string, newX: number, newY: number) => void
  containerSize: { width: number; height: number }
  columns: number
  rows: number
}) => {
  const [isResizing, setIsResizing] = useState(false)

  // ✅ Separate drag handle only inside move button
  const ref = useRef<HTMLDivElement>(null)
  const clickOffsetRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
  

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.BENTO_ITEM,
    item: () => ({
      id: item.id,
      clickOffset: clickOffsetRef.current,
    }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))
  
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  const handleDragStart = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    clickOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = item.w
    const startHeight = item.h

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const newW = Math.max(1, Math.round(startWidth + deltaX / (containerSize.width / columns)))
      const newH = Math.max(1, Math.round(startHeight + deltaY / (containerSize.height / rows)))

      onResize(item.id, newW, newH)
    }

    const onMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  return (
    <div
    className={`absolute bg-white/20 border border-white ${isSelected ? 'ring-2 ring-white/0 rounded-md' : 'rounded-md'}`}
    style={{
      left: `${(item.x / columns) * 100}%`,
      top: `${(item.y / rows) * 100}%`,
      width: `${(item.w / columns) * 100}%`,
      height: `${(item.h / rows) * 100}%`,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isSelected ? 10 : 1,
    }}
    onClick={onClick}
  >
    <div className="h-full w-full p-4 flex flex-col items-center justify-center">
      <div>{item.content}</div>

      {/* ✅ Move handle - drag attached only here */}
      <div
  ref={(node) => {
    drag(node)
    ref.current = node
  }}
  onMouseDown={handleDragStart}
  className="mt-2 p-1 bg-black/30 px-2 py-2 rounded-full cursor-move items-center justify-center hidden md:flex"
>
  <Move className="h-3 w-3 text-white" />
</div>
    </div>
    {isSelected && (
  <div
    onMouseDown={handleResize}
    className="absolute bottom-0 right-0 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-br-md rounded-tl-md flex items-center justify-center z-30 cursor-se-resize hidden md:flex"
  >
    <ArrowDownRight className="h-4 w-4 text-white" />
  </div>
)}
  </div>
  )
}



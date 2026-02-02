import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface SelectSearchableOption {
  value: string
  label: string
}

interface SelectSearchableProps {
  options: SelectSearchableOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

const SelectSearchable = React.forwardRef<HTMLButtonElement, SelectSearchableProps>(
  ({ options, value, onValueChange, placeholder = "Select...", searchPlaceholder = "Search...", className, disabled }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredOptions = React.useMemo(() => {
      if (!search) return options
      const searchLower = search.toLowerCase()
      return options.filter(option => 
        option.label.toLowerCase().includes(searchLower)
      )
    }, [options, search])

    const selectedOption = options.find(option => option.value === value)

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue)
      setOpen(false)
      setSearch("")
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[10000] bg-background border-border" align="start">
          <div className="flex flex-col">
            {/* Search input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            {/* Options list */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      value === option.value && "bg-accent/50"
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {value === option.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
SelectSearchable.displayName = "SelectSearchable"

export { SelectSearchable }

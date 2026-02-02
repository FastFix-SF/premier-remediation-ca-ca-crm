import React from 'react'
import { useCrmAutomation } from '@/hooks/useCrmAutomation'

interface CrmAutomationProviderProps {
  children: React.ReactNode
}

export const CrmAutomationProvider: React.FC<CrmAutomationProviderProps> = ({ 
  children 
}) => {
  // Initialize automation system
  useCrmAutomation()

  return <>{children}</>
}
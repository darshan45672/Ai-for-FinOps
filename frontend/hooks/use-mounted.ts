import { useState, useEffect } from 'react'

/**
 * Hook to check if the component has mounted on the client side.
 * Useful for preventing hydration mismatches with components that 
 * have different behavior between server and client.
 * 
 * @returns boolean indicating if the component has mounted
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
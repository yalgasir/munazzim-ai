import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @fileOverview Utility functions for the project.
 * Primarily handles Tailwind class merging.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




 
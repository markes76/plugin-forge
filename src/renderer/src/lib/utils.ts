import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function isValidKebabCase(str: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str)
}

export function isValidSemver(str: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(str)
}

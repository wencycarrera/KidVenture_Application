import { type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import kidventureLogo from './kidventure-logo.png'

export function Logo({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={kidventureLogo}
      alt='Kidventure Admin'
      className={cn('size-10', className)}
      {...props}
    />
  )
}

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  children?: ReactNode
}

export default function AppLink({ href, ...props }: AppLinkProps) {
  return <Link {...props} to={href} />
}

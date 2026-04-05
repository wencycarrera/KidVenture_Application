import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/create-admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/create-admin"!</div>
}

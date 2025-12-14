import { DiscountsListView } from '@/components/features/discounts'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/discounts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DiscountsListView />
}

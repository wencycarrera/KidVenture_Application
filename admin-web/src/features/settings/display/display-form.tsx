import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard overview' },
  { id: 'users', label: 'Users' },
  { id: 'teacher-approvals', label: 'Teacher approvals' },
  { id: 'sub-lessons', label: 'Sub-lessons' },
  { id: 'student-activity', label: 'Student activity reports' },
  { id: 'help-center', label: 'Help center' },
] as const

const sidebarItemIds = sidebarItems.map((item) => item.id) as [
  (typeof sidebarItems)[number]['id'],
  ...(typeof sidebarItems)[number]['id'][]
]

const displayFormSchema = z.object({
  items: z
    .array(z.enum(sidebarItemIds))
    .nonempty('Select at least one section to keep visible.'),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

// This can come from your database or API.
const defaultValues: DisplayFormValues = {
  items: [...sidebarItemIds],
}

export function DisplayForm() {
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
        className='space-y-8'
      >
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>Sidebar</FormLabel>
                <FormDescription>
                  Control which admin sections appear in the sidebar for quick
                  access.
                </FormDescription>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {sidebarItems.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name='items'
                    render={({ field }) => {
                      const checked = field.value?.includes(item.id)
                      return (
                        <FormItem className='flex flex-row items-start space-x-3 rounded-md border border-border/60 p-3'>
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                return isChecked
                                  ? field.onChange([...(field.value ?? []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <div className='space-y-1 leading-none'>
                            <FormLabel className='font-medium'>
                              {item.label}
                            </FormLabel>
                            <FormDescription className='text-xs text-muted-foreground'>
                              Toggle visibility in the admin sidebar.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Update display</Button>
      </form>
    </Form>
  )
}
